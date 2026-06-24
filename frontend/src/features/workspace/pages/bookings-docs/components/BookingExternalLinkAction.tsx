import { ExternalLinkAction } from "@/src/shared/components/external-link-action";
import type { BookingDoc } from "@/src/trip/types";

type BookingExternalLink = BookingDoc["externalLinks"][number];
type BookingExternalLinkActionVariant = "icon" | "inline";

interface BookingExternalLinkActionProps {
  link: BookingExternalLink;
  openLabel: string;
  variant: BookingExternalLinkActionVariant;
}

export function BookingExternalLinkAction({
  link,
  openLabel,
  variant,
}: BookingExternalLinkActionProps) {
  return (
    <ExternalLinkAction
      className={
        variant === "icon"
          ? "grid size-8 place-items-center rounded-(--radius-sm) text-(--color-primary-strong) hover:bg-(--color-primary-soft)"
          : "inline-flex min-h-9 items-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-extrabold text-(--color-primary-strong)"
      }
      href={link.url}
      iconPosition="start"
      openLabel={openLabel}
      variant={variant}
    />
  );
}
