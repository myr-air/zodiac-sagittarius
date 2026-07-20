"use client";

import { useState } from "react";
import { authChrome } from "@/src/auth/auth-chrome";
import { AccountEntryShell } from "./AccountEntryShell";
import { useAuthLocale } from "./AuthLocaleProvider";

const valueClass =
  "min-h-14 flex min-w-0 flex-1 items-center rounded-[8px] border border-(--color-border) bg-(--color-surface) px-3 text-[13px] font-medium break-all text-(--color-text) tabular-nums";

const copyBtnClass =
  "min-h-14 min-w-[88px] shrink-0 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-3.5 text-[13px] font-bold leading-[18px] text-(--color-text) transition-[background,border-color,color] duration-[180ms] hover:bg-[#f1f5f9]";

type JoinCredentialsPanelProps = {
  joinId: string;
  joinPassword: string;
  onContinue: () => void;
};

export function JoinCredentialsPanel({
  joinId,
  joinPassword,
  onContinue,
}: JoinCredentialsPanelProps) {
  return (
    <AccountEntryShell route="/register" nav="create-progress">
      <JoinCredentialsPanelBody
        joinId={joinId}
        joinPassword={joinPassword}
        onContinue={onContinue}
      />
    </AccountEntryShell>
  );
}

function JoinCredentialsPanelBody({
  joinId,
  joinPassword,
  onContinue,
}: JoinCredentialsPanelProps) {
  const chrome = authChrome();
  const { copy } = useAuthLocale();
  const jc = copy.joinCredentials;
  const motionClass = chrome.motion.transitionClassName;
  const [copiedField, setCopiedField] = useState<"id" | "password" | null>(
    null,
  );

  async function copyText(field: "id" | "password", text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard may be unavailable in some test/secure contexts.
    }
    setCopiedField(field);
    window.setTimeout(() => {
      setCopiedField((current) => (current === field ? null : current));
    }, 1400);
  }

  return (
    <div className="w-full">
      <h1 className="m-0 mt-2 text-[1.618rem] font-bold leading-[1.2] tracking-[-0.02em] text-(--color-text)">
        {jc.heading}
      </h1>
      <p className="mt-2 mb-7 w-full text-sm leading-[1.618] text-(--color-text-muted)">
        {jc.lede}
      </p>

      <div className="mb-4 grid gap-4">
        <div>
          <label
            htmlFor="join-credentials-id"
            className="mb-2 block text-xs font-semibold text-(--color-text-muted)"
          >
            {jc.joinId}
          </label>
          <div className="flex gap-2">
            <div id="join-credentials-id" className={valueClass}>
              {joinId}
            </div>
            <button
              type="button"
              className={`${copyBtnClass} ${
                copiedField === "id"
                  ? "border-(--color-primary) text-(--color-primary-strong)"
                  : ""
              }`}
              data-copied={copiedField === "id" ? "true" : "false"}
              onClick={() => void copyText("id", joinId)}
            >
              {copiedField === "id" ? jc.copied : jc.copy}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="join-credentials-password"
            className="mb-2 block text-xs font-semibold text-(--color-text-muted)"
          >
            {jc.password}
          </label>
          <div className="flex gap-2">
            <div id="join-credentials-password" className={valueClass}>
              {joinPassword}
            </div>
            <button
              type="button"
              className={`${copyBtnClass} ${
                copiedField === "password"
                  ? "border-(--color-primary) text-(--color-primary-strong)"
                  : ""
              }`}
              data-copied={copiedField === "password" ? "true" : "false"}
              onClick={() => void copyText("password", joinPassword)}
            >
              {copiedField === "password" ? jc.copied : jc.copy}
            </button>
          </div>
        </div>
      </div>

      <div
        role="note"
        className="mb-7 flex items-start gap-2.5 rounded-[8px] border border-(--color-warning-border) bg-(--color-warning-soft) px-3 py-3.5 text-[13px] font-medium leading-[1.45] text-(--color-warning-strong)"
      >
        <span
          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-(--color-warning)"
          aria-hidden="true"
        />
        <span>{jc.warning}</span>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className={`grid min-h-14 w-full place-items-center rounded-(--radius-md) border-0 bg-(--color-primary) text-[13px] font-bold leading-[18px] text-(--color-on-primary) hover:bg-(--color-primary-strong) ${motionClass}`}
      >
        {jc.continue}
      </button>
      <button
        type="button"
        onClick={onContinue}
        className={`mt-3 inline-flex min-h-[34px] w-full items-center justify-center border-0 bg-transparent text-[0.8125rem] font-bold text-(--color-text-muted) hover:text-(--color-primary-strong) ${motionClass}`}
      >
        {jc.skip}
      </button>
    </div>
  );
}
