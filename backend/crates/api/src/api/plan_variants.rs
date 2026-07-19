use axum::Json;
use axum::Router;
use axum::extract::rejection::JsonRejection;
use axum::extract::{Path, State};
use axum::routing::{patch, post};
use http::StatusCode;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{
    CreatePlanVariantRequest, PatchPlanVariantRequest, PublishPlanVariantRequest,
};
use crate::domain::types::{PlanVariantSummary, TripPlanSummary, TripSummary};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/trips/{trip_id}/plan-variants",
            post(create_plan_variant),
        )
        .route(
            "/trips/{trip_id}/plan-variants/{plan_variant_id}",
            patch(patch_plan_variant),
        )
        .route(
            "/trips/{trip_id}/plan-variants/{plan_variant_id}/publications",
            post(publish_plan_variant),
        )
        .route("/trips/{trip_id}/trip-plans", post(create_trip_plan))
        .route(
            "/trips/{trip_id}/trip-plans/{trip_plan_id}",
            patch(patch_trip_plan),
        )
        .route(
            "/trips/{trip_id}/trip-plans/{trip_plan_id}/set-main",
            post(set_main_trip_plan),
        )
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/plan-variants",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = CreatePlanVariantRequest,
    responses(
        (status = 201, description = "Plan variant created", body = PlanVariantSummary)
    ),
    tag = "plan_variants"
)]
pub async fn create_plan_variant(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<CreatePlanVariantRequest>, JsonRejection>,
) -> Result<(StatusCode, Json<PlanVariantSummary>), ApiError> {
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

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/trip-plans",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = CreatePlanVariantRequest,
    responses(
        (status = 201, description = "Trip plan created", body = TripPlanSummary)
    ),
    tag = "plan_variants"
)]
pub async fn create_trip_plan(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<CreatePlanVariantRequest>, JsonRejection>,
) -> Result<(StatusCode, Json<TripPlanSummary>), ApiError> {
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

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/plan-variants/{plan_variant_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("plan_variant_id" = String, Path, description = "Plan variant id")
    ),
    request_body = PatchPlanVariantRequest,
    responses(
        (status = 200, description = "Plan variant updated", body = PlanVariantSummary)
    ),
    tag = "plan_variants"
)]
pub async fn patch_plan_variant(
    State(state): State<AppState>,
    Path((trip_id, plan_variant_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<PatchPlanVariantRequest>, JsonRejection>,
) -> Result<Json<PlanVariantSummary>, ApiError> {
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

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/trip-plans/{trip_plan_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("trip_plan_id" = String, Path, description = "Trip plan id")
    ),
    request_body = PatchPlanVariantRequest,
    responses(
        (status = 200, description = "Trip plan updated", body = TripPlanSummary)
    ),
    tag = "plan_variants"
)]
pub async fn patch_trip_plan(
    State(state): State<AppState>,
    Path((trip_id, trip_plan_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<PatchPlanVariantRequest>, JsonRejection>,
) -> Result<Json<TripPlanSummary>, ApiError> {
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

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/plan-variants/{plan_variant_id}/publications",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("plan_variant_id" = String, Path, description = "Plan variant id")
    ),
    request_body = PublishPlanVariantRequest,
    responses(
        (status = 200, description = "Plan variant published", body = TripSummary)
    ),
    tag = "plan_variants"
)]
pub async fn publish_plan_variant(
    State(state): State<AppState>,
    Path((trip_id, plan_variant_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<PublishPlanVariantRequest>, JsonRejection>,
) -> Result<Json<TripSummary>, ApiError> {
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

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/trip-plans/{trip_plan_id}/set-main",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("trip_plan_id" = String, Path, description = "Trip plan id")
    ),
    request_body = PublishPlanVariantRequest,
    responses(
        (status = 200, description = "Main trip plan set", body = TripSummary)
    ),
    tag = "plan_variants"
)]
pub async fn set_main_trip_plan(
    State(state): State<AppState>,
    Path((trip_id, trip_plan_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<PublishPlanVariantRequest>, JsonRejection>,
) -> Result<Json<TripSummary>, ApiError> {
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
