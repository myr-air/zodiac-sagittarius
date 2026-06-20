"use client";

import { type FormEvent, useEffect, useState } from "react";
import type { AccountApiClient, AccountSession, EmailLoginStartResponse } from "@/src/account/api-client";
import { useI18n } from "@/src/i18n/I18nProvider";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  arrayBufferToBase64Url,
  errorMessage,
  getPasskeyCredential,
  passwordLoginErrorMessage,
} from "../auth";
import type { AuthFlow } from "../auth";
import type { AuthTransitionDirection } from "./account-email-login-styles";
import {
  buildEmailLoginStepMeta,
  type EmailLoginAuthStep,
} from "./account-email-login-step-meta";
import { buildEmailLoginPanelDerivedState } from "./email-login-panel-derived-state";

interface UseEmailLoginPanelStateProps {
  accountClient: AccountApiClient;
  activeFlow: AuthFlow;
  onError: (message: string | null) => void;
  onFlowChange?: (flow: AuthFlow) => void;
  onLoggedIn: (session: AccountSession) => void;
}

export function useEmailLoginPanelState({
  accountClient,
  activeFlow,
  onError,
  onFlowChange,
  onLoggedIn,
}: UseEmailLoginPanelStateProps) {
  const { locale, t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [homeBase, setHomeBase] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [authStep, setAuthStep] = useState<EmailLoginAuthStep>("email");
  const [transitionDirection, setTransitionDirection] = useState<AuthTransitionDirection>("forward");
  const [challenge, setChallenge] = useState<EmailLoginStartResponse | null>(null);
  const [verifiedRegistrationSession, setVerifiedRegistrationSession] = useState<AccountSession | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    codeHintId,
    codeInputId,
    emailHintId,
    emailInputId,
    formErrorId,
    isEmailInvalid,
    isEmailValid,
    isPasswordInvalid,
    normalizedEmail,
    otpReady,
    passwordAutocomplete,
    passwordHintId,
    passwordInputId,
    passwordReady,
  } = buildEmailLoginPanelDerivedState({
    activeFlow,
    code,
    email,
    password,
  });

  useEffect(() => {
    if (!challenge || resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [challenge, resendCooldown]);

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isEmailValid || !passwordReady) return;
    onError(null);
    if (activeFlow === "register") {
      await requestEmailCode();
      return;
    }
    await signInWithPassword();
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeFlow === "register") {
      await requestEmailCode();
      return;
    }
    await signInWithPassword();
  }

  async function requestEmailCode() {
    if (!isEmailValid || (activeFlow === "register" && !passwordReady)) return;
    setIsSubmitting(true);
    try {
      const nextChallenge = await accountClient.startEmailLogin(normalizedEmail);
      setTransitionDirection("forward");
      setChallenge(nextChallenge);
      setResendCooldown(30);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.startFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || !otpReady) return;
    setIsSubmitting(true);
    try {
      const session = await accountClient.finishEmailLogin({
        challengeId: challenge.challengeId,
        code,
        trustDevice: activeFlow === "login" ? trustDevice : true,
        deviceLabel: "",
      });
      if (activeFlow === "register") {
        setVerifiedRegistrationSession(session);
        goToStep("setup");
        setChallenge(null);
        setCode("");
        onError(null);
        return;
      }
      onLoggedIn(session);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.invalidCode, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verifiedRegistrationSession || !passwordReady) return;
    setIsSubmitting(true);
    try {
      const session = await accountClient.finishPasswordLogin({
        flow: "register",
        email: normalizedEmail,
        password,
        trustDevice: true,
        deviceLabel: "",
      });
      await accountClient.updateSettings(session.sessionToken, {
        displayName: displayName.trim() || normalizedEmail.split("@")[0] || t.access.dashboard.fallbackName,
        avatarColor: "#c2410c",
        locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.passwordRegisterFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithPassword() {
    if (!isEmailValid || !passwordReady) return;
    setIsSubmitting(true);
    try {
      const session = await accountClient.finishPasswordLogin({
        flow: activeFlow,
        email: normalizedEmail,
        password,
        trustDevice: activeFlow === "login" ? trustDevice : true,
        deviceLabel: "",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(
        activeFlow === "register"
          ? errorMessage(caught, t.access.emailLogin.errors.passwordRegisterFailed, t.access.messages)
          : passwordLoginErrorMessage(caught, t.access.emailLogin.errors.passwordLoginFailed, t.access.messages),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithPasskey() {
    if (!isEmailValid) return;
    setIsSubmitting(true);
    try {
      const loginStart = await accountClient.startPasskeyLogin(normalizedEmail);
      const credential = await getPasskeyCredential(loginStart.challenge, loginStart.allowCredentials.map((credential) => credential.credentialId));
      const session = await accountClient.finishPasskeyLogin({
        challengeId: loginStart.challengeId,
        credentialId: arrayBufferToBase64Url(credential.rawId),
        clientDataJson: arrayBufferToBase64Url(credential.response.clientDataJSON),
        authenticatorData: arrayBufferToBase64Url(credential.response.authenticatorData),
        signature: arrayBufferToBase64Url(credential.response.signature),
        trustDevice: activeFlow === "login" ? trustDevice : false,
        deviceLabel: "",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.passkeyLoginFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetChallenge() {
    setChallenge(null);
    setCode("");
    setPassword("");
    setResendCooldown(0);
    goToStep("email", "back");
    onError(null);
  }

  function changeEmail() {
    resetEntryState("back");
  }

  function resetEntryState(direction: AuthTransitionDirection = "back") {
    setChallenge(null);
    setCode("");
    setPassword("");
    setDisplayName("");
    setHomeBase("");
    setResendCooldown(0);
    setVerifiedRegistrationSession(null);
    goToStep("email", direction);
    onError(null);
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

  function goToStep(nextStep: EmailLoginAuthStep, direction: AuthTransitionDirection = "forward") {
    setTransitionDirection(direction);
    setAuthStep(nextStep);
  }

  function updateCode(value: string) {
    setCode(value.replace(/\D/g, "").slice(0, 6));
  }

  function switchFlow(nextFlow: AuthFlow) {
    if (nextFlow === activeFlow) return;
    onFlowChange?.(nextFlow);
    resetEntryState("mode");
    const nextHref = nextFlow === "register" ? appRoutes.register() : appRoutes.login();
    window.history.replaceState(null, "", nextHref);
  }

  const stepMeta = buildEmailLoginStepMeta({
    activeFlow,
    authStep,
    challengeExpiresAt: challenge?.expiresAt,
    locale,
    messages: t.access.emailLogin,
  });

  return {
    activeFlow,
    authStep,
    challenge,
    code,
    codeHintId,
    codeInputId,
    displayName,
    email,
    emailHintId,
    emailInputId,
    emailLoginMessages: t.access.emailLogin,
    formErrorId,
    homeBase,
    isEmailInvalid,
    isEmailValid,
    isPasswordInvalid,
    isSubmitting,
    normalizedEmail,
    otpReady,
    password,
    passwordAutocomplete,
    passwordHintId,
    passwordInputId,
    passwordReady,
    resendCooldown,
    stepHeading: stepMeta.heading,
    stepLabel: stepMeta.label,
    transitionDirection,
    trustDevice,
    visualStep: stepMeta.visualStep,
    changeEmail,
    chooseMethods,
    requestEmailCode,
    resetChallenge,
    setDisplayName,
    setEmail,
    setHomeBase,
    setPassword,
    setTrustDevice,
    showPasswordStep,
    signInWithPasskey,
    submitForm: authStep === "setup" ? submitSetup : challenge ? submitCode : authStep === "password" ? submitPassword : submitEmail,
    switchFlow,
    updateCode,
  };
}
