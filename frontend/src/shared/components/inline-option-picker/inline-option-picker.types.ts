import type { Dispatch, RefObject, SetStateAction } from "react";
import type { IconName } from "@/src/ui/icons";

export interface InlineOptionPickerOption {
  icon?: IconName;
  label: string;
  value: string;
}

export type InlineOptionPickerCommitResult = void | Promise<void>;

export interface InlineOptionPickerProps {
  ariaLabel: string;
  buttonClassName?: string;
  disabled?: boolean;
  onCommit: (value: string) => InlineOptionPickerCommitResult;
  onCommitSubOption?: (
    value: string,
    subValue: string,
  ) => InlineOptionPickerCommitResult;
  optionKeyPrefix?: string;
  options: InlineOptionPickerOption[];
  selectedSubValue?: string;
  subOptionsByValue?: Record<string, InlineOptionPickerOption[]>;
  value: string;
}

export interface InlineOptionPickerMenuProps {
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
