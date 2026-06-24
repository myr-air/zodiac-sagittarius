import { expect } from "vitest";

export function expectSourceToContain(source: string, requiredTerms: readonly string[]) {
  requiredTerms.forEach((term) => expect(source).toContain(term));
}

export function expectSourceNotToContain(source: string, blockedTerms: readonly string[]) {
  blockedTerms.forEach((term) => expect(source).not.toContain(term));
}
