import type { BookingDoc } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";

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
  if (variant === "icon") {
    return (
      <a
        className="grid size-8 place-items-center rounded-(--radius-sm) text-(--color-primary-strong) hover:bg-(--color-primary-soft)"
        href={link.url}
        target="_blank"
        rel="noreferrer"
        aria-label={openLabel}
      >
        <Icon name="external" />
      </a>
    );
  }

  return (
    <a
      className="inline-flex min-h-9 items-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-extrabold text-(--color-primary-strong)"
      href={link.url}
      target="_blank"
      rel="noreferrer"
    >
      <Icon name="external" />
      {openLabel}
    </a>
  );
}
