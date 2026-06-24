export type AccountSessionKind = "temporary" | "trusted";

export interface AccountSession {
  userId: string;
  sessionToken: string;
  kind: AccountSessionKind;
  trustedDeviceId: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface EmailLoginStartResponse {
  challengeId: string;
  expiresAt: string;
}

export interface PasskeyChallengeResponse {
  challengeId: string;
  challenge: string;
  expiresAt: string;
}

export interface PasskeyLoginStartResponse extends PasskeyChallengeResponse {
  allowCredentials: Array<{ credentialId: string }>;
}
