import { useEffect, useRef, type MutableRefObject, type ReactNode, type RefObject } from "react";
import { pickerPanelClassName, pickerTriggerClassName } from "./date-time-picker.styles";
import {
  calculatePickerPanelPosition,
  focusInputWithoutOpening,
  usePickerPosition,
  type PickerPanelPosition,
} from "./date-time-picker-popover-position";

export { focusInputWithoutOpening, usePickerPosition };

export function PickerTrigger({
  disabled,
  label,
  onClick,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={pickerTriggerClassName}
      disabled={disabled}
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <span aria-hidden="true">v</span>
    </button>
  );
}

export function PickerPanel({
  children,
  inputRef,
  onClose,
  position,
  setPosition,
  suppressOpenOnFocusRef,
  width,
}: {
  children: ReactNode;
  inputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  position: PickerPanelPosition;
  setPosition: (position: PickerPanelPosition) => void;
  suppressOpenOnFocusRef: MutableRefObject<boolean>;
  width: number;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function updatePosition() {
      const triggerRect = inputRef.current?.getBoundingClientRect();
      if (!triggerRect) return;
      setPosition(
        calculatePickerPanelPosition({
          panelHeight: panelRef.current?.getBoundingClientRect().height ?? 320,
          triggerRect,
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          width,
        }),
      );
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [inputRef, setPosition, width]);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (inputRef.current?.contains(target) || panelRef.current?.contains(target))
        return;
      onClose();
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
    };
  }, [inputRef, onClose]);

  return (
    <section
      ref={panelRef}
      className={pickerPanelClassName}
      style={position}
      role="dialog"
      aria-label="Joii date time picker"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          focusInputWithoutOpening(inputRef, suppressOpenOnFocusRef);
        }
      }}
    >
      {children}
    </section>
  );
}
