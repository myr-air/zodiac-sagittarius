/**
 * Draft enrichByType / fieldsToRail / renderTypeFields keys
 * (itinerary-plan-draft-v1.html / day-workspace-theme-a-draft-v9).
 * Shared by table + context rail.
 *
 * Soft assumption (M80P3JXX T7 #1): per-stop field bag is calm local state
 * keyed by draft labels (from/to/by/place/meal/…). API `details` examples use
 * origin/destination/mode — ambiguous vs draft keys — so A1 keeps the bag
 * local and maps only clear top-level fields (place → place, travel route →
 * activity) on blur when patching.
 *
 * Day-editor field matrix (M80VKAX5): primary ≤3 scan fields; By/Action
 * support for booking detail; no Duration in type setup; travel title is
 * derived From → To (not a visible field).
 */

export type StopFieldBag = Record<string, string>;

export type TypeFieldKind = "text" | "by" | "meal" | "stayAction";

export type TypeFieldDef = {
  key: string;
  label: string;
  kind: TypeFieldKind;
  /** Draft placeholder / secondary hint. */
  placeholder?: string;
  /** "primary" | "secondary" line in the stop body. */
  line: "primary" | "secondary";
};

const BY_OPTIONS = [
  "",
  "flight",
  "train",
  "bus",
  "taxi",
  "ferry",
  "walk",
  "car",
  "shuttle",
] as const;

const MEAL_OPTIONS = ["", "Breakfast", "Lunch", "Dinner", "Snack"] as const;

/** One hotel-visit action per Stay stop (not check-in + check-out together). */
const STAY_ACTION_OPTIONS = [
  "",
  "checkin",
  "drop",
  "rest",
  "checkout",
] as const;

const STAY_ACTION_LABEL: Record<string, string> = {
  checkin: "Check-in",
  drop: "Drop item",
  rest: "Rest",
  checkout: "Check-out",
};

export { BY_OPTIONS, MEAL_OPTIONS, STAY_ACTION_OPTIONS, STAY_ACTION_LABEL };

/** Draft fieldsToRail / enrichByType field sets. */
export function typeFieldDefs(activityType: string): TypeFieldDef[] {
  switch (activityType) {
    case "travel":
      return [
        { key: "from", label: "From", kind: "text", line: "primary" },
        { key: "to", label: "To", kind: "text", line: "primary" },
        { key: "by", label: "By", kind: "by", line: "primary" },
        {
          key: "carrier",
          label: "Carrier",
          kind: "text",
          placeholder: "Airline / operator / app",
          line: "secondary",
        },
        {
          key: "ref",
          label: "Ref",
          kind: "text",
          placeholder: "Flight # · booking ref",
          line: "secondary",
        },
      ];
    case "stay":
      return [
        {
          key: "place",
          label: "Place",
          kind: "text",
          placeholder: "Hotel / place",
          line: "primary",
        },
        {
          key: "action",
          label: "Action",
          kind: "stayAction",
          line: "primary",
        },
        {
          key: "note",
          label: "Detail",
          kind: "text",
          placeholder: "Room · bag drop · note (optional)",
          line: "secondary",
        },
      ];
    case "food":
      return [
        {
          key: "place",
          label: "Place",
          kind: "text",
          placeholder: "Restaurant / place",
          line: "primary",
        },
        { key: "meal", label: "Meal", kind: "meal", line: "primary" },
        {
          key: "reservation",
          label: "Reservation",
          kind: "text",
          placeholder: "Name · booking # (optional)",
          line: "secondary",
        },
      ];
    case "attraction":
      return [
        {
          key: "place",
          label: "Place",
          kind: "text",
          placeholder: "Attraction name",
          line: "primary",
        },
        {
          key: "ticket",
          label: "Ticket",
          kind: "text",
          placeholder: "Ticket · booking # (optional)",
          line: "secondary",
        },
        {
          key: "note",
          label: "Note",
          kind: "text",
          placeholder: "Entry tip (optional)",
          line: "secondary",
        },
      ];
    case "experience":
      return [
        {
          key: "title",
          label: "Activity",
          kind: "text",
          placeholder: "e.g. Cooking class · night safari",
          line: "primary",
        },
        {
          key: "meeting",
          label: "Meet at",
          kind: "text",
          placeholder: "Where the group meets (lobby, gate…)",
          line: "secondary",
        },
        {
          key: "ticket",
          label: "Booking",
          kind: "text",
          placeholder: "Provider · booking # (optional)",
          line: "secondary",
        },
      ];
    case "shopping":
      return [
        {
          key: "place",
          label: "Place",
          kind: "text",
          placeholder: "Store / area",
          line: "primary",
        },
        {
          key: "list",
          label: "To get",
          kind: "text",
          placeholder: "What to get",
          line: "secondary",
        },
      ];
    case "note":
      return [
        { key: "note", label: "Note", kind: "text", line: "primary" },
        {
          key: "place",
          label: "Place",
          kind: "text",
          placeholder: "Place (optional)",
          line: "secondary",
        },
      ];
    default:
      return [
        {
          key: "title",
          label: "Title",
          kind: "text",
          placeholder: "Title / note",
          line: "primary",
        },
        {
          key: "place",
          label: "Place",
          kind: "text",
          placeholder: "Place (optional)",
          line: "secondary",
        },
      ];
  }
}

/** Rail-only labels (draft fieldsToRail) — same keys as typeFieldDefs. */
export function fieldsToRail(activityType: string): TypeFieldDef[] {
  return typeFieldDefs(activityType).filter((f) => {
    // Travel rail is From/To/By only (carrier/ref are table-side / By-support).
    if (
      activityType === "travel" &&
      (f.key === "carrier" || f.key === "ref" || f.key === "note" || f.key === "title")
    ) {
      return false;
    }
    return true;
  });
}

/** Parse draft travel route "From → To" from activity summary. */
export function parseTravelRoute(activity: string): {
  from: string;
  to: string;
} {
  const parts = activity.split(/\s*→\s*/);
  if (parts.length >= 2) {
    return {
      from: parts[0]!.trim(),
      to: parts.slice(1).join(" → ").trim(),
    };
  }
  return { from: "", to: "" };
}

/**
 * Seed bag from cockpit summary fields.
 * Travel: activity "A → B" → from/to; place seeds carrier until details exist.
 *
 * M82GSOYG T2: when `item.details` carries origin/destination/mode/meal
 * (from an earlier T1-style PATCH), hydrate from/to/by/meal from there so a
 * reload doesn't lose the typed extras. Older/local items with no details
 * still fall back to the legacy activity-route + place seed.
 */
export function seedFieldBag(item: {
  activity: string;
  activityType: string;
  place: string;
  details?: Record<string, unknown> | null;
}): StopFieldBag {
  const details = item.details ?? undefined;
  const routeFromDetails =
    typeof details?.origin === "string" || typeof details?.destination === "string";
  const { from: legacyFrom, to: legacyTo } = parseTravelRoute(item.activity);
  const from = routeFromDetails
    ? (details?.origin as string | undefined) ?? ""
    : legacyFrom;
  const to = routeFromDetails
    ? (details?.destination as string | undefined) ?? ""
    : legacyTo;
  const by = typeof details?.mode === "string" ? details.mode : "";
  const meal = typeof details?.meal === "string" ? details.meal : "";
  const bag: StopFieldBag = {
    title: item.activity,
    place: item.place,
    from,
    to,
    note: "",
    by,
    meal,
    action: "",
    checkin: "",
    checkout: "",
    ticket: "",
    meeting: "",
    list: "",
    carrier: "",
    ref: "",
    reservation: "",
  };
  if (item.activityType === "travel" && !routeFromDetails) {
    // Until details exists, carrier/booking lives in API `place`.
    bag.carrier = item.place;
  }
  return bag;
}

/** Draft activitySummary for travel / place-primary types. */
export function activitySummaryFromBag(
  activityType: string,
  bag: StopFieldBag,
): string {
  if (activityType === "travel") {
    const route = [bag.from, bag.to].filter(Boolean).join(" → ");
    return route || bag.title || "Travel";
  }
  if (activityType === "note") {
    return bag.note || bag.title || "Note";
  }
  if (activityType === "experience" || !activityType || activityType === "default") {
    return bag.title || bag.place || "";
  }
  return bag.place || bag.title || "";
}

/**
 * Whether a draft bag key maps onto an existing /api/v1 itinerary-item PATCH
 * field (same soft-map as the Smart Itinerary Table). Non-mappable keys must
 * stay read-only in the rail — not silent local-only writes.
 */
export function isBagKeyPersistable(
  activityType: string,
  key: string,
): boolean {
  if (key === "place" || key === "title" || key === "by" || key === "meal") {
    return true;
  }
  if (
    activityType === "travel" &&
    (key === "carrier" || key === "ref" || key === "from" || key === "to")
  ) {
    return true;
  }
  return false;
}

/** Soft-map result aligned with ItineraryItemPatchFields (table write path). */
export type SoftMappedItemPatch = {
  place?: string;
  activity?: string;
  activitySubtype?: string | null;
  details?: Record<string, unknown>;
};

/**
 * Map a draft bag key/value to documented top-level PATCH fields.
 * Mirrors SmartItineraryTable commitBagKey soft-map (place, By→activitySubtype,
 * Meal→details.meal, travel route→activity, carrier/ref→place).
 * Returns null when the key has no persistence target or the value is unchanged.
 */
export function softMapBagKeyToPatch(input: {
  activityType: string;
  key: string;
  value: string;
  bag: StopFieldBag;
  /** Current API place — skip place/carrier patches when unchanged. */
  currentPlace?: string;
  /** Current API activity — skip title/route patches when unchanged. */
  currentActivity?: string;
  /**
   * Current API `details` (object only). `details` is coalesced (replaces the
   * whole column) on PATCH, so from/to/by/meal patches must merge into a
   * shallow copy of this instead of returning only the new field — otherwise
   * sibling detail fields (origin/destination/bookingRef, …) get wiped.
   */
  currentDetails?: Record<string, unknown> | null;
}): SoftMappedItemPatch | null {
  const { activityType, key, value, bag } = input;
  const baseDetails: Record<string, unknown> =
    input.currentDetails && typeof input.currentDetails === "object"
      ? { ...input.currentDetails }
      : {};

  if (key === "place") {
    if (input.currentPlace !== undefined && value === input.currentPlace) {
      return null;
    }
    return { place: value };
  }
  if (key === "title") {
    if (
      input.currentActivity !== undefined &&
      value === input.currentActivity
    ) {
      return null;
    }
    return { activity: value };
  }
  if (
    (key === "carrier" || key === "ref") &&
    activityType === "travel"
  ) {
    const combined = [bag.carrier, bag.ref].filter(Boolean).join(" · ");
    if (
      input.currentPlace !== undefined &&
      combined === input.currentPlace
    ) {
      return null;
    }
    return { place: combined };
  }
  if ((key === "from" || key === "to") && activityType === "travel") {
    const details: Record<string, unknown> = { ...baseDetails };
    if (bag.from) details.origin = bag.from;
    if (bag.to) details.destination = bag.to;
    const summary = activitySummaryFromBag(activityType, bag);
    if (!summary) {
      return Object.keys(details).length > 0 ? { details } : null;
    }
    if (
      input.currentActivity !== undefined &&
      summary === input.currentActivity
    ) {
      return Object.keys(details).length > 0 ? { details } : null;
    }
    return { activity: summary, details };
  }
  if (key === "by") {
    return {
      activitySubtype: value || null,
      details: { ...baseDetails, mode: value },
    };
  }
  if (key === "meal") {
    return { details: { ...baseDetails, meal: value } };
  }
  return null;
}
