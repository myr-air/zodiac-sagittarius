import type { EmailLoginAuthStep } from "../account-email-login-step-meta";

export const emailLoginSubmitRouteValues = [
  "setup",
  "code",
  "password",
  "email",
] as const;
export type EmailLoginSubmitRoute = (typeof emailLoginSubmitRouteValues)[number];

export type EmailLoginSubmitHandlers<Handler> = Record<EmailLoginSubmitRoute, Handler>;

export function selectEmailLoginSubmitRoute({
  authStep,
  hasChallenge,
}: {
  authStep: EmailLoginAuthStep;
  hasChallenge: boolean;
}): EmailLoginSubmitRoute {
  if (authStep === "setup") return "setup";
  if (hasChallenge) return "code";
  if (authStep === "password") return "password";
  return "email";
}

export function selectEmailLoginSubmitHandler<Handler>({
  authStep,
  handlers,
  hasChallenge,
}: {
  authStep: EmailLoginAuthStep;
  handlers: EmailLoginSubmitHandlers<Handler>;
  hasChallenge: boolean;
}) {
  return handlers[selectEmailLoginSubmitRoute({ authStep, hasChallenge })];
}
