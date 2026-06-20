import { describe, expect, it } from "vitest";
import { roleLabel } from "./member-labels";

describe("member labels", () => {
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
