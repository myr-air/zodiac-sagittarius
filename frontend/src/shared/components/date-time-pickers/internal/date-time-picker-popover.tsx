import { useEffect, useRef, useState, type MutableRefObject, type ReactNode, type RefObject } from "react";

const pickerPanelClassName =
  "joii-picker fixed z-[40] grid max-h-[calc(100dvh-16px)] gap-3 overflow-auto rounded-(--radius-lg) border border-(--color-route-border) bg-(--color-surface) p-3 text-(--color-text) shadow-[0_20px_42px_rgb(37_99_235_/_0.1),0_8px_16px_rgb(15_23_42_/_0.07)]";
const triggerClassName =
  "absolute inset-y-1 right-1 inline-grid min-h-0 w-8 place-items-center rounded-(--radius-sm) border border-transparent bg-transparent text-(--color-text-muted) transition-colors hover:bg-(--color-route-soft) hover:text-(--color-route)";

export function focusInputWithoutOpening(
  inputRef: RefObject<HTMLInputElement | null>,
  suppressOpenOnFocusRef: MutableRefObject<boolean>,
) {
  suppressOpenOnFocusRef.current = true;
  inputRef.current?.focus();
  window.requestAnimationFrame(() => {
    suppressOpenOnFocusRef.current = false;
  });
}

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
      className={triggerClassName}
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
  position: { left: number; top: number; width: number };
  setPosition: (position: { left: number; top: number; width: number }) => void;
  suppressOpenOnFocusRef: MutableRefObject<boolean>;
  width: number;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function updatePosition() {
      const triggerRect = inputRef.current?.getBoundingClientRect();
      if (!triggerRect) return;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const panelWidth = Math.min(width, viewportWidth - 16);
      const panelHeight = Math.min(
        panelRef.current?.getBoundingClientRect().height ?? 320,
        viewportHeight - 16,
      );
      const left = Math.min(
        Math.max(8, triggerRect.left),
        Math.max(8, viewportWidth - panelWidth - 8),
      );
      const belowTop = triggerRect.bottom + 6;
      const aboveTop = triggerRect.top - panelHeight - 6;
      const top =
        belowTop + panelHeight <= viewportHeight - 8
          ? belowTop
          : Math.min(
              Math.max(8, aboveTop),
              Math.max(8, viewportHeight - panelHeight - 8),
            );
      setPosition({ left, top, width: panelWidth });
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

export function usePickerPosition(
  open: boolean,
  inputRef: RefObject<HTMLInputElement | null>,
  width: number,
): [
  { left: number; top: number; width: number },
  (position: { left: number; top: number; width: number }) => void,
] {
  const [position, setPosition] = useState({ left: 8, top: 8, width });

  useEffect(() => {
    if (!open) return;
    const rect = inputRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      left: Math.max(8, rect.left),
      top: Math.min(window.innerHeight - 8, rect.bottom + 6),
      width: Math.min(width, window.innerWidth - 16),
    });
  }, [inputRef, open, width]);

  return [position, setPosition];
}
