import type { Messages } from "@/src/i18n/messages";
import { cn } from "@/src/lib/cn";
import {
  checkedChecklistKeys,
  checklistKeys,
  previewDayKeys,
} from "./HomeLanding.meta";
import {
  homeChecklistCardClassName,
  homeChecklistHeaderClassName,
  homeChecklistItemClassName,
  homeChecklistListClassName,
  homeChecklistMeterClassName,
  homeChecklistProgressClassName,
  homeChecklistTitleClassName,
  homeDayCardClassName,
  homeDayImageClassName,
  homeDayPillClassName,
  homeDayStripClassName,
  homeDayTextClassName,
  homeDayTitleClassName,
  homeMapCardClassName,
  homeMapRouteClassName,
  homeMapSvgClassName,
  homeMapWaterClassName,
  homePreviewBottomClassName,
  homePreviewMainClassName,
  homePreviewMenuClassName,
  homePreviewMenuItemClassName,
} from "./HomeLanding.styles";

type HomeLandingPreviewCopy = Messages["homeLanding"]["preview"];

export function HomePreviewMenu({ preview }: { preview: HomeLandingPreviewCopy }) {
  return (
    <div
      className={homePreviewMenuClassName}
      aria-label={preview.sectionsLabel}
      role="list"
    >
      <span
        className={homePreviewMenuItemClassName}
        data-active="true"
        role="listitem"
      >
        {preview.sections.overview}
      </span>
      <span className={homePreviewMenuItemClassName} role="listitem">
        {preview.sections.itinerary}
      </span>
      <span className={homePreviewMenuItemClassName} role="listitem">
        {preview.sections.map}
      </span>
      <span className={homePreviewMenuItemClassName} role="listitem">
        {preview.sections.budget}
      </span>
      <span className={homePreviewMenuItemClassName} role="listitem">
        {preview.sections.checklist}
      </span>
    </div>
  );
}

export function HomePreviewMain({ preview }: { preview: HomeLandingPreviewCopy }) {
  return (
    <div className={homePreviewMainClassName}>
      <HomePreviewDayStrip preview={preview} />

      <div className={homePreviewBottomClassName}>
        <HomePreviewMap preview={preview} />
        <HomePreviewChecklist preview={preview} />
      </div>
    </div>
  );
}

function HomePreviewDayStrip({ preview }: { preview: HomeLandingPreviewCopy }) {
  return (
    <div className={homeDayStripClassName}>
      {previewDayKeys.map((dayKey, artIndex) => (
        <article className={homeDayCardClassName} key={dayKey}>
          <span className={homeDayPillClassName}>
            {preview.days[dayKey].day}
          </span>
          <h2 className={homeDayTitleClassName}>
            {preview.days[dayKey].title}
          </h2>
          <p className={homeDayTextClassName}>
            {preview.days[dayKey].detail}
          </p>
          <div
            className={homeDayImageClassName}
            style={{ backgroundPosition: `${artIndex * 33.333}% 50%` }}
            aria-hidden="true"
          />
        </article>
      ))}
    </div>
  );
}

function HomePreviewMap({ preview }: { preview: HomeLandingPreviewCopy }) {
  return (
    <div
      className={homeMapCardClassName}
      aria-label={preview.mapLabel}
    >
      <svg
        className={homeMapSvgClassName}
        viewBox="0 0 420 220"
        role="img"
        aria-label={preview.mapAria}
      >
        <path
          className={homeMapWaterClassName}
          d="M280 0h140v220H244c52-42 64-83 36-132-13-23-13-52 0-88Z"
        />
        <path
          className={homeMapRouteClassName}
          d="M62 158C122 92 170 77 223 113s84 29 132-20"
        />
        <circle cx="62" cy="158" r="12" />
        <circle cx="223" cy="113" r="12" />
        <circle cx="355" cy="93" r="12" />
        <text x="32" y="192">{preview.mapStops.tokyo}</text>
        <text x="188" y="146">
          {preview.mapStops.yokohama}
        </text>
        <text x="314" y="126">
          {preview.mapStops.kamakura}
        </text>
      </svg>
    </div>
  );
}

function HomePreviewChecklist({ preview }: { preview: HomeLandingPreviewCopy }) {
  return (
    <div className={homeChecklistCardClassName}>
      <div className={homeChecklistHeaderClassName}>
        <strong className={homeChecklistTitleClassName}>
          {preview.sections.checklist}
        </strong>
        <span className={homeChecklistProgressClassName}>
          {preview.checklistProgress}
        </span>
      </div>
      <meter
        className={homeChecklistMeterClassName}
        min="0"
        max="100"
        value="75"
      >
        75%
      </meter>
      <ul className={homeChecklistListClassName}>
        {checklistKeys.map((itemKey) => (
          <li
            className={cn(
              homeChecklistItemClassName,
              checkedChecklistKeys.has(itemKey)
                ? "line-through text-(--color-text-subtle) font-medium"
                : "text-(--color-text) font-bold",
            )}
            data-checked={checkedChecklistKeys.has(itemKey) ? "true" : "false"}
            key={itemKey}
          >
            {preview.checklistItems[itemKey]}
          </li>
        ))}
      </ul>
    </div>
  );
}
