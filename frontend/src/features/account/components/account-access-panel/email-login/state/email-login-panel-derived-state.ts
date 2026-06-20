import type { AuthFlow } from "../../auth";
import { accountEmailPattern } from "../account-email-login-styles";

export interface EmailLoginPanelDerivedState {
  codeHintId: string;
  codeInputId: string;
  emailHintId: string;
  emailInputId: string;
  formErrorId: string;
  isEmailInvalid: boolean;
  isEmailValid: boolean;
  isPasswordInvalid: boolean;
  normalizedEmail: string;
  otpReady: boolean;
  passwordAutocomplete: "new-password" | "current-password";
  passwordHintId: string;
  passwordInputId: string;
  passwordReady: boolean;
}

interface BuildEmailLoginPanelDerivedStateInput {
  activeFlow: AuthFlow;
  code: string;
  email: string;
  password: string;
}

export function buildEmailLoginPanelDerivedState({
  activeFlow,
  code,
  email,
  password,
}: BuildEmailLoginPanelDerivedStateInput): EmailLoginPanelDerivedState {
  const normalizedEmail = email.trim();
  const isEmailValid = accountEmailPattern.test(normalizedEmail);
  const emailInputId = `account-${activeFlow}-email`;
  const passwordInputId = `account-${activeFlow}-password`;
  const codeInputId = `account-${activeFlow}-code`;
  const passwordReady = password.length >= 8;

  return {
    codeHintId: `${codeInputId}-hint`,
    codeInputId,
    emailHintId: `${emailInputId}-hint`,
    emailInputId,
    formErrorId: `account-${activeFlow}-error`,
    isEmailInvalid: normalizedEmail.length > 0 && !isEmailValid,
    isEmailValid,
    isPasswordInvalid: password.length > 0 && !passwordReady,
    normalizedEmail,
    otpReady: /^\d{6}$/.test(code),
    passwordAutocomplete: activeFlow === "register" ? "new-password" : "current-password",
    passwordHintId: `${passwordInputId}-hint`,
    passwordInputId,
    passwordReady,
  };
}
