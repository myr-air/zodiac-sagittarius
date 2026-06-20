import { describe, expect, it, vi } from "vitest";
import { createAccountApiClient } from "./api-client";
import {
  accountExplorer,
  accountTodo,
  accountTrip,
  accountVaultItem,
  jsonResponse,
} from "./api-client.test-support";

describe("Account API client portal routes", () => {
  it("loads trip history and stats with bearer auth", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([accountTrip]))
      .mockResolvedValueOnce(jsonResponse({ tripsTotal: 1, tripsOwned: 1, activeTrips: 1, tempClaimsCompleted: 0 }));
    const client = createAccountApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.listTrips("account-session")).resolves.toEqual([accountTrip]);
    await expect(client.loadStats("account-session")).resolves.toMatchObject({ tripsOwned: 1 });

    for (const call of fetchImpl.mock.calls) {
      expect(call[1]?.headers).toMatchObject({ Authorization: "Bearer account-session" });
    }
  });

  it("loads split portal explorer, to-dos, and vault APIs with bearer auth", async () => {
    const vaultRequest = {
      kind: "file",
      title: "Tickets",
      detail: "PDF copy",
      externalUrl: "https://example.test/tickets.pdf",
    } as const;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(accountExplorer))
      .mockResolvedValueOnce(jsonResponse([accountTodo]))
      .mockResolvedValueOnce(jsonResponse([accountVaultItem]))
      .mockResolvedValueOnce(jsonResponse(accountVaultItem, 201));
    const client = createAccountApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.loadExplorer("account-session")).resolves.toEqual(accountExplorer);
    await expect(client.listToDos("account-session")).resolves.toEqual([accountTodo]);
    await expect(client.listVault("account-session")).resolves.toEqual([accountVaultItem]);
    await expect(client.createVaultItem("account-session", vaultRequest)).resolves.toEqual(accountVaultItem);

    expect(fetchImpl.mock.calls.map((call) => call[0])).toEqual([
      "https://api.example.test/api/v1/account/explorer",
      "https://api.example.test/api/v1/account/to-dos",
      "https://api.example.test/api/v1/account/vault",
      "https://api.example.test/api/v1/account/vault",
    ]);
    expect(fetchImpl.mock.calls[3][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify(vaultRequest),
    });
  });
});
