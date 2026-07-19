use serde::Deserialize;
use time::Date;
use uuid::Uuid;

use crate::errors::ServiceError;
use crate::patch_serde::deserialize_non_null_option;
use crate::plan_status::{
    effective_plan_status, legacy_kind_for_plan_status, reject_main_plan_status,
    validate_plan_status, validate_plan_status_input,
};
use super::shared::*;

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchTripRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub name: Option<String>,
    pub destination_label: Option<String>,
    pub countries: Option<Vec<String>>,
    pub party_size: Option<i32>,
    pub default_timezone: Option<String>,
    pub start_date: Option<Date>,
    pub end_date: Option<Date>,
    pub active_plan_variant_id: Option<Uuid>,
    pub main_trip_plan_id: Option<Uuid>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePlanVariantRequest {
    pub client_mutation_id: String,
    pub name: String,
    #[serde(default, deserialize_with = "deserialize_non_null_option")]
    pub kind: Option<String>,
    #[serde(default, deserialize_with = "deserialize_non_null_option")]
    pub status: Option<String>,
    pub description: Option<String>,
    #[serde(default, deserialize_with = "deserialize_non_null_option")]
    pub source_trip_plan_id: Option<Uuid>,
    #[serde(default, deserialize_with = "deserialize_non_null_option")]
    pub creation_mode: Option<String>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPlanVariantRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: PlanVariantPatch,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanVariantPatch {
    pub name: Option<String>,
    #[serde(default, deserialize_with = "deserialize_non_null_option")]
    pub kind: Option<String>,
    #[serde(default, deserialize_with = "deserialize_non_null_option")]
    pub status: Option<String>,
    pub description: Option<String>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishPlanVariantRequest {
    pub client_mutation_id: String,
    #[serde(default, deserialize_with = "deserialize_non_null_option")]
    pub previous_main_next_status: Option<String>,
}

impl CreatePlanVariantRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_required_text(&self.name, "plan variant name is required")?;
        validate_plan_status_input(self.kind.as_deref(), self.status.as_deref())?;
        reject_main_plan_status(self.kind.as_deref(), self.status.as_deref())?;
        if let Some(description) = &self.description {
            validate_sized_text(description, "plan variant description is too long")?;
        }
        let creation_mode = self.creation_mode.as_deref().unwrap_or("blank");
        match creation_mode {
            "blank" => {}
            "duplicate-current" | "import" => {
                return Err(ServiceError::InvalidRequest(
                    "trip plan creation mode is not supported yet",
                ));
            }
            _ => {
                return Err(ServiceError::InvalidRequest(
                    "trip plan creation mode is invalid",
                ));
            }
        }
        if self.source_trip_plan_id.is_some() {
            return Err(ServiceError::InvalidRequest(
                "source trip plan is not supported for blank creation",
            ));
        }

        Ok(())
    }

    pub fn effective_status(&self) -> &str {
        effective_plan_status(self.kind.as_deref(), self.status.as_deref()).unwrap_or("draft")
    }

    pub fn effective_kind(&self) -> &str {
        legacy_kind_for_plan_status(self.effective_status())
    }
}

impl PatchPlanVariantRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        self.patch.validate()
    }
}

impl PlanVariantPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if let Some(name) = &self.name {
            validate_required_text(name, "plan variant name is required")?;
        }
        validate_plan_status_input(self.kind.as_deref(), self.status.as_deref())?;
        reject_main_plan_status(self.kind.as_deref(), self.status.as_deref())?;
        if let Some(description) = &self.description {
            validate_sized_text(description, "plan variant description is too long")?;
        }
        if self.name.is_none()
            && self.kind.is_none()
            && self.status.is_none()
            && self.description.is_none()
        {
            return Err(ServiceError::InvalidRequest("trip plan patch is empty"));
        }

        Ok(())
    }

    pub fn effective_status(&self) -> Option<&str> {
        effective_plan_status(self.kind.as_deref(), self.status.as_deref())
    }

    pub fn effective_kind(&self) -> Option<&str> {
        self.effective_status().map(legacy_kind_for_plan_status)
    }
}

impl PublishPlanVariantRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        if let Some(status) = &self.previous_main_next_status {
            validate_plan_status(status)?;
            if status == "main" {
                return Err(ServiceError::InvalidRequest(
                    "previous main next status cannot be main",
                ));
            }
        }
        Ok(())
    }
}

