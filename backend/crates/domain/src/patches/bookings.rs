use std::collections::HashSet;

use serde::Deserialize;
use uuid::Uuid;

use crate::errors::ServiceError;
use crate::patch_serde::{
    deserialize_nullable_f64_patch, deserialize_nullable_string_patch,
    deserialize_nullable_uuid_patch,
};
use super::shared::*;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBookingDocRequest {
    pub client_mutation_id: String,
    pub trip_plan_id: Option<Uuid>,
    pub r#type: String,
    pub title: String,
    pub status: String,
    pub visibility: String,
    pub owner_member_id: Option<Uuid>,
    pub provider_name: Option<String>,
    pub confirmation_code: Option<String>,
    pub starts_at: Option<String>,
    pub ends_at: Option<String>,
    pub timezone: Option<String>,
    pub price_amount: Option<f64>,
    pub currency: Option<String>,
    pub traveler_ids: Vec<Uuid>,
    pub external_links: Vec<CreateBookingDocExternalLinkRequest>,
    pub related_itinerary_item_ids: Vec<Uuid>,
    pub related_task_ids: Vec<Uuid>,
    pub related_expense_ids: Vec<Uuid>,
    pub note_ids: Vec<Uuid>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBookingDocExternalLinkRequest {
    pub id: Option<Uuid>,
    pub label: String,
    pub url: String,
    pub provider: Option<String>,
    pub access_note: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchBookingDocRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: BookingDocPatch,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingDocPatch {
    pub r#type: Option<String>,
    pub title: Option<String>,
    pub status: Option<String>,
    pub visibility: Option<String>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub owner_member_id: Option<Option<Uuid>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub provider_name: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub confirmation_code: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub starts_at: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub ends_at: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub timezone: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_f64_patch")]
    pub price_amount: Option<Option<f64>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub currency: Option<Option<String>>,
    pub traveler_ids: Option<Vec<Uuid>>,
    pub external_links: Option<Vec<CreateBookingDocExternalLinkRequest>>,
    pub related_itinerary_item_ids: Option<Vec<Uuid>>,
    pub related_task_ids: Option<Vec<Uuid>>,
    pub related_expense_ids: Option<Vec<Uuid>>,
    pub note_ids: Option<Vec<Uuid>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub notes: Option<Option<String>>,
}


pub(crate) fn validate_unique_booking_doc_external_link_ids(
    links: &[CreateBookingDocExternalLinkRequest],
) -> Result<(), ServiceError> {
    let mut seen = HashSet::new();
    for link in links {
        if let Some(id) = link.id
            && !seen.insert(id)
        {
            return Err(ServiceError::InvalidRequest(
                "booking doc external link ids must be unique",
            ));
        }
    }
    Ok(())
}

impl CreateBookingDocRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_booking_doc_type(&self.r#type)?;
        validate_booking_doc_title(&self.title)?;
        validate_booking_doc_status(&self.status)?;
        validate_booking_doc_visibility(&self.visibility)?;
        validate_booking_doc_price_amount(self.price_amount)?;
        if let Some(currency) = &self.currency {
            validate_booking_doc_currency(currency)?;
        }
        validate_unique_booking_doc_external_link_ids(&self.external_links)?;
        for link in &self.external_links {
            link.validate()?;
        }

        Ok(())
    }
}

impl CreateBookingDocExternalLinkRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_booking_doc_link_label(&self.label)?;
        validate_booking_doc_url(&self.url)
    }
}

impl PatchBookingDocRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        self.patch.validate()
    }
}

impl BookingDocPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if self.is_empty() {
            return Err(ServiceError::InvalidRequest("booking doc patch is empty"));
        }
        if let Some(value) = &self.r#type {
            validate_booking_doc_type(value)?;
        }
        if let Some(value) = &self.title {
            validate_booking_doc_title(value)?;
        }
        if let Some(value) = &self.status {
            validate_booking_doc_status(value)?;
        }
        if let Some(value) = &self.visibility {
            validate_booking_doc_visibility(value)?;
        }
        if let Some(Some(value)) = self.price_amount {
            validate_booking_doc_price_amount(Some(value))?;
        }
        if let Some(Some(value)) = &self.currency {
            validate_booking_doc_currency(value)?;
        }
        if let Some(links) = &self.external_links {
            validate_unique_booking_doc_external_link_ids(links)?;
            for link in links {
                link.validate()?;
            }
        }

        Ok(())
    }

    fn is_empty(&self) -> bool {
        self.r#type.is_none()
            && self.title.is_none()
            && self.status.is_none()
            && self.visibility.is_none()
            && self.owner_member_id.is_none()
            && self.provider_name.is_none()
            && self.confirmation_code.is_none()
            && self.starts_at.is_none()
            && self.ends_at.is_none()
            && self.timezone.is_none()
            && self.price_amount.is_none()
            && self.currency.is_none()
            && self.traveler_ids.is_none()
            && self.external_links.is_none()
            && self.related_itinerary_item_ids.is_none()
            && self.related_task_ids.is_none()
            && self.related_expense_ids.is_none()
            && self.note_ids.is_none()
            && self.notes.is_none()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::errors::ServiceError;
    use uuid::Uuid;

    fn invalid_message(result: Result<(), ServiceError>) -> &'static str {
        match result {
            Err(ServiceError::InvalidRequest(message)) => message,
            other => panic!("expected invalid request, got {other:?}"),
        }
    }

    fn valid_booking_doc_request() -> CreateBookingDocRequest {
        CreateBookingDocRequest {
            client_mutation_id: "booking-create".to_string(),
            trip_plan_id: None,
            r#type: "flight".to_string(),
            title: "Flight to Chiang Mai".to_string(),
            status: "booked".to_string(),
            visibility: "shared".to_string(),
            owner_member_id: None,
            provider_name: Some("Nok Air".to_string()),
            confirmation_code: Some("ABC123".to_string()),
            starts_at: Some("2026-06-07T02:00:00Z".to_string()),
            ends_at: Some("2026-06-07T04:00:00Z".to_string()),
            timezone: Some("Asia/Bangkok".to_string()),
            price_amount: Some(2500.0),
            currency: Some("THB".to_string()),
            traveler_ids: vec![Uuid::now_v7()],
            external_links: vec![CreateBookingDocExternalLinkRequest {
                id: None,
                label: "Airline booking".to_string(),
                url: "https://example.com/booking".to_string(),
                provider: Some("Nok Air".to_string()),
                access_note: None,
            }],
            related_itinerary_item_ids: Vec::new(),
            related_task_ids: Vec::new(),
            related_expense_ids: Vec::new(),
            note_ids: Vec::new(),
            notes: Some("Window seat".to_string()),
        }
    }

#[test]
    fn booking_doc_create_rejects_invalid_external_link_url() {
        for url in ["ftp://example.com/booking", "https://", "http://"] {
            let mut request = valid_booking_doc_request();
            request.external_links[0].url = url.to_string();

            assert_eq!(
                invalid_message(request.validate()),
                "external link URL is invalid"
            );
        }
    }

#[test]
    fn booking_doc_requests_reject_duplicate_external_link_ids() {
        let duplicate_id = Uuid::now_v7();
        let mut create = valid_booking_doc_request();
        create.external_links = vec![
            CreateBookingDocExternalLinkRequest {
                id: Some(duplicate_id),
                label: "Drive".to_string(),
                url: "https://drive.google.com/booking".to_string(),
                provider: Some("Google Drive".to_string()),
                access_note: None,
            },
            CreateBookingDocExternalLinkRequest {
                id: Some(duplicate_id),
                label: "Airline".to_string(),
                url: "https://example.com/booking".to_string(),
                provider: Some("Airline".to_string()),
                access_note: None,
            },
        ];
        assert_eq!(
            invalid_message(create.validate()),
            "booking doc external link ids must be unique"
        );

        let patch = PatchBookingDocRequest {
            client_mutation_id: "booking-patch-links".to_string(),
            expected_version: 2,
            patch: BookingDocPatch {
                external_links: Some(create.external_links),
                ..BookingDocPatch::default()
            },
        };
        assert_eq!(
            invalid_message(patch.validate()),
            "booking doc external link ids must be unique"
        );
    }

#[test]
    fn booking_doc_create_rejects_invalid_type() {
        let mut request = valid_booking_doc_request();
        request.r#type = "rental_car".to_string();

        assert_eq!(invalid_message(request.validate()), "type is invalid");
    }

#[test]
    fn booking_doc_create_rejects_invalid_currency() {
        let mut request = valid_booking_doc_request();
        request.currency = Some("usd".to_string());

        assert_eq!(invalid_message(request.validate()), "currency is invalid");
    }

#[test]
    fn booking_doc_create_rejects_negative_price_amount() {
        let mut request = valid_booking_doc_request();
        request.price_amount = Some(-1.0);

        assert_eq!(
            invalid_message(request.validate()),
            "priceAmount must be finite and zero or greater"
        );
    }

#[test]
    fn booking_doc_requests_reject_non_finite_price_amount() {
        let mut create = valid_booking_doc_request();
        create.price_amount = Some(f64::INFINITY);
        assert_eq!(
            invalid_message(create.validate()),
            "priceAmount must be finite and zero or greater"
        );

        let patch = PatchBookingDocRequest {
            client_mutation_id: "booking-patch".to_string(),
            expected_version: 2,
            patch: BookingDocPatch {
                price_amount: Some(Some(f64::NAN)),
                ..BookingDocPatch::default()
            },
        };
        assert_eq!(
            invalid_message(patch.validate()),
            "priceAmount must be finite and zero or greater"
        );
    }

#[test]
    fn booking_doc_patch_rejects_empty_patch() {
        let request = PatchBookingDocRequest {
            client_mutation_id: "booking-patch-empty".to_string(),
            expected_version: 2,
            patch: BookingDocPatch::default(),
        };

        assert_eq!(
            invalid_message(request.validate()),
            "booking doc patch is empty"
        );
    }

}
