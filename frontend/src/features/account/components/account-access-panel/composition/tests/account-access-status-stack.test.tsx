import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccountAccessStatusStack } from "../account-access-status-stack";

describe("AccountAccessStatusStack", () => {
  it("renders account entry success messages in the floating toast stack", () => {
    render(
      <AccountAccessStatusStack
        displayError="Hidden while account entry handles message"
        isAccountEntry
        message="Saved"
      />,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Saved");
    expect(status.closest(".account-toast-stack")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders non-account messages and errors inline", () => {
    render(
      <AccountAccessStatusStack
        displayError="Could not sign in"
        isAccountEntry={false}
        message="Ready"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Ready");
    expect(screen.getByRole("alert")).toHaveTextContent("Could not sign in");
    expect(
      screen.queryByRole("status")?.closest(".account-toast-stack"),
    ).toBeNull();
  });
});
