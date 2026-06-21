import { expect } from "vitest";

export function expectSourceNotToContain(source: string, blockedTerms: readonly string[]) {
  blockedTerms.forEach((term) => expect(source).not.toContain(term));
}
