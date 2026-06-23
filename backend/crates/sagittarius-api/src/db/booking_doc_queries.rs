use uuid::Uuid;

use crate::db::PgPool;
use crate::db::models::{BookingDocExternalLinkRecord, BookingDocRecord, NewBookingDoc};
use crate::domain::money_values::price_amount_to_minor;
use crate::domain::patches::{CreateBookingDocExternalLinkRequest, PatchBookingDocRequest};
use crate::domain::uuid_values::unique_uuids;

pub async fn list_booking_docs(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<BookingDocRecord>, sqlx::Error> {
    sqlx::query_as::<_, BookingDocRecord>(
        "select
           id, trip_id, trip_plan_id, type, title, status, visibility, owner_member_id, provider_name,
           confirmation_code, starts_at, ends_at, timezone, price_minor, currency, notes,
           created_by, created_at, updated_at, version
         from booking_docs
         where trip_id = $1 and deleted_at is null
         order by starts_at nulls last, created_at",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn list_booking_doc_links(
    pool: &PgPool,
    trip_id: Uuid,
    booking_ids: &[Uuid],
) -> Result<Vec<BookingDocExternalLinkRecord>, sqlx::Error> {
    if booking_ids.is_empty() {
        return Ok(Vec::new());
    }

    sqlx::query_as::<_, BookingDocExternalLinkRecord>(
        "select
           id, trip_id, booking_doc_id, label, url, provider, access_note, sort_order
         from booking_doc_external_links
         where trip_id = $1 and booking_doc_id = any($2)
         order by sort_order",
    )
    .bind(trip_id)
    .bind(booking_ids)
    .fetch_all(pool)
    .await
}

pub async fn list_booking_doc_relation_ids(
    pool: &PgPool,
    trip_id: Uuid,
    table_name: &str,
    booking_ids: &[Uuid],
) -> Result<Vec<(Uuid, Uuid)>, sqlx::Error> {
    if booking_ids.is_empty() {
        return Ok(Vec::new());
    }

    let sql = match table_name {
        "travelers" | "booking_doc_travelers" => {
            "select booking_doc_id, member_id as related_id
             from booking_doc_travelers
             where trip_id = $1 and booking_doc_id = any($2)
             order by booking_doc_id, member_id"
        }
        "itinerary_items" | "booking_doc_itinerary_items" => {
            "select booking_doc_id, itinerary_item_id as related_id
             from booking_doc_itinerary_items
             where trip_id = $1 and booking_doc_id = any($2)
             order by booking_doc_id, itinerary_item_id"
        }
        "tasks" | "booking_doc_tasks" => {
            "select booking_doc_id, task_id as related_id
             from booking_doc_tasks
             where trip_id = $1 and booking_doc_id = any($2)
             order by booking_doc_id, task_id"
        }
        "expenses" | "booking_doc_expenses" => {
            "select booking_doc_id, expense_id as related_id
             from booking_doc_expenses
             where trip_id = $1 and booking_doc_id = any($2)
             order by booking_doc_id, expense_id"
        }
        "stop_notes" | "notes" | "booking_doc_stop_notes" => {
            "select booking_doc_id, stop_note_id as related_id
             from booking_doc_stop_notes
             where trip_id = $1 and booking_doc_id = any($2)
             order by booking_doc_id, stop_note_id"
        }
        _ => {
            return Err(sqlx::Error::Protocol(format!(
                "unknown booking doc relation table: {table_name}"
            )));
        }
    };

    sqlx::query_as::<_, (Uuid, Uuid)>(sql)
        .bind(trip_id)
        .bind(booking_ids)
        .fetch_all(pool)
        .await
}

pub async fn lock_booking_doc(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    booking_id: Uuid,
) -> Result<Option<BookingDocRecord>, sqlx::Error> {
    sqlx::query_as::<_, BookingDocRecord>(
        "select
           id, trip_id, trip_plan_id, type, title, status, visibility, owner_member_id, provider_name,
           confirmation_code, starts_at, ends_at, timezone, price_minor, currency, notes,
           created_by, created_at, updated_at, version
         from booking_docs
         where id = $1 and deleted_at is null
         for update",
    )
    .bind(booking_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn insert_booking_doc(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    booking: NewBookingDoc<'_>,
) -> Result<BookingDocRecord, sqlx::Error> {
    sqlx::query_as::<_, BookingDocRecord>(
        "insert into booking_docs (
           id, trip_id, trip_plan_id, type, title, status, visibility, owner_member_id, provider_name,
           confirmation_code, starts_at, ends_at, timezone, price_minor, currency, notes,
           created_by, version
         )
         values (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13, $14, $15,
           $16, $17, 1
         )
         returning
           id, trip_id, trip_plan_id, type, title, status, visibility, owner_member_id, provider_name,
           confirmation_code, starts_at, ends_at, timezone, price_minor, currency, notes,
           created_by, created_at, updated_at, version",
    )
    .bind(booking.id)
    .bind(booking.trip_id)
    .bind(booking.trip_plan_id)
    .bind(booking.r#type)
    .bind(booking.title)
    .bind(booking.status)
    .bind(booking.visibility)
    .bind(booking.owner_member_id)
    .bind(booking.provider_name)
    .bind(booking.confirmation_code)
    .bind(booking.starts_at)
    .bind(booking.ends_at)
    .bind(booking.timezone)
    .bind(booking.price_minor)
    .bind(booking.currency)
    .bind(booking.notes)
    .bind(booking.created_by)
    .fetch_one(&mut **tx)
    .await
}

pub async fn update_booking_doc(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    booking_id: Uuid,
    patch: &PatchBookingDocRequest,
    trip_plan_id: Option<Uuid>,
    next_version: i64,
) -> Result<Option<BookingDocRecord>, sqlx::Error> {
    let patch = &patch.patch;
    let price_minor = patch
        .price_amount
        .map(|value| value.map(price_amount_to_minor));

    sqlx::query_as::<_, BookingDocRecord>(
        "update booking_docs
         set type = coalesce($2, type),
             title = coalesce($3, title),
             status = coalesce($4, status),
             visibility = coalesce($5, visibility),
             owner_member_id = case when $6 then $7 else owner_member_id end,
             provider_name = case when $8 then $9 else provider_name end,
             confirmation_code = case when $10 then $11 else confirmation_code end,
             starts_at = case when $12 then $13::timestamptz else starts_at end,
             ends_at = case when $14 then $15::timestamptz else ends_at end,
             timezone = case when $16 then $17 else timezone end,
             price_minor = case when $18 then $19 else price_minor end,
             currency = case when $20 then $21 else currency end,
             notes = case when $22 then $23 else notes end,
             trip_plan_id = $24,
             version = $25,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, trip_plan_id, type, title, status, visibility, owner_member_id, provider_name,
           confirmation_code, starts_at, ends_at, timezone, price_minor, currency, notes,
           created_by, created_at, updated_at, version",
    )
    .bind(booking_id)
    .bind(patch.r#type.as_deref())
    .bind(patch.title.as_deref())
    .bind(patch.status.as_deref())
    .bind(patch.visibility.as_deref())
    .bind(patch.owner_member_id.is_some())
    .bind(patch.owner_member_id.unwrap_or(None))
    .bind(patch.provider_name.is_some())
    .bind(
        patch
            .provider_name
            .as_ref()
            .and_then(|value| value.as_deref()),
    )
    .bind(patch.confirmation_code.is_some())
    .bind(
        patch
            .confirmation_code
            .as_ref()
            .and_then(|value| value.as_deref()),
    )
    .bind(patch.starts_at.is_some())
    .bind(patch.starts_at.as_ref().and_then(|value| value.as_deref()))
    .bind(patch.ends_at.is_some())
    .bind(patch.ends_at.as_ref().and_then(|value| value.as_deref()))
    .bind(patch.timezone.is_some())
    .bind(patch.timezone.as_ref().and_then(|value| value.as_deref()))
    .bind(price_minor.is_some())
    .bind(price_minor.unwrap_or(None))
    .bind(patch.currency.is_some())
    .bind(patch.currency.as_ref().and_then(|value| value.as_deref()))
    .bind(patch.notes.is_some())
    .bind(patch.notes.as_ref().and_then(|value| value.as_deref()))
    .bind(trip_plan_id)
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn soft_delete_booking_doc(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    booking_id: Uuid,
    next_version: i64,
) -> Result<Option<BookingDocRecord>, sqlx::Error> {
    sqlx::query_as::<_, BookingDocRecord>(
        "update booking_docs
         set deleted_at = now(), version = $2, updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, trip_plan_id, type, title, status, visibility, owner_member_id, provider_name,
           confirmation_code, starts_at, ends_at, timezone, price_minor, currency, notes,
           created_by, created_at, updated_at, version",
    )
    .bind(booking_id)
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn replace_booking_doc_external_links(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    booking_id: Uuid,
    links: &[CreateBookingDocExternalLinkRequest],
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "delete from booking_doc_external_links
         where trip_id = $1 and booking_doc_id = $2",
    )
    .bind(trip_id)
    .bind(booking_id)
    .execute(&mut **tx)
    .await?;

    for (sort_order, link) in links.iter().enumerate() {
        sqlx::query(
            "insert into booking_doc_external_links (
               id, trip_id, booking_doc_id, label, url, provider, access_note, sort_order
             )
             values ($1, $2, $3, $4, $5, $6, $7, $8)",
        )
        .bind(link.id.unwrap_or_else(Uuid::now_v7))
        .bind(trip_id)
        .bind(booking_id)
        .bind(&link.label)
        .bind(&link.url)
        .bind(link.provider.as_deref())
        .bind(link.access_note.as_deref())
        .bind(sort_order as i32)
        .execute(&mut **tx)
        .await?;
    }

    Ok(())
}

pub async fn replace_booking_doc_member_relations(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    booking_id: Uuid,
    member_ids: &[Uuid],
) -> Result<(), sqlx::Error> {
    sqlx::query("delete from booking_doc_travelers where trip_id = $1 and booking_doc_id = $2")
        .bind(trip_id)
        .bind(booking_id)
        .execute(&mut **tx)
        .await?;

    for member_id in unique_uuids(member_ids) {
        sqlx::query(
            "insert into booking_doc_travelers (trip_id, booking_doc_id, member_id)
             values ($1, $2, $3)",
        )
        .bind(trip_id)
        .bind(booking_id)
        .bind(member_id)
        .execute(&mut **tx)
        .await?;
    }

    Ok(())
}

pub async fn replace_booking_doc_itinerary_relations(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    booking_id: Uuid,
    itinerary_item_ids: &[Uuid],
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "delete from booking_doc_itinerary_items where trip_id = $1 and booking_doc_id = $2",
    )
    .bind(trip_id)
    .bind(booking_id)
    .execute(&mut **tx)
    .await?;

    for itinerary_item_id in unique_uuids(itinerary_item_ids) {
        sqlx::query(
            "insert into booking_doc_itinerary_items (trip_id, booking_doc_id, itinerary_item_id)
             values ($1, $2, $3)",
        )
        .bind(trip_id)
        .bind(booking_id)
        .bind(itinerary_item_id)
        .execute(&mut **tx)
        .await?;
    }

    Ok(())
}

pub async fn replace_booking_doc_task_relations(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    booking_id: Uuid,
    task_ids: &[Uuid],
) -> Result<(), sqlx::Error> {
    sqlx::query("delete from booking_doc_tasks where trip_id = $1 and booking_doc_id = $2")
        .bind(trip_id)
        .bind(booking_id)
        .execute(&mut **tx)
        .await?;

    for task_id in unique_uuids(task_ids) {
        sqlx::query(
            "insert into booking_doc_tasks (trip_id, booking_doc_id, task_id)
             values ($1, $2, $3)",
        )
        .bind(trip_id)
        .bind(booking_id)
        .bind(task_id)
        .execute(&mut **tx)
        .await?;
    }

    Ok(())
}

pub async fn replace_booking_doc_expense_relations(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    booking_id: Uuid,
    expense_ids: &[Uuid],
) -> Result<(), sqlx::Error> {
    sqlx::query("delete from booking_doc_expenses where trip_id = $1 and booking_doc_id = $2")
        .bind(trip_id)
        .bind(booking_id)
        .execute(&mut **tx)
        .await?;

    for expense_id in unique_uuids(expense_ids) {
        sqlx::query(
            "insert into booking_doc_expenses (trip_id, booking_doc_id, expense_id)
             values ($1, $2, $3)",
        )
        .bind(trip_id)
        .bind(booking_id)
        .bind(expense_id)
        .execute(&mut **tx)
        .await?;
    }

    Ok(())
}

pub async fn replace_booking_doc_note_relations(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    booking_id: Uuid,
    note_ids: &[Uuid],
) -> Result<(), sqlx::Error> {
    sqlx::query("delete from booking_doc_stop_notes where trip_id = $1 and booking_doc_id = $2")
        .bind(trip_id)
        .bind(booking_id)
        .execute(&mut **tx)
        .await?;

    for note_id in unique_uuids(note_ids) {
        sqlx::query(
            "insert into booking_doc_stop_notes (trip_id, booking_doc_id, stop_note_id)
             values ($1, $2, $3)",
        )
        .bind(trip_id)
        .bind(booking_id)
        .bind(note_id)
        .execute(&mut **tx)
        .await?;
    }

    Ok(())
}
