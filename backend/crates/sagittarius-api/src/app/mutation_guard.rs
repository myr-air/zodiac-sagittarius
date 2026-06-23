use serde::Serialize;

use crate::domain::errors::ServiceError;

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
