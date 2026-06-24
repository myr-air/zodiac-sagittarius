import { useEffect, useRef, useState } from "react";
import { useDismissOnOutside } from "@/src/shared/hooks/use-dismiss-on-outside";
import { inlineOptionPickerMenuPosition } from "./model/inline-option-picker-position";
import type {
  InlineOptionPickerOption,
  InlineOptionPickerProps,
} from "./inline-option-picker.types";

type UseInlineOptionPickerStateInput = Pick<
  InlineOptionPickerProps,
  "disabled" | "onCommit" | "onCommitSubOption" | "options" | "subOptionsByValue" | "value"
>;

export function useInlineOptionPickerState({
  disabled,
  onCommit,
  onCommitSubOption,
  options,
  subOptionsByValue,
  value,
}: UseInlineOptionPickerStateInput) {
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
      setPosition(
        inlineOptionPickerMenuPosition({
          anchorRect: rect,
          optionCount: options.length,
          viewport: {
            height: window.innerHeight,
            width: window.innerWidth,
          },
        }),
      );
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

  return {
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
  };
}
