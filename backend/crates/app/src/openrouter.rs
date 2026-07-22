//! Shared OpenRouter chat-completions helper with model rotation.
//!
//! Prefer the official Free Models Router (`openrouter/free`), which randomly
//! selects an available free model filtered for request capabilities
//! (see https://openrouter.ai/docs/guides/routing/routers/free-router).
//!
//! Free-tier account limits (RPM/RPD) are shared across all `:free` models —
//! client rotation does not raise that ceiling. It recovers from 408/429/502/503
//! when a given model/router attempt fails.

use sagittarius_domain::errors::ServiceError;
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

pub const OPENROUTER_CHAT_COMPLETIONS_URL: &str = "https://openrouter.ai/api/v1/chat/completions";

/// Official Free Models Router slug (OpenRouter picks a capable free model).
pub const FREE_MODELS_ROUTER: &str = "openrouter/free";

/// Default chain when neither `OPENROUTER_MODELS` nor a primary model is set.
/// Account settings will own model preference later; until then the server
/// defaults to the official Free Models Router only.
pub const DEFAULT_FREE_MODEL_CHAIN: &[&str] = &[FREE_MODELS_ROUTER];

#[derive(Debug, Clone)]
pub struct ChatMessage {
    pub role: &'static str,
    pub content: String,
}

#[derive(Debug, Clone)]
pub struct ChatCompletionRequest {
    pub messages: Vec<ChatMessage>,
    pub temperature: f32,
    /// When true, send `response_format: { type: "json_object" }` unless `response_format` is set.
    pub json_object: bool,
    /// Full OpenRouter `response_format` object (e.g. json_schema). Wins over `json_object`.
    pub response_format: Option<serde_json::Value>,
    /// Optional extra headers (e.g. place-resolution User-Agent).
    pub user_agent: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ChatCompletionResult {
    pub content: String,
    pub model: String,
}

#[derive(Debug, Serialize)]
struct OpenRouterBody<'a> {
    model: &'a str,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    models: Vec<&'a str>,
    temperature: f32,
    #[serde(skip_serializing_if = "Option::is_none")]
    response_format: Option<serde_json::Value>,
    messages: Vec<OpenRouterMessage<'a>>,
}

#[derive(Debug, Serialize)]
struct OpenRouterMessage<'a> {
    role: &'a str,
    content: &'a str,
}

#[derive(Debug, Deserialize)]
struct OpenRouterResponse {
    /// Actual model used (Free Models Router reports the selected `:free` model).
    #[serde(default)]
    model: Option<String>,
    choices: Vec<OpenRouterChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenRouterChoice {
    message: OpenRouterResponseMessage,
}

#[derive(Debug, Deserialize)]
struct OpenRouterResponseMessage {
    content: String,
}

/// Build the ordered unique model chain from env.
///
/// Precedence:
/// 1. `OPENROUTER_MODELS` (comma-separated) when non-empty
/// 2. else `OPENROUTER_MODEL` / `SAGITTARIUS_AI_MODEL` as primary, then free defaults
/// 3. else free defaults only
pub fn model_chain_from_env() -> Vec<String> {
    model_chain(
        std::env::var("OPENROUTER_MODELS").ok(),
        std::env::var("OPENROUTER_MODEL")
            .or_else(|_| std::env::var("SAGITTARIUS_AI_MODEL"))
            .ok(),
    )
}

/// Pure model-chain builder (testable without mutating process env).
pub fn model_chain(models_csv: Option<String>, primary: Option<String>) -> Vec<String> {
    if let Some(raw) = models_csv {
        let models = split_models(&raw);
        if !models.is_empty() {
            return models;
        }
    }

    let mut chain = Vec::new();
    if let Some(model) = primary
        .map(|m| m.trim().to_string())
        .filter(|m| !m.is_empty())
    {
        push_unique(&mut chain, model);
    }
    for model in DEFAULT_FREE_MODEL_CHAIN {
        push_unique(&mut chain, (*model).to_string());
    }
    chain
}

fn split_models(raw: &str) -> Vec<String> {
    let mut out = Vec::new();
    for part in raw.split(',') {
        let model = part.trim();
        if !model.is_empty() {
            push_unique(&mut out, model.to_string());
        }
    }
    out
}

fn push_unique(chain: &mut Vec<String>, model: String) {
    if !chain.iter().any(|existing| existing == &model) {
        chain.push(model);
    }
}

pub fn is_retryable_status(status: reqwest::StatusCode) -> bool {
    matches!(
        status.as_u16(),
        408 | 429 | 502 | 503 | 529
    )
}

fn openrouter_api_key() -> Result<String, ServiceError> {
    std::env::var("OPENROUTER_API_KEY")
        .or_else(|_| std::env::var("SAGITTARIUS_OPENROUTER_API_KEY"))
        .map_err(|_| ServiceError::InvalidRequest("OPENROUTER_API_KEY is required"))
}

/// POST chat/completions, rotating through the model chain on retryable failures.
pub async fn chat_completion_json(
    request: ChatCompletionRequest,
) -> Result<ChatCompletionResult, ServiceError> {
    let api_key = openrouter_api_key()?;
    let chain = model_chain_from_env();
    if chain.is_empty() {
        return Err(ServiceError::InvalidRequest(
            "OPENROUTER_MODELS / OPENROUTER_MODEL produced an empty model chain",
        ));
    }

    let client = reqwest::Client::new();
    let mut last_error = "openrouter request failed";

    for (index, model) in chain.iter().enumerate() {
        let fallbacks: Vec<&str> = chain[index + 1..].iter().map(String::as_str).collect();
        let messages: Vec<OpenRouterMessage<'_>> = request
            .messages
            .iter()
            .map(|m| OpenRouterMessage {
                role: m.role,
                content: m.content.as_str(),
            })
            .collect();

        let response_format = request.response_format.clone().or_else(|| {
            request.json_object.then(|| {
                serde_json::json!({
                    "type": "json_object"
                })
            })
        });

        let body = OpenRouterBody {
            model: model.as_str(),
            models: fallbacks,
            temperature: request.temperature,
            response_format,
            messages,
        };

        let mut builder = client
            .post(OPENROUTER_CHAT_COMPLETIONS_URL)
            .bearer_auth(&api_key)
            .json(&body);

        if let Some(ua) = &request.user_agent {
            builder = builder.header(reqwest::header::USER_AGENT, ua);
        }
        if let Ok(site_url) = std::env::var("OPENROUTER_SITE_URL") {
            builder = builder.header("HTTP-Referer", site_url);
        }
        if let Ok(site_name) = std::env::var("OPENROUTER_SITE_NAME") {
            builder = builder.header("X-Title", site_name);
        }

        let response = match builder.send().await {
            Ok(response) => response,
            Err(_) => {
                warn!(model = %model, "openrouter transport error; trying next model");
                last_error = "openrouter request failed";
                continue;
            }
        };

        let status = response.status();
        if is_retryable_status(status) {
            warn!(
                model = %model,
                status = status.as_u16(),
                "openrouter limited or unavailable; rotating to next model"
            );
            last_error = "openrouter rate limited or unavailable";
            continue;
        }
        if !status.is_success() {
            warn!(
                model = %model,
                status = status.as_u16(),
                "openrouter non-retryable error"
            );
            return Err(ServiceError::InvalidRequest(
                "openrouter request failed",
            ));
        }

        let parsed: OpenRouterResponse = response
            .json()
            .await
            .map_err(|_| ServiceError::InvalidRequest("openrouter response was invalid"))?;
        let content = parsed
            .choices
            .first()
            .map(|choice| choice.message.content.trim().to_string())
            .filter(|content| !content.is_empty())
            .ok_or(ServiceError::InvalidRequest(
                "openrouter response was empty",
            ))?;

        let resolved_model = parsed
            .model
            .filter(|m| !m.trim().is_empty())
            .unwrap_or_else(|| model.clone());
        info!(
            requested_model = %model,
            model = %resolved_model,
            "openrouter chat completion succeeded"
        );
        return Ok(ChatCompletionResult {
            content,
            model: resolved_model,
        });
    }

    Err(ServiceError::InvalidRequest(last_error))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn model_chain_prefers_openrouter_models_list() {
        let chain = model_chain(
            Some("alpha:free, beta:free, alpha:free,  ".to_string()),
            Some("should-be-ignored".to_string()),
        );
        assert_eq!(
            chain,
            vec!["alpha:free".to_string(), "beta:free".to_string()]
        );
    }

    #[test]
    fn model_chain_appends_free_defaults_after_primary() {
        let chain = model_chain(None, Some("openai/gpt-5.2".to_string()));
        assert_eq!(
            chain,
            vec![
                "openai/gpt-5.2".to_string(),
                FREE_MODELS_ROUTER.to_string()
            ]
        );
    }

    #[test]
    fn default_chain_is_official_free_router_only() {
        let chain = model_chain(None, None);
        assert_eq!(chain, vec![FREE_MODELS_ROUTER.to_string()]);
    }

    #[test]
    fn retryable_statuses_cover_rate_limit_and_upstream() {
        assert!(is_retryable_status(reqwest::StatusCode::TOO_MANY_REQUESTS));
        assert!(is_retryable_status(reqwest::StatusCode::BAD_GATEWAY));
        assert!(is_retryable_status(reqwest::StatusCode::SERVICE_UNAVAILABLE));
        assert!(is_retryable_status(reqwest::StatusCode::REQUEST_TIMEOUT));
        assert!(!is_retryable_status(reqwest::StatusCode::UNAUTHORIZED));
        assert!(!is_retryable_status(reqwest::StatusCode::PAYMENT_REQUIRED));
    }
}
