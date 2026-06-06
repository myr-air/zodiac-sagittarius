import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins string classes and removes empty values", () => {
    expect(cn("button", "", false, null, undefined, "button--primary")).toBe("button button--primary");
  });

  it("keeps conditional classes when the condition resolves to a string", () => {
    const disabled = true;
    const active = false;

    expect(cn("button", disabled && "opacity-60", active && "bg-(--color-primary)")).toBe("button opacity-60");
  });

  it("flattens nested arrays without changing class order", () => {
    expect(cn("panel", ["grid", ["gap-3", null, ["md:grid-cols-2"]]], "rounded-(--radius-lg)")).toBe(
      "panel grid gap-3 md:grid-cols-2 rounded-(--radius-lg)",
    );
  });

  it("preserves existing semantic classes for incremental migration", () => {
    expect(cn("badge", "badge--success", "inline-flex", "items-center")).toBe("badge badge--success inline-flex items-center");
  });
});
