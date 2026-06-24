import { ExternalLinkAction } from "@/src/shared/components/external-link-action";
import type { ButtonVariant } from "@/src/ui/primitive-styles";

type BlockedMode = "button" | "notice";

interface PhotoAlbumExternalLinkActionProps {
  blockedLabel: string;
  blockedMode: BlockedMode;
  buttonClassName?: string;
  href: string | null;
  noticeClassName?: string;
  openLabel: string;
  variant?: ButtonVariant;
}

export function PhotoAlbumExternalLinkAction({
  blockedLabel,
  blockedMode,
  buttonClassName,
  href,
  noticeClassName = "text-[#b91c1c]",
  openLabel,
  variant,
}: PhotoAlbumExternalLinkActionProps) {
  return (
    <ExternalLinkAction
      blockedLabel={blockedLabel}
      blockedMode={blockedMode}
      buttonVariant={variant}
      className={buttonClassName}
      href={href}
      noticeClassName={noticeClassName}
      openLabel={openLabel}
    />
  );
}
