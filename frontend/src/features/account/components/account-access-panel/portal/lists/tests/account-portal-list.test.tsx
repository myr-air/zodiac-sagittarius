import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PortalList, PortalListRow } from "../account-portal-list";

describe("account portal list", () => {
  it("renders reusable account portal list rows with action and badge slots", () => {
    render(
      <PortalList>
        <PortalListRow
          action={<button type="button">Open</button>}
          badge={<span className="badge">Ready</span>}
          detail="Travel workspace"
          icon="calendar"
          title="Hong Kong"
        />
      </PortalList>,
    );

    expect(screen.getByText("Hong Kong").closest(".account-trip-row")).toHaveClass(
      "flex",
    );
    expect(screen.getByText("Travel workspace")).toBeVisible();
    expect(screen.getByText("Ready")).toHaveClass("badge");
    expect(screen.getByRole("button", { name: "Open" })).toBeVisible();
    expect(screen.getByText("Hong Kong").closest(".account-trip-list")).toHaveClass(
      "grid",
    );
  });
});
