import { describe, expect, it } from "vitest";
import { fetchRequestUrl } from "./fetch-request-url";

describe("fetchRequestUrl", () => {
  it("returns a request URL from a Request object", () => {
    expect(fetchRequestUrl(new Request("https://api.example.test/trips"))).toBe(
      "https://api.example.test/trips",
    );
  });

  it("returns a URL string from string and URL inputs", () => {
    expect(fetchRequestUrl("https://api.example.test/account")).toBe(
      "https://api.example.test/account",
    );
    expect(fetchRequestUrl(new URL("https://api.example.test/settings"))).toBe(
      "https://api.example.test/settings",
    );
  });
});
