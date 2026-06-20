import { useCallback, useEffect, useState } from "react";
import type { AccountSession } from "@/src/account/api-client";
import {
  loadPersistedAccountSession,
  persistAccountSession,
} from "@/src/account/session-storage";

export function useWorkspaceAccountSession() {
  const [accountSession, setAccountSession] = useState<AccountSession | null>(
    null,
  );
  const [accountSessionLoaded, setAccountSessionLoaded] = useState(false);

  useEffect(() => {
    if (accountSessionLoaded) return;
    const timeout = window.setTimeout(() => {
      setAccountSession(loadPersistedAccountSession());
      setAccountSessionLoaded(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [accountSessionLoaded]);

  useEffect(() => {
    if (!accountSessionLoaded) return;
    persistAccountSession(accountSession);
  }, [accountSession, accountSessionLoaded]);

  const changeAccountSession = useCallback((session: AccountSession | null) => {
    setAccountSession(session);
    persistAccountSession(session);
  }, []);

  return {
    accountSession,
    accountSessionLoaded,
    changeAccountSession,
  };
}
