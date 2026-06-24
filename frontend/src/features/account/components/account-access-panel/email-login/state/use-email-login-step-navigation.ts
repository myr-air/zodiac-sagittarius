"use client";

import { useState } from "react";
import type { AuthTransitionDirection, EmailLoginAuthStep } from "../model/account-email-login-step-meta";

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
