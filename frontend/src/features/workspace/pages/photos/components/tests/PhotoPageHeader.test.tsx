import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { photoCopy } from "../../content/TripPhotosPage.copy";
import { PhotoPageHeader } from "../PhotoPageHeader";

describe("PhotoPageHeader", () => {
  it("renders localized trip metadata and album count", () => {
    render(
      <PhotoPageHeader
        albumCount={3}
        copy={photoCopy.en}
        locale="en"
        tripEndDate="2026-04-12"
        tripName="Hong Kong food crawl"
        tripStartDate="2026-04-10"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Photos & Albums" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hong Kong food crawl")).toBeInTheDocument();
    expect(screen.getByText(/Apr 10–12, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/3 album links/)).toBeInTheDocument();
  });
});
