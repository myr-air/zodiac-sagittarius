use axum::Json;
use axum::extract::{Path, State};
use http::StatusCode;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{
    CreatePlanVariantRequest, PatchPlanVariantRequest, PublishPlanVariantRequest,
};
use crate::domain::types::{PlanVariantSummary, TripSummary};

pub async fn create_plan_variant(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreatePlanVariantRequest>,
) -> Result<(StatusCode, Json<PlanVariantSummary>), ServiceError> {
    let variant = app::plan_variants::create_plan_variant(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok((StatusCode::CREATED, Json(variant)))
}

pub async fn patch_plan_variant(
    State(state): State<AppState>,
    Path((trip_id, plan_variant_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchPlanVariantRequest>,
) -> Result<Json<PlanVariantSummary>, ServiceError> {
    let variant = app::plan_variants::patch_plan_variant(
        &state.pool,
        &state.realtime,
        trip_id,
        plan_variant_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(variant))
}

pub async fn publish_plan_variant(
    State(state): State<AppState>,
    Path((trip_id, plan_variant_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PublishPlanVariantRequest>,
) -> Result<Json<TripSummary>, ServiceError> {
    let trip = app::plan_variants::publish_plan_variant(
        &state.pool,
        &state.realtime,
        trip_id,
        plan_variant_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(trip))
}
