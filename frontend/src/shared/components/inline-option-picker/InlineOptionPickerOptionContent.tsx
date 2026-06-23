import { Icon } from "@/src/ui/icons";
import type { InlineOptionPickerOption } from "./inline-option-picker.types";

interface InlineOptionPickerOptionContentProps {
  option: InlineOptionPickerOption;
  trailingMarker?: string;
}

export function InlineOptionPickerOptionContent({
  option,
  trailingMarker = "",
}: InlineOptionPickerOptionContentProps) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-2">
        {option.icon ? <Icon name={option.icon} className="size-3.5" /> : null}
        <span className="min-w-0 truncate">{option.label}</span>
      </span>
      <span aria-hidden="true">{trailingMarker}</span>
    </>
  );
}
