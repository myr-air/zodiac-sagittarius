import { cn } from "@/src/lib/cn";
import type { PortalSection } from "@/src/shared/portal";
import {
  accountEntryPageClassName,
  accountEntryShellClassName,
  accountPageClassName,
  accountPortalNewTripPageClassName,
  accountPortalNewTripShellClassName,
  accountPortalPageClassName,
  accountPortalShellClassName,
  accountShellClassName,
  accountTripAccessPageClassName,
  accountTripAccessShellClassName,
} from "./account-access-panel-layout";

interface AccountAccessPanelShellClassOptions {
  isAccountEntry: boolean;
  isPortalEntry: boolean;
  isTripAccessEntry: boolean;
  portalSection: PortalSection;
}

export function accountAccessPanelPageClassName({
  isAccountEntry,
  isPortalEntry,
  isTripAccessEntry,
  portalSection,
}: AccountAccessPanelShellClassOptions) {
  return cn(
    accountPageClassName,
    isAccountEntry ? accountEntryPageClassName : "",
    isPortalEntry ? accountPortalPageClassName : "",
    isTripAccessEntry ? accountTripAccessPageClassName : "",
    isPortalEntry && portalSection === "new-trip" ? accountPortalNewTripPageClassName : "",
  );
}

export function accountAccessPanelShellClassName({
  isAccountEntry,
  isPortalEntry,
  isTripAccessEntry,
  portalSection,
}: AccountAccessPanelShellClassOptions) {
  return cn(
    accountShellClassName,
    isAccountEntry ? accountEntryShellClassName : "",
    isPortalEntry ? accountPortalShellClassName : "",
    isPortalEntry && portalSection === "new-trip" ? accountPortalNewTripShellClassName : "",
    isTripAccessEntry ? accountTripAccessShellClassName : "",
  );
}
