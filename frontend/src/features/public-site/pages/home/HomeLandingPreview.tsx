import type { Messages } from "@/src/i18n/messages";
import { HomePreviewMain, HomePreviewMenu } from "./HomeLandingPreview.sections";
import {
  homePreviewFriendsClassName,
  homePreviewGridClassName,
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
          <HomePreviewMenu preview={landing.preview} />
          <HomePreviewMain preview={landing.preview} />
        </div>
      </div>
    </div>
  );
}
