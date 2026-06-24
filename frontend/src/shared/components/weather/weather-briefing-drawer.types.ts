import type { Locale } from "@/src/i18n/types";
import type {
  DailyBriefingOverrides,
  TextBriefingBlock,
  TripDailyBriefing,
} from "@/src/trip/types";

export type WeatherBriefingOverrideSaveHandler = (
  date: string,
  version: number,
  overrides: DailyBriefingOverrides,
) => void;

export interface WeatherBriefingDrawerProps {
  briefing: TripDailyBriefing | null;
  locale: Locale;
  canEdit: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSaveOverrides?: WeatherBriefingOverrideSaveHandler;
}

export interface OrganizerOverrideFormProps {
  briefing: TripDailyBriefing;
  locale: Locale;
  onSaveOverrides?: WeatherBriefingOverrideSaveHandler;
}

export interface WeatherTextBlockProps {
  title: string;
  block: TextBriefingBlock | null;
  locale: Locale;
}

export interface WeatherSourceMetaProps {
  source?: string;
  fetchedAt?: string | null;
  expiresAt?: string | null;
  locale: Locale;
}
