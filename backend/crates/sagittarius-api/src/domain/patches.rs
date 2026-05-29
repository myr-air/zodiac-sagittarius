use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::domain::errors::ServiceError;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchItineraryItemRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: ItineraryItemPatch,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSuggestionRequest {
    pub client_mutation_id: String,
    pub r#type: String,
    pub target_item_id: Option<Uuid>,
    pub plan_variant_id: Uuid,
    pub source_version: Option<i64>,
    pub proposed_patch: Value,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryItemPatch {
    pub start_time: Option<String>,
    pub duration_minutes: Option<i32>,
    pub activity: Option<String>,
    pub activity_type: Option<String>,
    pub place: Option<String>,
    pub map_link: Option<String>,
    pub transportation: Option<String>,
    pub note: Option<String>,
}

impl ItineraryItemPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if let Some(start_time) = &self.start_time {
            validate_hh_mm(start_time)?;
        }

        if self
            .duration_minutes
            .is_some_and(|duration_minutes| duration_minutes <= 0)
        {
            return Err(ServiceError::InvalidRequest(
                "duration_minutes must be greater than zero",
            ));
        }

        if let Some(activity_type) = &self.activity_type {
            validate_activity_type(activity_type)?;
        }

        Ok(())
    }
}

fn validate_hh_mm(value: &str) -> Result<(), ServiceError> {
    let Some((hour, minute)) = value.split_once(':') else {
        return Err(ServiceError::InvalidRequest("start_time must be HH:MM"));
    };

    if hour.len() != 2 || minute.len() != 2 {
        return Err(ServiceError::InvalidRequest("start_time must be HH:MM"));
    }

    let hour = hour
        .parse::<u8>()
        .map_err(|_| ServiceError::InvalidRequest("start_time must be HH:MM"))?;
    let minute = minute
        .parse::<u8>()
        .map_err(|_| ServiceError::InvalidRequest("start_time must be HH:MM"))?;

    if hour > 23 || minute > 59 {
        return Err(ServiceError::InvalidRequest("start_time must be HH:MM"));
    }

    Ok(())
}

fn validate_activity_type(value: &str) -> Result<(), ServiceError> {
    match value {
        "travel" | "food" | "shopping" | "attraction" | "experience" | "stay" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("activity_type is invalid")),
    }
}
