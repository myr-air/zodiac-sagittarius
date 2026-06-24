"use client";

import { useState } from "react";
import type { AccountSession, EmailLoginStartResponse } from "@/src/account/api-client";
import type { AuthTransitionDirection } from "../model/account-email-login-step-meta";
import { useEmailLoginResendCooldown } from "./use-email-login-resend-cooldown";

export function useEmailLoginChallengeState({
  setTransitionDirection,
}: {
  setTransitionDirection: (direction: AuthTransitionDirection) => void;
}) {
  const [challenge, setChallenge] = useState<EmailLoginStartResponse | null>(null);
  const [verifiedRegistrationSession, setVerifiedRegistrationSession] = useState<AccountSession | null>(null);
  const {
    resendCooldown,
    resetResendCooldown,
    startResendCooldown,
  } = useEmailLoginResendCooldown(challenge);

  function setSubmittedChallenge(nextChallenge: EmailLoginStartResponse | null) {
    if (nextChallenge) setTransitionDirection("forward");
    setChallenge(nextChallenge);
  }

  return {
    challenge,
    resendCooldown,
    resetResendCooldown,
    setChallenge,
    setSubmittedChallenge,
    setVerifiedRegistrationSession,
    startResendCooldown,
    verifiedRegistrationSession,
  };
}
