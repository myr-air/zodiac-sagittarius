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
  homePreviewFriendsClassName,
  homePreviewGridClassName,
  homePreviewMainClassName,
  homePreviewMenuClassName,
  homePreviewMenuItemClassName,
  homePreviewMetaClassName,
  homePreviewShellClassName,
  homePreviewTitleClassName,
  homePreviewTopbarClassName,
  homeProductPreviewClassName,
} from "./HomeLanding.styles";

interface HomeLandingPreviewProps {
  landing: Messages["homeLanding"];
}

export function HomeLandingPreview({ landing }: HomeLandingPreviewProps) {
  return (
    <div
      className={homeProductPreviewClassName}
      id="features"
      aria-label={landing.preview.label}
    >
      <div className={homePreviewShellClassName}>
        <div className={homePreviewTopbarClassName}>
          <div>
            <p className={homePreviewTitleClassName}>
              {landing.preview.tripTitle}
            </p>
            <strong className={homePreviewMetaClassName}>
              {landing.preview.tripMeta}
            </strong>
          </div>
          <div className={homePreviewFriendsClassName} aria-hidden="true">
            <span />
            <span />
            <span />
            <em>+2</em>
          </div>
        </div>

        <div className={homePreviewGridClassName}>
          <div
            className={homePreviewMenuClassName}
            aria-label={landing.preview.sectionsLabel}
            role="list"
          >
            <span
              className={homePreviewMenuItemClassName}
              data-active="true"
              role="listitem"
            >
              {landing.preview.sections.overview}
            </span>
            <span className={homePreviewMenuItemClassName} role="listitem">
              {landing.preview.sections.itinerary}
            </span>
            <span className={homePreviewMenuItemClassName} role="listitem">
              {landing.preview.sections.map}
            </span>
            <span className={homePreviewMenuItemClassName} role="listitem">
              {landing.preview.sections.budget}
            </span>
            <span className={homePreviewMenuItemClassName} role="listitem">
              {landing.preview.sections.checklist}
            </span>
          </div>

          <div className={homePreviewMainClassName}>
            <div className={homeDayStripClassName}>
              {previewDayKeys.map((dayKey, artIndex) => (
                <article className={homeDayCardClassName} key={dayKey}>
                  <span className={homeDayPillClassName}>
                    {landing.preview.days[dayKey].day}
                  </span>
                  <h2 className={homeDayTitleClassName}>
                    {landing.preview.days[dayKey].title}
                  </h2>
                  <p className={homeDayTextClassName}>
                    {landing.preview.days[dayKey].detail}
                  </p>
                  <div
                    className={homeDayImageClassName}
                    style={{ backgroundPosition: `${artIndex * 33.333}% 50%` }}
                    aria-hidden="true"
                  />
                </article>
              ))}
            </div>

            <div className={homePreviewBottomClassName}>
              <div
                className={homeMapCardClassName}
                aria-label={landing.preview.mapLabel}
              >
                <svg
                  className={homeMapSvgClassName}
                  viewBox="0 0 420 220"
                  role="img"
                  aria-label={landing.preview.mapAria}
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
                  <text x="32" y="192">{landing.preview.mapStops.tokyo}</text>
                  <text x="188" y="146">
                    {landing.preview.mapStops.yokohama}
                  </text>
                  <text x="314" y="126">
                    {landing.preview.mapStops.kamakura}
                  </text>
                </svg>
              </div>

              <div className={homeChecklistCardClassName}>
                <div className={homeChecklistHeaderClassName}>
                  <strong className={homeChecklistTitleClassName}>
                    {landing.preview.sections.checklist}
                  </strong>
                  <span className={homeChecklistProgressClassName}>
                    {landing.preview.checklistProgress}
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
                      data-checked={
                        checkedChecklistKeys.has(itemKey) ? "true" : "false"
                      }
                      key={itemKey}
                    >
                      {landing.preview.checklistItems[itemKey]}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
