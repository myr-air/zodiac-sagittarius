export interface GeneratedSubPath {
  pathId: string;
  pathName: string;
}

const generatedSubPathPattern = /^path-(\d{4}-\d{2}-\d{2})-sub-([a-z]+)$/i;
const subPathLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generatedDayFromSubPathId(pathId: string): string | null {
  return pathId.match(generatedSubPathPattern)?.[1] ?? null;
}

export function generatedSubPathForIndex(
  day: string,
  index: number,
): GeneratedSubPath {
  const label = generatedSubPathLabel(index);
  return {
    pathId: `path-${day}-sub-${label.toLowerCase()}`,
    pathName: generatedSubPathName(index),
  };
}

export function generatedSubPathIndexFromId(pathId: string): number {
  const value = pathId.match(generatedSubPathPattern)?.[2]?.toUpperCase();
  if (!value) return -1;
  if (value.length === 1) return subPathLetters.indexOf(value);
  if (value.length === 2)
    return (
      (subPathLetters.indexOf(value[0] ?? "A") + 1) *
        subPathLetters.length +
      subPathLetters.indexOf(value[1] ?? "A")
    );
  return -1;
}

export function generatedSubPathNameFromId(pathId: string): string | null {
  const index = generatedSubPathIndexFromId(pathId);
  return index >= 0 ? generatedSubPathName(index) : null;
}

function generatedSubPathName(index: number): string {
  return `Plan ${generatedSubPathLabel(index)}`;
}

function generatedSubPathLabel(index: number): string {
  if (index < subPathLetters.length) return subPathLetters[index] ?? "A";
  const prefix =
    subPathLetters[Math.floor(index / subPathLetters.length) - 1] ?? "Z";
  const suffix = subPathLetters[index % subPathLetters.length] ?? "Z";
  return `${prefix}${suffix}`;
}
