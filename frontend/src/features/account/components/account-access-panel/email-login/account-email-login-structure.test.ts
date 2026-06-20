import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const emailLoginDir = dirname(fileURLToPath(import.meta.url));

function readEmailLoginSource(fileName: string) {
  return readFileSync(join(emailLoginDir, fileName), "utf8");
}

describe("account email login structure", () => {
  it("keeps the panel shell split from step rendering", () => {
    const panelSource = readEmailLoginSource("account-email-login-panel.tsx");
    const stageSource = readEmailLoginSource("account-email-login-step-stage.tsx");

    expect(panelSource).toContain("EmailLoginStepStage");
    expect(panelSource).not.toContain("EmailLoginOtpStep");
    expect(stageSource).toContain("EmailLoginOtpStep");
    expect(stageSource).toContain("EmailLoginCredentialsStep");
    expect(stageSource).toContain("EmailLoginMethodsStep");
    expect(stageSource).toContain("EmailLoginPasswordStep");
    expect(stageSource).toContain("EmailLoginSetupStep");
  });
});
