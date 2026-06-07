export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const excludedRequestHeaders = new Set([
  ...hopByHopHeaders,
  "host",
  "content-length",
]);

function resolveInternalApiBaseUrl(): URL | Response {
  const rawBaseUrl = process.env.SAGITTARIUS_INTERNAL_API_BASE_URL?.trim();
  if (!rawBaseUrl) {
    return proxyConfigurationError(
      "SAGITTARIUS_INTERNAL_API_BASE_URL is required",
    );
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(rawBaseUrl);
  } catch {
    return proxyConfigurationError(
      "SAGITTARIUS_INTERNAL_API_BASE_URL must be a valid URL",
    );
  }

  if (!["http:", "https:"].includes(baseUrl.protocol)) {
    return proxyConfigurationError(
      "SAGITTARIUS_INTERNAL_API_BASE_URL must use http:// or https://",
    );
  }

  return baseUrl;
}

function proxyConfigurationError(message: string) {
  return Response.json(
    {
      error: "internal_api_proxy_unavailable",
      message,
    },
    { status: 503 },
  );
}

function copyRequestHeaders(headers: Headers): Headers {
  const forwarded = new Headers();
  for (const [name, value] of headers) {
    if (!excludedRequestHeaders.has(name.toLowerCase())) {
      forwarded.set(name, value);
    }
  }
  return forwarded;
}

function copyResponseHeaders(headers: Headers): Headers {
  const forwarded = new Headers();
  for (const [name, value] of headers) {
    if (!hopByHopHeaders.has(name.toLowerCase())) {
      forwarded.set(name, value);
    }
  }
  return forwarded;
}

async function proxyApiRequest(request: Request, context: RouteContext) {
  const baseUrl = resolveInternalApiBaseUrl();
  if (baseUrl instanceof Response) return baseUrl;

  const { path = [] } = await context.params;
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `/api/v1/${path.map(encodeURIComponent).join("/")}`,
    baseUrl,
  );
  upstreamUrl.search = requestUrl.search;

  const init: RequestInit = {
    headers: copyRequestHeaders(request.headers),
    method: request.method,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const upstreamResponse = await fetch(upstreamUrl, init);

  return new Response(upstreamResponse.body, {
    headers: copyResponseHeaders(upstreamResponse.headers),
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
}

export async function GET(request: Request, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export async function OPTIONS(request: Request, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export async function HEAD(request: Request, context: RouteContext) {
  return proxyApiRequest(request, context);
}
