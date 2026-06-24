import type { AccountApiClient } from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import { EmailLoginPanel } from "../email-login/account-email-login-panel";
import { accountAuthCardClassName } from "../layout/account-access-panel-layout";
import type { AuthFlow } from "../auth";
import type { UseAccountAccessPanelState } from "../state/use-account-access-panel-state";

interface AccountEmailLoginPanelContentProps {
  accountClient: AccountApiClient;
  entryFlow: AuthFlow;
  formError: string | null;
  messages: Messages["access"];
  showRouteTabs: boolean;
  state: UseAccountAccessPanelState;
}

export function AccountEmailLoginPanelContent({
  accountClient,
  entryFlow,
  formError,
  messages,
  showRouteTabs,
  state,
}: AccountEmailLoginPanelContentProps) {
  return (
    <EmailLoginPanel
      flow={entryFlow}
      accountClient={accountClient}
      authCardClassName={accountAuthCardClassName}
      formError={formError}
      showRouteTabs={showRouteTabs}
      onFlowChange={state.setEntryFlowOverride}
      onLoggedIn={(session) => state.handleLoggedIn(session, messages.messages)}
      onError={state.setError}
    />
  );
}
