import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { WorkspaceDialog } from "@/src/shared/components/workspace-dialog/WorkspaceDialog";

interface InviteDialogProps {
  open: boolean;
  inviteUrl: string;
  onClose: () => void;
  onCopyLink?: () => void;
  copied: boolean;
  closeAriaLabel: string;
  copyLinkLabel: string;
  copyLinkSuccess: string;
  qrLabel: string;
  inviteDialogTitle: string;
}

export function InviteDialog({
  open,
  inviteUrl,
  onClose,
  onCopyLink,
  copied,
  closeAriaLabel,
  copyLinkLabel,
  copyLinkSuccess,
  qrLabel,
  inviteDialogTitle,
}: InviteDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && open) {
      QRCode.toCanvas(canvasRef.current, inviteUrl, { width: 180 }).catch(() => {
        // Ignore QR rendering failures (e.g. jsdom without canvas support).
      });
    }
  }, [inviteUrl, open]);

  if (!open) {
    return null;
  }

  return (
    <WorkspaceDialog
      ariaLabel={inviteDialogTitle}
      title={inviteDialogTitle}
      closeAriaLabel={closeAriaLabel}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <input
            readOnly
            aria-label={inviteUrl}
            className="flex-1 min-w-0 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text)"
            value={inviteUrl}
            onFocus={(event) => event.target.select()}
          />
          <Button
            type="button"
            variant="primary"
            onClick={onCopyLink}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            {copied ? <Icon name="check" /> : <Icon name="copy" />}
            {copied ? copyLinkSuccess : copyLinkLabel}
          </Button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <canvas
            ref={canvasRef}
            aria-label={qrLabel}
            role="img"
            className="rounded-(--radius-md)"
          />
        </div>
      </div>
    </WorkspaceDialog>
  );
}
