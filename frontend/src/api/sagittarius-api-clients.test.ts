import { afterEach, describe, expect, it } from "vitest";
import { publicSagittariusApiBaseUrl } from "./sagittarius-api-clients";

const originalApiBaseUrl = process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL;

afterEach(() => {
  if (originalApiBaseUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL;
    return;
  }
  process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL = originalApiBaseUrl;
});

describe("publicSagittariusApiBaseUrl", () => {
  it("returns the public API base URL from the environment", () => {
    process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL = "https://api.example.test";

    expect(publicSagittariusApiBaseUrl()).toBe("https://api.example.test");
  });

  it("falls back to an empty base URL for local mode", () => {
    delete process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL;

    expect(publicSagittariusApiBaseUrl()).toBe("");
  });
});
