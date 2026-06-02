type ClassValue = string | false | null | undefined | ClassValue[];

export function cn(...values: ClassValue[]): string {
  return values.flatMap(classTokens).join(" ");
}

function classTokens(value: ClassValue): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(classTokens);
  return [value];
}
