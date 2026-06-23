import { describe, expect, it } from "vitest";
import { messages } from "@/src/i18n/messages";
import { ACCOUNT_PROFILE_DEFAULT_AVATAR_COLOR } from "../../../model/account-profile-defaults";
import {
  accountSettings,
  accountStats,
} from "../../../fixtures/account-access-panel-base-fixtures";
import { createTrustedAccountSession } from "../../../fixtures/account-access-panel-api-fixtures";
import {
  buildAccountPortalDashboardProfile,
  buildAccountPortalDashboardSessionBadge,
  buildAccountPortalDashboardStatRows,
} from "../account-portal-dashboard-section.model";

const labels = messages.en.access.dashboard;

describe("account portal dashboard section model", () => {
  it("builds profile display data from loaded account settings", () => {
    expect(buildAccountPortalDashboardProfile(accountSettings, labels)).toEqual({
      avatarColor: ACCOUNT_PROFILE_DEFAULT_AVATAR_COLOR,
      avatarInitial: "A",
      displayName: "Aom",
      email: "aom@example.test",
    });
  });

  it("falls back to default profile display data before settings load", () => {
    expect(buildAccountPortalDashboardProfile(null, labels)).toEqual({
      avatarColor: ACCOUNT_PROFILE_DEFAULT_AVATAR_COLOR,
      avatarInitial: "A",
      displayName: "Account",
      email: "No email loaded",
    });
  });

  it("maps account session kind to dashboard badge labels and tones", () => {
    expect(
      buildAccountPortalDashboardSessionBadge(
        createTrustedAccountSession({ kind: "trusted" }),
        labels,
      ),
    ).toEqual({
      label: "Trusted PC",
      tone: "success",
    });

    expect(
      buildAccountPortalDashboardSessionBadge(
        createTrustedAccountSession({ kind: "temporary" }),
        labels,
      ),
    ).toEqual({
      label: "Temporary account session",
      tone: "warning",
    });
  });

  it("builds ordered dashboard stat rows with zero fallbacks", () => {
    expect(buildAccountPortalDashboardStatRows(accountStats, labels)).toEqual([
      { label: "Trips", value: 2 },
      { label: "Owned", value: 1 },
      { label: "Active", value: 1 },
      { label: "Claims", value: 0 },
    ]);

    expect(buildAccountPortalDashboardStatRows(null, labels)).toEqual([
      { label: "Trips", value: 0 },
      { label: "Owned", value: 0 },
      { label: "Active", value: 0 },
      { label: "Claims", value: 0 },
    ]);
  });
});
