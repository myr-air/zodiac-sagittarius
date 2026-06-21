import { getTripDates } from "../itinerary";
import { seedTrip } from "../seed";

const tripDates = getTripDates(seedTrip.startDate, seedTrip.endDate);

export const arrivalDay = tripDates[0] ?? seedTrip.startDate;
export const hongKongDay = tripDates[1] ?? seedTrip.startDate;
export const shenzhenDay = tripDates[2] ?? seedTrip.endDate;
