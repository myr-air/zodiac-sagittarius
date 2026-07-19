"use client";

import { useState } from "react";
import { authChrome } from "@/src/auth/auth-chrome";
import {
  canSubmitPasswordRegister,
  defaultApiBaseUrl,
  passwordRegisterErrorPresentation,
  passwordRegisterUiFields,
  registerWithPassword,
} from "@/src/auth/password-session";
import { useAuthLocale } from "./AuthLocaleProvider";

const DEVICE_LABEL = "Joii web";

const fieldClass =
  "min-h-14 w-full rounded-[8px] border border-(--color-border) bg-(--color-surface) px-3 text-(--color-text) outline-none transition-[border-color,box-shadow] duration-[180ms] focus:border-(--color-primary) focus:shadow-[0_0_0_3px_rgba(15,118,110,0.18)]";

export function RegisterForm() {
  const chrome = authChrome();
  const { copy } = useAuthLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canSubmit = canSubmitPasswordRegister({
    email,
    password,
    confirmPassword,
  });
  const mismatch =
    confirmPassword.length > 0 && password !== confirmPassword
      ? copy.register.mismatch
      : null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setPending(true);
    try {
      const outcome = await registerWithPassword(
        {
          email,
          password,
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
      if (!outcome.ok) {
        setError(passwordRegisterErrorPresentation(outcome).message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <h1 className="m-0 text-[clamp(1.618rem,2.2vw,2.058rem)] font-bold leading-[1.618] tracking-[-0.02em] text-(--color-text)">
        {copy.register.heading}
      </h1>
      <p className="mt-2 mb-4 w-full text-sm leading-[1.618] text-(--color-text-muted)">
        {copy.register.lede}
      </p>

      <form className="grid w-full gap-3" onSubmit={onSubmit}>
        <div className="grid gap-1">
          <label
            htmlFor="reg-email"
            className="text-xs font-semibold leading-none text-(--color-text)"
          >
            {copy.register.email}
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            className={fieldClass}
          />
        </div>

        <div className="grid gap-1">
          <label
            htmlFor="reg-password"
            className="text-xs font-semibold leading-none text-(--color-text)"
          >
            {copy.register.password}
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={pending}
              className={`${fieldClass} pr-14`}
            />
            <button
              type="button"
              aria-label={
                showPassword ? copy.signIn.hidePassword : copy.signIn.showPassword
              }
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-1/2 right-1 grid size-[34px] -translate-y-1/2 place-items-center rounded-[8px] border-0 bg-transparent text-(--color-text-subtle) hover:bg-(--color-surface-muted) hover:text-(--color-text)"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          <span className="text-xs leading-[1.618] text-(--color-text-subtle)">
            {copy.register.passwordHint}
          </span>
        </div>

        <div className="grid gap-1">
          <label
            htmlFor={passwordRegisterUiFields.confirmPassword.id}
            className="text-xs font-semibold leading-none text-(--color-text)"
          >
            {copy.register.confirmPassword}
          </label>
          <input
            id={passwordRegisterUiFields.confirmPassword.id}
            name={passwordRegisterUiFields.confirmPassword.name}
            type={showPassword ? "text" : "password"}
            autoComplete={passwordRegisterUiFields.confirmPassword.autocomplete}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={pending}
            className={fieldClass}
          />
          {mismatch ? (
            <span className="text-xs leading-[1.618] text-(--color-danger)">
              {mismatch}
            </span>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending || !canSubmit}
          className="mt-1 flex min-h-[55px] w-full items-center justify-center rounded-[13px] bg-(--color-primary) px-4 text-sm font-bold text-(--color-on-primary) transition-colors duration-[180ms] hover:bg-(--color-primary-strong) disabled:cursor-not-allowed disabled:opacity-45"
        >
          {copy.register.submit}
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

      <p className="mt-4 text-center text-[0.8125rem] font-semibold leading-[1.618] text-(--color-text-muted)">
        {copy.register.hasAccount}{" "}
        <a
          href={chrome.crossLinks.login}
          className="font-bold text-(--color-primary-strong) underline-offset-2 hover:underline"
        >
          {copy.register.signInLink}
        </a>
      </p>
    </div>
  );
}
