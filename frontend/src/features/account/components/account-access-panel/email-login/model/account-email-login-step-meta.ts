import type { Locale } from "@/src/i18n/types";
import { formatDateTime } from "../../auth";
import type { AuthFlow } from "../../auth";

export const emailLoginAuthStepValues = [
  "email",
  "methods",
  "password",
  "setup",
] as const;
export type EmailLoginAuthStep = (typeof emailLoginAuthStepValues)[number];

export const emailLoginVisualStepValues = [
  ...emailLoginAuthStepValues,
  "otp",
] as const;
export type EmailLoginVisualStep = (typeof emailLoginVisualStepValues)[number];

export const authTransitionDirectionValues = ["forward", "back", "mode"] as const;
export type AuthTransitionDirection = (typeof authTransitionDirectionValues)[number];

export function resolveEmailLoginVisualStep(authStep: EmailLoginAuthStep, hasChallenge: boolean): EmailLoginVisualStep {
  return hasChallenge ? "otp" : authStep;
}

export function emailLoginStepProgress(flow: AuthFlow, visualStep: EmailLoginVisualStep) {
  if (flow === "register") {
    return {
      current: visualStep === "email" ? 1 : visualStep === "otp" ? 2 : 3,
      total: 3,
    };
  }

  return {
    current: visualStep === "otp" ? 2 : 1,
    total: 2,
  };
}

interface EmailLoginHeadingMessages {
  expiresAt: (params: { value: string }) => string;
  loginCredentialsDetail: string;
  loginCredentialsTitle: string;
  methodDetail: string;
  methodTitle: string;
  passwordDetail: string;
  passwordTitle: string;
  registerCredentialsDetail: string;
  registerCredentialsTitle: string;
  registerPasswordDetail: string;
  setupDetail: string;
  setupTitle: string;
  verifyTitle: string;
}

interface EmailLoginStepMessages extends EmailLoginHeadingMessages {
  stepLogin: (params: { current: number; total: number }) => string;
  stepRegister: (params: { current: number; total: number }) => string;
}

export function emailLoginStepHeading({
  activeFlow,
  authStep,
  challengeExpiresAt,
  locale,
  messages,
}: {
  activeFlow: AuthFlow;
  authStep: EmailLoginAuthStep;
  challengeExpiresAt?: string | null;
  locale: Locale;
  messages: EmailLoginHeadingMessages;
}) {
  if (challengeExpiresAt) {
    return {
      detail: messages.expiresAt({ value: formatDateTime(challengeExpiresAt, locale) }),
      icon: "settings" as const,
      title: messages.verifyTitle,
    };
  }

  if (authStep === "setup") {
    return {
      detail: messages.setupDetail,
      icon: "users" as const,
      title: messages.setupTitle,
    };
  }

  if (authStep === "methods") {
    return {
      detail: messages.methodDetail,
      icon: "users" as const,
      title: messages.methodTitle,
    };
  }

  if (authStep === "password") {
    return {
      detail: activeFlow === "register" ? messages.registerPasswordDetail : messages.passwordDetail,
      icon: "key" as const,
      title: messages.passwordTitle,
    };
  }

  return {
    detail: activeFlow === "register" ? messages.registerCredentialsDetail : messages.loginCredentialsDetail,
    icon: "users" as const,
    title: activeFlow === "register" ? messages.registerCredentialsTitle : messages.loginCredentialsTitle,
  };
}

export function buildEmailLoginStepMeta({
  activeFlow,
  authStep,
  challengeExpiresAt,
  locale,
  messages,
}: {
  activeFlow: AuthFlow;
  authStep: EmailLoginAuthStep;
  challengeExpiresAt?: string | null;
  locale: Locale;
  messages: EmailLoginStepMessages;
}) {
  const visualStep = resolveEmailLoginVisualStep(authStep, Boolean(challengeExpiresAt));
  const progress = emailLoginStepProgress(activeFlow, visualStep);
  const label = activeFlow === "register" ? messages.stepRegister(progress) : messages.stepLogin(progress);
  const heading = emailLoginStepHeading({
    activeFlow,
    authStep,
    challengeExpiresAt,
    locale,
    messages,
  });

  return {
    heading,
    label,
    visualStep,
  };
}
