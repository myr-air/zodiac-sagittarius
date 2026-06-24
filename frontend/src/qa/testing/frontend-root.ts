import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));

export const frontendRoot = resolve(testDir, "../../..");

export function frontendPath(...segments: string[]): string {
  return join(frontendRoot, ...segments);
}

export function readFrontendText(...segments: string[]): string {
  return readFileSync(frontendPath(...segments), "utf8");
}

export function readFrontendPackageJson(): { scripts?: Record<string, string> } {
  return JSON.parse(readFrontendText("package.json")) as {
    scripts?: Record<string, string>;
  };
}
