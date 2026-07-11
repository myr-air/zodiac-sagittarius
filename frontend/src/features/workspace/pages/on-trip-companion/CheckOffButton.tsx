"use client";

import { useEffect, useState } from "react";
import { cn } from "@/src/lib/cn";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { toastClassName } from "./OnTripCompanionPage.styles";

export interface CheckOffButtonProps {
  activityId: string;
  activityName: string;
  isCheckedOff: boolean;
  onCheckOff: (activityId: string) => void;
  onUndoCheckOff: (activityId: string) => void;
  checkOffButton: string;
  checkOffUndo: string;
  checkOffToast: (activity: string) => string;
  className?: string;
}

export function CheckOffButton({
  activityId,
  activityName,
  isCheckedOff,
  onCheckOff,
  onUndoCheckOff,
  checkOffButton,
  checkOffUndo,
  checkOffToast,
  className,
}: CheckOffButtonProps) {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = window.setTimeout(() => {
      setShowToast(false);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [showToast]);

  const handleCheckOff = () => {
    if (isCheckedOff) return;
    onCheckOff(activityId);
    setShowToast(true);
  };

  const handleUndo = () => {
    onUndoCheckOff(activityId);
    setShowToast(false);
  };

  return (
    <>
      {isCheckedOff ? (
        <div
          className={cn(
            "flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-muted) text-(--color-text-muted) transition-all duration-200 ease-out",
            className,
          )}
          data-testid="check-off-completed"
        >
          <Icon name="check" />
          <span>{checkOffButton.replace(/^✓\s*/, "")}</span>
        </div>
      ) : (
        <Button
          variant="secondary"
          onClick={handleCheckOff}
          className={cn("h-11 min-h-[44px] w-full", className)}
          data-testid="check-off-button"
        >
          <Icon name="check" /> {checkOffButton}
        </Button>
      )}

      {showToast && (
        <div className={toastClassName} role="status" data-testid="check-off-toast">
          <span className="text-sm text-(--color-text)">{checkOffToast(activityName)}</span>
          <Button variant="ghost" onClick={handleUndo} className="h-9 px-2 text-sm" data-testid="check-off-undo">
            {checkOffUndo}
          </Button>
        </div>
      )}
    </>
  );
}
