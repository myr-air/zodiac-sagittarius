import { type ReactElement } from "react";
import { Icon } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";
import { InlineOptionPickerMenu } from "./InlineOptionPickerMenu";
import { useInlineOptionPickerState } from "./use-inline-option-picker-state";
import type { InlineOptionPickerProps } from "./inline-option-picker.types";

const inlineFieldClassName =
  "inline-row-field min-h-[24px] w-full min-w-0 rounded-(--radius-sm) border border-transparent bg-transparent px-1.5 py-0 text-xs leading-4 text-(--color-text) outline-none transition-[background,border-color,box-shadow] duration-150 placeholder:text-(--color-text-subtle) hover:not-read-only:border-(--color-border) hover:not-read-only:bg-(--color-surface) focus:border-(--color-route-border) focus:bg-(--color-surface) focus:shadow-[0_0_0_2px_rgb(191_219_254_/_0.55)] read-only:cursor-pointer read-only:truncate read-only:px-0 read-only:font-semibold disabled:cursor-not-allowed disabled:text-(--color-text-muted)";
const inlineOptionPickerButtonClassName = cn(
  inlineFieldClassName,
  "inline-option-picker-button inline-flex !min-h-8 items-center justify-between gap-2 text-left font-semibold",
);
const inlineOptionPickerCaretClassName = "shrink-0 text-(--color-text-subtle)";

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
  const {
    activeIndex,
    activeOption,
    activeSubOptions,
    buttonRef,
    commitOption,
    commitSubOption,
    menuRef,
    open,
    openMenu,
    position,
    selectedOption,
    setActiveIndex,
    setOpen,
    sideMenuRef,
  } = useInlineOptionPickerState({
    disabled,
    onCommit,
    onCommitSubOption,
    options,
    subOptionsByValue,
    value,
  });

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
