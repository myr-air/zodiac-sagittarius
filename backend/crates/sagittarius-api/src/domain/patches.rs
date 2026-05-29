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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn invalid_message(result: Result<(), ServiceError>) -> &'static str {
        match result {
            Err(ServiceError::InvalidRequest(message)) => message,
            other => panic!("expected invalid request, got {other:?}"),
        }
    }

    #[test]
    #[should_panic(expected = "expected invalid request")]
    fn invalid_message_panics_for_non_invalid_request() {
        invalid_message(Ok(()));
    }

    #[test]
    fn itinerary_patch_accepts_valid_time_activity_type_and_duration() {
        let patch = ItineraryItemPatch {
            start_time: Some("09:30".to_string()),
            duration_minutes: Some(45),
            activity_type: Some("experience".to_string()),
            ..ItineraryItemPatch::default()
        };

        assert!(patch.validate().is_ok());
    }

    #[test]
    fn itinerary_patch_rejects_bad_time_shapes_and_ranges() {
        for value in ["0930", "9:30", "09:3", "aa:30", "09:bb", "24:00", "23:60"] {
            let patch = ItineraryItemPatch {
                start_time: Some(value.to_string()),
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
            duration_minutes: Some(0),
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

    #[test]
    fn task_create_validation_covers_required_fields_and_enums() {
        let valid = CreateTaskRequest {
            client_mutation_id: "task-create".to_string(),
            title: "Book ferry".to_string(),
            visibility: "shared".to_string(),
            kind: Some("booking".to_string()),
            assignee_id: None,
            related_item_id: None,
        };
        assert!(valid.validate().is_ok());

        let mut missing_mutation = valid.clone();
        missing_mutation.client_mutation_id = "  ".to_string();
        assert_eq!(
            invalid_message(missing_mutation.validate()),
            "client_mutation_id is required"
        );

        let mut missing_title = valid.clone();
        missing_title.title = " ".to_string();
        assert_eq!(
            invalid_message(missing_title.validate()),
            "task title is required"
        );

        let mut bad_visibility = valid.clone();
        bad_visibility.visibility = "team".to_string();
        assert_eq!(
            invalid_message(bad_visibility.validate()),
            "task visibility is invalid"
        );

        let mut bad_kind = valid;
        bad_kind.kind = Some("errand".to_string());
        assert_eq!(invalid_message(bad_kind.validate()), "task kind is invalid");
    }

    #[test]
    fn task_patch_validation_covers_status_empty_and_nullable_uuid_fields() {
        let assignee = Uuid::now_v7();
        let patch: PatchTaskRequest = serde_json::from_value(json!({
            "clientMutationId": "task-patch",
            "expectedVersion": 3,
            "patch": {
                "title": " Updated title ",
                "status": "done",
                "assigneeId": assignee,
                "relatedItemId": null
            }
        }))
        .unwrap();
        assert_eq!(patch.expected_version, 3);
        assert_eq!(patch.patch.assignee_id, Some(Some(assignee)));
        assert_eq!(patch.patch.related_item_id, Some(None));
        assert!(patch.validate().is_ok());

        let empty_patch = PatchTaskRequest {
            client_mutation_id: "task-patch-empty".to_string(),
            expected_version: 1,
            patch: TaskPatch::default(),
        };
        assert_eq!(
            invalid_message(empty_patch.validate()),
            "task patch is empty"
        );

        let bad_status = PatchTaskRequest {
            client_mutation_id: "task-patch-bad-status".to_string(),
            expected_version: 1,
            patch: TaskPatch {
                status: Some("blocked".to_string()),
                ..TaskPatch::default()
            },
        };
        assert_eq!(
            invalid_message(bad_status.validate()),
            "task status is invalid"
        );
    }
}
