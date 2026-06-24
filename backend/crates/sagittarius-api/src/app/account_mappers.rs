use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;

use crate::db::models::{
    AccountProfileRecord, AccountTodoRecord, AccountTripRecord, AccountTripStatsRecord,
    AccountVaultItemRecord, PasskeyRecord, TrustedDeviceRecord,
};
use crate::domain::types::{
    AccountProfile, AccountTodoSummary, AccountTripStats, AccountTripSummary,
    AccountVaultItemSummary, PasskeySummary, TrustedDeviceSummary,
};

pub fn account_profile_from_record(record: AccountProfileRecord) -> AccountProfile {
    AccountProfile {
        id: record.id,
        display_name: record.display_name,
        avatar_color: record.avatar_color,
        locale: record.locale,
        timezone: record.timezone,
        home_city: record.home_city,
        home_country: record.home_country,
        primary_email: record.primary_email,
    }
}

pub fn trusted_device_summary_from_record(record: TrustedDeviceRecord) -> TrustedDeviceSummary {
    TrustedDeviceSummary {
        id: record.id,
        label: record.label,
        user_agent: record.user_agent,
        created_at: format_timestamp(record.created_at),
        last_seen_at: record.last_seen_at.map(format_timestamp),
    }
}

pub fn account_trip_from_record(record: AccountTripRecord) -> AccountTripSummary {
    let is_owner = record.member_id == record.owner_member_id;

    AccountTripSummary {
        id: record.id,
        name: record.name,
        origin_label: record.origin_label,
        origin_city: record.origin_city,
        origin_country: record.origin_country,
        origin_country_code: record.origin_country_code,
        destination_label: record.destination_label,
        destination_cities: record.destination_cities.0,
        countries: record.countries,
        party_size: record.party_size,
        default_timezone: record.default_timezone,
        start_date: record.start_date,
        end_date: record.end_date,
        role: record.role,
        member_id: record.member_id,
        owner_member_id: record.owner_member_id,
        joined_at: format_timestamp(record.joined_at),
        is_owner,
    }
}

pub fn account_trip_stats_from_record(record: AccountTripStatsRecord) -> AccountTripStats {
    AccountTripStats {
        trips_total: record.trips_total,
        trips_owned: record.trips_owned,
        active_trips: record.active_trips,
        temp_claims_completed: record.temp_claims_completed,
    }
}

pub fn account_todo_from_record(record: AccountTodoRecord) -> AccountTodoSummary {
    AccountTodoSummary {
        id: record.id,
        trip_id: record.trip_id,
        trip_name: record.trip_name,
        title: record.title,
        status: record.status,
        visibility: record.visibility,
        kind: record.kind,
        assignee_id: record.assignee_id,
        related_item_id: record.related_item_id,
        version: record.version,
    }
}

pub fn account_vault_item_from_record(record: AccountVaultItemRecord) -> AccountVaultItemSummary {
    AccountVaultItemSummary {
        id: record.id,
        trip_id: record.trip_id,
        trip_name: record.trip_name,
        kind: record.kind,
        title: record.title,
        detail: record.detail,
        external_url: record.external_url,
        source: record.source,
        created_at: format_timestamp(record.created_at),
    }
}

pub fn passkey_summary_from_record(record: PasskeyRecord) -> PasskeySummary {
    PasskeySummary {
        id: record.id,
        nickname: record.nickname,
        created_at: format_timestamp(record.created_at),
        last_used_at: record.last_used_at.map(format_timestamp),
    }
}

pub fn format_timestamp(timestamp: OffsetDateTime) -> String {
    timestamp
        .format(&Rfc3339)
        .expect("rfc3339 timestamp should format")
}

#[cfg(test)]
mod tests {
    use sqlx::types::Json;
    use time::{Date, Month};
    use uuid::Uuid;

    use super::*;
    use crate::domain::types::{TripCity, TripRole};

    #[test]
    fn account_trip_mapper_derives_owner_flag_and_formats_join_timestamp() {
        let trip_id = Uuid::parse_str("018f0000-0000-7000-8000-000000000001").unwrap();
        let member_id = Uuid::parse_str("018f0000-0000-7000-8000-000000000002").unwrap();

        let summary = account_trip_from_record(AccountTripRecord {
            id: trip_id,
            name: "Seoul Spring".to_string(),
            origin_label: "Bangkok".to_string(),
            origin_city: "Bangkok".to_string(),
            origin_country: "Thailand".to_string(),
            origin_country_code: "TH".to_string(),
            destination_label: "Seoul".to_string(),
            destination_cities: Json(vec![TripCity {
                city: "Seoul".to_string(),
                country: "South Korea".to_string(),
                country_code: "KR".to_string(),
                timezone: "Asia/Seoul".to_string(),
                latitude: 37.5665,
                longitude: 126.978,
            }]),
            countries: vec!["South Korea".to_string()],
            party_size: 4,
            default_timezone: "Asia/Seoul".to_string(),
            start_date: Date::from_calendar_date(2026, Month::March, 1).unwrap(),
            end_date: Date::from_calendar_date(2026, Month::March, 5).unwrap(),
            role: TripRole::Owner,
            member_id,
            owner_member_id: member_id,
            joined_at: OffsetDateTime::UNIX_EPOCH,
        });

        assert_eq!(summary.id, trip_id);
        assert_eq!(summary.destination_cities[0].city, "Seoul");
        assert!(summary.is_owner);
        assert_eq!(summary.joined_at, "1970-01-01T00:00:00Z");
    }

    #[test]
    fn trusted_device_mapper_formats_optional_last_seen_timestamp() {
        let summary = trusted_device_summary_from_record(TrustedDeviceRecord {
            id: Uuid::parse_str("018f0000-0000-7000-8000-000000000003").unwrap(),
            label: "MacBook".to_string(),
            user_agent: "Safari".to_string(),
            created_at: OffsetDateTime::UNIX_EPOCH,
            last_seen_at: Some(OffsetDateTime::UNIX_EPOCH + time::Duration::days(1)),
        });

        assert_eq!(summary.created_at, "1970-01-01T00:00:00Z");
        assert_eq!(
            summary.last_seen_at.as_deref(),
            Some("1970-01-02T00:00:00Z")
        );
    }

    #[test]
    fn format_timestamp_uses_rfc3339_utc_shape() {
        assert_eq!(
            format_timestamp(OffsetDateTime::UNIX_EPOCH),
            "1970-01-01T00:00:00Z"
        );
    }
}
