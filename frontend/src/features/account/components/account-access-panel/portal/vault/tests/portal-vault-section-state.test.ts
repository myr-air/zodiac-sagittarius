import { describe, expect, it } from "vitest";
import {
  buildPortalVaultCreateRequest,
  createEmptyPortalVaultForm,
  portalVaultCloudProviders,
  portalVaultItemBadgeTone,
  portalVaultItemDetail,
  portalVaultItemIcon,
} from "../portal-vault-section-state";
import {
  accountVaultItem,
  createdAccountVaultItem,
} from "../../../fixtures/account-access-panel-fixtures";

describe("portal vault section state", () => {
  it("creates the default note form state", () => {
    expect(createEmptyPortalVaultForm()).toEqual({
      kind: "note",
      title: "",
      detail: "",
      externalUrl: "",
    });
  });

  it("keeps the supported provider labels stable", () => {
    expect(portalVaultCloudProviders).toEqual(["Google Drive", "iCloud", "Dropbox", "OneDrive"]);
  });

  it("normalizes a vault create request before submitting", () => {
    expect(
      buildPortalVaultCreateRequest({
        kind: "file",
        title: "  Passport scan  ",
        detail: "  shared doc  ",
        externalUrl: "  https://drive.google.com/file  ",
      }),
    ).toEqual({
      kind: "file",
      title: "Passport scan",
      detail: "shared doc",
      externalUrl: "https://drive.google.com/file",
    });
  });

  it("converts a blank external URL to null", () => {
    expect(
      buildPortalVaultCreateRequest({
        kind: "note",
        title: "Emergency contact",
        detail: "",
        externalUrl: "   ",
      }),
    ).toEqual({
      kind: "note",
      title: "Emergency contact",
      detail: "",
      externalUrl: null,
    });
  });

  it("does not submit a blank title", () => {
    expect(
      buildPortalVaultCreateRequest({
        kind: "note",
        title: "   ",
        detail: "ignored",
        externalUrl: "https://example.com",
      }),
    ).toBeNull();
  });

  it("formats vault item rows with trip or personal ownership context", () => {
    expect(portalVaultItemIcon(accountVaultItem)).toBe("note");
    expect(portalVaultItemBadgeTone(accountVaultItem)).toBe("success");
    expect(portalVaultItemDetail(accountVaultItem, "Personal")).toBe(
      "Seoul Spring · Keep copies ready",
    );

    expect(portalVaultItemIcon(createdAccountVaultItem)).toBe("document");
    expect(portalVaultItemBadgeTone(createdAccountVaultItem)).toBe("neutral");
    expect(portalVaultItemDetail(createdAccountVaultItem, "Personal")).toBe(
      "Personal · PDF link",
    );
  });
});
