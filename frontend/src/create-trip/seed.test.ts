import { describe, expect, it } from "vitest";
import { composeCreateSeed } from "./seed";

/** Independent place / title literals from mission decisions (not recomputed). */
const PLACE = "Chiang Mai";
const TITLE = "Weekend Escape";
const PRIMARY = "Bangkok";
const OPTIONAL = "Phuket";
const TBD = "TBD";

describe("composeCreateSeed", () => {
  it("accepts destination-only or name-only (derives missing label), rejects empty, supports primary/optional destinations", () => {
    // Destination-only → name ← destination
    const fromDestination = composeCreateSeed({ destination: PLACE });
    expect(fromDestination.ok).toBe(true);
    if (!fromDestination.ok) throw new Error("expected destination-only success");
    expect(fromDestination.seed.name).toBe(PLACE);
    expect(fromDestination.seed.destinationLabel).toBe(PLACE);
    expect(fromDestination.seed.destinations).toEqual([
      { label: PLACE, role: "primary" },
    ]);

    // Name-only → destination ← name / TBD (undecided place placeholder)
    const fromName = composeCreateSeed({ name: TITLE });
    expect(fromName.ok).toBe(true);
    if (!fromName.ok) throw new Error("expected name-only success");
    expect(fromName.seed.name).toBe(TITLE);
    expect(fromName.seed.destinationLabel).toBe(TBD);
    expect(fromName.seed.destinations).toEqual([
      { label: TBD, role: "primary" },
    ]);

    // Both empty (and whitespace-only) → reject
    expect(composeCreateSeed({}).ok).toBe(false);
    expect(composeCreateSeed({ name: "   ", destination: "\t" }).ok).toBe(
      false,
    );
    expect(composeCreateSeed({ destinations: [] }).ok).toBe(false);

    // Primary + optional destination list preserved; name ← primary when omitted
    const fromList = composeCreateSeed({
      destinations: [
        { label: PRIMARY, role: "primary" },
        { label: OPTIONAL, role: "optional" },
      ],
    });
    expect(fromList.ok).toBe(true);
    if (!fromList.ok) throw new Error("expected destinations-list success");
    expect(fromList.seed.name).toBe(PRIMARY);
    expect(fromList.seed.destinationLabel).toBe(PRIMARY);
    expect(fromList.seed.destinations).toEqual([
      { label: PRIMARY, role: "primary" },
      { label: OPTIONAL, role: "optional" },
    ]);
  });
});
