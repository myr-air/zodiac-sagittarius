import { describe, expect, it } from "vitest";
import { jsonResponse } from "./json-response";

describe("jsonResponse", () => {
  it("builds a JSON response with the default ok status", async () => {
    const response = jsonResponse({ ok: true });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("builds a JSON response with a custom status", async () => {
    const response = jsonResponse({ code: "invalid" }, 400);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "invalid" });
  });
});
