import { describe, expect, it } from "vitest";
import { buildMemberSelectOptions } from "@/src/trip/members";

describe("member options", () => {
  it("builds select options from member ids and display names", () => {
    expect(
      buildMemberSelectOptions([
        { id: "member-aom", displayName: "Aom" },
        { id: "member-beam", displayName: "Beam" },
      ]),
    ).toEqual([
      { value: "member-aom", label: "Aom" },
      { value: "member-beam", label: "Beam" },
    ]);
  });
});
