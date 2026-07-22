/**
 * Draft enrichByType / fieldsToRail / renderTypeFields keys
 * (itinerary-plan-draft-v1.html). Shared by table + context rail.
 *
 * Soft assumption (M80P3JXX T7 #1): per-stop field bag is calm local state
 * keyed by draft labels (from/to/by/place/meal/…). API `details` examples use
 * origin/destination/mode — ambiguous vs draft keys — so A1 keeps the bag
 * local and maps only clear top-level fields (place → place, travel route →
 * activity) on blur when patching.
 */

export type StopFieldBag = Record<string, string>;

export type TypeFieldKind = "text" | "by" | "meal";

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

export { BY_OPTIONS, MEAL_OPTIONS };

/** Draft fieldsToRail / enrichByType field sets. */
export function typeFieldDefs(activityType: string): TypeFieldDef[] {
  switch (activityType) {
    case "travel":
      return [
        { key: "from", label: "From", kind: "text", line: "primary" },
        { key: "to", label: "To", kind: "text", line: "primary" },
        { key: "by", label: "By", kind: "by", line: "primary" },
        {
          // Activity summary control — keeps activity PATCH / conflict tests
          // working while route From/To/By stay the draft primary set.
          key: "title",
          label: "Title",
          kind: "text",
          placeholder: "Title",
          line: "secondary",
        },
        {
          key: "note",
          label: "Airline · # (optional)",
          kind: "text",
          placeholder: "Airline · # (optional)",
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
        { key: "checkin", label: "Check-in", kind: "text", line: "secondary" },
        {
          key: "checkout",
          label: "Check-out",
          kind: "text",
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
      ];
    case "attraction":
      return [
        {
          key: "place",
          label: "Place",
          kind: "text",
          placeholder: "Attraction / place",
          line: "primary",
        },
        {
          key: "duration",
          label: "Duration",
          kind: "text",
          placeholder: "Duration (e.g. ~90 min)",
          line: "secondary",
        },
      ];
    case "experience":
      return [
        {
          key: "title",
          label: "Title",
          kind: "text",
          placeholder: "Experience title",
          line: "primary",
        },
        {
          key: "meeting",
          label: "Meeting point",
          kind: "text",
          placeholder: "Meeting point",
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
          label: "List",
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
    // Travel rail is From/To/By only (title/note are table-side).
    if (activityType === "travel" && (f.key === "note" || f.key === "title")) {
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
 * Travel: activity "A → B" → from/to; place seeds airline note.
 */
export function seedFieldBag(item: {
  activity: string;
  activityType: string;
  place: string;
}): StopFieldBag {
  const { from, to } = parseTravelRoute(item.activity);
  const bag: StopFieldBag = {
    title: item.activity,
    place: item.place,
    from,
    to,
    note: "",
    by: "",
    meal: "",
    checkin: "",
    checkout: "",
    duration: "",
    meeting: "",
    list: "",
  };
  if (item.activityType === "travel") {
    // Until details exists, airline note lives in API `place`.
    bag.note = item.place;
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
    return route || bag.note || bag.title || "Travel";
  }
  if (activityType === "note") {
    return bag.note || bag.title || "Note";
  }
  if (activityType === "experience" || !activityType || activityType === "default") {
    return bag.title || bag.place || "";
  }
  return bag.place || bag.title || "";
}
