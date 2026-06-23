import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
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
  if (href) {
    return (
      <Button asChild className={buttonClassName} variant={variant}>
        <a href={href} target="_blank" rel="noreferrer">
          {openLabel}
          <Icon name="external" />
        </a>
      </Button>
    );
  }

  if (blockedMode === "button") {
    return (
      <Button type="button" variant={variant} className={buttonClassName} disabled>
        {blockedLabel}
      </Button>
    );
  }

  return <strong className={noticeClassName}>{blockedLabel}</strong>;
}
