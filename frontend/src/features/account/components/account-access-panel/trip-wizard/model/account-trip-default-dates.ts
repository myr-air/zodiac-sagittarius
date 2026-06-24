const tripDurationDayCount = 3;
const dayInMs = 86_400_000;

export interface AccountTripDefaultDates {
  startDate: string;
  endDate: string;
}

export function accountTripDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultTripStartDate(now = new Date()): string {
  return accountTripDateString(now);
}

export function defaultTripTravelDates(now = new Date()): AccountTripDefaultDates {
  return {
    startDate: defaultTripStartDate(now),
    endDate: accountTripDateString(new Date(now.getTime() + tripDurationDayCount * dayInMs)),
  };
}
