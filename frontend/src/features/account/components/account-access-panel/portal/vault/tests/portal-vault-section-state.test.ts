import { describe, expect, it } from "vitest";
import {
  buildPortalVaultItemRows,
  buildPortalVaultCreateRequest,
  createEmptyPortalVaultForm,
  portalVaultCloudProviders,
  portalVaultKindSelectOptions,
  portalVaultKindValues,
  portalVaultItemBadgeTone,
  portalVaultItemDetail,
  portalVaultItemIcon,
} from "../portal-vault-section-state";
import {
  accountVaultItem,
  createdAccountVaultItem,
} from "../../../fixtures/account-access-panel-api-fixtures";

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

  it("keeps vault kind options centralized for the create form", () => {
    expect(portalVaultKindValues).toEqual(["note", "file"]);
    expect(portalVaultKindSelectOptions({
      file: "File",
      note: "Note",
    })).toEqual([
      { value: "note", label: "Note" },
      { value: "file", label: "File" },
    ]);
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

  it("builds vault list rows from centralized icon, detail, and badge rules", () => {
    expect(
      buildPortalVaultItemRows([accountVaultItem, createdAccountVaultItem], {
        personal: "Personal",
      }),
    ).toEqual([
      {
        badgeLabel: "note",
        badgeTone: "success",
        detail: "Seoul Spring · Keep copies ready",
        externalUrl: null,
        icon: "note",
        id: "vault-vault-1",
        title: "Passport note",
      },
      {
        badgeLabel: "file",
        badgeTone: "neutral",
        detail: "Personal · PDF link",
        externalUrl: "https://example.test/tickets.pdf",
        icon: "document",
        id: "vault-vault-created",
        title: "Tickets",
      },
    ]);
  });

  it("includes externalUrl in vault item rows when the vault item has one", () => {
    const rows = buildPortalVaultItemRows(
      [accountVaultItem, createdAccountVaultItem],
      { personal: "Personal" },
    );
    expect(rows[0].externalUrl).toBeNull();
    expect(rows[1].externalUrl).toBe("https://example.test/tickets.pdf");
  });
});
