import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "@/src/ui";

describe("shared UI icons", () => {
  it("renders every supported icon branch", () => {
    const iconNames = [
      "alertCircle",
      "calendar",
      "check",
      "chevronLeft",
      "chevronRight",
      "clock",
      "cloud",
      "copy",
      "document",
      "dots",
      "drag",
      "edit",
      "eye",
      "eyeOff",
      "external",
      "home",
      "layout",
      "lightbulb",
      "list",
      "location",
      "map",
      "menu",
      "note",
      "panel",
      "plus",
      "redo",
      "route",
      "settings",
      "sunrise",
      "sunset",
      "table",
      "trash",
      "undo",
      "utensils",
      "users",
      "wallet",
      "x",
      "warning",
    ] as const;

    const { container } = render(
      <>
        {iconNames.map((name) => (
          <Icon key={name} name={name} data-testid={`icon-${name}`} />
        ))}
      </>,
    );

    expect(container.querySelectorAll("svg")).toHaveLength(iconNames.length);
  });
});
