import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const emailLoginDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readEmailLoginSource(fileName: string) {
  return readFileSync(join(emailLoginDir, fileName), "utf8");
}

describe("account email login structure", () => {
  it("keeps the panel shell split from step rendering", () => {
    const panelSource = readEmailLoginSource("account-email-login-panel.tsx");
    const stageSource = readEmailLoginSource("account-email-login-step-stage.tsx");
    const dispatchSource = readEmailLoginSource("account-email-login-step-dispatch.tsx");
    const stepTypesSource = readEmailLoginSource("account-email-login-step.types.ts");

    expect(panelSource).toContain("EmailLoginStepStage");
    expect(panelSource).not.toContain("EmailLoginOtpStep");
    expect(stageSource).toContain("EmailLoginStepContent");
    expect(stageSource).toContain("./account-email-login-step.types");
    expect(stageSource).not.toContain("interface EmailLoginStepStageProps");
    expect(stageSource).not.toContain("EmailLoginOtpStep");
    expect(stageSource).not.toContain("EmailLoginCredentialsStep");
    expect(stageSource).not.toContain("EmailLoginMethodsStep");
    expect(stageSource).not.toContain("EmailLoginPasswordStep");
    expect(stageSource).not.toContain("EmailLoginSetupStep");
    expect(dispatchSource).toContain("export function EmailLoginStepContent");
    expect(dispatchSource).toContain("./account-email-login-step.types");
    expect(dispatchSource).not.toContain("interface EmailLoginStepContentProps");
    expect(dispatchSource).toContain("EmailLoginOtpStep");
    expect(dispatchSource).toContain("EmailLoginCredentialsStep");
    expect(dispatchSource).toContain("EmailLoginMethodsStep");
    expect(dispatchSource).toContain("EmailLoginPasswordStep");
    expect(dispatchSource).toContain("EmailLoginSetupStep");
    expect(stepTypesSource).toContain("export interface EmailLoginStepContentProps");
    expect(stepTypesSource).toContain("export interface EmailLoginStepStageProps extends EmailLoginStepContentProps");
  });
});
