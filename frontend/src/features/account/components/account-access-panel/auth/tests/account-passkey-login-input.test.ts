import { describe, expect, it } from "vitest";
import {
  buildPasskeyLoginFinishInput,
  type PasskeyAssertionCredential,
} from "../account-passkey-login-input";

describe("account passkey login input", () => {
  it("builds passkey login finish input from assertion credential buffers", () => {
    const credential = {
      rawId: new Uint8Array([1, 2, 3]).buffer,
      response: {
        authenticatorData: new Uint8Array([4, 5, 6]).buffer,
        clientDataJSON: new Uint8Array([7, 8, 9]).buffer,
        signature: new Uint8Array([10, 11, 12]).buffer,
      },
    } as PasskeyAssertionCredential;

    expect(
      buildPasskeyLoginFinishInput({
        credential,
        loginStart: { challengeId: "challenge-1" },
        trustDevice: true,
      }),
    ).toEqual({
      authenticatorData: "BAUG",
      challengeId: "challenge-1",
      clientDataJson: "BwgJ",
      credentialId: "AQID",
      deviceLabel: "",
      signature: "CgsM",
      trustDevice: true,
    });
  });
});
