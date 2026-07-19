use serde::Deserialize;

use crate::errors::ServiceError;
use super::shared::*;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchDailyBriefingRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub day_title: Option<Option<String>>,
    pub outfit_advice: Option<Option<String>>,
    pub festival_note: Option<Option<String>>,
    pub facts_note: Option<Option<String>>,
}

impl PatchDailyBriefingRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_optional_day_title(&self.day_title)?;
        validate_optional_override(&self.outfit_advice, "outfitAdvice")?;
        validate_optional_override(&self.festival_note, "festivalNote")?;
        validate_optional_override(&self.facts_note, "factsNote")?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::errors::ServiceError;

    fn invalid_message(result: Result<(), ServiceError>) -> &'static str {
        match result {
            Err(ServiceError::InvalidRequest(message)) => message,
            other => panic!("expected invalid request, got {other:?}"),
        }
    }

#[test]
    fn daily_briefing_patch_accepts_short_day_title_and_rejects_long_title() {
        let valid = PatchDailyBriefingRequest {
            client_mutation_id: "daily-title".to_string(),
            expected_version: 1,
            day_title: Some(Some("Bangkok -> Hong Kong".to_string())),
            outfit_advice: None,
            festival_note: None,
            facts_note: None,
        };
        assert!(valid.validate().is_ok());

        let invalid = PatchDailyBriefingRequest {
            day_title: Some(Some("x".repeat(49))),
            ..valid
        };
        assert_eq!(invalid_message(invalid.validate()), "dayTitle is too long");
    }

}
