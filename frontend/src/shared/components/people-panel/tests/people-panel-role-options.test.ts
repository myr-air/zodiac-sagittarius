import { describe, expect, it } from "vitest";
import { enMessages } from "@/src/i18n/messages/en";
import { thMessages } from "@/src/i18n/messages/th";

import { peoplePanelManagedRoleOptions } from "../people-panel-role-options";

describe("peoplePanelManagedRoleOptions", () => {
  it("uses the trip invitable role order with localized labels", () => {
    expect(peoplePanelManagedRoleOptions(enMessages.appShell.roles)).toEqual([
      { value: "organizer", label: "Organizer" },
      { value: "traveler", label: "Traveler" },
      { value: "viewer", label: "Viewer" },
    ]);
    expect(peoplePanelManagedRoleOptions(thMessages.appShell.roles)).toEqual([
      { value: "organizer", label: "ผู้จัดทริป" },
      { value: "traveler", label: "ผู้ร่วมเดินทาง" },
      { value: "viewer", label: "ผู้ชม" },
    ]);
  });
});
