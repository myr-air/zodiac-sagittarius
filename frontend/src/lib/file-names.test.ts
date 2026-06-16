import { describe, expect, it } from "vitest";
import { slugifyFilePart } from "./file-names";

describe("file name helpers", () => {
  it("normalizes labels into safe lowercase file parts", () => {
    expect(slugifyFilePart("Hong Kong + Shenzhen Trip")).toBe(
      "hong-kong-shenzhen-trip",
    );
    expect(slugifyFilePart("  Expenses: June 2026  ")).toBe(
      "expenses-june-2026",
    );
  });

  it("falls back when the label has no alphanumeric content", () => {
    expect(slugifyFilePart(" !!! ")).toBe("trip");
  });
});
