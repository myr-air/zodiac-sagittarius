export function noop(): void {
  return undefined;
}

export function asyncNoop(): Promise<void> {
  return Promise.resolve();
}
