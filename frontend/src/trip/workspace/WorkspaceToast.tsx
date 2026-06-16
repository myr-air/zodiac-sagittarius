import type { AccountSession } from "@/src/account/api-client";
import { Icon } from "@/src/components/icons";
import { Button } from "@/src/components/ui";

const workspaceToastClassName =
  "workspace-toast pointer-events-auto fixed left-1/2 top-5 z-[60] flex w-[min(480px,calc(100vw-32px))] -translate-x-1/2 items-start gap-3 rounded-(--radius-lg) border border-(--color-route-border) bg-(--color-route-soft) px-4 py-3 shadow-[0_10px_22px_rgb(15_23_42_/_0.1)] max-[767px]:top-3";
const workspaceToastIconClassName = "mt-0.5 shrink-0 text-(--color-route)";
const workspaceToastBodyClassName =
  "min-w-0 flex-1 [&_span]:block [&_span]:text-[12.5px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) [&_strong]:text-[13.5px] [&_strong]:font-[850] [&_strong]:text-(--color-route)";
const workspaceToastActionsClassName = "flex shrink-0 items-center gap-2";
const workspaceToastDismissClassName =
  "ml-1 grid size-9 shrink-0 place-items-center rounded-full text-(--color-text-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-text)";
const accountClaimMessageClassName = "account-claim-message font-extrabold";

interface WorkspaceToastProps {
  accountSession: AccountSession | null;
  memberUserId: string | null | undefined;
  claimState: { status: "idle" | "saving"; message: string | null };
  canClaim: boolean;
  dismissing: boolean;
  onClaim: () => void;
  onDismiss: () => void;
}

export function WorkspaceToast({
  accountSession,
  memberUserId,
  claimState,
  canClaim,
  dismissing,
  onClaim,
  onDismiss,
}: WorkspaceToastProps) {
  const isClaimed = Boolean(accountSession && memberUserId);
  const title = isClaimed
    ? "เชื่อมต่อ account แล้ว"
    : accountSession
      ? "ผูกตัวตนกับ account"
      : "เข้าแบบ temp";
  const detail = isClaimed
    ? "ตัวตนนี้ผูกกับ account แล้ว"
    : accountSession
      ? "ผูกตัวตน temp นี้กับ account เพื่อเก็บประวัติและสถิติ"
      : "เข้าสู่ระบบจากหน้า access เพื่อผูก identity นี้กับ account ภายหลัง";

  return (
    <div
      className={workspaceToastClassName}
      data-dismissing={dismissing ? "true" : undefined}
      role="status"
      aria-live="polite"
    >
      <span className={workspaceToastIconClassName} aria-hidden="true">
        <Icon name={isClaimed ? "check" : "clock"} />
      </span>
      <div className={workspaceToastBodyClassName}>
        <strong>{title}</strong>
        <span>{detail}</span>
        {claimState.message ? (
          <span className={accountClaimMessageClassName}>
            {claimState.message}
          </span>
        ) : null}
      </div>
      <div className={workspaceToastActionsClassName}>
        {canClaim ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onClaim}
            disabled={claimState.status === "saving"}
          >
            <Icon name="check" />
            ผูกตัวตน
          </Button>
        ) : null}
        <button
          type="button"
          className={workspaceToastDismissClassName}
          aria-label="ปิดการแจ้งเตือน"
          onClick={onDismiss}
        >
          <Icon name="x" />
        </button>
      </div>
    </div>
  );
}
