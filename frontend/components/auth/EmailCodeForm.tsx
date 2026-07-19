"use client";

import { useState } from "react";
import { authChrome } from "@/src/auth/auth-chrome";
import {
  defaultApiBaseUrl,
  emailCodeErrorPresentation,
  finishEmailChallenge,
  startEmailChallenge,
} from "@/src/auth/email-challenge";
import { useAuthLocale } from "./AuthLocaleProvider";

const DEVICE_LABEL = "Joii web";

const fieldClass =
  "min-h-14 w-full rounded-[8px] border border-(--color-border) bg-(--color-surface) px-3 text-(--color-text) outline-none transition-[border-color,box-shadow] duration-[180ms] focus:border-(--color-primary) focus:shadow-[0_0_0_3px_rgba(15,118,110,0.18)]";

const fieldErrorClass =
  "border-(--color-danger) shadow-[0_0_0_3px_rgba(220,38,38,0.12)]";

export function EmailCodeForm({
  initialEmail = "",
  onBack,
}: {
  initialEmail?: string;
  onBack: () => void;
}) {
  const chrome = authChrome();
  const { copy } = useAuthLocale();
  const [email, setEmail] = useState(initialEmail);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setCodeError(null);
    setPending(true);
    try {
      if (!challengeId) {
        if (email.trim().length === 0) {
          setError(copy.emailCode.enterEmail);
          return;
        }
        const start = await startEmailChallenge(
          { email },
          { fetch, apiBaseUrl: defaultApiBaseUrl() },
        );
        if (!start.ok) {
          setError(start.error);
          return;
        }
        setChallengeId(start.challengeId);
        return;
      }

      if (code.trim().length === 0) {
        setCodeError(copy.emailCode.enterCode);
        return;
      }

      const finish = await finishEmailChallenge(
        {
          challengeId,
          code,
          trustDevice: false,
          deviceLabel: DEVICE_LABEL,
        },
        {
          fetch,
          apiBaseUrl: defaultApiBaseUrl(),
          storage: window.localStorage,
          navigate: (route) => window.location.assign(route),
        },
      );
      if (!finish.ok) {
        setCodeError(emailCodeErrorPresentation(finish).message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <h1 className="m-0 text-[clamp(1.618rem,2.2vw,2.058rem)] font-bold leading-[1.618] tracking-[-0.02em] text-(--color-text)">
        {copy.emailCode.heading}
      </h1>
      <p className="mt-2 mb-4 w-full text-sm leading-[1.618] text-(--color-text-muted)">
        {copy.emailCode.lede}
      </p>

      <form className="grid w-full gap-3" onSubmit={onSubmit}>
        <div className="grid gap-1">
          <label
            htmlFor="code-email"
            className="text-xs font-semibold leading-none text-(--color-text)"
          >
            {copy.emailCode.email}
          </label>
          <input
            id="code-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending || Boolean(challengeId)}
            className={fieldClass}
          />
        </div>

        {challengeId ? (
          <div className="grid gap-1">
            <label
              htmlFor="code-otp"
              className="text-xs font-semibold leading-none text-(--color-text)"
            >
              {copy.emailCode.code}
            </label>
            <input
              id="code-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={pending}
              className={`${fieldClass} ${codeError ? fieldErrorClass : ""}`}
            />
            {codeError ? (
              <span className="text-xs leading-[1.618] text-(--color-danger)">
                {codeError}
              </span>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 flex min-h-[55px] w-full items-center justify-center rounded-[13px] bg-(--color-primary) px-4 text-sm font-bold text-(--color-on-primary) transition-colors duration-[180ms] hover:bg-(--color-primary-strong) disabled:cursor-not-allowed disabled:opacity-45"
        >
          {challengeId ? copy.emailCode.verify : copy.emailCode.send}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={onBack}
          className="min-h-[34px] w-auto border-0 bg-transparent px-0 text-[0.8125rem] font-bold text-(--color-primary-strong) underline-offset-2 hover:underline"
        >
          {copy.emailCode.backToPassword}
        </button>
      </form>

      {error ? (
        <p
          role="alert"
          className={`mt-4 rounded-[13px] border px-3 py-2 text-sm ${chrome.inlineError.className}`}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
