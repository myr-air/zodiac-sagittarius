import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { useEscapeToClose } from "@/src/shared/hooks/use-escape-to-close";

interface ActivityCellModalPortalProps {
  backdropClassName: string;
  children: ReactNode;
  onClose: () => void;
}

export function ActivityCellModalPortal({
  backdropClassName,
  children,
  onClose,
}: ActivityCellModalPortalProps) {
  useEscapeToClose(onClose);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={backdropClassName}
      role="presentation"
      onClick={onClose}
    >
      {children}
    </div>,
    document.body,
  );
}
