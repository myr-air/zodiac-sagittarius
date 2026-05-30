use std::process::{Command as StdCommand, Stdio};
use std::thread;

use time::OffsetDateTime;
use tokio::sync::oneshot;
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::domain::errors::ServiceError;

#[derive(Clone, Debug)]
pub enum EmailDelivery {
    Disabled,
    LogOnly,
    Sendmail {
        command: String,
        from: String,
    },
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
                send_via_sendmail(command, from, email, code, challenge_id, expires_at).await
            }
        }
    }
}

async fn send_via_sendmail(
    command: &str,
    from: &str,
    to: &str,
    code: &str,
    challenge_id: Uuid,
    expires_at: &str,
) -> Result<(), ServiceError> {
    let message = compose_login_email(from, to, code, challenge_id, expires_at);

    let command = command.to_string();
    let from = from.to_string();

    let (tx, rx) = oneshot::channel();

    thread::spawn(move || {
        let result = send_with_command(&command, &from, message);
        let _ = tx.send(result);
    });

    rx.await
        .map_err(|_| ServiceError::EmailDelivery("email delivery task failed".to_string()))?
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

    use std::io::Write;
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
รหัสยืนยันการเข้าสู่ระบบของคุณคือ: {code}\n\
Challenge ID: {challenge_id}\n\
หมดอายุ: {expires_at}\n\
\n\
ข้อความนี้หมดอายุอัตโนมัติใน 10 นาที.\n",
    )
}
