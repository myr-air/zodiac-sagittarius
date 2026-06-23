"use client";

import { useState } from "react";
import type { EmailLoginAuthStep } from "../model/account-email-login-step-meta";

export const authTransitionDirectionValues = ["forward", "back", "mode"] as const;
export type AuthTransitionDirection = (typeof authTransitionDirectionValues)[number];

export function useEmailLoginStepNavigation() {
  const [authStep, setAuthStep] = useState<EmailLoginAuthStep>("email");
  const [transitionDirection, setTransitionDirection] =
    useState<AuthTransitionDirection>("forward");

  function goToStep(
    nextStep: EmailLoginAuthStep,
    direction: AuthTransitionDirection = "forward",
  ) {
    setTransitionDirection(direction);
    setAuthStep(nextStep);
  }

  return {
    authStep,
    goToStep,
    setTransitionDirection,
    transitionDirection,
  };
}
