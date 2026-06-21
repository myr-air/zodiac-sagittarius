import { describe, expect, it, vi } from "vitest";
import {
  createJsonApiRequester,
  type JsonApiErrorInput,
} from "../json-api-requester";

class TestApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(input: JsonApiErrorInput) {
    super(input.message);
    this.name = "TestApiError";
    this.code = input.code;
    this.status = input.status;
  }
}

describe("createJsonApiRequester", () => {
  it("normalizes base URLs and sends JSON headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ ok: true }));
    const request = createRequester({ baseUrl: "https://api.example.test/", fetchImpl });

    await expect(
      request<{ ok: boolean }>("/api/v1/resource", {
        method: "POST",
        headers: { Authorization: "Bearer token" },
        body: JSON.stringify({ name: "Demo" }),
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/api/v1/resource", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ name: "Demo" }),
    });
  });

  it("returns undefined for empty success responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }));
    const request = createRequester({ fetchImpl });

    await expect(request<void>("/api/v1/resource", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("creates typed errors from JSON error responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      jsonResponse({ code: "invalid_request", message: "Bad input" }, { status: 400 }),
    );
    const request = createRequester({ fetchImpl });

    await expect(request("/api/v1/resource", { method: "GET" })).rejects.toMatchObject({
      name: "TestApiError",
      code: "invalid_request",
      message: "Bad input",
      status: 400,
    });
  });

  it("uses fallback error details when the error body is not JSON", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response("not-json", { status: 502 }));
    const request = createRequester({ fetchImpl });

    await expect(request("/api/v1/resource", { method: "GET" })).rejects.toMatchObject({
      code: "request_failed",
      message: "request failed with 502",
      status: 502,
    });
  });
});

function createRequester({
  baseUrl,
  fetchImpl,
}: {
  baseUrl?: string;
  fetchImpl: typeof fetch;
}) {
  return createJsonApiRequester({
    baseUrl,
    fetcher: fetchImpl,
    createError: (input) => new TestApiError(input),
  });
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}
