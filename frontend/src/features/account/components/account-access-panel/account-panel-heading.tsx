import type { ComponentProps } from "react";
import { Icon } from "@/src/ui/icons";

const accountPanelHeadingClassName =
  "account-panel-heading flex min-w-0 items-center gap-3 max-[767px]:flex-wrap max-[767px]:items-start [&>div]:max-[767px]:min-w-0 [&_small]:text-[13px] [&_small]:leading-5 [&_small]:text-(--color-text-muted) max-[767px]:[&_small]:[overflow-wrap:anywhere] [&_span[aria-hidden=true]]:grid [&_span[aria-hidden=true]]:size-9 [&_span[aria-hidden=true]]:shrink-0 [&_span[aria-hidden=true]]:place-items-center [&_span[aria-hidden=true]]:rounded-(--radius-md) [&_span[aria-hidden=true]]:bg-(--color-primary-soft) [&_span[aria-hidden=true]]:text-(--color-primary-strong) [&_strong]:block [&_strong]:text-(--color-text)";

export function PanelHeading({ detail, icon, title }: { detail: string; icon: ComponentProps<typeof Icon>["name"]; title: string }) {
  return (
    <div className={accountPanelHeadingClassName}>
      <span aria-hidden="true"><Icon name={icon} /></span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}
