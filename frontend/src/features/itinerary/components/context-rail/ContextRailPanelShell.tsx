import type { ReactNode } from "react";

import { Icon } from "@/src/ui/icons";
import {
  inspectorCloseButtonClassName,
  inspectorTitleClassName,
  inspectorTitleHeadingClassName,
  railInspectorClassName,
} from "./context-rail.styles";

interface ContextRailPanelShellProps {
  children: ReactNode;
  closeLabel: string;
  title: ReactNode;
  onClose: () => void;
}

export function ContextRailPanelShell({
  children,
  closeLabel,
  title,
  onClose,
}: ContextRailPanelShellProps) {
  return (
    <div className={railInspectorClassName}>
      <div className={inspectorTitleClassName}>
        <h2 className={inspectorTitleHeadingClassName}>{title}</h2>
        <button
          className={inspectorCloseButtonClassName}
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
        >
          <Icon name="chevronRight" />
        </button>
      </div>
      {children}
    </div>
  );
}
