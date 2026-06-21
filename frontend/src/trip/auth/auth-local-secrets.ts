export function hashLocalSecret(secret: string): string {
  const normalized = secret.trim();
  let hash = 5381;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 33) ^ normalized.charCodeAt(index);
  }
  return `local_hash_${(hash >>> 0).toString(36)}`;
}

export function createLocalSessionToken(): string {
  const webCrypto = (globalThis as { crypto?: Crypto }).crypto;
  if (webCrypto && "randomUUID" in webCrypto) return `local-${webCrypto.randomUUID()}`;
  const randomValue = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `local-${randomValue}`;
}
