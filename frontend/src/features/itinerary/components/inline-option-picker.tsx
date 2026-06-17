import { createPortal } from "react-dom";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useDismissOnOutside } from "@/src/shared/hooks/use-dismiss-on-outside";
import { Icon, type IconName } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";

export interface InlineOptionPickerOption {
  icon?: IconName;
  label: string;
  value: string;
}

const inlineFieldClassName =
  "inline-row-field min-h-[24px] w-full min-w-0 rounded-(--radius-sm) border border-transparent bg-transparent px-1.5 py-0 text-xs leading-4 text-(--color-text) outline-none transition-[background,border-color,box-shadow] duration-150 placeholder:text-(--color-text-subtle) hover:not-read-only:border-(--color-border) hover:not-read-only:bg-(--color-surface) focus:border-(--color-route-border) focus:bg-(--color-surface) focus:shadow-[0_0_0_2px_rgb(191_219_254_/_0.55)] read-only:cursor-pointer read-only:truncate read-only:px-0 read-only:font-semibold disabled:cursor-not-allowed disabled:text-(--color-text-muted)";
const inlineOptionPickerButtonClassName = cn(
  inlineFieldClassName,
  "inline-option-picker-button inline-flex !min-h-8 items-center justify-between gap-2 text-left font-semibold",
);
const inlineOptionPickerCaretClassName = "shrink-0 text-(--color-text-subtle)";
const floatingOptionMenuClassName =
  "inline-option-picker-menu fixed z-[15] grid max-h-[min(260px,calc(100vh_-_24px))] overflow-auto rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-1 shadow-[0_10px_22px_rgb(15_23_42_/_0.12)]";
const floatingOptionButtonClassName =
  "grid min-h-8 w-full min-w-0 cursor-pointer grid-cols-[minmax(0,1fr)_16px] items-center gap-2 rounded-(--radius-sm) px-2.5 py-1.5 text-left text-xs font-bold text-(--color-text) transition-colors hover:bg-(--color-route-soft) focus-visible:bg-(--color-route-soft) focus-visible:outline-none aria-selected:bg-(--color-route-soft) aria-selected:text-(--color-route) data-[active=true]:bg-(--color-route-soft)";

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

interface InlineOptionPickerProps {
  ariaLabel: string;
  buttonClassName?: string;
  disabled?: boolean;
  onCommit: (value: string) => void | Promise<void>;
  onCommitSubOption?: (value: string, subValue: string) => void | Promise<void>;
  optionKeyPrefix?: string;
  options: InlineOptionPickerOption[];
  selectedSubValue?: string;
  subOptionsByValue?: Record<string, InlineOptionPickerOption[]>;
  value: string;
}

export function InlineOptionPicker({
  ariaLabel,
  buttonClassName,
  disabled,
  onCommit,
  onCommitSubOption,
  optionKeyPrefix = "option",
  options,
  selectedSubValue,
  subOptionsByValue,
  value,
}: InlineOptionPickerProps): ReactElement {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sideMenuRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
  }>({ left: 0, top: 0, width: 180 });
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const activeOption = options[activeIndex] ?? selectedOption;
  const activeSubOptions = activeOption ? subOptionsByValue?.[activeOption.value] ?? [] : [];
  const hasSideMenu = open && activeSubOptions.length > 0 && Boolean(onCommitSubOption);
  const sideMenuWidth = Math.max(position.width, 180);
  const sideMenuTop = Math.min(
    Math.max(8, position.top + activeIndex * 34),
    Math.max(8, typeof window === "undefined" ? position.top : window.innerHeight - Math.min(260, activeSubOptions.length * 34 + 8) - 8),
  );
  const sideMenuLeft =
    typeof window === "undefined"
      ? position.left + position.width + 6
      : sideMenuFloatingLeft(position.left, position.width, sideMenuWidth, window.innerWidth);

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuHeight = Math.min(260, options.length * 34 + 8);
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const top =
        spaceBelow >= menuHeight
          ? rect.bottom + 6
          : Math.max(8, rect.top - menuHeight - 6);
      setPosition({
        left: Math.min(
          Math.max(8, rect.left),
          Math.max(8, window.innerWidth - Math.max(rect.width, 180) - 8),
        ),
        top,
        width: Math.max(rect.width, 180),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, options.length]);

  useDismissOnOutside({
    enabled: open,
    onDismiss: () => setOpen(false),
    triggerRefs: [buttonRef, menuRef, sideMenuRef],
  });

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => menuRef.current?.focus());
  }, [open]);

  function openMenu() {
    if (disabled) return;
    setActiveIndex(selectedIndex);
    setOpen(true);
  }

  function commitOption(option: InlineOptionPickerOption) {
    if (option.value !== value) void onCommit(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function commitSubOption(parentOption: InlineOptionPickerOption, option: InlineOptionPickerOption) {
    void onCommitSubOption?.(parentOption.value, option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cn(inlineOptionPickerButtonClassName, buttonClassName)}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          if (open) {
            setOpen(false);
          } else {
            openMenu();
          }
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu();
          }
          if (event.key === "Escape") setOpen(false);
        }}
      >
        {selectedOption?.icon ? <Icon name={selectedOption.icon} className="size-3.5" /> : null}
        <span className="inline-option-picker-label min-w-0 truncate">
          {selectedOption?.label ?? "—"}
        </span>
        <span className={cn(inlineOptionPickerCaretClassName, "inline-option-picker-caret")} aria-hidden="true">
          ⌄
        </span>
      </button>
      {open ? createPortal(
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
      ) : null}
    </>
  );
}
