/** Destination place on a create-trip seed (primary = trip area, optional = extra). */
export type CreateSeedDestinationRole = "primary" | "optional";

export type CreateSeedDestination = {
  label: string;
  role: CreateSeedDestinationRole;
};

/** Partial seed before compose fills missing name / destination labels. */
export type ComposeCreateSeedInput = {
  name?: string | null;
  /** Shorthand primary destination (landing / single-place seed). */
  destination?: string | null;
  destinations?: CreateSeedDestination[] | null;
};

export type ComposedCreateSeed = {
  name: string;
  /** Primary destination label for API payloads. */
  destinationLabel: string;
  destinations: CreateSeedDestination[];
};

export type ComposeCreateSeedResult =
  | { ok: true; seed: ComposedCreateSeed }
  | { ok: false; error: string };

const TBD_LABEL = "TBD";

function trimOrEmpty(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Compose a create-trip seed: require name and/or destination(s), derive the
 * missing label, preserve primary/optional destination roles.
 */
export function composeCreateSeed(
  input: ComposeCreateSeedInput,
): ComposeCreateSeedResult {
  const name = trimOrEmpty(input.name);
  const destination = trimOrEmpty(input.destination);

  let destinations: CreateSeedDestination[] | null = null;

  if (Array.isArray(input.destinations) && input.destinations.length > 0) {
    destinations = input.destinations.map((d) => ({
      label: d.label.trim(),
      role: d.role,
    }));
  } else if (destination) {
    destinations = [{ label: destination, role: "primary" }];
  } else if (name) {
    destinations = [{ label: TBD_LABEL, role: "primary" }];
  }

  if (!destinations || destinations.length === 0) {
    return { ok: false, error: "name or destination required" };
  }

  const primary =
    destinations.find((d) => d.role === "primary") ?? destinations[0];
  const destinationLabel = primary.label || TBD_LABEL;

  return {
    ok: true,
    seed: {
      name: name || destinationLabel,
      destinationLabel,
      destinations,
    },
  };
}
