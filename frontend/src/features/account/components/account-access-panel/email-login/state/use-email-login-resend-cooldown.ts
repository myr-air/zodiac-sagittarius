"use client";

import { useEffect, useState } from "react";
import type { EmailLoginStartResponse } from "@/src/account/api-client";

const resendCooldownSeconds = 30;

export function useEmailLoginResendCooldown(
  challenge: EmailLoginStartResponse | null,
) {
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!challenge || resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [challenge, resendCooldown]);

  return {
    resendCooldown,
    resetResendCooldown: () => setResendCooldown(0),
    startResendCooldown: () => setResendCooldown(resendCooldownSeconds),
  };
}
