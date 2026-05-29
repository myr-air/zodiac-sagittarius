use std::cmp::Reverse;
use std::collections::BTreeMap;

use uuid::Uuid;

use crate::app::auth;
use crate::db;
use crate::db::PgPool;
use crate::db::models::ExpenseSplitRecord;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::types::{Capability, ExpenseSummary, SettlementSuggestion, TripCockpit};

pub async fn load_cockpit(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
) -> Result<TripCockpit, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;

    let trip = db::queries::find_trip_by_id(pool, session.trip_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let members = db::queries::list_trip_members(pool, session.trip_id).await?;
    let plan_variants = db::queries::list_plan_variants(pool, session.trip_id).await?;
    let itinerary_items = db::queries::list_itinerary_items(pool, session.trip_id).await?;
    let suggestions = db::queries::list_suggestions(pool, session.trip_id).await?;
    let tasks = db::queries::list_visible_tasks(pool, session.trip_id, session.member_id).await?;

    let expense_summary = if can(session.role, Capability::ViewExpenses) {
        let expenses = db::queries::list_expense_splits(pool, session.trip_id).await?;
        Some(build_expense_summary(expenses, session.member_id))
    } else {
        None
    };

    Ok(TripCockpit {
        trip: trip.into(),
        members: members.into_iter().map(Into::into).collect(),
        plan_variants: plan_variants.into_iter().map(Into::into).collect(),
        itinerary_items: itinerary_items.into_iter().map(Into::into).collect(),
        suggestions: suggestions.into_iter().map(Into::into).collect(),
        tasks: tasks.into_iter().map(Into::into).collect(),
        expense_summary,
    })
}

fn build_expense_summary(
    expenses: Vec<ExpenseSplitRecord>,
    current_member_id: Uuid,
) -> ExpenseSummary {
    let mut net_minor_by_member = BTreeMap::new();
    let mut group_spend_minor = 0_i64;

    for expense in expenses {
        group_spend_minor += i64::from(expense.amount_minor);
        *net_minor_by_member.entry(expense.paid_by).or_insert(0) += i64::from(expense.amount_minor);

        if let Some(splits) = expense.splits.as_object() {
            for (member_id, share) in splits {
                let Ok(member_id) = Uuid::parse_str(member_id) else {
                    continue;
                };
                let share_minor = json_number_to_i64(share);
                *net_minor_by_member.entry(member_id).or_insert(0) -= share_minor;
            }
        }
    }

    let current_net_minor = *net_minor_by_member.get(&current_member_id).unwrap_or(&0);
    let net_by_member = net_minor_by_member
        .iter()
        .map(|(member_id, cents)| (*member_id, minor_to_major(*cents)))
        .collect();

    ExpenseSummary {
        group_spend: minor_to_major(group_spend_minor),
        net_by_member,
        current_user_net_label: current_user_net_label(current_net_minor),
        settlement_suggestions: settlement_suggestions(net_minor_by_member),
    }
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

fn current_user_net_label(net_minor: i64) -> String {
    let amount = minor_to_major(net_minor.abs());
    match net_minor.cmp(&0) {
        std::cmp::Ordering::Greater => format!("You are owed HK${amount:.2}"),
        std::cmp::Ordering::Less => format!("You owe HK${amount:.2}"),
        std::cmp::Ordering::Equal => "You are settled".to_string(),
    }
}

fn settlement_suggestions(net_minor_by_member: BTreeMap<Uuid, i64>) -> Vec<SettlementSuggestion> {
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
                paid_by: payer,
                amount_minor: 10_000,
                splits: json!({
                    payer.to_string(): 2500,
                    debtor.to_string(): 7500,
                    "not-a-uuid": 9999
                }),
            },
            ExpenseSplitRecord {
                paid_by: settled,
                amount_minor: 125,
                splits: json!({
                    settled.to_string(): 124.6,
                    debtor.to_string(): "ignored"
                }),
            },
            ExpenseSplitRecord {
                paid_by: debtor,
                amount_minor: 0,
                splits: json!("not an object"),
            },
        ];

        let summary = build_expense_summary(expenses, debtor);

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
        let suggestions = settlement_suggestions(BTreeMap::from([
            (creditor_a, 5_000),
            (creditor_b, 2_500),
            (debtor_a, -3_000),
            (debtor_b, -4_500),
        ]));

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
