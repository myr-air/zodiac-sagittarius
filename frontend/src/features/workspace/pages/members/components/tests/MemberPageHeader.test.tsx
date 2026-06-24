import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemberPageHeader } from "../MemberPageHeader";

describe("MemberPageHeader", () => {
  it("renders trip title, date range, and member count", () => {
    render(
      <MemberPageHeader
        locale="en"
        memberCountLabel="4 members"
        subtitle="Hong Kong food crawl"
        title="Members"
        tripStartDate="2026-04-10"
        tripEndDate="2026-04-12"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Members" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hong Kong food crawl")).toBeInTheDocument();
    expect(screen.getByText(/Apr 10–12, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/4 members/)).toBeInTheDocument();
  });
});
