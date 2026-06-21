import type { ReactNode } from "react";

interface SmartItineraryStoryFrameProps {
  children: ReactNode;
  size?: "narrow" | "table";
  padded?: boolean;
}

export function SmartItineraryStoryFrame({
  children,
  size,
  padded = false,
}: SmartItineraryStoryFrameProps) {
  const sizeClassName =
    size === "narrow" ? "w-[360px]" : size === "table" ? "w-[720px]" : "";
  const paddingClassName = padded ? "p-6" : "";
  const className = [sizeClassName, paddingClassName].filter(Boolean).join(" ");

  return <div className={className}>{children}</div>;
}
