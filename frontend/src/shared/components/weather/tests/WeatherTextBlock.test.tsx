import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeatherTextBlock } from "../WeatherTextBlock";

describe("WeatherTextBlock", () => {
  it("renders block copy with source metadata", () => {
    render(
      <WeatherTextBlock
        title="Festival"
        locale="en"
        block={{
          title: "Festival",
          body: "Dragon boat events near the harbor.",
          meta: {
            source: "Local events",
            sourceUrl: null,
            fetchedAt: "2026-06-04T00:00:00Z",
            expiresAt: "2026-06-05T00:00:00Z",
            confidence: "medium",
            unavailableReason: null,
          },
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Festival" })).toBeInTheDocument();
    expect(screen.getByText("Dragon boat events near the harbor.")).toBeInTheDocument();
    expect(screen.getByText(/Local events/)).toHaveTextContent("fetched 2026-06-04T00:00:00Z");
    expect(screen.getByText(/Local events/)).toHaveTextContent("expires 2026-06-05T00:00:00Z");
  });

  it("uses localized empty text and no-source fallback", () => {
    render(<WeatherTextBlock title="เทศกาล" block={null} locale="th" />);

    expect(screen.getByText("ยังไม่มีข้อมูล")).toBeInTheDocument();
    expect(screen.getByText("ไม่มีแหล่งข้อมูล")).toBeInTheDocument();
  });
});
