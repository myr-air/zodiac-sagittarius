import type { ReactNode } from "react";
import type { Messages } from "@/src/i18n/messages";
import type { IconName } from "@/src/ui/icons";
import type { AuthFlow } from "../auth";
import type { EmailLoginAuthStep, EmailLoginVisualStep } from "./account-email-login-step-meta";
import type { AuthTransitionDirection } from "./state/use-email-login-step-navigation";

export interface EmailLoginStepContentProps {
  activeFlow: AuthFlow;
  authStep: EmailLoginAuthStep;
  code: string;
  codeHintId: string;
  codeInputId: string;
  displayName: string;
  email: string;
  emailHintId: string;
  emailInputId: string;
  emailLoginMessages: Messages["access"]["emailLogin"];
  hasChallenge: boolean;
  homeBase: string;
  isEmailInvalid: boolean;
  isEmailValid: boolean;
  isPasswordInvalid: boolean;
  isSubmitting: boolean;
  normalizedEmail: string;
  otpReady: boolean;
  password: string;
  passwordAutocomplete: string;
  passwordHintId: string;
  passwordInputId: string;
  passwordReady: boolean;
  resendCooldown: number;
  trustDeviceFields: ReactNode;
  changeEmail: () => void;
  chooseMethods: () => void;
  requestEmailCode: () => Promise<void>;
  resetChallenge: () => void;
  setDisplayName: (value: string) => void;
  setEmail: (value: string) => void;
  setHomeBase: (value: string) => void;
  setPassword: (value: string) => void;
  showPasswordStep: () => void;
  signInWithPasskey: () => Promise<void>;
  updateCode: (value: string) => void;
}

export interface EmailLoginStepStageProps extends EmailLoginStepContentProps {
  stepHeading: {
    detail: string;
    icon: IconName;
    title: string;
  };
  transitionDirection: AuthTransitionDirection;
  visualStep: EmailLoginVisualStep;
}
