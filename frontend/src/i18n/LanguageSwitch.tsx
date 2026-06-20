"use client";

import type { HTMLAttributes } from "react";
import { Icon } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";
import { useI18n } from "./I18nProvider";
import {
  currencyStorageKey,
  rootClassName,
  triggerClassName,
} from "./language-switch.support";
import { LanguageSwitchMenu } from "./LanguageSwitchMenu";
import { useLanguageSwitchState } from "./use-language-switch-state";

export { currencyStorageKey };

export function LanguageSwitch({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { locale, setLocale, t } = useI18n();
  const {
    activeLanguage,
    chooseCurrency,
    chooseLanguage,
    currency,
    menuId,
    menuRef,
    menuStyle,
    open,
    rootRef,
    setOpen,
    triggerRef,
  } = useLanguageSwitchState({ locale, setLocale });

  return (
    <div ref={rootRef} className={cn(rootClassName, className)} {...props}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(triggerClassName)}
        data-open={open ? "true" : "false"}
        aria-label={t.common.language.currencyLabel}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="wallet" className="text-(--color-primary-strong)" />
        <span className="truncate">{activeLanguage.shortLabel} / {currency}</span>
        <Icon name="chevronRight" className={cn("text-(--color-text-muted) transition-transform duration-150", open ? "-rotate-90" : "rotate-90")} />
      </button>

      {open ? (
        <LanguageSwitchMenu
          activeLanguage={activeLanguage}
          currency={currency}
          locale={locale}
          menuId={menuId}
          menuRef={menuRef}
          menuStyle={menuStyle}
          onChooseCurrency={chooseCurrency}
          onChooseLanguage={chooseLanguage}
          t={t}
        />
      ) : null}
    </div>
  );
}
