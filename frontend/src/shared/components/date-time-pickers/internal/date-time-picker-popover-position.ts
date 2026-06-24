import { useEffect, useState, type MutableRefObject, type RefObject } from "react";

export interface PickerPanelPosition {
  left: number;
  top: number;
  width: number;
}

export interface PickerPanelPositionInput {
  panelHeight: number;
  triggerRect: Pick<DOMRect, "bottom" | "left" | "top">;
  viewportHeight: number;
  viewportWidth: number;
  width: number;
}

export interface PickerPanelInitialPositionInput {
  triggerRect: Pick<DOMRect, "bottom" | "left">;
  viewportHeight: number;
  viewportWidth: number;
  width: number;
}

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

export function calculatePickerPanelPosition({
  panelHeight,
  triggerRect,
  viewportHeight,
  viewportWidth,
  width,
}: PickerPanelPositionInput): PickerPanelPosition {
  const panelWidth = Math.min(width, viewportWidth - 16);
  const constrainedPanelHeight = Math.min(panelHeight, viewportHeight - 16);
  const left = Math.min(
    Math.max(8, triggerRect.left),
    Math.max(8, viewportWidth - panelWidth - 8),
  );
  const belowTop = triggerRect.bottom + 6;
  const aboveTop = triggerRect.top - constrainedPanelHeight - 6;
  const top =
    belowTop + constrainedPanelHeight <= viewportHeight - 8
      ? belowTop
      : Math.min(
          Math.max(8, aboveTop),
          Math.max(8, viewportHeight - constrainedPanelHeight - 8),
        );

  return { left, top, width: panelWidth };
}

export function calculatePickerPanelInitialPosition({
  triggerRect,
  viewportHeight,
  viewportWidth,
  width,
}: PickerPanelInitialPositionInput): PickerPanelPosition {
  return {
    left: Math.max(8, triggerRect.left),
    top: Math.min(viewportHeight - 8, triggerRect.bottom + 6),
    width: Math.min(width, viewportWidth - 16),
  };
}

export function usePickerPosition(
  open: boolean,
  inputRef: RefObject<HTMLInputElement | null>,
  width: number,
): [
  PickerPanelPosition,
  (position: PickerPanelPosition) => void,
] {
  const [position, setPosition] = useState<PickerPanelPosition>({ left: 8, top: 8, width });

  useEffect(() => {
    if (!open) return;
    const triggerRect = inputRef.current?.getBoundingClientRect();
    if (!triggerRect) return;
    setPosition(
      calculatePickerPanelInitialPosition({
        triggerRect,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        width,
      }),
    );
  }, [inputRef, open, width]);

  return [position, setPosition];
}
