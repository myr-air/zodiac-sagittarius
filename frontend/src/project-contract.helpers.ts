import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";

export const testDir = dirname(fileURLToPath(import.meta.url));
export const frontendRoot = resolve(testDir, "..");
export const repoRoot = resolve(frontendRoot, "..");

export const productCopySourceRoots = [
  "app",
  "src/app",
  "src/components",
  "src/shared/components",
  "src/i18n",
];

export function collectProductCopyFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", "storybook-static"].includes(entry)) continue;
      files.push(...collectProductCopyFiles(path));
      continue;
    }
    if (!/\.[cm]?[jt]sx?$/.test(entry)) continue;
    if (/\.(test|spec|stories)\.[cm]?[jt]sx?$/.test(entry)) continue;
    if (entry === "types.ts" || entry === "api-client.ts") continue;
    files.push(path);
  }
  return files;
}

export function envFileValue(source: string, name: string): string {
  const line = source.split(/\r?\n/).find((entry) => entry.startsWith(`${name}=`));
  expect(line).toBeDefined();
  return line!.slice(name.length + 1).replace(/^"|"$/g, "");
}

export function composeServiceBlock(source: string, serviceName: string): string {
  const marker = `  ${serviceName}:\n`;
  const start = source.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);

  const body = source.slice(start + marker.length);
  const nextServiceStart = body.search(/\n  [A-Za-z0-9_-]+:\n/);
  return nextServiceStart === -1 ? body : body.slice(0, nextServiceStart);
}

export function collectSourceFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((entry) => {
    const filePath = join(root, entry);
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      if ([".next", "coverage", "node_modules", "target"].includes(entry)) return [];
      return collectSourceFiles(filePath);
    }
    return /\.(css|rs|ts|tsx)$/.test(entry) ? [filePath] : [];
  });
}
