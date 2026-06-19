import { type ReactElement, useEffect, useRef, useState } from "react";
import { useDismissOnOutside } from "@/src/shared/hooks/use-dismiss-on-outside";
import { Icon, type IconName } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";
import { InlineOptionPickerMenu } from "./inline-option-picker-menu";

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
      {open ? (
        <InlineOptionPickerMenu
          activeIndex={activeIndex}
          activeOption={activeOption}
          activeSubOptions={activeSubOptions}
          ariaLabel={ariaLabel}
          buttonRef={buttonRef}
          commitOption={commitOption}
          commitSubOption={commitSubOption}
          menuRef={menuRef}
          optionKeyPrefix={optionKeyPrefix}
          options={options}
          position={position}
          selectedSubValue={selectedSubValue}
          setActiveIndex={setActiveIndex}
          setOpen={setOpen}
          sideMenuRef={sideMenuRef}
          subOptionsByValue={subOptionsByValue}
          value={value}
        />
      ) : null}
    </>
  );
}
