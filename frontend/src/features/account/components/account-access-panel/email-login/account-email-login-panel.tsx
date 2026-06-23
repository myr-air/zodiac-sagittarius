"use client";

import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import type { AuthFlow } from "../auth";
import { EmailLoginPanelForm } from "./account-email-login-panel-form";
import { useEmailLoginPanelState } from "./state/use-email-login-panel-state";

interface EmailLoginPanelProps {
  accountClient: AccountApiClient;
  authCardClassName: string;
  flow: AuthFlow;
  formError?: string | null;
  onError: (message: string | null) => void;
  onFlowChange?: (flow: AuthFlow) => void;
  onLoggedIn: (session: AccountSession) => void;
  showRouteTabs?: boolean;
}

export function EmailLoginPanel({
  flow,
  accountClient,
  authCardClassName,
  formError,
  onError,
  onFlowChange,
  onLoggedIn,
  showRouteTabs = false,
}: EmailLoginPanelProps) {
  const state = useEmailLoginPanelState({
    accountClient,
    activeFlow: flow,
    onError,
    onFlowChange,
    onLoggedIn,
  });

  return (
    <EmailLoginPanelForm
      authCardClassName={authCardClassName}
      formError={formError}
      showRouteTabs={showRouteTabs}
      state={state}
    />
  );
}
