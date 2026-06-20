import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  TravelMotif,
  travelMotifToneClassNames,
  travelMotifToneValues,
} from "./TravelMotifs";

describe("TravelMotif", () => {
  it("keeps motif tones and classes in story order", () => {
    expect(travelMotifToneValues).toEqual(["route", "sunshine", "postcard"]);
    expect(travelMotifToneClassNames).toMatchObject({
      route: expect.stringContaining("travel-motif--route"),
      sunshine: expect.stringContaining("travel-motif--sunshine"),
      postcard: expect.stringContaining("travel-motif--postcard"),
    });
  });

  it("applies the selected motif tone class", () => {
    render(<TravelMotif tone="postcard" data-testid="motif" />);

    expect(screen.getByTestId("motif")).toHaveClass("travel-motif--postcard");
  });
});
