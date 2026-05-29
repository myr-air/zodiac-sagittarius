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
