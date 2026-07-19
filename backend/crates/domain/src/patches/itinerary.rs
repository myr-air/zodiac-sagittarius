use serde::{Deserialize, Serialize};
use serde_json::Value;
use time::Date;
use uuid::Uuid;

use crate::errors::ServiceError;
use crate::patch_serde::{
    deserialize_nullable_f64_patch, deserialize_nullable_i32_patch,
    deserialize_nullable_string_patch, deserialize_nullable_uuid_patch,
};
use super::shared::*;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchItineraryItemRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: ItineraryItemPatch,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateItineraryItemRequest {
    pub client_mutation_id: String,
    pub plan_variant_id: Uuid,
    pub path_group_id: Option<String>,
    pub path_id: Option<String>,
    pub path_name: Option<String>,
    pub path_role: Option<String>,
    pub parent_item_id: Option<Uuid>,
    pub item_kind: Option<String>,
    pub time_mode: Option<String>,
    pub is_plan_block: Option<bool>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub day: Date,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub end_offset_days: Option<i32>,
    pub activity: String,
    pub activity_type: String,
    pub activity_subtype: Option<String>,
    pub place: String,
    pub map_link: Option<String>,
    pub address: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub duration_minutes: Option<i32>,
    pub transportation: Option<String>,
    pub details: Option<Value>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReorderItineraryItemsRequest {
    pub client_mutation_id: String,
    pub plan_variant_id: Uuid,
    pub day: Date,
    pub item_ids: Vec<Uuid>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportItineraryRequest {
    pub file_name: Option<String>,
    pub content_type: Option<String>,
    pub mode: Option<String>,
    pub content: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateStopNoteRequest {
    pub client_mutation_id: String,
    pub trip_plan_id: Option<Uuid>,
    pub itinerary_item_id: Uuid,
    pub body: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchStopNoteRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub body: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryItemPatch {
    pub path_group_id: Option<String>,
    pub path_id: Option<String>,
    pub path_name: Option<String>,
    pub path_role: Option<String>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub parent_item_id: Option<Option<Uuid>>,
    pub item_kind: Option<String>,
    pub time_mode: Option<String>,
    pub is_plan_block: Option<bool>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub day: Option<Date>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub start_time: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub end_time: Option<Option<String>>,
    pub end_offset_days: Option<i32>,
    #[serde(default, deserialize_with = "deserialize_nullable_i32_patch")]
    pub duration_minutes: Option<Option<i32>>,
    pub activity: Option<String>,
    pub activity_type: Option<String>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub activity_subtype: Option<Option<String>>,
    pub place: Option<String>,
    pub map_link: Option<String>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub address: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_f64_patch")]
    pub latitude: Option<Option<f64>>,
    #[serde(default, deserialize_with = "deserialize_nullable_f64_patch")]
    pub longitude: Option<Option<f64>>,
    pub transportation: Option<String>,
    pub details: Option<Value>,
    pub note: Option<String>,
}

impl CreateItineraryItemRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        if let Some(start_time) = &self.start_time {
            validate_hh_mm(start_time)?;
        }
        if let Some(end_time) = &self.end_time {
            validate_hh_mm(end_time)?;
        }
        if self
            .end_offset_days
            .is_some_and(|offset| !(0..=7).contains(&offset))
        {
            return Err(ServiceError::InvalidRequest(
                "end_offset_days must be between 0 and 7",
            ));
        }
        validate_required_text(&self.activity, "activity is required")?;
        if let Some(item_kind) = &self.item_kind {
            validate_item_kind(item_kind)?;
        }
        if let Some(time_mode) = &self.time_mode {
            validate_time_mode(time_mode)?;
        }
        if let Some(status) = &self.status {
            validate_item_status(status)?;
        }
        if let Some(priority) = &self.priority {
            validate_item_priority(priority)?;
        }
        validate_activity_type(&self.activity_type)?;
        if let Some(activity_subtype) = &self.activity_subtype {
            validate_activity_subtype(activity_subtype)?;
        }
        if let Some(path_role) = &self.path_role {
            validate_path_role(path_role)?;
        }
        validate_optional_map_link(self.map_link.as_deref())?;
        if self
            .duration_minutes
            .is_some_and(|duration_minutes| duration_minutes <= 0)
        {
            return Err(ServiceError::InvalidRequest(
                "duration_minutes must be greater than zero",
            ));
        }
        validate_coordinates(self.latitude, self.longitude)?;
        validate_optional_details(self.details.as_ref())?;

        Ok(())
    }
}

impl ReorderItineraryItemsRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        if self.item_ids.is_empty() {
            return Err(ServiceError::InvalidRequest("item_ids are required"));
        }

        Ok(())
    }
}

impl ImportItineraryRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        let mode = self.mode.as_deref().unwrap_or("auto");
        if !matches!(mode, "auto" | "json" | "ai") {
            return Err(ServiceError::InvalidRequest("unsupported import mode"));
        }
        if self.content.trim().is_empty() {
            return Err(ServiceError::InvalidRequest("import content is required"));
        }
        if self.content.len() > 120_000 {
            return Err(ServiceError::InvalidRequest("import content is too large"));
        }
        Ok(())
    }
}

impl CreateStopNoteRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_stop_note_body(&self.body)
    }
}

impl PatchStopNoteRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_stop_note_body(&self.body)
    }
}

impl ItineraryItemPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if let Some(Some(start_time)) = &self.start_time {
            validate_hh_mm(start_time)?;
        }
        if let Some(Some(end_time)) = &self.end_time {
            validate_hh_mm(end_time)?;
        }
        if self
            .end_offset_days
            .is_some_and(|offset| !(0..=7).contains(&offset))
        {
            return Err(ServiceError::InvalidRequest(
                "end_offset_days must be between 0 and 7",
            ));
        }

        if self
            .duration_minutes
            .flatten()
            .is_some_and(|duration_minutes| duration_minutes <= 0)
        {
            return Err(ServiceError::InvalidRequest(
                "duration_minutes must be greater than zero",
            ));
        }

        if let Some(activity_type) = &self.activity_type {
            validate_activity_type(activity_type)?;
        }
        if let Some(Some(activity_subtype)) = &self.activity_subtype {
            validate_activity_subtype(activity_subtype)?;
        }

        if let Some(path_role) = &self.path_role {
            validate_path_role(path_role)?;
        }
        if let Some(item_kind) = &self.item_kind {
            validate_item_kind(item_kind)?;
        }
        if let Some(time_mode) = &self.time_mode {
            validate_time_mode(time_mode)?;
        }
        if let Some(status) = &self.status {
            validate_item_status(status)?;
        }
        if let Some(priority) = &self.priority {
            validate_item_priority(priority)?;
        }
        validate_optional_map_link(self.map_link.as_deref())?;
        validate_coordinate_patch(self.latitude, self.longitude)?;
        validate_optional_details(self.details.as_ref())?;

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
    fn itinerary_patch_accepts_valid_time_activity_type_and_duration() {
        let patch = ItineraryItemPatch {
            start_time: Some(Some("09:30".to_string())),
            duration_minutes: Some(Some(45)),
            activity_type: Some("default".to_string()),
            ..ItineraryItemPatch::default()
        };

        assert!(patch.validate().is_ok());
    }

#[test]
    fn itinerary_patch_rejects_bad_time_shapes_and_ranges() {
        for value in ["0930", "9:30", "09:3", "aa:30", "09:bb", "24:00", "23:60"] {
            let patch = ItineraryItemPatch {
                start_time: Some(Some(value.to_string())),
                ..ItineraryItemPatch::default()
            };

            assert_eq!(
                invalid_message(patch.validate()),
                "start_time must be HH:MM"
            );
        }
    }

#[test]
    fn itinerary_patch_rejects_bad_duration_and_activity_type() {
        let bad_duration = ItineraryItemPatch {
            duration_minutes: Some(Some(0)),
            ..ItineraryItemPatch::default()
        };
        assert_eq!(
            invalid_message(bad_duration.validate()),
            "duration_minutes must be greater than zero"
        );

        let bad_type = ItineraryItemPatch {
            activity_type: Some("museum".to_string()),
            ..ItineraryItemPatch::default()
        };
        assert_eq!(
            invalid_message(bad_type.validate()),
            "activity_type is invalid"
        );
    }

}
