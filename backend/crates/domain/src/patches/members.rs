use serde::Deserialize;

use crate::errors::ServiceError;
use crate::types::{TripMemberAccessStatus, TripRole};
use super::shared::*;

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMemberRequest {
    pub display_name: String,
    pub role: TripRole,
    pub color: String,
    pub participant_password: Option<String>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchMemberRequest {
    pub display_name: Option<String>,
    pub role: Option<TripRole>,
    pub access_status: Option<TripMemberAccessStatus>,
    pub participant_password: Option<String>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePresenceRequest {
    pub client_mutation_id: String,
    pub presence: String,
}

impl CreateMemberRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_required_text(&self.display_name, "member display name is required")?;
        validate_member_role(self.role)?;
        validate_required_text(&self.color, "member color is required")?;
        if let Some(password) = &self.participant_password {
            validate_participant_password(password)?;
        }

        Ok(())
    }
}

impl PatchMemberRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if let Some(display_name) = &self.display_name {
            validate_required_text(display_name, "member display name is required")?;
        }
        if let Some(role) = self.role {
            validate_member_role(role)?;
        }
        if let Some(password) = &self.participant_password {
            validate_participant_password(password)?;
        }
        if self.display_name.is_none()
            && self.role.is_none()
            && self.access_status.is_none()
            && self.participant_password.is_none()
        {
            return Err(ServiceError::InvalidRequest("member patch is empty"));
        }

        Ok(())
    }
}

