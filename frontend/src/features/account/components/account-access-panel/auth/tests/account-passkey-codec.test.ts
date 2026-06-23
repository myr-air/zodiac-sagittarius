import { describe, expect, it } from "vitest";
import {
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
} from "../account-passkey-codec";

describe("account passkey codec", () => {
  it("round-trips ArrayBuffers with base64url formatting", () => {
    const bytes = new Uint8Array([251, 255, 254]);
    const encoded = arrayBufferToBase64Url(bytes.buffer);

    expect(encoded).toBe("-__-");
    expect(Array.from(new Uint8Array(base64UrlToArrayBuffer(encoded)))).toEqual([251, 255, 254]);
  });

  it("decodes unpadded base64url challenges", () => {
    expect(Array.from(new Uint8Array(base64UrlToArrayBuffer("AQID")))).toEqual([1, 2, 3]);
  });
});
