import { describe, expect, it } from "vitest";
import {
  emptyClassName,
  rowClassName,
  segmentClassName,
  stripClassName,
  tempHighClassName,
} from "../weather-forecast-strip.styles";

describe("weather forecast strip styles", () => {
  it("keeps strip layout and mobile overflow styles centralized", () => {
    expect(stripClassName).toContain("weather-forecast-strip");
    expect(stripClassName).toContain("bg-(--color-surface)");
    expect(rowClassName).toContain("weather-forecast-row");
    expect(rowClassName).toContain("max-[767px]:snap-x");
    expect(segmentClassName).toContain("weather-forecast-segment");
    expect(segmentClassName).toContain("max-[767px]:w-[118px]");
    expect(tempHighClassName).toContain("weather-forecast-temp-high");
    expect(emptyClassName).toContain("weather-forecast-empty-state");
  });
});
