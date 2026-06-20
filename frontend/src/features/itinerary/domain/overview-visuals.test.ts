import { describe, expect, it } from "vitest";
import {
  buildDestinationVisual,
  destinationToneValues,
} from "./overview-visuals";

describe("overview visual helpers", () => {
  it("keeps destination tones in visual fallback order", () => {
    expect(destinationToneValues).toEqual(["harbor", "city", "coast", "market"]);
  });

  it("builds destination visuals from destination label heuristics", () => {
    const harbor = buildDestinationVisual("Night in Hong Kong");
    const coast = buildDestinationVisual("Bali beach retreat");
    const market = buildDestinationVisual("Bangkok night market");
    const city = buildDestinationVisual("Kyoto");

    expect(harbor.tone).toBe("harbor");
    expect(coast.tone).toBe("coast");
    expect(market.tone).toBe("market");
    expect(city.tone).toBe("city");
  });
});
