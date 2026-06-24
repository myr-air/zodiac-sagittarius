import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import type { AuthFlow } from "../../auth";

export interface UseEmailLoginPanelStateProps {
  accountClient: AccountApiClient;
  activeFlow: AuthFlow;
  onError: (message: string | null) => void;
  onFlowChange?: (flow: AuthFlow) => void;
  onLoggedIn: (session: AccountSession) => void;
}
