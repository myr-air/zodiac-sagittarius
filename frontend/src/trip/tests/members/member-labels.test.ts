import { describe, expect, it } from "vitest";
import { memberInitial, roleLabel } from "../../members";

describe("member labels", () => {
  it("formats compact member initials with a readable fallback", () => {
    expect(memberInitial("  aom")).toBe("A");
    expect(memberInitial("")).toBe("?");
  });

  it("formats member roles from the provided locale labels", () => {
    expect(roleLabel("organizer", {
      organizer: "Organizer",
      owner: "Owner",
      traveler: "Traveler",
      viewer: "Viewer",
    })).toBe("Organizer");
    expect(roleLabel("viewer", {
      organizer: "ผู้จัดทริป",
      owner: "เจ้าของแผน",
      traveler: "ผู้ร่วมเดินทาง",
      viewer: "ดูได้",
    })).toBe("ดูได้");
  });
});
