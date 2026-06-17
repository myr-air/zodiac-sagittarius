"use client";

import { FormEvent, useEffect, useState } from "react";
import type { AccountApiClient, AccountSession, EmailLoginStartResponse } from "@/src/account/api-client";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import {
  arrayBufferToBase64Url,
  errorMessage,
  formatDateTime,
  getPasskeyCredential,
  passwordLoginErrorMessage,
} from "./account-auth-support";
import { AccountAuthFlowSwitch, AccountAuthRouteTabs, type AuthFlow } from "./account-auth-chrome";
import {
  accountAlternateActionsClassName,
  accountEmailPattern,
  accountEntryLoginFlowClassName,
  accountLoginFlowClassName,
  accountStepKickerClassName,
  accountStepStageClassName,
  accountStepStageDirectionClassNames,
  type AuthTransitionDirection,
} from "./account-email-login-styles";
import { AccountField, AccountStepSummary, AccountTertiaryAction, AccountTrustDeviceField } from "./account-email-login-fields";
import { PanelHeading } from "./account-portal-primitives";
import { StatusMessage } from "./account-status-message";

interface EmailLoginPanelProps {
  accountClient: AccountApiClient;
  authCardClassName: string;
  flow: AuthFlow;
  formError?: string | null;
  onError: (message: string | null) => void;
  onFlowChange?: (flow: AuthFlow) => void;
  onLoggedIn: (session: AccountSession) => void;
  showRouteTabs?: boolean;
}

export function EmailLoginPanel({
  flow,
  accountClient,
  authCardClassName,
  formError,
  onError,
  onFlowChange,
  onLoggedIn,
  showRouteTabs = false,
}: EmailLoginPanelProps) {
  const { locale, t } = useI18n();
  const activeFlow = flow;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [homeBase, setHomeBase] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [authStep, setAuthStep] = useState<"email" | "methods" | "password" | "setup">("email");
  const [transitionDirection, setTransitionDirection] = useState<AuthTransitionDirection>("forward");
  const [challenge, setChallenge] = useState<EmailLoginStartResponse | null>(null);
  const [verifiedRegistrationSession, setVerifiedRegistrationSession] = useState<AccountSession | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const normalizedEmail = email.trim();
  const isEmailValid = accountEmailPattern.test(normalizedEmail);
  const isEmailInvalid = normalizedEmail.length > 0 && !isEmailValid;
  const passwordReady = password.length >= 8;
  const isPasswordInvalid = password.length > 0 && !passwordReady;
  const otpReady = /^\d{6}$/.test(code);
  const emailInputId = `account-${activeFlow}-email`;
  const emailHintId = `${emailInputId}-hint`;
  const passwordInputId = `account-${activeFlow}-password`;
  const passwordHintId = `${passwordInputId}-hint`;
  const codeInputId = `account-${activeFlow}-code`;
  const codeHintId = `${codeInputId}-hint`;
  const formErrorId = `account-${activeFlow}-error`;
  const passwordAutocomplete = activeFlow === "register" ? "new-password" : "current-password";

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

  function goToStep(nextStep: typeof authStep, direction: AuthTransitionDirection = "forward") {
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

  const visualStep = challenge ? "otp" : authStep;
  const stepLabel = activeFlow === "register"
    ? t.access.emailLogin.stepRegister({ current: visualStep === "email" ? 1 : visualStep === "otp" ? 2 : 3, total: 3 })
    : t.access.emailLogin.stepLogin({ current: visualStep === "otp" ? 2 : 1, total: 2 });

  const trustDeviceFields = (
    <AccountTrustDeviceField checked={trustDevice} label={t.access.emailLogin.trustDevice} onChange={setTrustDevice} />
  );

  return (
    <div className={cn(accountLoginFlowClassName, showRouteTabs ? accountEntryLoginFlowClassName : "")}>
      {showRouteTabs ? (
        <AccountAuthRouteTabs activeFlow={activeFlow} onFlowChange={switchFlow} />
      ) : null}
      <form
        aria-busy={isSubmitting}
        aria-describedby={formError ? formErrorId : undefined}
        className={authCardClassName}
        onSubmit={authStep === "setup" ? submitSetup : challenge ? submitCode : authStep === "password" ? submitPassword : submitEmail}
      >
        <span className={accountStepKickerClassName}>{stepLabel}</span>
        {formError ? <StatusMessage id={formErrorId} tone="danger">{formError}</StatusMessage> : null}
        <div className={cn(accountStepStageClassName, accountStepStageDirectionClassNames[transitionDirection])} key={visualStep}>
          <PanelHeading
            icon={challenge ? "settings" : authStep === "password" ? "key" : "users"}
            title={challenge ? t.access.emailLogin.verifyTitle : authStep === "setup" ? t.access.emailLogin.setupTitle : authStep === "methods" ? t.access.emailLogin.methodTitle : authStep === "password" ? t.access.emailLogin.passwordTitle : activeFlow === "register" ? t.access.emailLogin.registerCredentialsTitle : t.access.emailLogin.loginCredentialsTitle}
            detail={
              challenge
                ? t.access.emailLogin.expiresAt({ value: formatDateTime(challenge.expiresAt, locale) })
                : authStep === "setup"
                  ? t.access.emailLogin.setupDetail
                  : authStep === "methods"
                    ? t.access.emailLogin.methodDetail
                    : authStep === "password"
                      ? activeFlow === "register" ? t.access.emailLogin.registerPasswordDetail : t.access.emailLogin.passwordDetail
                      : activeFlow === "register" ? t.access.emailLogin.registerCredentialsDetail : t.access.emailLogin.loginCredentialsDetail
            }
          />
          {challenge ? (
            <>
            <AccountStepSummary label={t.access.emailLogin.sentCodeTo} value={normalizedEmail} />
            <AccountField inputId={codeInputId} label={t.access.emailLogin.verificationCode} hintId={codeHintId} hint={t.access.emailLogin.verificationCodeHint}>
              <input
                id={codeInputId}
                value={code}
                onChange={(event) => updateCode(event.target.value)}
                name="one-time-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                aria-describedby={codeHintId}
                aria-invalid={code.length > 0 && !otpReady ? true : undefined}
                required
                suppressHydrationWarning
              />
            </AccountField>
            {activeFlow === "login" ? trustDeviceFields : null}
            <Button type="submit" disabled={!otpReady || isSubmitting}>
              <Icon name="check" />
              {activeFlow === "register" ? t.access.emailLogin.verifyEmail : t.access.emailLogin.signInAccount}
            </Button>
            <Button type="button" variant="secondary" disabled={!isEmailValid || (activeFlow === "register" && !passwordReady) || isSubmitting || resendCooldown > 0} onClick={() => void requestEmailCode()}>
              {t.access.emailLogin.resendCode}
              {resendCooldown > 0 ? t.access.emailLogin.resendCooldown({ seconds: resendCooldown }) : ""}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={resetChallenge}>
              {t.access.emailLogin.changeEmail}
            </Button>
            </>
          ) : authStep === "email" ? (
            <>
            <AccountField
              inputId={emailInputId}
              label={t.access.emailLogin.email}
              hintId={emailHintId}
              hint={isEmailInvalid ? t.access.emailLogin.emailInvalidHint : t.access.emailLogin.emailHint}
            >
              <input
                id={emailInputId}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                name="email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="username"
                aria-describedby={emailHintId}
                aria-invalid={isEmailInvalid ? true : undefined}
                spellCheck={false}
                placeholder="you@example.com"
                required
                suppressHydrationWarning
              />
            </AccountField>
            <AccountField inputId={passwordInputId} label={t.access.emailLogin.password} hintId={passwordHintId} hint={t.access.emailLogin.passwordHint}>
              <input
                id={passwordInputId}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                name="password"
                type="password"
                autoComplete={passwordAutocomplete}
                aria-describedby={passwordHintId}
                aria-invalid={isPasswordInvalid ? true : undefined}
                minLength={8}
                required
                suppressHydrationWarning
              />
            </AccountField>
            {activeFlow === "login" ? trustDeviceFields : null}
            <Button type="submit" disabled={!isEmailValid || !passwordReady || isSubmitting}>
              <Icon name={activeFlow === "register" ? "check" : "key"} />
              {activeFlow === "register" ? t.access.emailLogin.createWithPassword : t.access.emailLogin.signInAccount}
            </Button>
            {activeFlow === "login" ? (
              <div className={accountAlternateActionsClassName} aria-label={t.access.emailLogin.alternateSignInOptions}>
                <AccountTertiaryAction icon="check" label={t.access.emailLogin.useSignInCodeInstead} disabled={!isEmailValid || isSubmitting} onClick={() => void requestEmailCode()} />
                <AccountTertiaryAction icon="key" label={t.access.emailLogin.usePasskeyInstead} disabled={!isEmailValid || isSubmitting} onClick={() => void signInWithPasskey()} />
              </div>
            ) : null}
            </>
          ) : authStep === "methods" ? (
            <>
            <AccountStepSummary label={activeFlow === "register" ? t.access.emailLogin.createFor : t.access.emailLogin.signInAs} value={normalizedEmail} />
            <Button type="button" disabled={isSubmitting} onClick={() => void requestEmailCode()}>
              <Icon name="check" />
              {activeFlow === "register" ? t.access.emailLogin.sendRegisterCode : t.access.emailLogin.sendSignInCode}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={showPasswordStep}>
              <Icon name="key" />
              {activeFlow === "register" ? t.access.emailLogin.createWithPassword : t.access.emailLogin.signInWithPassword}
            </Button>
            {activeFlow === "login" ? (
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => void signInWithPasskey()}>
                <Icon name="key" />
                {t.access.emailLogin.signInWithPasskey}
              </Button>
            ) : null}
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={changeEmail}>
              {t.access.emailLogin.changeEmail}
            </Button>
            </>
          ) : authStep === "setup" ? (
            <>
            <AccountStepSummary label={t.access.emailLogin.createFor} value={normalizedEmail} />
            <label>
              <span>{t.access.emailLogin.displayName}</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" placeholder="Aom Traveler" required suppressHydrationWarning />
            </label>
            <label>
              <span>{t.access.emailLogin.homeBase}</span>
              <input value={homeBase} onChange={(event) => setHomeBase(event.target.value)} autoComplete="address-level2" placeholder="Bangkok" suppressHydrationWarning />
            </label>
            <Button type="submit" disabled={!displayName.trim() || isSubmitting}>
              <Icon name="check" />
              {t.access.emailLogin.finishSetup}
            </Button>
            </>
          ) : (
            <>
            <AccountStepSummary label={activeFlow === "register" ? t.access.emailLogin.createFor : t.access.emailLogin.signInAs} value={normalizedEmail} />
            <input
              aria-hidden="true"
              autoComplete="username"
              className="sr-only"
              name="email"
              readOnly
              tabIndex={-1}
              type="email"
              value={normalizedEmail}
            />
            <AccountField inputId={`${passwordInputId}-step`} label={t.access.emailLogin.password} hintId={passwordHintId} hint={t.access.emailLogin.passwordHint}>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                id={`${passwordInputId}-step`}
                name="password"
                type="password"
                autoComplete={passwordAutocomplete}
                aria-describedby={passwordHintId}
                aria-invalid={isPasswordInvalid ? true : undefined}
                minLength={8}
                required
                suppressHydrationWarning
              />
            </AccountField>
            {activeFlow === "login" ? trustDeviceFields : null}
            <Button type="submit" disabled={password.length < 8 || isSubmitting}>
              <Icon name="key" />
              {activeFlow === "register" ? t.access.emailLogin.continueToOtp : t.access.emailLogin.signInWithPassword}
            </Button>
            {activeFlow === "login" ? (
              <Button type="button" variant="ghost" disabled={isSubmitting} onClick={chooseMethods}>
                {t.access.emailLogin.chooseAnotherMethod}
              </Button>
            ) : (
              <Button type="button" variant="ghost" disabled={isSubmitting} onClick={changeEmail}>
                {t.access.emailLogin.changeEmail}
              </Button>
            )}
            </>
          )}
        </div>
      </form>
      {!challenge ? (
        <AccountAuthFlowSwitch activeFlow={activeFlow} onFlowChange={switchFlow} />
      ) : null}
    </div>
  );
}
