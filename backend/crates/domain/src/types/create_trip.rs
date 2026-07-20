//! Create-trip seed classify / structure types (NL → editable review shape).

use serde::{Deserialize, Serialize};

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ClassifyTripSeedRequest {
    pub text: String,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ClassifiedDestination {
    pub label: String,
    pub role: ClassifiedDestinationRole,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ClassifiedDestinationRole {
    Primary,
    Optional,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "mode", rename_all = "camelCase")]
pub enum ClassifiedWhen {
    Flexible,
    #[serde(rename_all = "camelCase")]
    Months {
        start_y: i32,
        start_m: u8,
        end_y: i32,
        end_m: u8,
    },
    Exact {
        start: String,
        end: String,
    },
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TripSeedRecommendations {
    /// Suggested travel styles (food, culture, adventure, …).
    pub styles: Vec<String>,
    /// Extra place labels the user might add (never required).
    pub related_places: Vec<String>,
    /// Soft season hint when months/exact were not detected.
    pub season_hint: Option<String>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ClassifyTripSeedResponse {
    pub name: String,
    pub destinations: Vec<ClassifiedDestination>,
    pub when: ClassifiedWhen,
    /// high | medium | low — heuristic confidence for the structure.
    pub confidence: String,
    pub recommendations: TripSeedRecommendations,
}
