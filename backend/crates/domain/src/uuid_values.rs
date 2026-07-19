use std::collections::HashSet;

use uuid::Uuid;

pub fn unique_uuids(ids: &[Uuid]) -> Vec<Uuid> {
    let mut seen = HashSet::new();
    ids.iter().copied().filter(|id| seen.insert(*id)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unique_uuids_preserves_first_seen_order() {
        let first = Uuid::now_v7();
        let second = Uuid::now_v7();
        let third = Uuid::now_v7();

        assert_eq!(
            unique_uuids(&[first, second, first, third, second]),
            vec![first, second, third]
        );
    }
}
