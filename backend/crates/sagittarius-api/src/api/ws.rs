use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, header};
use axum::response::Response;
use serde::Deserialize;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::app::{AppState, auth};
use crate::db;
use crate::domain::errors::ServiceError;
use crate::realtime::{RealtimeEvent, RealtimeHub, load_events_after};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WsQuery {
    after_event_id: Option<Uuid>,
    token: Option<String>,
}

pub async fn trip_ws(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    Query(query): Query<WsQuery>,
    headers: HeaderMap,
    ws: WebSocketUpgrade,
) -> Result<Response, ServiceError> {
    let session_token = session_token_from_request(&headers, &query)?;
    let token_hash = auth::hash_session_token(&session_token)?;
    db::queries::find_active_member_session(&state.pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;

    Ok(ws.on_upgrade(move |socket| {
        stream_trip_events(
            socket,
            state.pool,
            state.realtime,
            trip_id,
            query.after_event_id,
        )
    }))
}

fn session_token_from_request(
    headers: &HeaderMap,
    query: &WsQuery,
) -> Result<String, ServiceError> {
    if let Some(token) = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .filter(|token| !token.is_empty())
    {
        return Ok(token.to_string());
    }

    query
        .token
        .clone()
        .filter(|token| !token.is_empty())
        .ok_or(ServiceError::Unauthenticated)
}

#[rustfmt::skip]
async fn stream_trip_events(
    mut socket: WebSocket,
    pool: sqlx::PgPool,
    realtime: RealtimeHub,
    trip_id: Uuid,
    after_event_id: Option<Uuid>,
) {
    let mut receiver = realtime.subscribe();
    let Ok(replay_events) = load_events_after(&pool, trip_id, after_event_id).await else { let _ = socket.send(Message::Close(None)).await; return; };

    let mut last_sent_event_id = after_event_id;
    for event in replay_events {
        if send_event(&mut socket, &event).await.is_err() { return; }
        last_sent_event_id = Some(event.event_id);
    }

    loop {
        match receiver.recv().await {
            Ok(event)
                if should_send_live_event(
                    trip_id,
                    event.trip_id,
                    event.event_id,
                    last_sent_event_id,
                ) =>
            {
                if send_event(&mut socket, &event).await.is_err() { return; }
                last_sent_event_id = Some(event.event_id);
            }
            Ok(_) => {}
            Err(error) => { if matches!(error, broadcast::error::RecvError::Lagged(_)) { let _ = socket.send(Message::Close(None)).await; } return; }
        }
    }
}

pub fn should_send_live_event(
    subscribed_trip_id: Uuid,
    event_trip_id: Uuid,
    event_id: Uuid,
    last_sent_event_id: Option<Uuid>,
) -> bool {
    subscribed_trip_id == event_trip_id
        && last_sent_event_id.is_none_or(|last_sent_event_id| event_id > last_sent_event_id)
}

async fn send_event(socket: &mut WebSocket, event: &RealtimeEvent) -> Result<(), axum::Error> {
    let text = serde_json::to_string(event).map_err(axum::Error::new)?;
    socket.send(Message::Text(text.into())).await
}
