const knownDestinationCountries: Array<[string, string[]]> = [
  ["hong kong", ["Hong Kong", "China"]],
  ["shenzhen", ["Hong Kong", "China"]],
  ["macau", ["Macau", "China"]],
  ["thailand", ["Thailand"]],
  ["bangkok", ["Thailand"]],
  ["chiang mai", ["Thailand"]],
  ["japan", ["Japan"]],
  ["tokyo", ["Japan"]],
  ["osaka", ["Japan"]],
  ["south korea", ["South Korea"]],
  ["seoul", ["South Korea"]],
  ["taiwan", ["Taiwan"]],
  ["taipei", ["Taiwan"]],
  ["singapore", ["Singapore"]],
  ["malaysia", ["Malaysia"]],
  ["vietnam", ["Vietnam"]],
  ["indonesia", ["Indonesia"]],
  ["china", ["China"]],
];

export function deriveTripCountriesFromDestination(
  destinationLabel: string,
  fallbackCountries: string[],
): string[] {
  const destination = destinationLabel.toLowerCase();
  const countries = knownDestinationCountries.flatMap(([keyword, countries]) =>
    destination.includes(keyword) ? countries : [],
  );
  const uniqueCountries = Array.from(new Set(countries));
  return uniqueCountries.length ? uniqueCountries : fallbackCountries;
}
