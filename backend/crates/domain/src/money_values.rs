pub fn price_amount_to_minor(value: f64) -> i32 {
    (value * 100.0).round() as i32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn price_amount_to_minor_rounds_to_nearest_cent() {
        assert_eq!(price_amount_to_minor(12.345), 1235);
        assert_eq!(price_amount_to_minor(12.344), 1234);
    }
}
