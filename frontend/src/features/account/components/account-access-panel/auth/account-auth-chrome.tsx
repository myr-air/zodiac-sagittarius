"use client";

import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import {
  accessLanguageSwitchClassName,
  accountEntryLanguageSwitchClassName,
} from "../account-panel-shared-styles";

export type AuthFlow = "login" | "register";

const accountEntryTabsClassName = "account-entry-tabs grid grid-cols-2 gap-0 border-b border-(--color-border) px-[34px] pb-3.5 max-[520px]:px-0";
const accountEntryTabClassName =
  "account-entry-tab grid min-h-[42px] cursor-pointer place-items-center border-0 border-b-[3px] border-solid bg-transparent text-[15px] font-[850] no-underline transition-[border-color,color] duration-[180ms] ease-out";
const accountEntryTabActiveClassName = "account-entry-tab--active border-(--color-primary) text-(--color-primary-strong)";
const accountEntryTabInactiveClassName = "border-transparent text-(--color-text-muted)";
const accountFlowSwitchClassName =
  "account-flow-switch m-0 text-center text-[13px] font-[750] text-(--color-text-muted) [&_a]:cursor-pointer [&_a]:border-0 [&_a]:bg-transparent [&_a]:p-0 [&_a]:font-[inherit] [&_a]:font-[850] [&_a]:text-(--color-primary-strong) [&_a]:no-underline [&_a:focus-visible]:underline [&_a:hover]:underline [&_button]:cursor-pointer [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:font-[inherit] [&_button]:font-[850] [&_button]:text-(--color-primary-strong) [&_button]:no-underline [&_button:focus-visible]:underline [&_button:hover]:underline";

export function AccountAuthRouteTabs({
  activeFlow,
  onFlowChange,
}: {
  activeFlow: AuthFlow;
  onFlowChange: (flow: AuthFlow) => void;
}) {
  const { t } = useI18n();

  return (
    <>
      <LanguageSwitch className={cn(accessLanguageSwitchClassName, accountEntryLanguageSwitchClassName)} />
      <nav className={accountEntryTabsClassName} aria-label={t.access.mainLabels.combined}>
        <button
          type="button"
          className={cn(accountEntryTabClassName, activeFlow === "login" ? accountEntryTabActiveClassName : accountEntryTabInactiveClassName)}
          aria-current={activeFlow === "login" ? "page" : undefined}
          onClick={() => onFlowChange("login")}
        >
          {t.access.titles.accountLogin}
        </button>
        <button
          type="button"
          className={cn(accountEntryTabClassName, activeFlow === "register" ? accountEntryTabActiveClassName : accountEntryTabInactiveClassName)}
          aria-current={activeFlow === "register" ? "page" : undefined}
          onClick={() => onFlowChange("register")}
        >
          {t.access.titles.accountRegister}
        </button>
      </nav>
    </>
  );
}

export function AccountAuthFlowSwitch({
  activeFlow,
  onFlowChange,
}: {
  activeFlow: AuthFlow;
  onFlowChange: (flow: AuthFlow) => void;
}) {
  const { t } = useI18n();

  return (
    <p className={accountFlowSwitchClassName}>
      {activeFlow === "register" ? (
        <>
          {t.access.emailLogin.hasAccount} <button type="button" onClick={() => onFlowChange("login")}>{t.access.emailLogin.signInLink}</button>
        </>
      ) : (
        <>
          {t.access.emailLogin.noAccount} <button type="button" onClick={() => onFlowChange("register")}>{t.access.emailLogin.registerLink}</button>
        </>
      )}
    </p>
  );
}
