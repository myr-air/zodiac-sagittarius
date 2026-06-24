import { describe, expect, it } from "vitest";
import { externalLinkAnchorProps } from "../external-link-props";

describe("externalLinkAnchorProps", () => {
  it("centralizes secure new-tab anchor attributes", () => {
    expect(externalLinkAnchorProps).toEqual({
      rel: "noreferrer",
      target: "_blank",
    });
  });
});
