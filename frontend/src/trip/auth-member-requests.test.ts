import { describe, expect, it } from "vitest";
import {
  buildCreateMemberRequest,
  buildPatchMemberAccessStatusRequest,
  buildPatchMemberPasswordRequest,
  buildPatchMemberRoleRequest,
  buildUpdatePresenceRequest,
} from "./auth";

describe("trip participant member API requests", () => {
  it("builds member API create and patch requests", () => {
    expect(
      buildCreateMemberRequest(
        { displayName: "New friend", role: "traveler" },
        { memberCount: 2 },
      ),
    ).toEqual({
      displayName: "New friend",
      role: "traveler",
      color: "#f97316",
    });

    expect(buildPatchMemberRoleRequest("organizer")).toEqual({
      role: "organizer",
    });
    expect(buildPatchMemberAccessStatusRequest("disabled")).toEqual({
      accessStatus: "disabled",
    });
    expect(buildPatchMemberPasswordRequest("new-pin")).toEqual({
      participantPassword: "new-pin",
    });
    expect(buildUpdatePresenceRequest("online", {
      clientMutationId: "mutation-presence-online",
    })).toEqual({
      clientMutationId: "mutation-presence-online",
      presence: "online",
    });
  });
});
