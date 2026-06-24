use serde::Serialize;
use uuid::Uuid;

use crate::db;
use crate::domain::errors::ServiceError;

pub async fn reject_duplicate_mutation(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
    client_mutation_id: &str,
) -> Result<(), ServiceError> {
    if db::queries::realtime_event_exists_for_client_mutation(
        tx,
        trip_id,
        member_id,
        client_mutation_id,
    )
    .await?
    {
        return Err(ServiceError::VersionConflict);
    }

    Ok(())
}

pub fn version_conflict_with_latest<T>(latest: T, serialization_error: &'static str) -> ServiceError
where
    T: Serialize,
{
    match serde_json::to_value(latest) {
        Ok(latest) => ServiceError::VersionConflictWithLatest(latest),
        Err(_) => ServiceError::InvalidRequest(serialization_error),
    }
}

#[cfg(test)]
mod tests {
    use serde::Serialize;

    use super::*;

    #[derive(Serialize)]
    struct Latest {
        id: &'static str,
        version: i64,
    }

    #[test]
    fn builds_version_conflict_with_serialized_latest_payload() {
        let error = version_conflict_with_latest(
            Latest {
                id: "record-1",
                version: 3,
            },
            "latest record could not be serialized",
        );

        match error {
            ServiceError::VersionConflictWithLatest(latest) => {
                assert_eq!(latest["id"], "record-1");
                assert_eq!(latest["version"], 3);
            }
            other => panic!("expected latest conflict, got {other:?}"),
        }
    }
}
