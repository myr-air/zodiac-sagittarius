use std::{
    collections::HashMap,
    hash::{Hash, Hasher},
    sync::Arc,
    time::{Duration, Instant},
};

use async_trait::async_trait;
use serde::Serialize;
use tokio::sync::Mutex;

use sagittarius_domain::errors::ServiceError;

const FRANKFURTER_RATES_ENDPOINT: &str = "https://api.frankfurter.dev/v2/rates";
const FRESH_TTL: Duration = Duration::from_secs(24 * 60 * 60);
const STALE_TTL: Duration = Duration::from_secs(72 * 60 * 60);

const MAJOR_CURRENCIES: &[&str] = &[
    "HKD", "THB", "USD", "JPY", "CNY", "EUR", "GBP", "SGD", "KRW", "TWD",
];

#[derive(Clone)]
pub struct ExchangeRateService {
    cache: Arc<Mutex<HashMap<ExchangeRateCacheKey, CachedExchangeRate>>>,
    provider: Arc<dyn ExchangeRateProvider>,
    fresh_ttl: Duration,
    stale_ttl: Duration,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExchangeRateResponse {
    pub base: String,
    pub quote: String,
    pub rate: f64,
    pub date: Option<String>,
    pub provider: String,
    pub stale: bool,
}

#[derive(Debug, Clone)]
pub struct ProviderExchangeRate {
    pub rate: f64,
    pub date: Option<String>,
    pub provider: String,
}

#[async_trait]
pub trait ExchangeRateProvider: Send + Sync {
    async fn fetch_rate(
        &self,
        base: &str,
        quote: &str,
    ) -> Result<ProviderExchangeRate, ExchangeRateProviderError>;
}

#[derive(Debug, thiserror::Error)]
pub enum ExchangeRateProviderError {
    #[error("exchange rate provider request failed")]
    Request,
    #[error("exchange rate provider response was invalid")]
    InvalidResponse,
}

#[derive(Debug, Clone, Eq)]
struct ExchangeRateCacheKey {
    base: String,
    quote: String,
}

impl PartialEq for ExchangeRateCacheKey {
    fn eq(&self, other: &Self) -> bool {
        self.base == other.base && self.quote == other.quote
    }
}

impl Hash for ExchangeRateCacheKey {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.base.hash(state);
        self.quote.hash(state);
    }
}

#[derive(Debug, Clone)]
struct CachedExchangeRate {
    rate: f64,
    date: Option<String>,
    provider: String,
    fetched_at: Instant,
}

impl Default for ExchangeRateService {
    fn default() -> Self {
        Self::new()
    }
}

impl ExchangeRateService {
    pub fn new() -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
            provider: Arc::new(FrankfurterExchangeRateProvider::new()),
            fresh_ttl: FRESH_TTL,
            stale_ttl: STALE_TTL,
        }
    }

    #[cfg(test)]
    fn with_provider(provider: Arc<dyn ExchangeRateProvider>) -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
            provider,
            fresh_ttl: FRESH_TTL,
            stale_ttl: STALE_TTL,
        }
    }

    pub async fn get_rate(
        &self,
        base: impl AsRef<str>,
        quote: impl AsRef<str>,
    ) -> Result<ExchangeRateResponse, ServiceError> {
        let base = normalize_major_currency(base.as_ref())?;
        let quote = normalize_major_currency(quote.as_ref())?;

        if base == quote {
            return Ok(ExchangeRateResponse {
                base,
                quote,
                rate: 1.0,
                date: None,
                provider: "internal".to_string(),
                stale: false,
            });
        }

        let key = ExchangeRateCacheKey {
            base: base.clone(),
            quote: quote.clone(),
        };
        let cached = self.cache.lock().await.get(&key).cloned();
        if let Some(cached) = cached
            .as_ref()
            .filter(|cached| cached.fetched_at.elapsed() < self.fresh_ttl)
        {
            return Ok(to_response(&base, &quote, cached, false));
        }

        match self.provider.fetch_rate(&base, &quote).await {
            Ok(rate) => {
                let cached = CachedExchangeRate {
                    rate: rate.rate,
                    date: rate.date,
                    provider: rate.provider,
                    fetched_at: Instant::now(),
                };
                self.cache.lock().await.insert(key, cached.clone());
                Ok(to_response(&base, &quote, &cached, false))
            }
            Err(error) => {
                if let Some(cached) =
                    cached.filter(|cached| cached.fetched_at.elapsed() < self.stale_ttl)
                {
                    return Ok(to_response(&base, &quote, &cached, true));
                }
                Err(ServiceError::ExchangeRateProvider(error.to_string()))
            }
        }
    }
}

fn normalize_major_currency(currency: &str) -> Result<String, ServiceError> {
    let normalized = currency.trim().to_uppercase();
    if MAJOR_CURRENCIES.contains(&normalized.as_str()) {
        Ok(normalized)
    } else {
        Err(ServiceError::InvalidRequest("unsupported currency"))
    }
}

fn to_response(
    base: &str,
    quote: &str,
    cached: &CachedExchangeRate,
    stale: bool,
) -> ExchangeRateResponse {
    ExchangeRateResponse {
        base: base.to_string(),
        quote: quote.to_string(),
        rate: cached.rate,
        date: cached.date.clone(),
        provider: cached.provider.clone(),
        stale,
    }
}

struct FrankfurterExchangeRateProvider {
    client: reqwest::Client,
}

impl FrankfurterExchangeRateProvider {
    fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl ExchangeRateProvider for FrankfurterExchangeRateProvider {
    async fn fetch_rate(
        &self,
        base: &str,
        quote: &str,
    ) -> Result<ProviderExchangeRate, ExchangeRateProviderError> {
        let response = self
            .client
            .get(FRANKFURTER_RATES_ENDPOINT)
            .query(&[("base", base), ("quotes", quote)])
            .send()
            .await
            .map_err(|_| ExchangeRateProviderError::Request)?;

        if !response.status().is_success() {
            return Err(ExchangeRateProviderError::Request);
        }

        parse_frankfurter_payload(
            response
                .json::<serde_json::Value>()
                .await
                .map_err(|_| ExchangeRateProviderError::InvalidResponse)?,
            base,
            quote,
        )
    }
}

fn parse_frankfurter_payload(
    payload: serde_json::Value,
    base: &str,
    quote: &str,
) -> Result<ProviderExchangeRate, ExchangeRateProviderError> {
    if let Some(entries) = payload.as_array() {
        for entry in entries {
            let entry_base = entry.get("base").and_then(serde_json::Value::as_str);
            let entry_quote = entry.get("quote").and_then(serde_json::Value::as_str);
            let rate = entry.get("rate").and_then(serde_json::Value::as_f64);
            if entry_base == Some(base) && entry_quote == Some(quote) {
                return valid_provider_rate(rate, entry.get("date"));
            }
        }
        return Err(ExchangeRateProviderError::InvalidResponse);
    }

    let rate = payload
        .get("rates")
        .and_then(|rates| rates.get(quote))
        .and_then(serde_json::Value::as_f64);
    valid_provider_rate(rate, payload.get("date"))
}

fn valid_provider_rate(
    rate: Option<f64>,
    date: Option<&serde_json::Value>,
) -> Result<ProviderExchangeRate, ExchangeRateProviderError> {
    let rate = rate
        .filter(|rate| rate.is_finite() && *rate > 0.0)
        .ok_or(ExchangeRateProviderError::InvalidResponse)?;
    Ok(ProviderExchangeRate {
        rate,
        date: date.and_then(serde_json::Value::as_str).map(str::to_string),
        provider: "frankfurter".to_string(),
    })
}

#[cfg(test)]
mod tests {
    use std::sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    };

    use super::*;

    struct CountingProvider {
        calls: AtomicUsize,
    }

    #[async_trait]
    impl ExchangeRateProvider for CountingProvider {
        async fn fetch_rate(
            &self,
            _base: &str,
            _quote: &str,
        ) -> Result<ProviderExchangeRate, ExchangeRateProviderError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            Ok(ProviderExchangeRate {
                rate: 1.1,
                date: Some("2026-06-05".to_string()),
                provider: "test".to_string(),
            })
        }
    }

    #[tokio::test]
    async fn caches_provider_rate_for_shared_backend_use() {
        let provider = Arc::new(CountingProvider {
            calls: AtomicUsize::new(0),
        });
        let service = ExchangeRateService::with_provider(provider.clone());

        let first = service.get_rate("cny", "hkd").await.unwrap();
        let second = service.get_rate("CNY", "HKD").await.unwrap();

        assert_eq!(first.rate, 1.1);
        assert_eq!(second.rate, 1.1);
        assert_eq!(provider.calls.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    #[ignore = "live provider smoke test; run manually to verify Frankfurter compatibility"]
    async fn frankfurter_provider_live_smoke() {
        let provider = FrankfurterExchangeRateProvider::new();

        let quote = provider.fetch_rate("CNY", "HKD").await.unwrap();

        assert!(quote.rate.is_finite());
        assert!(quote.rate > 0.0);
        assert_eq!(quote.provider, "frankfurter");
    }
}
