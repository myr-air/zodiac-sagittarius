import { useMemo } from "react";
import {
  createConfiguredAccountApiClient,
  createConfiguredTripApiClient,
  publicSagittariusApiBaseUrl,
} from "@/src/api/sagittarius-api-clients";
import type { AccountApiClient } from "@/src/account/api-client";
import type { TripApiClient } from "@/src/trip/api-client";

interface UseWorkspaceApiClientsOptions {
  apiClient?: TripApiClient;
  dataSource: "api" | "local";
}

interface WorkspaceApiClients {
  accountClient: AccountApiClient;
  apiBaseUrl: string;
  resolvedApiClient: TripApiClient | undefined;
}

export function useWorkspaceApiClients({
  apiClient,
  dataSource,
}: UseWorkspaceApiClientsOptions): WorkspaceApiClients {
  const resolvedApiClient = useMemo(
    () =>
      apiClient ??
      (dataSource === "api"
        ? createConfiguredTripApiClient()
        : undefined),
    [apiClient, dataSource],
  );
  const accountClient = useMemo(
    () => createConfiguredAccountApiClient(),
    [],
  );
  const apiBaseUrl = useMemo(() => publicSagittariusApiBaseUrl(), []);

  return {
    accountClient,
    apiBaseUrl,
    resolvedApiClient,
  };
}
