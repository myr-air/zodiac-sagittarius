import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace account feature source boundaries", () => {
  it("keeps the trip preview map view split from the MapLibre lifecycle", () => {
    const {
      tripPreviewLiveMapHook,
      tripPreviewMap,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(tripPreviewMap).toContain("useTripPreviewLiveMap");
    expect(tripPreviewMap).toContain("TripPreviewMapFallback");
    expect(tripPreviewMap).not.toContain("maplibre-gl");
    expect(tripPreviewMap).not.toContain("document.createElement");
    expect(tripPreviewLiveMapHook).toContain("export function useTripPreviewLiveMap");
    expect(tripPreviewLiveMapHook).toContain("maplibre-gl");
    expect(tripPreviewLiveMapHook).toContain("document.createElement");
    expect(tripPreviewLiveMapHook).toContain("fitPreviewMap");
  });
});
