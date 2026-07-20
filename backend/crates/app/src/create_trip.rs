//! NL → structured trip seed (mock/heuristic; LLM swap later).

use time::OffsetDateTime;

use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::types::{
    ClassifiedDestination, ClassifiedDestinationRole, ClassifiedWhen, ClassifyTripSeedRequest,
    ClassifyTripSeedResponse, TripSeedRecommendations,
};

use sagittarius_db::PgPool;

use crate::account::authenticate_user_session;

const MAX_SEED_CHARS: usize = 2_000;

const MONTHS: [(&str, u8); 12] = [
    ("january", 0),
    ("february", 1),
    ("march", 2),
    ("april", 3),
    ("may", 4),
    ("june", 5),
    ("july", 6),
    ("august", 7),
    ("september", 8),
    ("october", 9),
    ("november", 10),
    ("december", 11),
];

pub async fn classify_trip_seed(
    pool: &PgPool,
    session_token: &str,
    input: ClassifyTripSeedRequest,
) -> Result<ClassifyTripSeedResponse, ServiceError> {
    authenticate_user_session(pool, session_token).await?;
    classify_trip_seed_text(&input.text)
}

/// Pure classifier used by HTTP and unit tests. Never invents join credentials.
pub fn classify_trip_seed_text(text: &str) -> Result<ClassifyTripSeedResponse, ServiceError> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err(ServiceError::InvalidRequest("seed text is required"));
    }
    if trimmed.chars().count() > MAX_SEED_CHARS {
        return Err(ServiceError::InvalidRequest("seed text is too long"));
    }

    let recommendations = recommend_from_text(trimmed);
    let year = OffsetDateTime::now_utc().year();

    if let Some((start, end, name, destinations)) = parse_exact(trimmed) {
        return Ok(ClassifyTripSeedResponse {
            name,
            destinations,
            when: ClassifiedWhen::Exact { start, end },
            confidence: "high".to_string(),
            recommendations,
        });
    }

    if let Some((destinations, start_m, end_m)) = parse_months(trimmed) {
        let start_y = year;
        let end_y = if end_m < start_m { year + 1 } else { year };
        let name = primary_label(&destinations);
        return Ok(ClassifyTripSeedResponse {
            name,
            destinations,
            when: ClassifiedWhen::Months {
                start_y,
                start_m,
                end_y,
                end_m,
            },
            confidence: "high".to_string(),
            recommendations,
        });
    }

    let (name, destinations) = parse_flexible_place(trimmed);
    let confidence = if destinations.is_empty() {
        "low"
    } else {
        "medium"
    };
    Ok(ClassifyTripSeedResponse {
        name,
        destinations,
        when: ClassifiedWhen::Flexible,
        confidence: confidence.to_string(),
        recommendations,
    })
}

fn primary_label(destinations: &[ClassifiedDestination]) -> String {
    destinations
        .iter()
        .find(|d| d.role == ClassifiedDestinationRole::Primary)
        .or_else(|| destinations.first())
        .map(|d| d.label.clone())
        .unwrap_or_default()
}

fn parse_exact(
    text: &str,
) -> Option<(String, String, String, Vec<ClassifiedDestination>)> {
    let dates = find_iso_dates(text);
    if dates.len() < 2 {
        return None;
    }
    let call_it = find_after_ci(text, "call it ").map(|s| {
        s.split(['.', '\n'])
            .next()
            .unwrap_or(s)
            .trim()
            .to_string()
    });
    let place = trip_place_prefix(text).unwrap_or_default();
    let destinations = if place.is_empty() {
        vec![]
    } else {
        vec![ClassifiedDestination {
            label: place.clone(),
            role: ClassifiedDestinationRole::Primary,
        }]
    };
    let name = call_it.unwrap_or_else(|| place.clone());
    Some((dates[0].clone(), dates[1].clone(), name, destinations))
}

fn find_iso_dates(text: &str) -> Vec<String> {
    let bytes = text.as_bytes();
    let mut out = Vec::new();
    let mut i = 0;
    while i + 10 <= bytes.len() {
        if is_iso_date_at(bytes, i) {
            out.push(text[i..i + 10].to_string());
            i += 10;
            continue;
        }
        i += 1;
    }
    out
}

fn is_iso_date_at(bytes: &[u8], i: usize) -> bool {
    if i + 10 > bytes.len() {
        return false;
    }
    bytes[i..i + 4].iter().all(u8::is_ascii_digit)
        && bytes[i + 4] == b'-'
        && bytes[i + 5..i + 7].iter().all(u8::is_ascii_digit)
        && bytes[i + 7] == b'-'
        && bytes[i + 8..i + 10].iter().all(u8::is_ascii_digit)
}

fn trip_place_prefix(text: &str) -> Option<String> {
    let lower = text.to_ascii_lowercase();
    let markers = [" road trip", " trip"];
    for marker in markers {
        if let Some(idx) = lower.find(marker) {
            let prefix = text[..idx].trim();
            if !prefix.is_empty()
                && prefix
                    .chars()
                    .next()
                    .is_some_and(|c| c.is_ascii_alphabetic())
            {
                return Some(prefix.to_string());
            }
        }
    }
    None
}

fn find_after_ci<'a>(text: &'a str, needle: &str) -> Option<&'a str> {
    let lower = text.to_ascii_lowercase();
    let needle_l = needle.to_ascii_lowercase();
    let idx = lower.find(&needle_l)?;
    Some(&text[idx + needle.len()..])
}

fn parse_months(text: &str) -> Option<(Vec<ClassifiedDestination>, u8, u8)> {
    let destinations = parse_role_destinations(text)?;
    let months = parse_month_indexes(text);
    if months.len() < 2 {
        return None;
    }
    Some((destinations, months[0], months[1]))
}

fn parse_role_destinations(text: &str) -> Option<Vec<ClassifiedDestination>> {
    let lower = text.to_ascii_lowercase();
    let mut destinations = Vec::new();
    for (role_word, role) in [
        (" primary", ClassifiedDestinationRole::Primary),
        (" optional", ClassifiedDestinationRole::Optional),
    ] {
        let mut search_from = 0;
        while let Some(rel) = lower[search_from..].find(role_word) {
            let abs = search_from + rel;
            if let Some(label) = capitalized_label_before(text, abs) {
                destinations.push(ClassifiedDestination {
                    label,
                    role: role.clone(),
                });
            }
            search_from = abs + role_word.len();
        }
    }
    // Preserve appearance order by sorting on original position of labels.
    destinations.sort_by_key(|d| {
        text.find(&d.label).unwrap_or(usize::MAX)
    });
    if destinations.is_empty() {
        None
    } else {
        Some(destinations)
    }
}

fn capitalized_label_before(text: &str, role_idx: usize) -> Option<String> {
    let before = text[..role_idx].trim_end();
    if before.is_empty() {
        return None;
    }
    let tokens: Vec<&str> = before.split_whitespace().collect();
    let mut collected = Vec::new();
    for token in tokens.iter().rev() {
        let chars: Vec<char> = token.chars().collect();
        if chars.is_empty() {
            break;
        }
        if !chars[0].is_ascii_uppercase() {
            break;
        }
        if !chars.iter().skip(1).all(|c| c.is_ascii_alphabetic()) {
            break;
        }
        collected.push(*token);
    }
    if collected.is_empty() {
        return None;
    }
    collected.reverse();
    Some(collected.join(" "))
}

fn parse_month_indexes(text: &str) -> Vec<u8> {
    let lower = text.to_ascii_lowercase();
    let mut found = Vec::new();
    let mut chars = lower.char_indices().peekable();
    while let Some((i, _)) = chars.next() {
        let mut matched = false;
        for (name, idx) in MONTHS {
            if lower[i..].starts_with(name) {
                let after = i + name.len();
                let boundary_ok = after >= lower.len()
                    || !lower[after..]
                        .chars()
                        .next()
                        .is_some_and(|c| c.is_ascii_alphabetic());
                let before_ok = i == 0
                    || !lower[..i]
                        .chars()
                        .next_back()
                        .is_some_and(|c| c.is_ascii_alphabetic());
                if before_ok && boundary_ok {
                    found.push(idx);
                    // Skip past the matched month name.
                    while chars.peek().is_some_and(|(j, _)| *j < after) {
                        chars.next();
                    }
                    matched = true;
                    break;
                }
            }
        }
        let _ = matched;
    }
    found
}

fn parse_flexible_place(text: &str) -> (String, Vec<ClassifiedDestination>) {
    let label = if let Some(idx) = text.to_ascii_lowercase().find(" with") {
        text[..idx].trim().to_string()
    } else {
        text.split([',', '.'])
            .next()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| text.to_string())
    };
    (
        label.clone(),
        vec![ClassifiedDestination {
            label,
            role: ClassifiedDestinationRole::Primary,
        }],
    )
}

fn recommend_from_text(text: &str) -> TripSeedRecommendations {
    let lower = text.to_ascii_lowercase();
    let mut styles = Vec::new();
    if lower.contains("food") || lower.contains("ramen") || lower.contains("eat") {
        styles.push("food".to_string());
    }
    if lower.contains("hike") || lower.contains("trek") || lower.contains("adventure") {
        styles.push("adventure".to_string());
    }
    if lower.contains("temple") || lower.contains("museum") || lower.contains("culture") {
        styles.push("culture".to_string());
    }
    if lower.contains("beach") || lower.contains("chill") || lower.contains("relax") {
        styles.push("chill".to_string());
    }
    if lower.contains("nature") || lower.contains("park") || lower.contains("mountain") {
        styles.push("nature".to_string());
    }
    if styles.is_empty() {
        styles.push("mixed".to_string());
    }

    let mut related_places = Vec::new();
    if lower.contains("japan") || lower.contains("tokyo") {
        for p in ["Kyoto", "Osaka", "Nara"] {
            if !lower.contains(&p.to_ascii_lowercase()) {
                related_places.push(p.to_string());
            }
        }
    }
    if lower.contains("thailand") || lower.contains("bangkok") || lower.contains("chiang mai") {
        for p in ["Chiang Mai", "Phuket", "Krabi"] {
            if !lower.contains(&p.to_ascii_lowercase()) {
                related_places.push(p.to_string());
            }
        }
    }
    related_places.truncate(3);

    let season_hint = if lower.contains("spring") {
        Some("spring".to_string())
    } else if lower.contains("summer") {
        Some("summer".to_string())
    } else if lower.contains("autumn") || lower.contains("fall") {
        Some("autumn".to_string())
    } else if lower.contains("winter") {
        Some("winter".to_string())
    } else {
        None
    };

    TripSeedRecommendations {
        styles,
        related_places,
        season_hint,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn flexible_place_with_friends() {
        let out = classify_trip_seed_text("Chiang Mai with friends, not sure when yet").unwrap();
        assert_eq!(out.name, "Chiang Mai");
        assert_eq!(out.destinations[0].label, "Chiang Mai");
        assert!(matches!(out.when, ClassifiedWhen::Flexible));
        assert_eq!(out.confidence, "medium");
    }

    #[test]
    fn months_primary_optional_cross_year() {
        let out = classify_trip_seed_text(
            "Thailand primary, Japan optional, December into January",
        )
        .unwrap();
        assert_eq!(out.destinations.len(), 2);
        assert_eq!(out.destinations[0].label, "Thailand");
        assert_eq!(out.destinations[1].label, "Japan");
        match out.when {
            ClassifiedWhen::Months {
                start_m, end_m, end_y, start_y, ..
            } => {
                assert_eq!(start_m, 11);
                assert_eq!(end_m, 0);
                assert_eq!(end_y, start_y + 1);
            }
            other => panic!("expected months, got {other:?}"),
        }
    }

    #[test]
    fn exact_iso_range() {
        let out = classify_trip_seed_text(
            "Europe road trip 2026-09-10 to 2026-09-24 call it Autumn Loop",
        )
        .unwrap();
        assert_eq!(out.name, "Autumn Loop");
        match out.when {
            ClassifiedWhen::Exact { start, end } => {
                assert_eq!(start, "2026-09-10");
                assert_eq!(end, "2026-09-24");
            }
            other => panic!("expected exact, got {other:?}"),
        }
        assert_eq!(out.confidence, "high");
    }

    #[test]
    fn empty_rejected() {
        assert!(classify_trip_seed_text("  ").is_err());
    }

    #[test]
    fn japan_recommendations() {
        let out = classify_trip_seed_text("Japan food trip in autumn").unwrap();
        assert!(out.recommendations.styles.contains(&"food".to_string()));
        assert_eq!(out.recommendations.season_hint.as_deref(), Some("autumn"));
        assert!(
            out.recommendations
                .related_places
                .iter()
                .any(|p| p == "Kyoto")
        );
    }
}
