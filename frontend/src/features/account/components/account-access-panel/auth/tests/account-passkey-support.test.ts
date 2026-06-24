import { describe, expect, it } from "vitest";
import {
  buildPasskeyLoginFinishInput,
} from "../account-passkey-support";

describe("account passkey support", () => {
  it("keeps passkey login input helpers available through the support module", () => {
    expect(typeof buildPasskeyLoginFinishInput).toBe("function");
  });
});
