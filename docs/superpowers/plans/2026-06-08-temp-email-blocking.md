# Temp Email Blocking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block disposable email domains from all account auth entry points.

**Architecture:** Keep the policy inside the backend account service so direct API calls cannot bypass it. Extend the existing `normalize_email` path to reject exact disposable domains and subdomains before any auth state, challenge, outbox, user, session, or WebAuthn challenge rows are created.

**Tech Stack:** Rust 1.95, Axum, sqlx PostgreSQL contract tests, existing Sagittarius account auth service.

---

## File Structure

- Modify: `backend/crates/sagittarius-api/tests/account_auth_contract.rs`
  - Add HTTP-level contract tests for email-code, password, and passkey account auth endpoints.
  - Assert blocked requests return `400 invalid_request` and create no relevant rows.
- Modify: `backend/crates/sagittarius-api/src/app/account.rs`
  - Add a static disposable email domain denylist.
  - Add small helper functions for domain extraction and exact/subdomain matching.
  - Wire the helper through `normalize_email`.
  - Add focused unit tests for the matching helper.

## Task 1: Account Auth Contract Coverage

**Files:**
- Modify: `backend/crates/sagittarius-api/tests/account_auth_contract.rs`

- [ ] **Step 1: Write failing contract tests**

Insert this block after `password_auth_validates_payload` in `backend/crates/sagittarius-api/tests/account_auth_contract.rs`:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn email_login_start_rejects_disposable_email_domains_without_challenge(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());

    for email in [
        "traveler@10minutemail.com",
        "traveler@inbox.10minutemail.com",
    ] {
        let (status, body): (StatusCode, Value) = post_json_response(
            app.clone(),
            "/api/v1/auth/email/challenges",
            json!({ "email": email }),
        )
        .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(body["code"], "invalid_request");
    }

    let challenge_count: i64 = sqlx::query_scalar("select count(*) from email_login_challenges")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(challenge_count, 0);

    let outbox_count: i64 = sqlx::query_scalar("select count(*) from email_login_outbox")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(outbox_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn password_auth_rejects_disposable_email_domains_without_side_effects(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());

    let (register_status, register_body): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/api/v1/auth/password/sessions",
        json!({
            "flow": "register",
            "email": "owner@mailinator.com",
            "password": "correct-horse-battery",
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;
    assert_eq!(register_status, StatusCode::BAD_REQUEST);
    assert_eq!(register_body["code"], "invalid_request");

    let (login_status, login_body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/password/sessions",
        json!({
            "flow": "login",
            "email": "owner@sub.guerrillamail.com",
            "password": "wrong-password",
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;
    assert_eq!(login_status, StatusCode::BAD_REQUEST);
    assert_eq!(login_body["code"], "invalid_request");

    let user_count: i64 = sqlx::query_scalar("select count(*) from users")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(user_count, 0);

    let email_count: i64 = sqlx::query_scalar("select count(*) from user_emails")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(email_count, 0);

    let session_count: i64 = sqlx::query_scalar("select count(*) from user_sessions")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(session_count, 0);

    let attempt_count: i64 = sqlx::query_scalar("select count(*) from auth_attempt_locks")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(attempt_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn passkey_login_start_rejects_disposable_email_domain_without_challenge(
    pool: sqlx::PgPool,
) {
    let app = support::app(pool.clone());
    let (status, body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/passkeys/options",
        json!({ "email": "traveler@maildrop.cc" }),
    )
    .await;

    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");

    let challenge_count: i64 = sqlx::query_scalar("select count(*) from webauthn_challenges")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(challenge_count, 0);
}
```

- [ ] **Step 2: Run one failing email-code test**

Run from `backend/`:

```bash
rtk cargo test -p sagittarius-api --test account_auth_contract email_login_start_rejects_disposable_email_domains_without_challenge
```

Expected: FAIL because `traveler@10minutemail.com` currently creates an email login challenge and returns `200 OK`.

- [ ] **Step 3: Run one failing password test**

Run from `backend/`:

```bash
rtk cargo test -p sagittarius-api --test account_auth_contract password_auth_rejects_disposable_email_domains_without_side_effects
```

Expected: FAIL because `owner@mailinator.com` currently registers and creates account rows.

- [ ] **Step 4: Run one failing passkey test**

Run from `backend/`:

```bash
rtk cargo test -p sagittarius-api --test account_auth_contract passkey_login_start_rejects_disposable_email_domain_without_challenge
```

Expected: FAIL because disposable email syntax is currently accepted and the route returns `401 unauthenticated` for a missing passkey user.

- [ ] **Step 5: Commit failing contract tests**

Run from repo root:

```bash
rtk git add backend/crates/sagittarius-api/tests/account_auth_contract.rs
rtk git commit -m "test: cover disposable account email blocking"
```

Expected: commit succeeds with only the contract test file staged.

## Task 2: Backend Disposable Domain Policy

**Files:**
- Modify: `backend/crates/sagittarius-api/src/app/account.rs`

- [ ] **Step 1: Add the denylist constant**

Add this constant after `const MAX_EMAIL_LENGTH: usize = 254;` in `backend/crates/sagittarius-api/src/app/account.rs`:

```rust
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
```

- [ ] **Step 2: Replace `normalize_email` and add helper functions**

Replace the existing `normalize_email` function and insert the helper functions before `is_valid_email`:

```rust
fn normalize_email(email: &str) -> Result<String, ServiceError> {
    let normalized = email.trim().to_ascii_lowercase();
    if normalized.len() > MAX_EMAIL_LENGTH || !is_valid_email(&normalized) {
        return Err(ServiceError::InvalidRequest("email is invalid"));
    }

    let domain =
        email_domain(&normalized).ok_or(ServiceError::InvalidRequest("email is invalid"))?;
    if is_disposable_email_domain(domain) {
        return Err(ServiceError::InvalidRequest(
            "disposable email domain is not allowed",
        ));
    }

    Ok(normalized)
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
```

- [ ] **Step 3: Add helper unit tests**

Insert these tests in the `#[cfg(test)] mod tests` block after `fake_database_error_exposes_sqlx_database_error_contract`:

```rust
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
```

- [ ] **Step 4: Run helper tests**

Run from `backend/`:

```bash
rtk cargo test -p sagittarius-api app::account::tests::disposable_email_domain_policy_matches_exact_and_subdomains
rtk cargo test -p sagittarius-api app::account::tests::normalize_email_rejects_disposable_domains_after_normalization
```

Expected: PASS for both helper tests.

- [ ] **Step 5: Run focused contract tests**

Run from `backend/`:

```bash
rtk cargo test -p sagittarius-api --test account_auth_contract email_login_start_rejects_disposable_email_domains_without_challenge
rtk cargo test -p sagittarius-api --test account_auth_contract password_auth_rejects_disposable_email_domains_without_side_effects
rtk cargo test -p sagittarius-api --test account_auth_contract passkey_login_start_rejects_disposable_email_domain_without_challenge
```

Expected: PASS for all three disposable-email contract tests.

- [ ] **Step 6: Run account auth contract suite**

Run from `backend/`:

```bash
rtk cargo test -p sagittarius-api --test account_auth_contract
```

Expected: PASS. This proves non-disposable account auth flows still work.

- [ ] **Step 7: Commit implementation**

Run from repo root:

```bash
rtk git add backend/crates/sagittarius-api/src/app/account.rs
rtk git commit -m "fix: block disposable account email domains"
```

Expected: commit succeeds with only the account service file staged.

## Task 3: Final Verification

**Files:**
- Read: `docs/superpowers/specs/2026-06-08-temp-email-block-design.md`
- Read: `backend/crates/sagittarius-api/src/app/account.rs`
- Read: `backend/crates/sagittarius-api/tests/account_auth_contract.rs`

- [ ] **Step 1: Check worktree**

Run from repo root:

```bash
rtk git status --short --branch
```

Expected: no unstaged or uncommitted changes.

- [ ] **Step 2: Run focused backend verification**

Run from `backend/`:

```bash
rtk cargo test -p sagittarius-api --test account_auth_contract
```

Expected: PASS.

- [ ] **Step 3: Confirm spec coverage**

Check the implementation against these points:

```text
email-code challenge start rejects exact and subdomain disposable email domains
password register rejects disposable email domains and creates no user or session
password login rejects disposable email domains before auth attempt state changes
passkey login start rejects disposable email domains and creates no WebAuthn challenge
non-disposable email domains continue through existing account auth tests
trip temporary access code remains untouched
```

- [ ] **Step 4: Report completion**

Final report must include:

```text
Goal | block disposable/temp email account auth
Change | backend account email normalization now rejects denylisted disposable domains and subdomains
Evidence | focused account auth contract suite command and result
Risk | static denylist coverage can miss new providers
Branch | current branch and remote sync state
Work status | done
```

## Self-Review

- Spec coverage: Task 1 covers each account auth endpoint; Task 2 implements the shared backend source of truth; Task 3 verifies the contract and unchanged non-disposable flows.
- Placeholder scan: no placeholder instructions remain; every code-changing step includes concrete code.
- Type consistency: snippets use existing `StatusCode`, `Value`, `json!`, `ServiceError`, and account test helpers already imported in the touched files.
