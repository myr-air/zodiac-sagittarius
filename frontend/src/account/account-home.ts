/**
 * Account home composition contract (draft v3).
 */

export type AccountHomeDataSource = "placeholder" | "live";

export type AccountHomeNavItem = {
  label: string;
  current: boolean;
};

export type AccountHomeComposeArea = {
  id: string;
  dataSource: AccountHomeDataSource;
};

export type AccountHomeComposition = {
  brand: string;
  topNav: AccountHomeNavItem[];
  greeting: { dataSource: AccountHomeDataSource };
  composeAreas: AccountHomeComposeArea[];
};

export const accountHomeComposition: AccountHomeComposition = {
  brand: "Joii",
  topNav: [
    { label: "Home", current: true },
    { label: "My Bookings", current: false },
    { label: "Itinerary", current: false },
    { label: "Community", current: false },
    { label: "Money Changer", current: false },
  ],
  greeting: { dataSource: "live" },
  composeAreas: [
    { id: "stories", dataSource: "placeholder" },
    { id: "friends", dataSource: "placeholder" },
    { id: "trips", dataSource: "live" },
    { id: "places", dataSource: "placeholder" },
    { id: "itinerary", dataSource: "live" },
  ],
};
