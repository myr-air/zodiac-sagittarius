import { useCallback, useEffect, useState } from "react";
import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import {
  loadPersistedAccountSession,
  persistAccountSession,
} from "@/src/account/session-storage";

export function useWorkspaceAccountSession(accountClient: AccountApiClient) {
  const [accountSession, setAccountSession] = useState<AccountSession | null>(
    null,
  );
  const [accountSessionLoaded, setAccountSessionLoaded] = useState(false);

  useEffect(() => {
    if (accountSessionLoaded) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      const legacySession = loadPersistedAccountSession();
      if (legacySession) {
        setAccountSession(legacySession);
        setAccountSessionLoaded(true);
        return;
      }
      accountClient.restoreSession()
        .then((session) => {
          if (cancelled) return;
          setAccountSession(session);
        })
        .catch(() => undefined)
        .finally(() => {
          if (cancelled) return;
          setAccountSessionLoaded(true);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [accountClient, accountSessionLoaded]);

  useEffect(() => {
    if (!accountSessionLoaded) return;
    persistAccountSession();
  }, [accountSessionLoaded]);

  const changeAccountSession = useCallback((session: AccountSession | null) => {
    setAccountSession(session);
    persistAccountSession();
  }, []);

  return {
    accountSession,
    accountSessionLoaded,
    changeAccountSession,
  };
}
