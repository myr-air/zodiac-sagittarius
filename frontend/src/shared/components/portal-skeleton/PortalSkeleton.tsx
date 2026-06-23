import type { ComponentPropsWithoutRef } from "react";
import {
  portalSkeletonClassName,
  type PortalSkeletonVariant,
} from "./PortalSkeleton.styles";

export {
  portalSkeletonBlockClassName,
  portalSkeletonClassName,
  portalSkeletonLineClassName,
  portalSkeletonTitleClassName,
  portalSkeletonVariantValues,
  type PortalSkeletonVariant,
} from "./PortalSkeleton.styles";

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
