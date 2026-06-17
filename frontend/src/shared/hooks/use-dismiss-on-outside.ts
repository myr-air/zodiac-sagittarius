import { useEffect } from "react";
import type { RefObject } from "react";

interface UseDismissOnOutsideOptions {
  enabled: boolean;
  onDismiss: () => void;
  triggerRefs: Array<RefObject<HTMLElement | null> | null>;
  onEscape?: () => void;
}

export function useDismissOnOutside({
  enabled,
  onDismiss,
  triggerRefs,
  onEscape,
}: UseDismissOnOutsideOptions): void {
  useEffect(() => {
    if (!enabled) return;

    function isInsideTarget(target: Node | null): boolean {
      return triggerRefs.some(
        (triggerRef) =>
          !!triggerRef?.current && !!target && triggerRef.current.contains(target),
      );
    }

    function closeOnOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target || isInsideTarget(target)) return;
      onDismiss();
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || !onEscape) return;
      onEscape();
    }

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    if (onEscape) {
      document.addEventListener("keydown", closeOnEscape);
    }

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
      if (onEscape) {
        document.removeEventListener("keydown", closeOnEscape);
      }
    };
  }, [enabled, onDismiss, onEscape, triggerRefs]);
}
