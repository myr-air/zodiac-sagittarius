import { describe, expect, it } from "vitest";
import type { AccountVaultItemSummary } from "@/src/account/api-client";
import { prependPortalVaultItem } from "../account-access-panel-portal-content";

const existingItem = {
  createdAt: "2026-06-01T00:00:00.000Z",
  detail: "Existing item",
  externalUrl: null,
  id: "vault-existing",
  kind: "note",
  source: "vault",
  title: "Existing",
  tripId: null,
  tripName: null,
} satisfies AccountVaultItemSummary;

const createdItem = {
  ...existingItem,
  detail: "Created item",
  id: "vault-created",
  title: "Created",
} satisfies AccountVaultItemSummary;

describe("account access panel portal content", () => {
  it("prepends a newly created vault item without mutating current items", () => {
    const currentItems = [existingItem];

    const nextItems = prependPortalVaultItem(currentItems, createdItem);

    expect(nextItems).toEqual([createdItem, existingItem]);
    expect(currentItems).toEqual([existingItem]);
  });
});
