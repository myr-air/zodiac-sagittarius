import { destinationRouteCode } from "./account-trip-destinations";

export function generateJoinId(): string {
  return generateJoinIdForTrip(new Date().toISOString().slice(0, 10), [], randomToken(3));
}

export function generateJoinIdForTrip(startDate: string, destinations: string[], suffix = randomToken(3)): string {
  const date = new Date(`${startDate}T00:00:00`);
  const month = Number.isNaN(date.getTime()) ? "00" : String(date.getMonth() + 1).padStart(2, "0");
  const year = Number.isNaN(date.getTime()) ? "00" : String(date.getFullYear()).slice(-2);
  return `${month}${year}-${destinationRouteCode(destinations)}-${suffix}`.toUpperCase();
}

export function generateJoinPassword(): string {
  return `${randomToken(4)}-${randomToken(4)}`;
}

export function randomToken(length: number): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const values = new Uint8Array(length);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < values.length; index += 1) values[index] = Math.floor(Math.random() * 256);
  }
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}
