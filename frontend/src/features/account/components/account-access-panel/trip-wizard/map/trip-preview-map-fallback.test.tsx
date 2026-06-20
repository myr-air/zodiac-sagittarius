import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TripCity } from "@/src/trip/types";
import { TripPreviewMapFallback, TripPreviewMapSourceBadge } from "./trip-preview-map-fallback";

const bangkok: TripCity = {
  city: "Bangkok",
  country: "Thailand",
  countryCode: "TH",
  latitude: 13.7563,
  longitude: 100.5018,
  timezone: "Asia/Bangkok",
};

const tokyo: TripCity = {
  city: "Tokyo",
  country: "Japan",
  countryCode: "JP",
  latitude: 35.6762,
  longitude: 139.6503,
  timezone: "Asia/Tokyo",
};

describe("trip preview map fallback", () => {
  it("renders the fallback route between origin and destination cities", () => {
    render(<TripPreviewMapFallback originCity={bangkok} destinationCity={tokyo} />);

    expect(screen.getByLabelText("Flight route from Bangkok to Tokyo")).toBeInTheDocument();
    expect(screen.getByText("TH")).toBeInTheDocument();
    expect(screen.getByText("Bangkok")).toBeInTheDocument();
    expect(screen.getByText("JP")).toBeInTheDocument();
    expect(screen.getByText("Tokyo")).toBeInTheDocument();
  });

  it("uses a destination placeholder when no destination city exists yet", () => {
    render(<TripPreviewMapFallback originCity={bangkok} />);

    expect(screen.getByLabelText("Flight route from Bangkok to Destination")).toBeInTheDocument();
    expect(screen.getByText("Destination")).toBeInTheDocument();
  });

  it("renders the map source badge separately from live map lifecycle", () => {
    render(<TripPreviewMapSourceBadge />);

    expect(screen.getByText("OpenFreeMap live map")).toBeInTheDocument();
  });
});
