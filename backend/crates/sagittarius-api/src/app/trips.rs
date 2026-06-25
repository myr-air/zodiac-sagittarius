use std::cmp::Reverse;
use std::collections::BTreeMap;

use uuid::Uuid;

use crate::app::{auth, bookings, events, mutation_guard, photo_albums, plan_checks};
use crate::db;
use crate::db::PgPool;
use crate::db::models::{ExpenseReminderRecord, ExpenseSplitRecord};
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::PatchTripRequest;
use crate::domain::types::{
    Capability, ExpenseSummary, SettlementSuggestion, TripCockpit, TripSummary,
};
use crate::realtime::RealtimeHub;

pub async fn load_cockpit(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
) -> Result<TripCockpit, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;

    let session_trip_id = session.trip_id;
    let session_member_id = session.member_id;
    if matches!(
        session.role,
        crate::domain::types::TripRole::Organizer | crate::domain::types::TripRole::Traveler
    ) {
        if db::queries::find_trip_by_id(pool, session_trip_id)
            .await?
            .is_some()
        {
            let refreshed_expires_at = time::OffsetDateTime::now_utc() + time::Duration::days(3);
            db::queries::extend_member_session_expiry(
                pool,
                session_trip_id,
                session_member_id,
                &token_hash,
                refreshed_expires_at,
            )
            .await?;
        }
    }
    let can_view_expenses = can(session.role, Capability::ViewExpenses);

    let (
        trip,
        members,
        plan_variants,
        itinerary_items,
        suggestions,
        tasks,
        stop_notes,
        expense_rows,
        expense_splits,
        expense_reminders,
    ) = tokio::try_join!(
        db::queries::find_trip_by_id(pool, session_trip_id),
        db::queries::list_trip_members(pool, session_trip_id),
        db::queries::list_plan_variants(pool, session_trip_id),
        db::queries::list_itinerary_items(pool, session_trip_id),
        db::queries::list_suggestions(pool, session_trip_id),
        db::queries::list_visible_tasks(pool, session_trip_id, session_member_id),
        db::queries::list_stop_notes(pool, session_trip_id),
        async {
            if can_view_expenses {
                db::expense_queries::list_expenses(pool, session_trip_id).await
            } else {
                Ok(Vec::new())
            }
        },
        async {
            if can_view_expenses {
                db::expense_queries::list_expense_splits(pool, session_trip_id, None).await
            } else {
                Ok(Vec::new())
            }
        },
        async {
            if can_view_expenses {
                db::expense_queries::list_expense_reminders(pool, session_trip_id, None).await
            } else {
                Ok(Vec::new())
            }
        },
    )?;

    let trip = trip.ok_or(ServiceError::NotFound)?;
    let expense_summary = if can_view_expenses {
        Some(build_expense_summary(
            expense_splits,
            session_member_id,
            expense_reminders,
        ))
    } else {
        None
    };
    let booking_docs =
        bookings::list_visible_booking_docs(pool, session_trip_id, session_member_id, session.role)
            .await?;
    let photo_album_links = photo_albums::list_photo_album_links(pool, session_trip_id).await?;
    let latest_plan_check = plan_checks::latest_plan_check_for_trip(pool, session_trip_id).await?;

    let trip_summary = TripSummary::from(trip);
    let plan_summaries: Vec<_> = plan_variants
        .into_iter()
        .map(|record| {
            crate::domain::types::PlanVariantSummary::from_record_for_main_pointer(
                record,
                trip_summary.main_trip_plan_id,
            )
        })
        .collect();

    Ok(TripCockpit {
        trip: trip_summary,
        members: members.into_iter().map(Into::into).collect(),
        plan_variants: plan_summaries.clone(),
        trip_plans: plan_summaries,
        itinerary_items: itinerary_items.into_iter().map(Into::into).collect(),
        suggestions: suggestions.into_iter().map(Into::into).collect(),
        latest_plan_check,
        tasks: tasks.into_iter().map(Into::into).collect(),
        stop_notes: stop_notes.into_iter().map(Into::into).collect(),
        expenses: expense_rows.into_iter().map(Into::into).collect(),
        expense_summary,
        booking_docs,
        photo_album_links,
    })
}

pub async fn patch_trip(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: PatchTripRequest,
) -> Result<TripSummary, ServiceError> {
    validate_trip_patch(&request)?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }
    mutation_guard::reject_duplicate_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?;

    let existing = db::queries::lock_trip(&mut tx, trip_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.version != request.expected_version {
        return Err(mutation_guard::version_conflict_with_latest(
            TripSummary::from(existing),
            "latest trip could not be serialized",
        ));
    }
    let start_date = request.start_date.unwrap_or(existing.start_date);
    let end_date = request.end_date.unwrap_or(existing.end_date);
    if start_date > end_date {
        return Err(ServiceError::InvalidRequest(
            "startDate must be before endDate",
        ));
    }
    let updated =
        db::queries::update_trip_metadata(&mut tx, trip_id, &request, request.expected_version + 1)
            .await?
            .ok_or(ServiceError::NotFound)?;
    let trip = TripSummary::from(updated);
    let payload = serde_json::to_value(&trip)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;
    let event = events::insert(
        &mut tx,
        events::EventWrite {
            trip_id,
            aggregate_type: "trip",
            event_type: "trip.updated",
            aggregate_id: trip.id,
            version: trip.version,
            payload,
            client_mutation_id: Some(request.client_mutation_id.as_str()),
            created_by: Some(session.member_id),
        },
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(trip)
}

fn validate_trip_patch(request: &PatchTripRequest) -> Result<(), ServiceError> {
    if request.client_mutation_id.trim().is_empty() {
        return Err(ServiceError::InvalidRequest("clientMutationId is required"));
    }
    if let Some(name) = &request.name {
        validate_text(name, "name")?;
    }
    if let Some(destination_label) = &request.destination_label {
        validate_text(destination_label, "destinationLabel")?;
    }
    if let Some(countries) = &request.countries {
        for country in countries {
            validate_text(country, "country")?;
        }
    }
    if let Some(party_size) = request.party_size {
        if party_size <= 0 {
            return Err(ServiceError::InvalidRequest(
                "partySize must be greater than zero",
            ));
        }
    }
    if let Some(default_timezone) = &request.default_timezone {
        validate_text(default_timezone, "defaultTimezone")?;
    }
    if let (Some(start_date), Some(end_date)) = (request.start_date, request.end_date) {
        if start_date > end_date {
            return Err(ServiceError::InvalidRequest(
                "startDate must be before endDate",
            ));
        }
    }
    if request.active_plan_variant_id.is_some() || request.main_trip_plan_id.is_some() {
        return Err(ServiceError::InvalidRequest(
            "use set-main to change the main trip plan",
        ));
    }

    Ok(())
}

fn validate_text(value: &str, field: &'static str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(ServiceError::InvalidRequest(field));
    }
    if trimmed.len() > 160 {
        return Err(ServiceError::InvalidRequest(field));
    }
    Ok(())
}

pub(crate) fn build_expense_summary(
    expenses: Vec<ExpenseSplitRecord>,
    current_member_id: Uuid,
    reminders: Vec<ExpenseReminderRecord>,
) -> ExpenseSummary {
    let settlement_currency = "HKD";
    let mut net_minor_by_member = BTreeMap::new();
    let mut group_spend_minor = 0_i64;
    let closed_coverage_by_share = closed_statement_coverage_by_share(&expenses);

    for expense in expenses {
        if matches!(
            expense.stored_value_transaction_type.as_deref(),
            Some("topup" | "refund")
        ) {
            continue;
        }
        let converted_amount_minor = convert_minor_to_settlement_currency(
            i64::from(expense.amount_minor),
            expense.exchange_rate_to_settlement_currency,
        );
        let mut amount_minor = if expense.category == "settlement" {
            closed_statement_minor(&expense).unwrap_or(converted_amount_minor)
        } else {
            0
        };
        if expense.category != "settlement" {
            group_spend_minor += converted_amount_minor;
        }

        if let Some(splits) = expense.splits.as_object() {
            let split_members: Vec<_> = splits
                .iter()
                .filter(|(_, share)| json_number_to_i64(share) > 0)
                .map(|(member_id, _)| member_id.as_str())
                .collect();
            for (member_id, share) in splits {
                let Ok(member_id) = Uuid::parse_str(member_id) else {
                    continue;
                };
                let share_minor = if expense.category == "settlement" && split_members.len() == 1 {
                    closed_statement_minor(&expense).unwrap_or_else(|| {
                        convert_minor_to_settlement_currency(
                            json_number_to_i64(share),
                            expense.exchange_rate_to_settlement_currency,
                        )
                    })
                } else if expense.category != "settlement" {
                    closed_coverage_by_share
                        .get(&(expense.id, member_id))
                        .copied()
                        .unwrap_or_else(|| {
                            convert_minor_to_settlement_currency(
                                json_number_to_i64(share),
                                expense.exchange_rate_to_settlement_currency,
                            )
                        })
                } else {
                    convert_minor_to_settlement_currency(
                        json_number_to_i64(share),
                        expense.exchange_rate_to_settlement_currency,
                    )
                };
                if expense.category != "settlement" {
                    amount_minor += share_minor;
                }
                *net_minor_by_member.entry(member_id).or_insert(0) -= share_minor;
            }
        } else if expense.category != "settlement" {
            amount_minor = converted_amount_minor;
        }
        *net_minor_by_member.entry(expense.paid_by).or_insert(0) += amount_minor;
    }

    let current_net_minor = *net_minor_by_member.get(&current_member_id).unwrap_or(&0);
    let net_by_member = net_minor_by_member
        .iter()
        .map(|(member_id, cents)| (*member_id, minor_to_major(*cents)))
        .collect();

    ExpenseSummary {
        group_spend: minor_to_major(group_spend_minor),
        settlement_currency: settlement_currency.to_string(),
        net_by_member,
        current_user_net_label: current_user_net_label(current_net_minor),
        settlement_suggestions: attach_reminder_history(
            settlement_suggestions(net_minor_by_member, settlement_currency),
            reminders,
        ),
    }
}

fn closed_statement_minor(expense: &ExpenseSplitRecord) -> Option<i64> {
    if expense.category != "settlement" {
        return None;
    }
    let allocations = expense.settlement_allocations.as_array()?;
    let total_minor = allocations.iter().fold(0_i64, |sum, allocation| {
        let Some(allocation) = allocation.as_object() else {
            return sum;
        };
        if allocation
            .get("statementStatus")
            .and_then(serde_json::Value::as_str)
            != Some("closed")
        {
            return sum;
        }
        let amount = allocation
            .get("closedAmount")
            .and_then(serde_json::Value::as_f64)
            .unwrap_or(0.0);
        if !amount.is_finite() || amount <= 0.0 {
            return sum;
        }
        sum + (amount * 100.0).round() as i64
    });
    (total_minor > 0).then_some(total_minor)
}

fn closed_statement_coverage_by_share(
    expenses: &[ExpenseSplitRecord],
) -> BTreeMap<(Uuid, Uuid), i64> {
    let mut coverage = BTreeMap::new();
    for expense in expenses {
        if expense.category != "settlement" {
            continue;
        }
        let Some(allocations) = expense.settlement_allocations.as_array() else {
            continue;
        };
        for allocation in allocations {
            let Some(allocation) = allocation.as_object() else {
                continue;
            };
            if allocation
                .get("statementStatus")
                .and_then(serde_json::Value::as_str)
                != Some("closed")
            {
                continue;
            }
            let Some(expense_id) = allocation
                .get("expenseId")
                .and_then(serde_json::Value::as_str)
                .and_then(|value| Uuid::parse_str(value).ok())
            else {
                continue;
            };
            let Some(member_id) = allocation
                .get("memberId")
                .and_then(serde_json::Value::as_str)
                .and_then(|value| Uuid::parse_str(value).ok())
            else {
                continue;
            };
            let amount = allocation
                .get("closedAmount")
                .and_then(serde_json::Value::as_f64)
                .unwrap_or(0.0);
            if !amount.is_finite() || amount <= 0.0 {
                continue;
            }
            *coverage.entry((expense_id, member_id)).or_insert(0) +=
                (amount * 100.0).round() as i64;
        }
    }
    coverage
}

fn attach_reminder_history(
    suggestions: Vec<SettlementSuggestion>,
    reminders: Vec<ExpenseReminderRecord>,
) -> Vec<SettlementSuggestion> {
    let reminders_by_key: BTreeMap<(Uuid, Uuid, i32), String> = reminders
        .into_iter()
        .map(|reminder| {
            (
                (
                    reminder.from_member_id,
                    reminder.to_member_id,
                    reminder.amount_minor,
                ),
                reminder.last_reminded_at,
            )
        })
        .collect();

    suggestions
        .into_iter()
        .map(|mut suggestion| {
            let amount_minor = (suggestion.amount * 100.0).round() as i32;
            suggestion.last_reminded_at = reminders_by_key
                .get(&(suggestion.from, suggestion.to, amount_minor))
                .cloned();
            suggestion
        })
        .collect()
}

fn json_number_to_i64(value: &serde_json::Value) -> i64 {
    value
        .as_i64()
        .or_else(|| value.as_f64().map(|number| number.round() as i64))
        .unwrap_or(0)
}

fn minor_to_major(value: i64) -> f64 {
    value as f64 / 100.0
}

fn convert_minor_to_settlement_currency(
    value: i64,
    exchange_rate_to_settlement_currency: f64,
) -> i64 {
    ((value as f64) * exchange_rate_to_settlement_currency).round() as i64
}

fn current_user_net_label(net_minor: i64) -> String {
    let amount = minor_to_major(net_minor.abs());
    match net_minor.cmp(&0) {
        std::cmp::Ordering::Greater => format!("You are owed HK${amount:.2}"),
        std::cmp::Ordering::Less => format!("You owe HK${amount:.2}"),
        std::cmp::Ordering::Equal => "You are settled".to_string(),
    }
}

fn settlement_suggestions(
    net_minor_by_member: BTreeMap<Uuid, i64>,
    settlement_currency: &str,
) -> Vec<SettlementSuggestion> {
    let mut creditors: Vec<(Uuid, i64)> = net_minor_by_member
        .iter()
        .filter_map(|(member_id, net)| (*net > 0).then_some((*member_id, *net)))
        .collect();
    let mut debtors: Vec<(Uuid, i64)> = net_minor_by_member
        .iter()
        .filter_map(|(member_id, net)| (*net < 0).then_some((*member_id, -*net)))
        .collect();
    creditors.sort_by_key(|entry| Reverse(entry.1));
    debtors.sort_by_key(|entry| Reverse(entry.1));

    let mut suggestions = Vec::new();
    let mut debtor_index = 0;
    let mut creditor_index = 0;
    while debtor_index < debtors.len() && creditor_index < creditors.len() {
        let amount = debtors[debtor_index].1.min(creditors[creditor_index].1);
        if amount > 0 {
            suggestions.push(SettlementSuggestion {
                from: debtors[debtor_index].0,
                to: creditors[creditor_index].0,
                amount: minor_to_major(amount),
                currency: settlement_currency.to_string(),
                last_reminded_at: None,
            });
        }

        debtors[debtor_index].1 -= amount;
        creditors[creditor_index].1 -= amount;
        if debtors[debtor_index].1 == 0 {
            debtor_index += 1;
        }
        if creditors[creditor_index].1 == 0 {
            creditor_index += 1;
        }
    }

    suggestions
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn expense_summary_handles_positive_negative_zero_and_bad_split_values() {
        let payer = Uuid::now_v7();
        let debtor = Uuid::now_v7();
        let settled = Uuid::now_v7();
        let expenses = vec![
            ExpenseSplitRecord {
                id: Uuid::now_v7(),
                paid_by: payer,
                amount_minor: 10_000,
                currency: "HKD".to_string(),
                exchange_rate_to_settlement_currency: 1.0,
                category: "transport".to_string(),
                stored_value_transaction_type: None,
                settlement_allocations: json!([]),
                splits: json!({
                    payer.to_string(): 2500,
                    debtor.to_string(): 7500,
                    "not-a-uuid": 9999
                }),
            },
            ExpenseSplitRecord {
                id: Uuid::now_v7(),
                paid_by: settled,
                amount_minor: 125,
                currency: "HKD".to_string(),
                exchange_rate_to_settlement_currency: 1.0,
                category: "food".to_string(),
                stored_value_transaction_type: None,
                settlement_allocations: json!([]),
                splits: json!({
                    settled.to_string(): 124.6,
                    debtor.to_string(): "ignored"
                }),
            },
            ExpenseSplitRecord {
                id: Uuid::now_v7(),
                paid_by: debtor,
                amount_minor: 0,
                currency: "HKD".to_string(),
                exchange_rate_to_settlement_currency: 1.0,
                category: "food".to_string(),
                stored_value_transaction_type: None,
                settlement_allocations: json!([]),
                splits: json!("not an object"),
            },
        ];

        let summary = build_expense_summary(expenses, debtor, Vec::new());

        assert_eq!(summary.group_spend, 101.25);
        assert_eq!(summary.current_user_net_label, "You owe HK$75.00");
        assert_eq!(summary.net_by_member[&payer], 75.0);
        assert_eq!(summary.net_by_member[&debtor], -75.0);
        assert_eq!(summary.net_by_member[&settled], 0.0);
        assert_eq!(summary.settlement_suggestions.len(), 1);
        assert_eq!(summary.settlement_suggestions[0].from, debtor);
        assert_eq!(summary.settlement_suggestions[0].to, payer);
        assert_eq!(summary.settlement_suggestions[0].amount, 75.0);
    }

    #[test]
    fn settlement_expenses_adjust_balances_without_increasing_group_spend() {
        let payer = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac561").unwrap();
        let debtor = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac562").unwrap();
        let expenses = vec![
            ExpenseSplitRecord {
                id: Uuid::now_v7(),
                paid_by: payer,
                amount_minor: 9_000,
                currency: "HKD".to_string(),
                exchange_rate_to_settlement_currency: 1.0,
                category: "food".to_string(),
                stored_value_transaction_type: None,
                settlement_allocations: json!([]),
                splits: json!({
                    payer.to_string(): 4500,
                    debtor.to_string(): 4500
                }),
            },
            ExpenseSplitRecord {
                id: Uuid::now_v7(),
                paid_by: debtor,
                amount_minor: 4_500,
                currency: "HKD".to_string(),
                exchange_rate_to_settlement_currency: 1.0,
                category: "settlement".to_string(),
                stored_value_transaction_type: None,
                settlement_allocations: json!([]),
                splits: json!({
                    payer.to_string(): 4500
                }),
            },
        ];

        let summary = build_expense_summary(expenses, debtor, Vec::new());

        assert_eq!(summary.group_spend, 90.0);
        assert_eq!(summary.current_user_net_label, "You are settled");
        assert!(summary.settlement_suggestions.is_empty());
    }

    #[test]
    fn stored_value_funding_transactions_do_not_inflate_group_spend_or_balances() {
        let payer = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac561").unwrap();
        let debtor = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac562").unwrap();
        let expenses = vec![
            ExpenseSplitRecord {
                id: Uuid::now_v7(),
                paid_by: payer,
                amount_minor: 80_000,
                currency: "HKD".to_string(),
                exchange_rate_to_settlement_currency: 1.0,
                category: "transport".to_string(),
                stored_value_transaction_type: Some("topup".to_string()),
                settlement_allocations: json!([]),
                splits: json!({
                    payer.to_string(): 80_000
                }),
            },
            ExpenseSplitRecord {
                id: Uuid::now_v7(),
                paid_by: payer,
                amount_minor: 1_200,
                currency: "HKD".to_string(),
                exchange_rate_to_settlement_currency: 1.0,
                category: "transport".to_string(),
                stored_value_transaction_type: Some("spend".to_string()),
                settlement_allocations: json!([]),
                splits: json!({
                    payer.to_string(): 600,
                    debtor.to_string(): 600
                }),
            },
            ExpenseSplitRecord {
                id: Uuid::now_v7(),
                paid_by: payer,
                amount_minor: 5_000,
                currency: "HKD".to_string(),
                exchange_rate_to_settlement_currency: 1.0,
                category: "transport".to_string(),
                stored_value_transaction_type: Some("refund".to_string()),
                settlement_allocations: json!([]),
                splits: json!({
                    payer.to_string(): 5_000
                }),
            },
        ];

        let summary = build_expense_summary(expenses, debtor, Vec::new());

        assert_eq!(summary.group_spend, 12.0);
        assert_eq!(summary.net_by_member[&payer], 6.0);
        assert_eq!(summary.net_by_member[&debtor], -6.0);
        assert_eq!(summary.settlement_suggestions[0].amount, 6.0);
    }

    #[test]
    fn expense_summary_converts_foreign_currency_before_balancing_members() {
        let payer = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac561").unwrap();
        let debtor = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac562").unwrap();
        let expenses = vec![
            ExpenseSplitRecord {
                id: Uuid::now_v7(),
                paid_by: payer,
                amount_minor: 12_000,
                currency: "HKD".to_string(),
                exchange_rate_to_settlement_currency: 1.0,
                category: "food".to_string(),
                stored_value_transaction_type: None,
                settlement_allocations: json!([]),
                splits: json!({
                    payer.to_string(): 6000,
                    debtor.to_string(): 6000
                }),
            },
            ExpenseSplitRecord {
                id: Uuid::now_v7(),
                paid_by: debtor,
                amount_minor: 10_000,
                currency: "CNY".to_string(),
                exchange_rate_to_settlement_currency: 1.1,
                category: "transport".to_string(),
                stored_value_transaction_type: None,
                settlement_allocations: json!([]),
                splits: json!({
                    payer.to_string(): 5000,
                    debtor.to_string(): 5000
                }),
            },
        ];

        let summary = build_expense_summary(expenses, debtor, Vec::new());

        assert_eq!(summary.settlement_currency, "HKD");
        assert_eq!(summary.group_spend, 230.0);
        assert_eq!(summary.current_user_net_label, "You owe HK$5.00");
        assert_eq!(summary.net_by_member[&payer], 5.0);
        assert_eq!(summary.net_by_member[&debtor], -5.0);
        assert_eq!(summary.settlement_suggestions.len(), 1);
        assert_eq!(summary.settlement_suggestions[0].amount, 5.0);
        assert_eq!(summary.settlement_suggestions[0].currency, "HKD");
    }

    #[test]
    fn expense_summary_attaches_matching_reminder_history_to_settlement_suggestions() {
        let payer = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac561").unwrap();
        let debtor = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac562").unwrap();
        let stale_reminder_at = "2026-06-05T11:00:00Z".to_string();
        let matching_reminder_at = "2026-06-05T12:00:00Z".to_string();
        let expenses = vec![ExpenseSplitRecord {
            id: Uuid::now_v7(),
            paid_by: payer,
            amount_minor: 9_000,
            currency: "HKD".to_string(),
            exchange_rate_to_settlement_currency: 1.0,
            category: "food".to_string(),
            stored_value_transaction_type: None,
            settlement_allocations: json!([]),
            splits: json!({
                payer.to_string(): 4500,
                debtor.to_string(): 4500
            }),
        }];

        let summary = build_expense_summary(
            expenses,
            debtor,
            vec![
                ExpenseReminderRecord {
                    id: Uuid::now_v7(),
                    trip_id: Uuid::now_v7(),
                    trip_plan_id: Uuid::now_v7(),
                    from_member_id: debtor,
                    to_member_id: payer,
                    amount_minor: 4_000,
                    last_reminded_at: stale_reminder_at,
                    version: 1,
                },
                ExpenseReminderRecord {
                    id: Uuid::now_v7(),
                    trip_id: Uuid::now_v7(),
                    trip_plan_id: Uuid::now_v7(),
                    from_member_id: debtor,
                    to_member_id: payer,
                    amount_minor: 4_500,
                    last_reminded_at: matching_reminder_at.clone(),
                    version: 1,
                },
            ],
        );

        assert_eq!(summary.settlement_suggestions.len(), 1);
        assert_eq!(
            summary.settlement_suggestions[0].last_reminded_at,
            Some(matching_reminder_at)
        );
    }

    #[test]
    fn closed_statement_snapshots_clear_accepted_payback_differences() {
        let payer = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac561").unwrap();
        let debtor = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac562").unwrap();
        let expense_id = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac563").unwrap();
        let expenses = vec![
            ExpenseSplitRecord {
                id: expense_id,
                paid_by: payer,
                amount_minor: 65_000,
                currency: "CNY".to_string(),
                exchange_rate_to_settlement_currency: 1.2,
                category: "food".to_string(),
                stored_value_transaction_type: None,
                settlement_allocations: json!([]),
                splits: json!({
                    debtor.to_string(): 65_000
                }),
            },
            ExpenseSplitRecord {
                id: Uuid::now_v7(),
                paid_by: debtor,
                amount_minor: 64_000,
                currency: "HKD".to_string(),
                exchange_rate_to_settlement_currency: 1.0,
                category: "settlement".to_string(),
                stored_value_transaction_type: None,
                settlement_allocations: json!([
                    {
                        "expenseId": expense_id.to_string(),
                        "memberId": debtor.to_string(),
                        "amount": 640.0,
                        "closedAmount": 650.0,
                        "closedAt": "2026-06-25T04:00:00.000Z",
                        "lockedCurrency": "HKD",
                        "lockedExchangeRate": 1.0,
                        "statementStatus": "closed"
                    }
                ]),
                splits: json!({
                    payer.to_string(): 64_000
                }),
            },
        ];

        let summary = build_expense_summary(expenses, debtor, Vec::new());

        assert_eq!(summary.group_spend, 780.0);
        assert_eq!(summary.current_user_net_label, "You are settled");
        assert_eq!(summary.net_by_member[&payer], 0.0);
        assert_eq!(summary.net_by_member[&debtor], 0.0);
        assert!(summary.settlement_suggestions.is_empty());
    }

    #[test]
    fn current_user_net_label_covers_owed_owe_and_settled() {
        assert_eq!(current_user_net_label(1234), "You are owed HK$12.34");
        assert_eq!(current_user_net_label(-1234), "You owe HK$12.34");
        assert_eq!(current_user_net_label(0), "You are settled");
    }

    #[test]
    fn settlement_suggestions_can_pay_multiple_creditors_and_debtors() {
        let creditor_a = Uuid::now_v7();
        let creditor_b = Uuid::now_v7();
        let debtor_a = Uuid::now_v7();
        let debtor_b = Uuid::now_v7();
        let suggestions = settlement_suggestions(
            BTreeMap::from([
                (creditor_a, 5_000),
                (creditor_b, 2_500),
                (debtor_a, -3_000),
                (debtor_b, -4_500),
            ]),
            "HKD",
        );

        assert_eq!(suggestions.len(), 3);
        assert_eq!(
            suggestions
                .iter()
                .map(|suggestion| suggestion.amount)
                .sum::<f64>(),
            75.0
        );
        assert!(
            suggestions
                .iter()
                .any(|suggestion| suggestion.to == creditor_a)
        );
        assert!(
            suggestions
                .iter()
                .any(|suggestion| suggestion.to == creditor_b)
        );
    }
}
