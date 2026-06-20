import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const emailLoginDir = dirname(fileURLToPath(import.meta.url));

function readEmailLoginSource(fileName: string) {
  return readFileSync(join(emailLoginDir, fileName), "utf8");
}

describe("email login state structure", () => {
  it("keeps resend cooldown timer state out of the main login panel hook", () => {
    const panelState = readEmailLoginSource("use-email-login-panel-state.ts");
    const resendCooldown = readEmailLoginSource("use-email-login-resend-cooldown.ts");

    expect(panelState).toContain("useEmailLoginResendCooldown");
    expect(panelState).not.toContain("window.setInterval");
    expect(panelState).not.toContain("useState(0)");
    expect(panelState).not.toMatch(/const \[resendCooldown,\s*setResendCooldown\]/);
    expect(resendCooldown).toContain("export function useEmailLoginResendCooldown");
    expect(resendCooldown).toContain("window.setInterval");
    expect(resendCooldown).toContain("resendCooldownSeconds");
  });
});
