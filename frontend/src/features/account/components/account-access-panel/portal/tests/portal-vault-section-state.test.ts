import { describe, expect, it } from "vitest";
import {
  buildPortalVaultCreateRequest,
  createEmptyPortalVaultForm,
  portalVaultCloudProviders,
} from "../portal-vault-section-state";

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
});
