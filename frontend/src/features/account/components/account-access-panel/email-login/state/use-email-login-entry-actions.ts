"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AccountSession, EmailLoginStartResponse } from "@/src/account/api-client";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import type { AuthFlow } from "../../auth";
import type { AuthTransitionDirection } from "./use-email-login-step-navigation";

interface UseEmailLoginEntryActionsOptions {
  activeFlow: AuthFlow;
  clearCodeAndPassword: () => void;
  goToStep: (nextStep: "email" | "methods" | "password", direction?: AuthTransitionDirection) => void;
  onError: (message: string | null) => void;
  onFlowChange?: (flow: AuthFlow) => void;
  resetEntryFields: () => void;
  resetResendCooldown: () => void;
  setChallenge: Dispatch<SetStateAction<EmailLoginStartResponse | null>>;
  setPassword: (value: string) => void;
  setVerifiedRegistrationSession: Dispatch<SetStateAction<AccountSession | null>>;
}

export function useEmailLoginEntryActions({
  activeFlow,
  clearCodeAndPassword,
  goToStep,
  onError,
  onFlowChange,
  resetEntryFields,
  resetResendCooldown,
  setChallenge,
  setPassword,
  setVerifiedRegistrationSession,
}: UseEmailLoginEntryActionsOptions) {
  function resetChallenge() {
    setChallenge(null);
    clearCodeAndPassword();
    resetResendCooldown();
    goToStep("email", "back");
    onError(null);
  }

  function resetEntryState(direction: AuthTransitionDirection = "back") {
    setChallenge(null);
    resetEntryFields();
    resetResendCooldown();
    setVerifiedRegistrationSession(null);
    goToStep("email", direction);
    onError(null);
  }

  function changeEmail() {
    resetEntryState("back");
  }

  function showPasswordStep() {
    setPassword("");
    goToStep("password");
    onError(null);
  }

  function chooseMethods() {
    goToStep("methods", "back");
    onError(null);
  }

  function switchFlow(nextFlow: AuthFlow) {
    if (nextFlow === activeFlow) return;
    onFlowChange?.(nextFlow);
    resetEntryState("mode");
    const nextHref = nextFlow === "register" ? appRoutes.register() : appRoutes.login();
    window.history.replaceState(null, "", nextHref);
  }

  return {
    changeEmail,
    chooseMethods,
    resetChallenge,
    showPasswordStep,
    switchFlow,
  };
}
