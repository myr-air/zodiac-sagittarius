use serde::{Deserialize, Deserializer, Serialize};
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

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskRequest {
    pub client_mutation_id: String,
    pub title: String,
    pub visibility: String,
    pub kind: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub related_item_id: Option<Uuid>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchTaskRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: TaskPatch,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskPatch {
    pub title: Option<String>,
    pub status: Option<String>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub assignee_id: Option<Option<Uuid>>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub related_item_id: Option<Option<Uuid>>,
}

impl CreateTaskRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_task_title(&self.title)?;
        validate_task_visibility(&self.visibility)?;
        if let Some(kind) = &self.kind {
            validate_task_kind(kind)?;
        }

        Ok(())
    }
}

impl PatchTaskRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        self.patch.validate()
    }
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

impl TaskPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if let Some(title) = &self.title {
            validate_task_title(title)?;
        }

        if let Some(status) = &self.status {
            validate_task_status(status)?;
        }

        if self.title.is_none()
            && self.status.is_none()
            && self.assignee_id.is_none()
            && self.related_item_id.is_none()
        {
            return Err(ServiceError::InvalidRequest("task patch is empty"));
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

fn validate_client_mutation_id(value: &str) -> Result<(), ServiceError> {
    if value.trim().is_empty() {
        return Err(ServiceError::InvalidRequest(
            "client_mutation_id is required",
        ));
    }

    Ok(())
}

fn validate_task_title(value: &str) -> Result<(), ServiceError> {
    if value.trim().is_empty() {
        return Err(ServiceError::InvalidRequest("task title is required"));
    }

    Ok(())
}

fn validate_task_visibility(value: &str) -> Result<(), ServiceError> {
    match value {
        "private" | "shared" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("task visibility is invalid")),
    }
}

fn validate_task_status(value: &str) -> Result<(), ServiceError> {
    match value {
        "open" | "done" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("task status is invalid")),
    }
}

fn validate_task_kind(value: &str) -> Result<(), ServiceError> {
    match value {
        "prep" | "booking" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("task kind is invalid")),
    }
}

fn deserialize_nullable_uuid_patch<'de, D>(
    deserializer: D,
) -> Result<Option<Option<Uuid>>, D::Error>
where
    D: Deserializer<'de>,
{
    Option::<Uuid>::deserialize(deserializer).map(Some)
}
