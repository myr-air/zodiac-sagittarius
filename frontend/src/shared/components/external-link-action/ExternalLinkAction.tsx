import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { ButtonVariant } from "@/src/ui/primitive-styles";
import { externalLinkAnchorProps } from "./external-link-props";

export type ExternalLinkActionVariant = "button" | "icon" | "inline";
export type ExternalLinkBlockedMode = "button" | "none" | "notice";

interface ExternalLinkActionProps {
  blockedLabel?: string;
  blockedMode?: ExternalLinkBlockedMode;
  buttonVariant?: ButtonVariant;
  className?: string;
  href: string | null | undefined;
  iconPosition?: "end" | "start";
  noticeClassName?: string;
  openLabel: string;
  variant?: ExternalLinkActionVariant;
}

export function ExternalLinkAction({
  blockedLabel,
  blockedMode = "none",
  buttonVariant,
  className,
  href,
  iconPosition = "end",
  noticeClassName = "text-[#b91c1c]",
  openLabel,
  variant = "button",
}: ExternalLinkActionProps) {
  if (href) {
    if (variant === "button") {
      return (
        <Button asChild className={className} variant={buttonVariant}>
          <a href={href} {...externalLinkAnchorProps}>
            {iconPosition === "start" ? <Icon name="external" /> : null}
            {openLabel}
            {iconPosition === "end" ? <Icon name="external" /> : null}
          </a>
        </Button>
      );
    }

    if (variant === "icon") {
      return (
        <a
          className={className}
          href={href}
          {...externalLinkAnchorProps}
          aria-label={openLabel}
        >
          <Icon name="external" />
        </a>
      );
    }

    return (
      <a className={className} href={href} {...externalLinkAnchorProps}>
        {iconPosition === "start" ? <Icon name="external" /> : null}
        {openLabel}
        {iconPosition === "end" ? <Icon name="external" /> : null}
      </a>
    );
  }

  if (blockedMode === "button" && blockedLabel) {
    return (
      <Button type="button" variant={buttonVariant} className={className} disabled>
        {blockedLabel}
      </Button>
    );
  }

  if (blockedMode === "notice" && blockedLabel) {
    return <strong className={noticeClassName}>{blockedLabel}</strong>;
  }

  return null;
}
