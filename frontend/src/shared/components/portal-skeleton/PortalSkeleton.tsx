import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/src/lib/cn";

export const portalSkeletonVariantValues = [
  "title",
  "line",
  "block",
  "number",
  "short",
  "icon",
] as const;

export type PortalSkeletonVariant = (typeof portalSkeletonVariantValues)[number];

const portalSkeletonBaseClassName =
  "portal-skeleton block overflow-hidden rounded-(--radius-md) bg-[linear-gradient(90deg,var(--color-surface-subtle),rgb(226_232_240_/_0.72),var(--color-surface-subtle))] bg-[length:220%_100%] animate-[portal-skeleton-pulse_1.2s_ease-in-out_infinite] motion-reduce:animate-none";

const portalSkeletonVariantClassNames: Record<PortalSkeletonVariant, string> = {
  block: "portal-skeleton--block h-[132px] w-full",
  icon: "portal-skeleton--icon size-9",
  line: "portal-skeleton--line h-4 w-[min(520px,72%)]",
  number: "portal-skeleton--number h-[26px] w-[34px]",
  short: "portal-skeleton--short h-3.5 w-24",
  title: "portal-skeleton--title h-7 w-[min(220px,48%)]",
};

export function portalSkeletonClassName(
  variant: PortalSkeletonVariant,
  className?: string,
) {
  return cn(portalSkeletonBaseClassName, portalSkeletonVariantClassNames[variant], className);
}

interface PortalSkeletonProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  variant: PortalSkeletonVariant;
}

export function PortalSkeleton({
  className,
  variant,
  ...props
}: PortalSkeletonProps) {
  return (
    <span
      className={portalSkeletonClassName(variant, className)}
      {...props}
    />
  );
}
