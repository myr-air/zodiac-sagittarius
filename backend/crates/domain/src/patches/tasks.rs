use serde::Deserialize;
use uuid::Uuid;

use crate::errors::ServiceError;
use crate::patch_serde::deserialize_nullable_uuid_patch;
use super::shared::*;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskRequest {
    pub client_mutation_id: String,
    pub trip_plan_id: Option<Uuid>,
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::errors::ServiceError;
    use serde_json::json;
    use uuid::Uuid;

    fn invalid_message(result: Result<(), ServiceError>) -> &'static str {
        match result {
            Err(ServiceError::InvalidRequest(message)) => message,
            other => panic!("expected invalid request, got {other:?}"),
        }
    }

#[test]
    fn task_create_validation_covers_required_fields_and_enums() {
        let valid = CreateTaskRequest {
            client_mutation_id: "task-create".to_string(),
            trip_plan_id: None,
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
