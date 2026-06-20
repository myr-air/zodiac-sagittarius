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

  it("keeps form field state and code normalization out of the main login panel hook", () => {
    const panelState = readEmailLoginSource("use-email-login-panel-state.ts");
    const formState = readEmailLoginSource("use-email-login-form-state.ts");

    expect(panelState).toContain("useEmailLoginFormState");
    expect(panelState).not.toMatch(/const \[email,\s*setEmail\]/);
    expect(panelState).not.toMatch(/const \[password,\s*setPassword\]/);
    expect(panelState).not.toMatch(/const \[code,\s*setCode\]/);
    expect(panelState).not.toContain("replace(/\\D/g");
    expect(formState).toContain("export function useEmailLoginFormState");
    expect(formState).toContain("function updateCode");
    expect(formState).toContain("resetEntryFields");
  });
});
