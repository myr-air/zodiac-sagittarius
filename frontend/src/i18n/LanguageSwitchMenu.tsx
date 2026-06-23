import type { CSSProperties, RefObject } from "react";
import { cn } from "@/src/lib/cn";
import { majorCurrencyOptions, type MajorCurrencyCode } from "@/src/trip/currencies";
import { Icon } from "@/src/ui/icons";
import type { Messages } from "./messages";
import type { Locale } from "./types";
import {
  activeCurrencyIconClassName,
  activeOptionClassName,
  checkClassName,
  menuClassName,
  menuHeaderClassName,
  menuSummaryClassName,
  menuTitleClassName,
  optionClassName,
  optionDetailClassName,
  optionGridClassName,
  optionMetaClassName,
  sectionClassName,
  sectionLabelClassName,
} from "./language-switch.styles";
import { languageOptions } from "./language-switch-options";

interface LanguageSwitchMenuProps {
  activeLanguage: { label: string };
  currency: MajorCurrencyCode;
  locale: Locale;
  menuId: string;
  menuRef: RefObject<HTMLDivElement | null>;
  menuStyle: CSSProperties;
  onChooseCurrency: (currency: MajorCurrencyCode) => void;
  onChooseLanguage: (locale: Locale) => void;
  t: Messages;
}

export function LanguageSwitchMenu({
  activeLanguage,
  currency,
  locale,
  menuId,
  menuRef,
  menuStyle,
  onChooseCurrency,
  onChooseLanguage,
  t,
}: LanguageSwitchMenuProps) {
  return (
    <div ref={menuRef} id={menuId} className={cn(menuClassName)} role="menu" aria-label={t.common.language.currencyLabel} style={menuStyle}>
      <div className={menuHeaderClassName}>
        <strong className={menuTitleClassName}>{t.common.language.currencyLabel}</strong>
        <span className={menuSummaryClassName}>{activeLanguage.label} · {currency}</span>
      </div>

      <section className={cn(sectionClassName)} aria-labelledby={`${menuId}-language`}>
        <strong id={`${menuId}-language`} className={sectionLabelClassName}>{t.common.language.label}</strong>
        <div className={optionGridClassName}>
          {languageOptions.map((option) => {
            const isActive = option.locale === locale;
            return (
              <button
                type="button"
                key={option.locale}
                className={cn(optionClassName, isActive ? activeOptionClassName : "")}
                role="menuitemradio"
                aria-checked={isActive}
                aria-label={option.label}
                onClick={() => onChooseLanguage(option.locale)}
              >
                <span className="min-w-0">
                  <span className="block truncate">{option.shortLabel}</span>
                  <span className={optionDetailClassName}>{option.label}</span>
                </span>
                <Icon name="check" className={checkClassName} data-active={isActive ? "true" : "false"} />
              </button>
            );
          })}
        </div>
      </section>

      <section className={cn(sectionClassName)} aria-labelledby={`${menuId}-currency`}>
        <strong id={`${menuId}-currency`} className={sectionLabelClassName}>{t.common.currency.label}</strong>
        <div className={optionGridClassName}>
          {majorCurrencyOptions.map((option) => {
            const isActive = option.code === currency;
            return (
              <button
                type="button"
                key={option.code}
                className={cn(optionClassName, isActive ? activeOptionClassName : "")}
                role="menuitemradio"
                aria-checked={isActive}
                aria-label={option.code}
                onClick={() => onChooseCurrency(option.code)}
              >
                <span className="min-w-0">
                  <span className="block truncate">{option.code}</span>
                  <span className={optionDetailClassName}>{option.label}</span>
                </span>
                {isActive ? (
                  <span className={activeCurrencyIconClassName}>
                    <Icon name="check" />
                  </span>
                ) : (
                  <span className={optionMetaClassName}>{option.symbol}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
