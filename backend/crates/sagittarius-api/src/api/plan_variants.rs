use axum::Json;
use axum::extract::rejection::JsonRejection;
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
use crate::domain::types::{PlanVariantSummary, TripPlanSummary, TripSummary};

pub async fn create_plan_variant(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<CreatePlanVariantRequest>, JsonRejection>,
) -> Result<(StatusCode, Json<PlanVariantSummary>), ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
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

pub async fn create_trip_plan(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<CreatePlanVariantRequest>, JsonRejection>,
) -> Result<(StatusCode, Json<TripPlanSummary>), ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let trip_plan = app::plan_variants::create_plan_variant(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok((StatusCode::CREATED, Json(trip_plan)))
}

pub async fn patch_plan_variant(
    State(state): State<AppState>,
    Path((trip_id, plan_variant_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<PatchPlanVariantRequest>, JsonRejection>,
) -> Result<Json<PlanVariantSummary>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
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

pub async fn patch_trip_plan(
    State(state): State<AppState>,
    Path((trip_id, trip_plan_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<PatchPlanVariantRequest>, JsonRejection>,
) -> Result<Json<TripPlanSummary>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let trip_plan = app::plan_variants::patch_plan_variant(
        &state.pool,
        &state.realtime,
        trip_id,
        trip_plan_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(trip_plan))
}

pub async fn publish_plan_variant(
    State(state): State<AppState>,
    Path((trip_id, plan_variant_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<PublishPlanVariantRequest>, JsonRejection>,
) -> Result<Json<TripSummary>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
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

pub async fn set_main_trip_plan(
    State(state): State<AppState>,
    Path((trip_id, trip_plan_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<PublishPlanVariantRequest>, JsonRejection>,
) -> Result<Json<TripSummary>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let trip = app::plan_variants::publish_plan_variant(
        &state.pool,
        &state.realtime,
        trip_id,
        trip_plan_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(trip))
}
