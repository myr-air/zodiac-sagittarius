export const memberPasswordMinLength = 4;

export function buildMemberPasswordInput(value: string): string | null {
  const password = value.trim();
  return password.length >= memberPasswordMinLength ? password : null;
}
