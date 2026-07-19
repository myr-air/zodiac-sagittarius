use crate::errors::ServiceError;

pub fn validate_plan_status_input(
    kind: Option<&str>,
    status: Option<&str>,
) -> Result<(), ServiceError> {
    if let Some(kind) = kind {
        validate_plan_variant_kind(kind)?;
    }
    if let Some(status) = status {
        validate_plan_status(status)?;
    }
    if let (Some(kind), Some(status)) = (kind, status) {
        let kind_status = status_for_legacy_kind(kind)?;
        if kind_status != status {
            return Err(ServiceError::InvalidRequest(
                "trip plan status does not match legacy kind",
            ));
        }
    }
    Ok(())
}

pub fn reject_main_plan_status(
    kind: Option<&str>,
    status: Option<&str>,
) -> Result<(), ServiceError> {
    if matches!(status, Some("main")) || matches!(kind, Some("main")) {
        return Err(ServiceError::InvalidRequest(
            "use set-main to select the main trip plan",
        ));
    }
    Ok(())
}

pub fn effective_plan_status<'a>(
    kind: Option<&'a str>,
    status: Option<&'a str>,
) -> Option<&'a str> {
    status.or_else(|| kind.and_then(|value| status_for_legacy_kind(value).ok()))
}

pub fn validate_plan_status(value: &str) -> Result<(), ServiceError> {
    match value {
        "main" | "backup" | "draft" | "proposal" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("trip plan status is invalid")),
    }
}

fn validate_plan_variant_kind(value: &str) -> Result<(), ServiceError> {
    status_for_legacy_kind(value).map(|_| ())
}

fn status_for_legacy_kind(value: &str) -> Result<&'static str, ServiceError> {
    match value {
        "main" => Ok("main"),
        "backup" => Ok("backup"),
        "draft" => Ok("draft"),
        "split" => Ok("proposal"),
        _ => Err(ServiceError::InvalidRequest("plan variant kind is invalid")),
    }
}

pub fn legacy_kind_for_plan_status(value: &str) -> &'static str {
    match value {
        "proposal" => "split",
        "main" => "main",
        "backup" => "backup",
        _ => "draft",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn invalid_message(result: Result<(), ServiceError>) -> &'static str {
        match result {
            Err(ServiceError::InvalidRequest(message)) => message,
            other => panic!("expected invalid request, got {other:?}"),
        }
    }

    #[test]
    fn maps_legacy_kind_and_canonical_status_in_one_place() {
        assert_eq!(legacy_kind_for_plan_status("proposal"), "split");
        assert_eq!(legacy_kind_for_plan_status("main"), "main");
        assert_eq!(legacy_kind_for_plan_status("backup"), "backup");
        assert_eq!(legacy_kind_for_plan_status("draft"), "draft");
        assert_eq!(effective_plan_status(Some("split"), None), Some("proposal"));
        assert_eq!(effective_plan_status(Some("backup"), None), Some("backup"));
        assert_eq!(
            effective_plan_status(Some("split"), Some("draft")),
            Some("draft")
        );
    }

    #[test]
    fn validates_status_kind_pairs_and_rejects_mismatches() {
        assert!(validate_plan_status_input(Some("split"), Some("proposal")).is_ok());
        assert_eq!(
            invalid_message(validate_plan_status_input(Some("split"), Some("backup"))),
            "trip plan status does not match legacy kind"
        );
        assert_eq!(
            invalid_message(validate_plan_status_input(Some("unknown"), None)),
            "plan variant kind is invalid"
        );
        assert_eq!(
            invalid_message(validate_plan_status_input(None, Some("unknown"))),
            "trip plan status is invalid"
        );
    }

    #[test]
    fn rejects_main_status_for_regular_patch_paths() {
        assert!(reject_main_plan_status(Some("backup"), Some("backup")).is_ok());
        assert_eq!(
            invalid_message(reject_main_plan_status(Some("main"), None)),
            "use set-main to select the main trip plan"
        );
        assert_eq!(
            invalid_message(reject_main_plan_status(None, Some("main"))),
            "use set-main to select the main trip plan"
        );
    }
}
