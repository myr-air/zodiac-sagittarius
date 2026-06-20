import { describe, expect, it } from "vitest";
import {
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
  buildPasskeyLoginFinishInput,
} from "./account-passkey-support";

describe("account passkey support", () => {
  it("round-trips ArrayBuffers with base64url formatting", () => {
    const bytes = new Uint8Array([251, 255, 254]);
    const encoded = arrayBufferToBase64Url(bytes.buffer);
    expect(encoded).toBe("-__-");
    expect(Array.from(new Uint8Array(base64UrlToArrayBuffer(encoded)))).toEqual([251, 255, 254]);
  });

  it("builds passkey login finish input from assertion credential buffers", () => {
    const credential = {
      rawId: new Uint8Array([1, 2, 3]).buffer,
      response: {
        authenticatorData: new Uint8Array([4, 5, 6]).buffer,
        clientDataJSON: new Uint8Array([7, 8, 9]).buffer,
        signature: new Uint8Array([10, 11, 12]).buffer,
      },
    } as PublicKeyCredential & {
      response: AuthenticatorAssertionResponse;
    };

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
