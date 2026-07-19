use std::fmt;
use std::io::Write;
use std::process::{Command as StdCommand, Stdio};

use lettre::message::Mailbox;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use time::OffsetDateTime;
use tracing::{error, info, warn};
use uuid::Uuid;

use sagittarius_domain::errors::ServiceError;

#[derive(Clone)]
pub enum EmailDelivery {
    Disabled,
    LogOnly,
    Sendmail {
        command: String,
        from: String,
    },
    Smtp {
        host: String,
        port: u16,
        username: String,
        password: String,
        from: String,
    },
}

impl fmt::Debug for EmailDelivery {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EmailDelivery::Disabled => formatter.write_str("Disabled"),
            EmailDelivery::LogOnly => formatter.write_str("LogOnly"),
            EmailDelivery::Sendmail { command, from } => formatter
                .debug_struct("Sendmail")
                .field("command", command)
                .field("from", from)
                .finish(),
            EmailDelivery::Smtp {
                host,
                port,
                username,
                from,
                ..
            } => formatter
                .debug_struct("Smtp")
                .field("host", host)
                .field("port", port)
                .field("username", username)
                .field("password", &"<redacted>")
                .field("from", from)
                .finish(),
        }
    }
}

impl EmailDelivery {
    pub fn from_env() -> Self {
        let mode = std::env::var("EMAIL_DELIVERY")
            .unwrap_or_else(|_| "off".to_string())
            .to_ascii_lowercase();

        match mode.as_str() {
            "off" => EmailDelivery::Disabled,
            "log" => EmailDelivery::LogOnly,
            "sendmail" => EmailDelivery::Sendmail {
                command: std::env::var("SENDMAIL_COMMAND")
                    .unwrap_or_else(|_| "/usr/sbin/sendmail".to_string()),
                from: std::env::var("EMAIL_FROM")
                    .unwrap_or_else(|_| "Sagittarius <noreply@sagittarius.local>".to_string()),
            },
            "smtp" => EmailDelivery::Smtp {
                host: std::env::var("SMTP_HOST")
                    .unwrap_or_else(|_| "smtp-relay.brevo.com".to_string()),
                port: std::env::var("SMTP_PORT")
                    .ok()
                    .and_then(|port| port.parse::<u16>().ok())
                    .unwrap_or(587),
                username: std::env::var("SMTP_USERNAME").unwrap_or_default(),
                password: std::env::var("SMTP_PASSWORD").unwrap_or_default(),
                from: std::env::var("EMAIL_FROM")
                    .unwrap_or_else(|_| "Sagittarius <noreply@sagittarius.local>".to_string()),
            },
            _ => {
                warn!(mode = %mode, "unknown EMAIL_DELIVERY mode; defaulting to off");
                EmailDelivery::Disabled
            }
        }
    }

    pub async fn send_login_code(
        &self,
        email: &str,
        code: &str,
        challenge_id: Uuid,
        expires_at: &str,
    ) -> Result<(), ServiceError> {
        match self {
            EmailDelivery::Disabled => Ok(()),
            EmailDelivery::LogOnly => {
                info!(
                    to = %email,
                    code = %code,
                    challenge_id = %challenge_id,
                    expires_at = %expires_at,
                    "email-login code generated"
                );
                Ok(())
            }
            EmailDelivery::Sendmail { command, from } => {
                send_via_sendmail(SendmailDeliveryRequest {
                    command: command.to_string(),
                    from: from.to_string(),
                    to: email.to_string(),
                    code: code.to_string(),
                    challenge_id,
                    expires_at: expires_at.to_string(),
                })
                .await
            }
            EmailDelivery::Smtp {
                host,
                port,
                username,
                password,
                from,
            } => {
                send_via_smtp(SmtpDeliveryRequest {
                    host: host.to_string(),
                    port: *port,
                    username: username.to_string(),
                    password: password.to_string(),
                    from: from.to_string(),
                    to: email.to_string(),
                    code: code.to_string(),
                    challenge_id,
                    expires_at: expires_at.to_string(),
                })
                .await
            }
        }
    }
}

struct SmtpDeliveryRequest {
    host: String,
    port: u16,
    username: String,
    password: String,
    from: String,
    to: String,
    code: String,
    challenge_id: Uuid,
    expires_at: String,
}

struct SendmailDeliveryRequest {
    command: String,
    from: String,
    to: String,
    code: String,
    challenge_id: Uuid,
    expires_at: String,
}

async fn send_via_smtp(request: SmtpDeliveryRequest) -> Result<(), ServiceError> {
    tokio::task::spawn_blocking(move || send_with_smtp(request))
        .await
        .map_err(|_| ServiceError::EmailDelivery("email delivery task failed".to_string()))?
}

fn send_with_smtp(request: SmtpDeliveryRequest) -> Result<(), ServiceError> {
    if request.username.trim().is_empty() || request.password.trim().is_empty() {
        return Err(ServiceError::EmailDelivery(
            "smtp credentials are not configured".to_string(),
        ));
    }

    let email = Message::builder()
        .from(parse_mailbox(&request.from, "sender")?)
        .to(parse_mailbox(&request.to, "recipient")?)
        .subject("[Sagittarius] รหัสยืนยันการเข้าสู่ระบบ")
        .body(compose_login_email_body(
            &request.code,
            request.challenge_id,
            &request.expires_at,
        ))
        .map_err(|cause| {
            error!(error = %cause, "failed to build smtp email");
            ServiceError::EmailDelivery("email message build failed".to_string())
        })?;

    let mailer = SmtpTransport::starttls_relay(&request.host)
        .map_err(|cause| {
            error!(host = %request.host, error = %cause, "failed to configure smtp relay");
            ServiceError::EmailDelivery("smtp relay configuration failed".to_string())
        })?
        .port(request.port)
        .credentials(Credentials::new(request.username, request.password))
        .build();

    mailer.send(&email).map_err(|cause| {
        error!(
            host = %request.host,
            port = request.port,
            error = %cause,
            "smtp send failed"
        );
        ServiceError::EmailDelivery("smtp send failed".to_string())
    })?;

    Ok(())
}

fn parse_mailbox(address: &str, label: &str) -> Result<Mailbox, ServiceError> {
    address.parse::<Mailbox>().map_err(|cause| {
        error!(label = %label, error = %cause, "failed to parse email address");
        ServiceError::EmailDelivery(format!("invalid {label} email address"))
    })
}

async fn send_via_sendmail(request: SendmailDeliveryRequest) -> Result<(), ServiceError> {
    tokio::task::spawn_blocking(move || send_with_sendmail(request))
        .await
        .map_err(|_| ServiceError::EmailDelivery("email delivery task failed".to_string()))?
}

fn send_with_sendmail(request: SendmailDeliveryRequest) -> Result<(), ServiceError> {
    let message = compose_login_email(
        &request.from,
        &request.to,
        &request.code,
        request.challenge_id,
        &request.expires_at,
    );
    send_with_command(&request.command, &request.from, message)
}

fn send_with_command(command: &str, from: &str, message: String) -> Result<(), ServiceError> {
    let mut process = StdCommand::new(command)
        .arg("-f")
        .arg(from)
        .arg("-t")
        .stdin(Stdio::piped())
        .spawn()
        .map_err(|cause| {
            error!(command = %command, error = %cause, "failed to spawn sendmail");
            ServiceError::EmailDelivery("email delivery command failed".to_string())
        })?;

    let Some(stdin) = process.stdin.as_mut() else {
        return Err(ServiceError::EmailDelivery(
            "email delivery stdin unavailable".to_string(),
        ));
    };

    stdin.write_all(message.as_bytes()).map_err(|cause| {
        error!(error = %cause, "failed to write email payload");
        ServiceError::EmailDelivery("email delivery write failed".to_string())
    })?;

    let status = process.wait().map_err(|cause| {
        error!(error = %cause, "failed waiting for sendmail");
        ServiceError::EmailDelivery("email delivery command failed".to_string())
    })?;

    if status.success() {
        Ok(())
    } else {
        error!(command = %command, status = ?status, "sendmail command failed");
        Err(ServiceError::EmailDelivery(
            "email delivery command returned non-zero status".to_string(),
        ))
    }
}

fn compose_login_email(
    from: &str,
    to: &str,
    code: &str,
    challenge_id: Uuid,
    expires_at: &str,
) -> String {
    let now = OffsetDateTime::now_utc();
    let date = now
        .format(&time::format_description::well_known::Rfc2822)
        .unwrap_or_default();

    format!(
        "From: {from}\n\
To: {to}\n\
Subject: [Sagittarius] รหัสยืนยันการเข้าสู่ระบบ\n\
Date: {date}\n\
MIME-Version: 1.0\n\
Content-Type: text/plain; charset=UTF-8\n\
\n\
{}",
        compose_login_email_body(code, challenge_id, expires_at)
    )
}

fn compose_login_email_body(code: &str, challenge_id: Uuid, expires_at: &str) -> String {
    format!(
        "รหัสยืนยันการเข้าสู่ระบบของคุณคือ: {code}\n\
Challenge ID: {challenge_id}\n\
หมดอายุ: {expires_at}\n\
\n\
ข้อความนี้หมดอายุอัตโนมัติใน 10 นาที.\n",
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Mutex, OnceLock};

    fn env_lock() -> &'static Mutex<()> {
        static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        ENV_LOCK.get_or_init(|| Mutex::new(()))
    }

    #[test]
    fn smtp_delivery_can_be_configured_from_env() {
        let _guard = env_lock().lock().unwrap();

        unsafe {
            std::env::set_var("EMAIL_DELIVERY", "smtp");
            std::env::set_var("SMTP_HOST", "smtp-relay.brevo.com");
            std::env::set_var("SMTP_PORT", "587");
            std::env::set_var("SMTP_USERNAME", "example@smtp-brevo.com");
            std::env::set_var("SMTP_PASSWORD", "smtp-key");
            std::env::set_var("EMAIL_FROM", "Sagittarius <no-reply@example.com>");
        }

        match EmailDelivery::from_env() {
            EmailDelivery::Smtp {
                host,
                port,
                username,
                password,
                from,
            } => {
                assert_eq!(host, "smtp-relay.brevo.com");
                assert_eq!(port, 587);
                assert_eq!(username, "example@smtp-brevo.com");
                assert_eq!(password, "smtp-key");
                assert_eq!(from, "Sagittarius <no-reply@example.com>");
            }
            delivery => panic!("expected smtp delivery, got {delivery:?}"),
        }

        unsafe {
            std::env::remove_var("EMAIL_DELIVERY");
            std::env::remove_var("SMTP_HOST");
            std::env::remove_var("SMTP_PORT");
            std::env::remove_var("SMTP_USERNAME");
            std::env::remove_var("SMTP_PASSWORD");
            std::env::remove_var("EMAIL_FROM");
        }
    }
}
