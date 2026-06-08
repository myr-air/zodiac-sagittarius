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

  it("fetches a Frankfurter rate for one major-currency pair and caches it", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ date: "2026-06-05", base: "CNY", quote: "HKD", rate: 1.1 }],
    });
    const storage = installStorageStub();

    const firstRate = await fetchMajorExchangeRate("CNY", "HKD", { fetchImpl, storage });
    const cachedRate = await fetchMajorExchangeRate("CNY", "HKD", { fetchImpl, storage });

    expect(firstRate).toEqual({ date: "2026-06-05", rate: 1.1, source: "CNY", target: "HKD" });
    expect(cachedRate).toEqual(firstRate);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith("https://api.frankfurter.dev/v2/rates?base=CNY&quotes=HKD");
    expect(storage.getItem(exchangeRateCacheKey("CNY", "HKD"))).toContain("\"rate\":1.1");
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
