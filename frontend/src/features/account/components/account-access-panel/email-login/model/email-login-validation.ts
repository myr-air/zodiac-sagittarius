export const emailLoginEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const emailLoginOtpPattern = /^\d{6}$/;
export const emailLoginMinPasswordLength = 8;

export function normalizeEmailLoginEmail(email: string) {
  return email.trim();
}

export function isEmailLoginEmailValid(email: string) {
  return emailLoginEmailPattern.test(email);
}

export function isEmailLoginOtpReady(code: string) {
  return emailLoginOtpPattern.test(code);
}

export function isEmailLoginPasswordReady(password: string) {
  return password.length >= emailLoginMinPasswordLength;
}
