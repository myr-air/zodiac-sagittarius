import { type FormEvent, useState } from "react";
import { Button } from "@/src/ui";
import {
  buildDailyBriefingOverrides,
  weatherDrawerCopy,
} from "./model/weather-briefing-drawer-model";
import {
  briefingBlockClassName,
  textAreaClassName,
} from "./weather-briefing-drawer.styles";
import type { OrganizerOverrideFormProps } from "./weather-briefing-drawer.types";

export function WeatherOrganizerOverrideForm({
  briefing,
  locale,
  onSaveOverrides,
}: OrganizerOverrideFormProps) {
  const copy = weatherDrawerCopy(locale);
  const [outfitAdvice, setOutfitAdvice] = useState(briefing.manualOverrides.outfitAdvice ?? "");
  const [festivalNote, setFestivalNote] = useState(briefing.manualOverrides.festivalNote ?? "");
  const [factsNote, setFactsNote] = useState(briefing.manualOverrides.factsNote ?? "");

  function submitOverrides(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSaveOverrides?.(
      briefing.date,
      briefing.version,
      buildDailyBriefingOverrides({ outfitAdvice, festivalNote, factsNote }),
    );
  }

  return (
    <form className={briefingBlockClassName} onSubmit={submitOverrides}>
      <h3 className="m-0 text-sm font-black">{copy.organizerNotes}</h3>
      <label className="grid gap-1 text-xs font-extrabold text-(--color-text-muted)">
        {copy.outfitOverride}
        <textarea className={textAreaClassName} value={outfitAdvice} onChange={(event) => setOutfitAdvice(event.target.value)} />
      </label>
      <label className="grid gap-1 text-xs font-extrabold text-(--color-text-muted)">
        {copy.festivalOverride}
        <textarea className={textAreaClassName} value={festivalNote} onChange={(event) => setFestivalNote(event.target.value)} />
      </label>
      <label className="grid gap-1 text-xs font-extrabold text-(--color-text-muted)">
        {copy.factsOverride}
        <textarea className={textAreaClassName} value={factsNote} onChange={(event) => setFactsNote(event.target.value)} />
      </label>
      <Button type="submit">{copy.save}</Button>
    </form>
  );
}
