import type { ReactNode } from "react";
import { Icon } from "@/src/ui/icons";

const accountDangerStatusClassName =
  "join-alert m-0 inline-flex items-center gap-2 rounded-(--radius-md) border border-(--color-danger-border) bg-(--color-danger-soft) px-3 py-2.5 text-[13px] font-bold text-(--color-danger)";
const accountSuccessStatusClassName =
  "account-success m-0 inline-flex items-center gap-2 rounded-(--radius-md) border border-(--color-success-border) bg-(--color-success-soft) px-3 py-2.5 text-[13px] font-extrabold text-(--color-success)";

export function StatusMessage({ children, id, tone }: { children: ReactNode; id?: string; tone: "danger" | "success" }) {
  return (
    <p className={tone === "danger" ? accountDangerStatusClassName : accountSuccessStatusClassName} id={id} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={tone === "danger" ? "alertCircle" : "check"} />
      {children}
    </p>
  );
}
