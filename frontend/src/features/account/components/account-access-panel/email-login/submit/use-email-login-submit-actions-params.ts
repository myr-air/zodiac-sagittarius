import type {
  AccountApiClient,
  AccountSession,
  EmailLoginStartResponse,
} from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import type { AuthFlow } from "../../auth";
import type { EmailLoginAuthStep } from "../account-email-login-step-meta";

export interface UseEmailLoginSubmitActionsProps {
  accountClient: AccountApiClient;
  activeFlow: AuthFlow;
  authStep: EmailLoginAuthStep;
  challenge: EmailLoginStartResponse | null;
  code: string;
  displayName: string;
  emailLoginMessages: Messages["access"]["emailLogin"];
  fallbackName: string;
  isEmailValid: boolean;
  locale: Locale;
  messages: Messages["access"]["messages"];
  normalizedEmail: string;
  onError: (message: string | null) => void;
  onLoggedIn: (session: AccountSession) => void;
  otpReady: boolean;
  password: string;
  passwordReady: boolean;
  trustDevice: boolean;
  verifiedRegistrationSession: AccountSession | null;
  goToSetupStep: () => void;
  setChallenge: (challenge: EmailLoginStartResponse | null) => void;
  setVerifiedRegistrationSession: (session: AccountSession | null) => void;
  startResendCooldown: () => void;
  updateCode: (value: string) => void;
}
