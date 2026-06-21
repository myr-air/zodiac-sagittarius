import { seedTrip } from "../../../seed";
import { getTripDates } from "../../../itinerary";

const tripDates = getTripDates(seedTrip.startDate, seedTrip.endDate);

export const arrivalDay = tripDates[0] ?? seedTrip.startDate;
export const hongKongDay = tripDates[1] ?? seedTrip.startDate;
export const shenzhenDay = tripDates[2] ?? seedTrip.endDate;
