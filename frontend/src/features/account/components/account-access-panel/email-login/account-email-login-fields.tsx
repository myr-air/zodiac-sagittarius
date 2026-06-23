import type { ReactNode } from "react";
import { Icon, type IconName } from "@/src/ui/icons";
import {
  accountCheckClassName,
  accountFieldClassName,
  accountFieldHintClassName,
  accountTertiaryActionClassName,
} from "./account-email-login-styles";
import { accountStepSummaryClassName } from "../layout/account-access-panel-layout";

export function AccountStepSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className={accountStepSummaryClassName}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function AccountField({
  children,
  hint,
  hintId,
  inputId,
  label,
}: {
  children: ReactNode;
  hint: string;
  hintId: string;
  inputId: string;
  label: string;
}) {
  return (
    <div className={accountFieldClassName}>
      <label htmlFor={inputId}><span>{label}</span></label>
      {children}
      <p className={accountFieldHintClassName} id={hintId}>{hint}</p>
    </div>
  );
}

export function AccountTrustDeviceField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={accountCheckClassName}>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" suppressHydrationWarning />
      {label}
    </label>
  );
}

export function AccountTertiaryAction({
  disabled,
  icon,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: IconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={accountTertiaryActionClassName} type="button" disabled={disabled} onClick={onClick}>
      <Icon name={icon} />
      {label}
    </button>
  );
}
