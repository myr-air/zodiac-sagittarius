import type {
  AccountApiClient,
  PasskeyLoginStartResponse,
} from "@/src/account/api-client";
import { arrayBufferToBase64Url } from "./account-passkey-codec";

export type PasskeyAssertionCredential = PublicKeyCredential & {
  response: AuthenticatorAssertionResponse;
};

type PasskeyLoginFinishInput = Parameters<AccountApiClient["finishPasskeyLogin"]>[0];

export function buildPasskeyLoginFinishInput({
  credential,
  loginStart,
  trustDevice,
}: {
  credential: PasskeyAssertionCredential;
  loginStart: Pick<PasskeyLoginStartResponse, "challengeId">;
  trustDevice: boolean;
}): PasskeyLoginFinishInput {
  return {
    challengeId: loginStart.challengeId,
    credentialId: arrayBufferToBase64Url(credential.rawId),
    clientDataJson: arrayBufferToBase64Url(credential.response.clientDataJSON),
    authenticatorData: arrayBufferToBase64Url(credential.response.authenticatorData),
    signature: arrayBufferToBase64Url(credential.response.signature),
    trustDevice,
    deviceLabel: "",
  };
}
