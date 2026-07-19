use serde::Deserialize;
use serde_json::Value;
use uuid::Uuid;

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSuggestionRequest {
    pub client_mutation_id: String,
    pub r#type: String,
    pub target_item_id: Option<Uuid>,
    pub plan_variant_id: Uuid,
    pub source_version: Option<i64>,
    #[cfg_attr(feature = "openapi", schema(value_type = Object))]
    pub proposed_patch: Value,
}

