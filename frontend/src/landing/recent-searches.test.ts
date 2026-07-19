import { describe, expect, it } from "vitest";
import {
  appendRecent,
  loadRecent,
  RECENT_STORAGE_KEY,
  saveRecent,
  type StorageLike,
} from "./recent-searches";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem(key: string) {
      return key in data ? data[key]! : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
  };
}

describe("appendRecent", () => {
  it("prepends and dedupes", () => {
    expect(appendRecent(["Tokyo", "Paris"], "Vietnam")).toEqual([
      "Vietnam",
      "Tokyo",
      "Paris",
    ]);
    expect(appendRecent(["Tokyo", "Vietnam"], "Vietnam")).toEqual([
      "Vietnam",
      "Tokyo",
    ]);
  });

  it("trims and ignores empty", () => {
    expect(appendRecent(["Tokyo"], "  Hanoi  ")).toEqual(["Hanoi", "Tokyo"]);
    expect(appendRecent(["Tokyo"], "   ")).toEqual(["Tokyo"]);
  });

  it("caps at max", () => {
    const list = ["a", "b", "c", "d", "e", "f", "g", "h"];
    expect(appendRecent(list, "z", 8)).toEqual([
      "z",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
    ]);
    expect(appendRecent(list, "z", 3)).toEqual(["z", "a", "b"]);
  });
});

describe("loadRecent / saveRecent", () => {
  it("loads an empty list when missing or invalid", () => {
    expect(loadRecent(null)).toEqual([]);
    expect(loadRecent(undefined)).toEqual([]);
    expect(loadRecent(memoryStorage())).toEqual([]);
    expect(
      loadRecent(memoryStorage({ [RECENT_STORAGE_KEY]: "not-json" })),
    ).toEqual([]);
    expect(
      loadRecent(memoryStorage({ [RECENT_STORAGE_KEY]: "{}" })),
    ).toEqual([]);
  });

  it("round-trips through injectable storage", () => {
    const storage = memoryStorage();
    saveRecent(storage, ["Vietnam", "Tokyo"]);
    expect(loadRecent(storage)).toEqual(["Vietnam", "Tokyo"]);
    expect(storage.data[RECENT_STORAGE_KEY]).toBe(
      JSON.stringify(["Vietnam", "Tokyo"]),
    );
  });

  it("filters non-string entries", () => {
    const storage = memoryStorage({
      [RECENT_STORAGE_KEY]: JSON.stringify(["ok", 1, null, "yes"]),
    });
    expect(loadRecent(storage)).toEqual(["ok", "yes"]);
  });
});
