export function fetchRequestUrl(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : String(input);
}
