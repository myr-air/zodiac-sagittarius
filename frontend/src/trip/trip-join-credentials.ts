export function generateTripJoinId({
  routeCode,
  startDate,
  suffix = randomToken(3),
}: {
  routeCode: string;
  startDate: string;
  suffix?: string;
}): string {
  const date = new Date(`${startDate}T00:00:00`);
  const month = Number.isNaN(date.getTime()) ? "00" : String(date.getMonth() + 1).padStart(2, "0");
  const year = Number.isNaN(date.getTime()) ? "00" : String(date.getFullYear()).slice(-2);
  return `${month}${year}-${routeCode}-${suffix}`.toUpperCase();
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
