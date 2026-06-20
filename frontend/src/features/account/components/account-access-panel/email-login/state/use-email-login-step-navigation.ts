"use client";

import { useState } from "react";
import type { EmailLoginAuthStep } from "../account-email-login-step-meta";

export type AuthTransitionDirection = "forward" | "back" | "mode";

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
