import { type Dispatch, type RefObject, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { InlineOptionPickerOption } from "./inline-option-picker";

const floatingOptionMenuClassName =
  "inline-option-picker-menu fixed z-[15] grid max-h-[min(260px,calc(100vh_-_24px))] overflow-auto rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-1 shadow-[0_10px_22px_rgb(15_23_42_/_0.12)]";
const floatingOptionButtonClassName =
  "grid min-h-8 w-full min-w-0 cursor-pointer grid-cols-[minmax(0,1fr)_16px] items-center gap-2 rounded-(--radius-sm) px-2.5 py-1.5 text-left text-xs font-bold text-(--color-text) transition-colors hover:bg-(--color-route-soft) focus-visible:bg-(--color-route-soft) focus-visible:outline-none aria-selected:bg-(--color-route-soft) aria-selected:text-(--color-route) data-[active=true]:bg-(--color-route-soft)";

interface InlineOptionPickerMenuProps {
  activeIndex: number;
  activeOption: InlineOptionPickerOption | undefined;
  activeSubOptions: InlineOptionPickerOption[];
  ariaLabel: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
  commitOption: (option: InlineOptionPickerOption) => void;
  commitSubOption: (
    parentOption: InlineOptionPickerOption,
    option: InlineOptionPickerOption,
  ) => void;
  menuRef: RefObject<HTMLDivElement | null>;
  optionKeyPrefix: string;
  options: InlineOptionPickerOption[];
  position: { left: number; top: number; width: number };
  selectedSubValue?: string;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  sideMenuRef: RefObject<HTMLDivElement | null>;
  subOptionsByValue?: Record<string, InlineOptionPickerOption[]>;
  value: string;
}

export function InlineOptionPickerMenu({
  activeIndex,
  activeOption,
  activeSubOptions,
  ariaLabel,
  buttonRef,
  commitOption,
  commitSubOption,
  menuRef,
  optionKeyPrefix,
  options,
  position,
  selectedSubValue,
  setActiveIndex,
  setOpen,
  sideMenuRef,
  subOptionsByValue,
  value,
}: InlineOptionPickerMenuProps) {
  const hasSideMenu =
    activeSubOptions.length > 0 && Boolean(commitSubOption) && Boolean(activeOption);
  const sideMenuWidth = Math.max(position.width, 180);
  const sideMenuTop = Math.min(
    Math.max(8, position.top + activeIndex * 34),
    Math.max(
      8,
      typeof window === "undefined"
        ? position.top
        : window.innerHeight -
            Math.min(260, activeSubOptions.length * 34 + 8) -
            8,
    ),
  );
  const sideMenuLeft =
    typeof window === "undefined"
      ? position.left + position.width + 6
      : sideMenuFloatingLeft(
          position.left,
          position.width,
          sideMenuWidth,
          window.innerWidth,
        );

  return createPortal(
    <>
      <div
        ref={menuRef}
        className={floatingOptionMenuClassName}
        role="listbox"
        aria-label={ariaLabel}
        aria-activedescendant={`${optionKeyPrefix}-${options[activeIndex]?.value ?? value}`}
        style={{ left: position.left, top: position.top, width: position.width }}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            buttonRef.current?.focus();
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => Math.min(options.length - 1, current + 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => Math.max(0, current - 1));
          }
          if (event.key === "ArrowRight" && activeSubOptions.length > 0 && activeOption) {
            event.preventDefault();
            commitSubOption(activeOption, activeSubOptions[0]);
          }
          if (event.key === "Enter") {
            event.preventDefault();
            const option = options[activeIndex];
            if (option) commitOption(option);
          }
        }}
      >
        {options.map((option, index) => (
          <div
            className={floatingOptionButtonClassName}
            role="option"
            aria-selected={option.value === value}
            data-active={index === activeIndex ? "true" : undefined}
            id={`${optionKeyPrefix}-${option.value}`}
            tabIndex={-1}
            key={`${optionKeyPrefix}-${option.value}`}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={(event) => {
              event.stopPropagation();
              commitOption(option);
            }}
          >
            <span className="flex min-w-0 items-center gap-2">
              {option.icon ? <Icon name={option.icon} className="size-3.5" /> : null}
              <span className="min-w-0 truncate">{option.label}</span>
            </span>
            <span aria-hidden="true">
              {subOptionsByValue?.[option.value]?.length
                ? "›"
                : option.value === value
                  ? "✓"
                  : ""}
            </span>
          </div>
        ))}
      </div>
      {hasSideMenu && activeOption ? (
        <div
          ref={sideMenuRef}
          className={cn(floatingOptionMenuClassName, "w-[180px]")}
          role="listbox"
          aria-label={`${activeOption.label} options`}
          style={{ left: sideMenuLeft, top: sideMenuTop, width: sideMenuWidth }}
        >
          {activeSubOptions.map((option) => (
            <button
              type="button"
              className={floatingOptionButtonClassName}
              data-active={option.value === selectedSubValue ? "true" : undefined}
              key={`${optionKeyPrefix}-${activeOption.value}-${option.value}`}
              onClick={(event) => {
                event.stopPropagation();
                commitSubOption(activeOption, option);
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                {option.icon ? <Icon name={option.icon} className="size-3.5" /> : null}
                <span className="min-w-0 truncate">{option.label}</span>
              </span>
              <span aria-hidden="true">{option.value === selectedSubValue ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      ) : null}
    </>,
    document.body,
  );
}

function sideMenuFloatingLeft(
  menuLeft: number,
  menuWidth: number,
  sideMenuWidth: number,
  viewportWidth: number,
): number {
  const margin = 8;
  const gap = 6;
  const right = menuLeft + menuWidth + gap;
  if (right + sideMenuWidth <= viewportWidth - margin) return right;
  const left = menuLeft - sideMenuWidth - gap;
  if (left >= margin) return left;
  return Math.max(margin, viewportWidth - sideMenuWidth - margin);
}
