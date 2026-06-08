import { describe, expect, it, vi } from "vitest";
import {
  exchangeRateCacheKey,
  fetchMajorExchangeRate,
  majorCurrencyCodes,
  majorCurrencyOptions,
} from "./currencies";

describe("major currency exchange rates", () => {
  it("keeps the first release scoped to major travel currencies", () => {
    expect(majorCurrencyCodes).toEqual(["HKD", "THB", "USD", "JPY", "CNY", "EUR", "GBP", "SGD", "KRW", "TWD"]);
    expect(majorCurrencyOptions.map((option) => option.code)).toEqual(majorCurrencyCodes);
  });

  it("fetches a backend shared rate for one major-currency pair and caches it", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ date: "2026-06-05", base: "CNY", quote: "HKD", rate: 1.1, provider: "frankfurter", stale: false }),
    });
    const storage = installStorageStub();

    const firstRate = await fetchMajorExchangeRate("CNY", "HKD", { fetchImpl, storage });
    const cachedRate = await fetchMajorExchangeRate("CNY", "HKD", { fetchImpl, storage });

    expect(firstRate).toEqual({ date: "2026-06-05", rate: 1.1, source: "CNY", target: "HKD" });
    expect(cachedRate).toEqual(firstRate);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith("/api/v1/exchange-rates?base=CNY&quote=HKD");
    expect(storage.getItem(exchangeRateCacheKey("CNY", "HKD"))).toContain("\"rate\":1.1");
  });

  it("falls back to Frankfurter directly when the backend shared rate is unavailable", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ date: "2026-06-05", base: "CNY", quote: "HKD", rate: 1.1 }],
      });

    await expect(fetchMajorExchangeRate("CNY", "HKD", { fetchImpl, storage: null })).resolves.toEqual({
      date: "2026-06-05",
      rate: 1.1,
      source: "CNY",
      target: "HKD",
    });
    expect(fetchImpl).toHaveBeenNthCalledWith(1, "/api/v1/exchange-rates?base=CNY&quote=HKD");
    expect(fetchImpl).toHaveBeenNthCalledWith(2, "https://api.frankfurter.dev/v2/rates?base=CNY&quotes=HKD");
  });

  it("returns one without fetching when source and target currencies match", async () => {
    const fetchImpl = vi.fn();

    await expect(fetchMajorExchangeRate("HKD", "HKD", { fetchImpl })).resolves.toEqual({
      date: null,
      rate: 1,
      source: "HKD",
      target: "HKD",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

function installStorageStub(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
