import type {
  AccountApiClient,
  AccountSession,
  EmailLoginStartResponse,
} from "@/src/account/api-client";
import type { AuthFlow } from "../../auth";
import {
  buildPasskeyLoginFinishInput,
  getPasskeyCredential,
} from "../../auth";
import { ACCOUNT_PROFILE_DEFAULT_AVATAR_COLOR } from "../../model/account-profile-defaults";

const deviceLabel = "";

export function trustedDeviceForFlow(
  activeFlow: AuthFlow,
  trustDevice: boolean,
) {
  return activeFlow === "login" ? trustDevice : true;
}

export async function finishEmailCodeLogin({
  accountClient,
  activeFlow,
  challenge,
  code,
  trustDevice,
}: {
  accountClient: AccountApiClient;
  activeFlow: AuthFlow;
  challenge: EmailLoginStartResponse;
  code: string;
  trustDevice: boolean;
}) {
  return accountClient.finishEmailLogin({
    challengeId: challenge.challengeId,
    code,
    trustDevice: trustedDeviceForFlow(activeFlow, trustDevice),
    deviceLabel,
  });
}

export async function finishEmailPasswordLogin({
  accountClient,
  activeFlow,
  normalizedEmail,
  password,
  trustDevice,
}: {
  accountClient: AccountApiClient;
  activeFlow: AuthFlow;
  normalizedEmail: string;
  password: string;
  trustDevice: boolean;
}) {
  return accountClient.finishPasswordLogin({
    flow: activeFlow,
    email: normalizedEmail,
    password,
    trustDevice: trustedDeviceForFlow(activeFlow, trustDevice),
    deviceLabel,
  });
}

export async function finishEmailRegistrationSetup({
  accountClient,
  displayName,
  fallbackName,
  locale,
  normalizedEmail,
  password,
}: {
  accountClient: AccountApiClient;
  displayName: string;
  fallbackName: string;
  locale: string;
  normalizedEmail: string;
  password: string;
}): Promise<AccountSession> {
  const session = await finishEmailPasswordLogin({
    accountClient,
    activeFlow: "register",
    normalizedEmail,
    password,
    trustDevice: true,
  });
  await accountClient.updateSettings(session.sessionToken, {
    displayName: displayName.trim() || normalizedEmail.split("@")[0] || fallbackName,
    avatarColor: ACCOUNT_PROFILE_DEFAULT_AVATAR_COLOR,
    locale,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  });
  return session;
}

export async function signInWithEmailPasskey({
  accountClient,
  activeFlow,
  normalizedEmail,
  trustDevice,
}: {
  accountClient: AccountApiClient;
  activeFlow: AuthFlow;
  normalizedEmail: string;
  trustDevice: boolean;
}) {
  const loginStart = await accountClient.startPasskeyLogin(normalizedEmail);
  const credential = await getPasskeyCredential(
    loginStart.challenge,
    loginStart.allowCredentials.map((credential) => credential.credentialId),
  );
  return accountClient.finishPasskeyLogin(
    buildPasskeyLoginFinishInput({
      credential,
      loginStart,
      trustDevice: activeFlow === "login" ? trustDevice : false,
    }),
  );
}
