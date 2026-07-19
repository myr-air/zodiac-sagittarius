use sagittarius_domain::errors::ServiceError;

const MAX_EMAIL_LENGTH: usize = 254;
const DISPOSABLE_EMAIL_DOMAINS: &[&str] = &[
    "10minutemail.co.uk",
    "10minutemail.com",
    "10minutemail.net",
    "10minutemail.org",
    "10minutemailbox.com",
    "burnermail.io",
    "dispostable.com",
    "dropmail.me",
    "emailondeck.com",
    "fakeinbox.com",
    "getnada.com",
    "grr.la",
    "guerrillamail.biz",
    "guerrillamail.com",
    "guerrillamail.net",
    "guerrillamail.org",
    "inboxkitten.com",
    "mail.tm",
    "maildrop.cc",
    "mailinator.com",
    "mailnesia.com",
    "mailpoof.com",
    "mintemail.com",
    "moakt.com",
    "mohmal.com",
    "mytemp.email",
    "sharklasers.com",
    "temp-mail.io",
    "temp-mail.org",
    "tempmail.com",
    "tempmailo.com",
    "throwawaymail.com",
    "trashmail.com",
    "trashmail.me",
    "trashmail.net",
    "yopmail.com",
    "yopmail.fr",
    "yopmail.net",
];

pub(crate) fn normalize_email(email: &str) -> Result<String, ServiceError> {
    let normalized = email.trim().to_ascii_lowercase();
    if normalized.len() > MAX_EMAIL_LENGTH || !is_valid_email(&normalized) {
        return Err(ServiceError::InvalidRequest("email is invalid"));
    }

    ensure_email_domain_is_allowed(&normalized)?;

    Ok(normalized)
}

pub(crate) fn ensure_email_domain_is_allowed(email: &str) -> Result<(), ServiceError> {
    let domain = email_domain(email).ok_or(ServiceError::InvalidRequest("email is invalid"))?;
    if is_disposable_email_domain(domain) {
        return Err(ServiceError::InvalidRequest(
            "disposable email domain is not allowed",
        ));
    }

    Ok(())
}

fn email_domain(email: &str) -> Option<&str> {
    email.split_once('@').map(|(_, domain)| domain)
}

fn is_disposable_email_domain(domain: &str) -> bool {
    DISPOSABLE_EMAIL_DOMAINS
        .iter()
        .copied()
        .any(|blocked| domain_matches_blocked_domain(domain, blocked))
}

fn domain_matches_blocked_domain(domain: &str, blocked: &str) -> bool {
    domain == blocked
        || domain
            .strip_suffix(blocked)
            .is_some_and(|prefix| prefix.ends_with('.'))
}

fn is_valid_email(email: &str) -> bool {
    let Some((local, domain)) = email.split_once('@') else {
        return false;
    };
    !local.is_empty()
        && !domain.is_empty()
        && domain.contains('.')
        && !domain.starts_with('.')
        && !domain.ends_with('.')
        && !email.chars().any(char::is_whitespace)
        && email.matches('@').count() == 1
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn disposable_email_domain_policy_matches_exact_and_subdomains() {
        assert!(is_disposable_email_domain("10minutemail.com"));
        assert!(is_disposable_email_domain("inbox.10minutemail.com"));
        assert!(is_disposable_email_domain("mailinator.com"));
        assert!(is_disposable_email_domain("alerts.mailinator.com"));

        assert!(!is_disposable_email_domain("example.com"));
        assert!(!is_disposable_email_domain("notmailinator.com"));
        assert!(!is_disposable_email_domain("mailinator.com.example.org"));
    }

    #[test]
    fn normalize_email_rejects_disposable_domains_after_normalization() {
        let result = normalize_email(" Traveler@Inbox.10MinuteMail.COM ");

        assert!(matches!(
            result,
            Err(ServiceError::InvalidRequest(
                "disposable email domain is not allowed"
            ))
        ));
    }
}
