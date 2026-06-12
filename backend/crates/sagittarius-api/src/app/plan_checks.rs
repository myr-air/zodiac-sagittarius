use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use time::OffsetDateTime;
use uuid::Uuid;

use crate::app::auth;
use crate::db;
use crate::db::PgPool;
use crate::db::models::{NewPlanCheck, NewPlanSuggestion, plan_check_summary};
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::types::{Capability, ItineraryItemSummary, PlanCheckSummary};

pub async fn run_plan_check(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
) -> Result<PlanCheckSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary)
        && !can(session.role, Capability::CreateSuggestion)
    {
        return Err(ServiceError::Forbidden);
    }
    let trip = db::queries::find_trip_by_id(pool, session.trip_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let items: Vec<ItineraryItemSummary> = db::queries::list_itinerary_items(pool, session.trip_id)
        .await?
        .into_iter()
        .map(Into::into)
        .collect();
    let fingerprint = itinerary_fingerprint(&items);
    let check_record = db::queries::insert_plan_check(
        &mut tx,
        NewPlanCheck {
            id: Uuid::now_v7(),
            trip_id: session.trip_id,
            created_by: session.member_id,
            itinerary_fingerprint: &fingerprint,
            language_metadata: &json!({
                "mode": "bilingual",
                "provider": std::env::var("SAGITTARIUS_AI_PROVIDER").unwrap_or_else(|_| "rules".to_string())
            }),
        },
    )
    .await?;
    let findings = build_findings(&trip.default_timezone, &items);
    let mut suggestions = Vec::with_capacity(findings.len());
    for finding in findings {
        let record = db::queries::insert_plan_suggestion(
            &mut tx,
            NewPlanSuggestion {
                id: Uuid::now_v7(),
                trip_id: session.trip_id,
                plan_check_id: check_record.id,
                severity: finding.severity,
                scope: finding.scope,
                target_item_ids: &finding.target_item_ids,
                explanation_i18n: &json!({ "en": finding.explanation_en, "th": finding.explanation_th }),
                recommended_action_i18n: &json!({ "en": finding.action_en, "th": finding.action_th }),
                action_kind: finding.action_kind,
                action_payload: &finding.action_payload,
            },
        )
        .await?;
        suggestions.push(record.into_summary());
    }

    tx.commit().await?;
    Ok(plan_check_summary(check_record, false, suggestions))
}

pub async fn latest_plan_check(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
) -> Result<Option<PlanCheckSummary>, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ViewPlan) {
        return Err(ServiceError::Forbidden);
    }
    latest_plan_check_for_trip(pool, session.trip_id).await
}

pub async fn latest_plan_check_for_trip(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Option<PlanCheckSummary>, ServiceError> {
    let Some(check) = db::queries::find_latest_plan_check(pool, trip_id).await? else {
        return Ok(None);
    };
    let items: Vec<ItineraryItemSummary> = db::queries::list_itinerary_items(pool, trip_id)
        .await?
        .into_iter()
        .map(Into::into)
        .collect();
    let stale = check.itinerary_fingerprint != itinerary_fingerprint(&items);
    let suggestions = db::queries::list_plan_suggestions(pool, check.id)
        .await?
        .into_iter()
        .map(|record| record.into_summary())
        .collect();
    Ok(Some(plan_check_summary(check, stale, suggestions)))
}

pub async fn patch_plan_suggestion(
    pool: &PgPool,
    trip_id: Uuid,
    suggestion_id: Uuid,
    session_token: &str,
    status: &str,
    snoozed_until: Option<String>,
    expected_version: i64,
) -> Result<crate::domain::types::PlanSuggestionSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ReviewSuggestions) && status != "snoozed" {
        return Err(ServiceError::Forbidden);
    }
    let existing = db::queries::lock_plan_suggestion(&mut tx, suggestion_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != session.trip_id {
        return Err(ServiceError::NotFound);
    }
    if existing.version != expected_version {
        let latest = serde_json::to_value(existing.into_summary())
            .map_err(|_| ServiceError::InvalidRequest("latest suggestion could not serialize"))?;
        return Err(ServiceError::VersionConflictWithLatest(latest));
    }
    validate_status(status)?;
    let snooze_ref = snoozed_until.as_deref();
    if status == "snoozed" && snooze_ref.is_none() {
        return Err(ServiceError::InvalidRequest("snoozedUntil is required"));
    }
    if let Some(value) = snooze_ref {
        OffsetDateTime::parse(value, &time::format_description::well_known::Rfc3339)
            .map_err(|_| ServiceError::InvalidRequest("snoozedUntil is invalid"))?;
    }
    let updated = db::queries::update_plan_suggestion_status(
        &mut tx,
        suggestion_id,
        status,
        snooze_ref,
        expected_version + 1,
    )
    .await?
    .ok_or(ServiceError::NotFound)?;
    tx.commit().await?;
    Ok(updated.into_summary())
}

fn validate_status(status: &str) -> Result<(), ServiceError> {
    match status {
        "accepted" | "dismissed" | "snoozed" => Ok(()),
        _ => Err(ServiceError::InvalidRequest(
            "plan suggestion status is invalid",
        )),
    }
}

pub fn itinerary_fingerprint(items: &[ItineraryItemSummary]) -> String {
    let mut rows = items
        .iter()
        .map(|item| {
            json!({
                "id": item.id,
                "version": item.version,
                "day": item.day,
                "sortOrder": item.sort_order,
                "startTime": item.start_time,
                "durationMinutes": item.duration_minutes,
                "itemKind": item.item_kind,
                "timeMode": item.time_mode,
                "parentItemId": item.parent_item_id,
                "details": item.details,
            })
            .to_string()
        })
        .collect::<Vec<_>>();
    rows.sort();
    let mut hasher = Sha256::new();
    for row in rows {
        hasher.update(row.as_bytes());
    }
    format!("{:x}", hasher.finalize())
}

struct Finding {
    severity: &'static str,
    scope: &'static str,
    target_item_ids: Vec<Uuid>,
    explanation_en: String,
    explanation_th: String,
    action_en: String,
    action_th: String,
    action_kind: Option<&'static str>,
    action_payload: Value,
}

fn build_findings(default_timezone: &str, items: &[ItineraryItemSummary]) -> Vec<Finding> {
    let mut findings = Vec::new();
    for item in items {
        if item.time_mode == "scheduled" && item.start_time.trim().is_empty() {
            findings.push(item_patch_finding(
                "warning",
                item,
                "Missing scheduled time.",
                "ยังไม่มีเวลาสำหรับรายการที่ตั้งเป็น scheduled",
                "Add a time or switch this row to flexible.",
                "เพิ่มเวลา หรือเปลี่ยนรายการนี้เป็น flexible",
                json!({ "timeMode": "flexible", "startTime": null, "durationMinutes": null }),
            ));
        }
        if item.duration_minutes.is_none() && item.time_mode == "scheduled" {
            findings.push(item_patch_finding(
                "info",
                item,
                "Missing duration makes route timing harder to check.",
                "ยังไม่มีระยะเวลา ทำให้ตรวจจังหวะการเดินทางได้ยาก",
                "Add a realistic duration.",
                "เพิ่มระยะเวลาที่สมจริง",
                json!({ "durationMinutes": 60 }),
            ));
        }
        if item.item_kind == "travel" && transport_segments(item).is_empty() {
            findings.push(item_finding(
                "warning",
                item,
                "Travel item is missing transport segment details.",
                "รายการเดินทางยังไม่มีรายละเอียด segment",
                "Add origin, destination, mode, and local departure/arrival.",
                "เพิ่มต้นทาง ปลายทาง วิธีเดินทาง และเวลา local",
                Some("editItem"),
            ));
        }
        if (item.item_kind == "meal" || item.activity_type == "food")
            && !has_detail_key(item, "reservationStatus")
        {
            findings.push(item_finding(
                "info",
                item,
                "Meal item may need reservation or queue details.",
                "รายการอาหารอาจต้องระบุการจองหรือเวลารอคิว",
                "Add reservation status, queue expectation, or dietary notes.",
                "เพิ่มสถานะจอง คิวที่คาดไว้ หรือ dietary notes",
                Some("editItem"),
            ));
        }
        if item.item_kind == "lodging"
            && !has_any_detail_key(item, &["checkInTime", "checkOutTime"])
        {
            findings.push(item_finding(
                "warning",
                item,
                "Lodging item is missing check-in or check-out timing.",
                "ที่พักยังไม่มีเวลา check-in หรือ check-out",
                "Add check-in/check-out details.",
                "เพิ่มรายละเอียด check-in/check-out",
                Some("editItem"),
            ));
        }
        if item.item_kind == "travel" && default_timezone.trim().is_empty() {
            findings.push(item_finding(
                "warning",
                item,
                "Trip timezone is missing for transport display.",
                "ยังไม่มี timezone หลักของทริปสำหรับแสดงเวลาเดินทาง",
                "Set the trip default timezone.",
                "ตั้งค่า timezone หลักของทริป",
                None,
            ));
        }
    }
    findings.extend(overlap_findings(items));
    findings.extend(plan_block_child_findings(items));
    findings
}

fn item_finding(
    severity: &'static str,
    item: &ItineraryItemSummary,
    explanation_en: &str,
    explanation_th: &str,
    action_en: &str,
    action_th: &str,
    action_kind: Option<&'static str>,
) -> Finding {
    Finding {
        severity,
        scope: "item",
        target_item_ids: vec![item.id],
        explanation_en: format!("{} {}", item.activity, explanation_en),
        explanation_th: format!("{} {}", item.activity, explanation_th),
        action_en: action_en.to_string(),
        action_th: action_th.to_string(),
        action_kind,
        action_payload: json!({ "itemId": item.id }),
    }
}

fn item_patch_finding(
    severity: &'static str,
    item: &ItineraryItemSummary,
    explanation_en: &str,
    explanation_th: &str,
    action_en: &str,
    action_th: &str,
    patch: Value,
) -> Finding {
    Finding {
        severity,
        scope: "item",
        target_item_ids: vec![item.id],
        explanation_en: format!("{} {}", item.activity, explanation_en),
        explanation_th: format!("{} {}", item.activity, explanation_th),
        action_en: action_en.to_string(),
        action_th: action_th.to_string(),
        action_kind: Some("editItem"),
        action_payload: json!({ "itemId": item.id, "patch": patch }),
    }
}

fn overlap_findings(items: &[ItineraryItemSummary]) -> Vec<Finding> {
    let mut findings = Vec::new();
    let mut sorted = items
        .iter()
        .filter_map(|item| {
            let start = parse_time(&item.start_time)?;
            let duration = item.duration_minutes?;
            if duration <= 0 {
                return None;
            }
            Some((
                item,
                itinerary_overlap_path_key(item),
                start,
                start + duration,
            ))
        })
        .collect::<Vec<_>>();
    sorted.sort_by(|left, right| {
        let (left_item, left_path, left_start, _) = left;
        let (right_item, right_path, right_start, _) = right;
        (
            left_item.plan_variant_id,
            left_item.day,
            left_path,
            *left_start,
            left_item.sort_order,
        )
            .cmp(&(
                right_item.plan_variant_id,
                right_item.day,
                right_path,
                *right_start,
                right_item.sort_order,
            ))
    });
    for (index, (a, a_path, _, a_end)) in sorted.iter().enumerate() {
        for (b, b_path, b_start, _) in sorted.iter().skip(index + 1) {
            if a.plan_variant_id != b.plan_variant_id || a.day != b.day || a_path != b_path {
                continue;
            }
            if *b_start >= *a_end {
                break;
            }
            findings.push(Finding {
                severity: "warning",
                scope: "betweenItems",
                target_item_ids: vec![a.id, b.id],
                explanation_en: format!("{} overlaps with {}.", a.activity, b.activity),
                explanation_th: format!("{} เวลาซ้อนกับ {}", a.activity, b.activity),
                action_en: "Adjust time, duration, or move one item to an alternative path."
                    .to_string(),
                action_th: "ปรับเวลา ระยะเวลา หรือย้ายหนึ่งรายการไป path ทางเลือก".to_string(),
                action_kind: Some("editItem"),
                action_payload: json!({ "itemIds": [a.id, b.id] }),
            });
        }
    }
    findings
}

fn itinerary_overlap_path_key(item: &ItineraryItemSummary) -> String {
    if item.path_role.as_deref() == Some("alternative") {
        return item
            .path_id
            .clone()
            .unwrap_or_else(|| format!("alternative:{}", item.id));
    }
    "main".to_string()
}

fn plan_block_child_findings(items: &[ItineraryItemSummary]) -> Vec<Finding> {
    let mut findings = Vec::new();
    for child in items.iter().filter(|item| item.parent_item_id.is_some()) {
        let Some(parent) = items
            .iter()
            .find(|item| Some(item.id) == child.parent_item_id)
        else {
            continue;
        };
        let Some(parent_start) = parse_time(&parent.start_time) else {
            continue;
        };
        let Some(child_start) = parse_time(&child.start_time) else {
            continue;
        };
        let parent_end = parent_start + parent.duration_minutes.unwrap_or(0);
        let child_end = child_start + child.duration_minutes.unwrap_or(0);
        if child_start < parent_start
            || (parent.duration_minutes.is_some() && child_end > parent_end)
        {
            findings.push(Finding {
                severity: "warning",
                scope: "item",
                target_item_ids: vec![child.id, parent.id],
                explanation_en: format!(
                    "{} sits outside the {} plan block window.",
                    child.activity, parent.activity
                ),
                explanation_th: format!(
                    "{} อยู่นอกช่วงเวลาของ plan block {}",
                    child.activity, parent.activity
                ),
                action_en: "Move the child item inside the block window or resize the block."
                    .to_string(),
                action_th: "ย้ายรายการย่อยให้อยู่ในช่วง block หรือปรับเวลา block".to_string(),
                action_kind: Some("editItem"),
                action_payload: json!({
                    "itemId": child.id,
                    "parentItemId": parent.id,
                    "patch": { "parentItemId": null }
                }),
            });
        }
    }
    findings
}

fn parse_time(value: &str) -> Option<i32> {
    let (hour, minute) = value.split_once(':')?;
    Some(hour.parse::<i32>().ok()? * 60 + minute.parse::<i32>().ok()?)
}

fn transport_segments(item: &ItineraryItemSummary) -> Vec<Value> {
    item.details
        .get("transportSegments")
        .and_then(|value| value.as_array())
        .cloned()
        .unwrap_or_default()
}

fn has_detail_key(item: &ItineraryItemSummary, key: &str) -> bool {
    item.details
        .get(key)
        .and_then(|value| value.as_str())
        .is_some_and(|value| !value.trim().is_empty())
}

fn has_any_detail_key(item: &ItineraryItemSummary, keys: &[&str]) -> bool {
    keys.iter().any(|key| has_detail_key(item, key))
}
