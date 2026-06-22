import { describe, expect, it } from "vitest";
import { defaultCreatedMemberRole } from "../member-create-input";
import {
  initialMemberCreateFormState,
  initialMemberFilterState,
  setMemberCreatePanelOpenState,
  updateMemberCreateFormState,
  updateMemberFilterState,
} from "../member-page-state";

describe("member page state", () => {
  it("defines initial filter and create form state in one model", () => {
    expect(initialMemberFilterState).toEqual({
      query: "",
      roleFilter: "all",
      statusFilter: "all",
    });
    expect(initialMemberCreateFormState).toEqual({
      isOpen: false,
      name: "",
      role: defaultCreatedMemberRole,
    });
  });

  it("updates filter state without mutating current state", () => {
    const nextState = updateMemberFilterState(
      initialMemberFilterState,
      "roleFilter",
      "viewer",
    );

    expect(nextState).toEqual({
      query: "",
      roleFilter: "viewer",
      statusFilter: "all",
    });
    expect(initialMemberFilterState.roleFilter).toBe("all");
  });

  it("updates create form state without mutating current state", () => {
    const namedState = updateMemberCreateFormState(
      initialMemberCreateFormState,
      "name",
      "Aom",
    );
    const openState = setMemberCreatePanelOpenState(namedState, true);

    expect(openState).toEqual({
      isOpen: true,
      name: "Aom",
      role: defaultCreatedMemberRole,
    });
    expect(
      setMemberCreatePanelOpenState(openState, (current) => !current).isOpen,
    ).toBe(false);
    expect(initialMemberCreateFormState.name).toBe("");
  });
});
