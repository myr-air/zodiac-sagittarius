/**
 * Account home composition contract (portal shell).
 */

export type AccountHomeDataSource = "placeholder" | "live";

export type AccountHomeComposeArea = {
  id: string;
  dataSource: AccountHomeDataSource;
};

export type AccountHomeComposition = {
  brand: string;
  greeting: { dataSource: AccountHomeDataSource };
  composeAreas: AccountHomeComposeArea[];
};

export const accountHomeComposition: AccountHomeComposition = {
  brand: "Joii",
  greeting: { dataSource: "live" },
  composeAreas: [
    { id: "stories", dataSource: "placeholder" },
    { id: "friends", dataSource: "placeholder" },
    { id: "trips", dataSource: "live" },
    { id: "places", dataSource: "placeholder" },
    { id: "itinerary", dataSource: "live" },
  ],
};
