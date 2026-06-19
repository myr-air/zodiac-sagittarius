import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceApiClients } from "./use-workspace-api-clients";
import type { TripApiClient } from "@/src/trip/api-client";

const originalApiBaseUrl = process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL;

afterEach(() => {
  if (originalApiBaseUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL;
    return;
  }
  process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL = originalApiBaseUrl;
});

describe("useWorkspaceApiClients", () => {
  it("uses an injected trip API client before configured clients", () => {
    process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL = "https://api.example.test";
    const apiClient = { loadTrip: vi.fn() } as unknown as TripApiClient;

    const { result } = renderHook(() =>
      useWorkspaceApiClients({ apiClient, dataSource: "api" }),
    );

    expect(result.current.resolvedApiClient).toBe(apiClient);
    expect(result.current.apiBaseUrl).toBe("https://api.example.test");
    expect(result.current.accountClient).toBeTruthy();
  });

  it("does not create a trip API client for local mode without injection", () => {
    const { result } = renderHook(() =>
      useWorkspaceApiClients({ dataSource: "local" }),
    );

    expect(result.current.resolvedApiClient).toBeUndefined();
    expect(result.current.accountClient).toBeTruthy();
  });

  it("creates a configured trip API client for API mode", () => {
    const { result } = renderHook(() =>
      useWorkspaceApiClients({ dataSource: "api" }),
    );

    expect(result.current.resolvedApiClient).toBeTruthy();
    expect(result.current.accountClient).toBeTruthy();
  });
});
