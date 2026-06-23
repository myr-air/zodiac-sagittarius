import { Button } from "@/src/ui";
import { buildInviteEmailHref } from "@/src/routes/invite-links";

export interface CreatedTripShare {
  inviteLink: string;
  joinId: string;
  name: string;
}

export interface CreatedTripShareCopy {
  copied: string;
  copyInvite: string;
  inviteLink: string;
  ready: (name: string) => string;
  regionLabel: string;
  sendEmail: string;
}

const tripCreatedShareClassName =
  "trip-created-share grid gap-2.5 rounded-[12px] border border-(--color-success-border) bg-[linear-gradient(180deg,rgb(240_253_244_/_0.94),white)] p-3 text-[13px] font-bold text-(--color-text-muted) [&_strong]:text-(--color-text) [&_code]:rounded-[6px] [&_code]:bg-white [&_code]:px-2 [&_code]:py-1 [&_code]:text-xs [&_code]:font-black [&_code]:text-(--color-primary-strong) [&_div]:flex [&_div]:flex-wrap [&_div]:gap-2 [&_.button]:w-auto";
const tripCreatedShareLinkClassName =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 py-[7px] text-[13px] font-extrabold text-(--color-primary-strong) no-underline";

export function PortalCreatedTripShare({
  copy,
  hasCopiedInvite,
  onCopyInvite,
  share,
}: {
  copy: CreatedTripShareCopy;
  hasCopiedInvite: boolean;
  onCopyInvite: () => void;
  share: CreatedTripShare;
}) {
  return (
    <section className={tripCreatedShareClassName} role="region" aria-label={copy.regionLabel}>
      <strong>{copy.ready(share.name)}</strong>
      <span>{copy.inviteLink}: <code>{share.inviteLink}</code></span>
      <div>
        <Button type="button" variant="secondary" onClick={onCopyInvite}>
          {hasCopiedInvite ? copy.copied : copy.copyInvite}
        </Button>
        <a className={tripCreatedShareLinkClassName} href={buildInviteEmailHref(share.name, share.inviteLink)}>
          {copy.sendEmail}
        </a>
      </div>
    </section>
  );
}
