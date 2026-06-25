import { type ReactNode, useEffect, useRef, useState } from "react";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";

interface ExpenseActionDetailsProps {
  children: ReactNode;
  menuClassName?: string;
  title: string;
}

export function ExpenseActionDetails({
  children,
  menuClassName = expenseStyles.overviewActionMenuPanelClassName,
  title,
}: ExpenseActionDetailsProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (!details?.open || !event.target || details.contains(event.target as Node)) return;
      details.open = false;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <details
      ref={detailsRef}
      className={`${expenseStyles.overviewActionMenuClassName} ${expenseStyles.overviewIconButtonClassName}`}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.currentTarget.open = false;
        setOpen(false);
        summaryRef.current?.focus();
      }}
    >
      <summary ref={summaryRef} aria-label={title} role="button" title={title}>
        <Icon name="dots" />
      </summary>
      <div className={menuClassName} hidden={!open}>
        {children}
      </div>
    </details>
  );
}
