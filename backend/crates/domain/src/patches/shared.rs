use serde_json::Value;
use time::Date;

use crate::errors::ServiceError;
use crate::types::TripRole;

pub use crate::expense_patch_rules::validate_expense_splits_total;

pub(crate) fn validate_hh_mm(value: &str) -> Result<(), ServiceError> {
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

pub(crate) fn validate_activity_type(value: &str) -> Result<(), ServiceError> {
    match value {
        "travel" | "food" | "shopping" | "attraction" | "experience" | "stay" | "default" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("activity_type is invalid")),
    }
}

pub(crate) fn validate_activity_subtype(value: &str) -> Result<(), ServiceError> {
    match value {
        "flight" | "train" | "bus" | "taxi" | "ferry" | "walk" | "car" | "shuttle" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("activity_subtype is invalid")),
    }
}

pub(crate) fn validate_path_role(value: &str) -> Result<(), ServiceError> {
    match value {
        "main" | "alternative" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("path_role is invalid")),
    }
}

pub(crate) fn validate_item_kind(value: &str) -> Result<(), ServiceError> {
    match value {
        "travel" | "activity" | "lodging" | "meal" | "note" | "preparation"
        | "foodRecommendation" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("item_kind is invalid")),
    }
}

pub(crate) fn validate_time_mode(value: &str) -> Result<(), ServiceError> {
    match value {
        "scheduled" | "flexible" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("time_mode is invalid")),
    }
}

pub(crate) fn validate_item_status(value: &str) -> Result<(), ServiceError> {
    match value {
        "idea" | "planned" | "booked" | "confirmed" | "done" | "skipped" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("status is invalid")),
    }
}

pub(crate) fn validate_item_priority(value: &str) -> Result<(), ServiceError> {
    match value {
        "low" | "normal" | "high" | "must" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("priority is invalid")),
    }
}

pub(crate) fn validate_client_mutation_id(value: &str) -> Result<(), ServiceError> {
    if value.trim().is_empty() {
        return Err(ServiceError::InvalidRequest(
            "client_mutation_id is required",
        ));
    }

    Ok(())
}

pub(crate) fn validate_stop_note_body(value: &str) -> Result<(), ServiceError> {
    if value.trim().is_empty() {
        return Err(ServiceError::InvalidRequest("stop note body is required"));
    }

    Ok(())
}

pub(crate) fn validate_task_title(value: &str) -> Result<(), ServiceError> {
    validate_required_text(value, "task title is required")
}

pub(crate) fn validate_required_text(value: &str, message: &'static str) -> Result<(), ServiceError> {
    if value.trim().is_empty() {
        return Err(ServiceError::InvalidRequest(message));
    }

    validate_sized_text(value, "text is too long")
}

pub(crate) fn validate_sized_text(value: &str, message: &'static str) -> Result<(), ServiceError> {
    if value.chars().count() > 500 {
        return Err(ServiceError::InvalidRequest(message));
    }

    Ok(())
}

pub(crate) fn validate_optional_override(
    value: &Option<Option<String>>,
    field: &'static str,
) -> Result<(), ServiceError> {
    if let Some(Some(text)) = value {
        validate_sized_text(text, field)?;
    }
    Ok(())
}

pub(crate) fn validate_optional_day_title(value: &Option<Option<String>>) -> Result<(), ServiceError> {
    if let Some(Some(text)) = value {
        if text.chars().count() > 48 {
            return Err(ServiceError::InvalidRequest("dayTitle is too long"));
        }
    }
    Ok(())
}

pub(crate) fn validate_task_visibility(value: &str) -> Result<(), ServiceError> {
    match value {
        "private" | "shared" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("task visibility is invalid")),
    }
}

pub(crate) fn validate_task_status(value: &str) -> Result<(), ServiceError> {
    match value {
        "open" | "done" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("task status is invalid")),
    }
}

pub(crate) fn validate_booking_doc_type(value: &str) -> Result<(), ServiceError> {
    match value {
        "flight" | "train" | "public_transport" | "hotel" | "insurance" | "passport" | "visa"
        | "activity_ticket" | "other" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("type is invalid")),
    }
}

pub(crate) fn validate_booking_doc_status(value: &str) -> Result<(), ServiceError> {
    match value {
        "draft" | "needs_action" | "booked" | "confirmed" | "paid" | "cancelled" | "expired" => {
            Ok(())
        }
        _ => Err(ServiceError::InvalidRequest("status is invalid")),
    }
}

pub(crate) fn validate_booking_doc_visibility(value: &str) -> Result<(), ServiceError> {
    match value {
        "shared" | "sensitive" | "private" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("visibility is invalid")),
    }
}

pub(crate) fn validate_booking_doc_title(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.len() > 180 {
        return Err(ServiceError::InvalidRequest("title is invalid"));
    }
    Ok(())
}

pub(crate) fn validate_booking_doc_currency(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if trimmed.len() != 3 || !trimmed.chars().all(|c| c.is_ascii_uppercase()) {
        return Err(ServiceError::InvalidRequest("currency is invalid"));
    }
    Ok(())
}

pub(crate) fn validate_booking_doc_price_amount(value: Option<f64>) -> Result<(), ServiceError> {
    if value.is_some_and(|amount| !amount.is_finite() || amount < 0.0) {
        return Err(ServiceError::InvalidRequest(
            "priceAmount must be finite and zero or greater",
        ));
    }
    Ok(())
}

pub(crate) fn validate_booking_doc_link_label(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.len() > 80 {
        return Err(ServiceError::InvalidRequest(
            "external link label is invalid",
        ));
    }
    Ok(())
}

pub(crate) fn validate_booking_doc_url(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    validate_http_url(trimmed, "external link URL is invalid")
}

pub(crate) fn validate_photo_album_title(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.len() > 180 {
        return Err(ServiceError::InvalidRequest("photo album title is invalid"));
    }
    Ok(())
}

pub(crate) fn validate_photo_album_provider(value: &str) -> Result<(), ServiceError> {
    match value {
        "google_photos" | "icloud" | "google_drive" | "dropbox" | "onedrive" | "custom" => Ok(()),
        _ => Err(ServiceError::InvalidRequest(
            "photo album provider is invalid",
        )),
    }
}

pub(crate) fn validate_photo_album_access(value: &str) -> Result<(), ServiceError> {
    match value {
        "view_only" | "collaborative" | "upload_request" => Ok(()),
        _ => Err(ServiceError::InvalidRequest(
            "photo album access is invalid",
        )),
    }
}

pub(crate) fn validate_photo_album_url(value: &str) -> Result<(), ServiceError> {
    validate_http_url(value.trim(), "photo album URL is invalid")
}

pub(crate) fn validate_iso_date(value: &str, message: &'static str) -> Result<(), ServiceError> {
    let value = value.trim();
    let mut parts = value.split('-');
    let (Some(year), Some(month), Some(day), None) =
        (parts.next(), parts.next(), parts.next(), parts.next())
    else {
        return Err(ServiceError::InvalidRequest(message));
    };
    let year = year
        .parse::<i32>()
        .map_err(|_| ServiceError::InvalidRequest(message))?;
    let month = month
        .parse::<u8>()
        .map_err(|_| ServiceError::InvalidRequest(message))?;
    let day = day
        .parse::<u8>()
        .map_err(|_| ServiceError::InvalidRequest(message))?;
    Date::from_calendar_date(
        year,
        time::Month::try_from(month).map_err(|_| ServiceError::InvalidRequest(message))?,
        day,
    )
    .map(|_| ())
    .map_err(|_| ServiceError::InvalidRequest(message))
}

pub(crate) fn validate_optional_map_link(value: Option<&str>) -> Result<(), ServiceError> {
    let Some(trimmed) = value.map(str::trim).filter(|value| !value.is_empty()) else {
        return Ok(());
    };
    validate_http_url(trimmed, "map link URL is invalid")
}

pub(crate) fn validate_http_url(value: &str, message: &'static str) -> Result<(), ServiceError> {
    let parsed = value
        .parse::<http::Uri>()
        .map_err(|_| ServiceError::InvalidRequest(message))?;
    if !matches!(parsed.scheme_str(), Some("http" | "https"))
        || parsed.host().is_none_or(str::is_empty)
        || value.len() > 2048
    {
        return Err(ServiceError::InvalidRequest(message));
    }
    Ok(())
}


pub(crate) fn validate_optional_details(value: Option<&Value>) -> Result<(), ServiceError> {
    let Some(value) = value else {
        return Ok(());
    };
    if !value.is_object() {
        return Err(ServiceError::InvalidRequest("details must be an object"));
    }

    Ok(())
}

pub(crate) fn validate_member_role(role: TripRole) -> Result<(), ServiceError> {
    if role == TripRole::Owner {
        return Err(ServiceError::InvalidRequest(
            "owner role must use ownership transfer",
        ));
    }

    Ok(())
}

pub(crate) fn validate_participant_password(value: &str) -> Result<(), ServiceError> {
    if value.trim().len() < 4 {
        return Err(ServiceError::InvalidRequest(
            "participant password must be at least 4 characters",
        ));
    }

    Ok(())
}

pub(crate) fn validate_task_kind(value: &str) -> Result<(), ServiceError> {
    match value {
        "prep" | "booking" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("task kind is invalid")),
    }
}

pub(crate) fn validate_coordinate_patch(
    latitude: Option<Option<f64>>,
    longitude: Option<Option<f64>>,
) -> Result<(), ServiceError> {
    if latitude.is_some() != longitude.is_some() {
        return Err(ServiceError::InvalidRequest(
            "latitude and longitude must be provided together",
        ));
    }

    match (latitude, longitude) {
        (Some(Some(lat)), Some(Some(lng))) => validate_coordinates(Some(lat), Some(lng)),
        (Some(None), Some(None)) | (None, None) => Ok(()),
        _ => Err(ServiceError::InvalidRequest(
            "latitude and longitude must be provided together",
        )),
    }
}

pub(crate) fn validate_coordinates(latitude: Option<f64>, longitude: Option<f64>) -> Result<(), ServiceError> {
    if latitude.is_some() != longitude.is_some() {
        return Err(ServiceError::InvalidRequest(
            "latitude and longitude must be provided together",
        ));
    }
    if latitude.is_some_and(|value| !(-90.0..=90.0).contains(&value))
        || longitude.is_some_and(|value| !(-180.0..=180.0).contains(&value))
    {
        return Err(ServiceError::InvalidRequest("coordinates are out of range"));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use crate::errors::ServiceError;

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
}
