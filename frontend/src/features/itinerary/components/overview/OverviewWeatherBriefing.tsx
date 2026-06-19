import { useState } from "react";
import type { Locale } from "@/src/i18n/types";
import type { DailyBriefingOverrides, TripDailyBriefing } from "@/src/trip/types";
import { WeatherBriefingDrawer, WeatherForecastStrip } from "@/src/shared/components/weather";

interface OverviewWeatherBriefingProps {
  canEdit: boolean;
  dailyBriefings: TripDailyBriefing[];
  locale: Locale;
  onSaveDailyBriefingOverrides?: (date: string, version: number, overrides: DailyBriefingOverrides) => void;
}

export function OverviewWeatherBriefing({
  canEdit,
  dailyBriefings,
  locale,
  onSaveDailyBriefingOverrides,
}: OverviewWeatherBriefingProps) {
  const [selectedBriefingDate, setSelectedBriefingDate] = useState<string | null>(null);
  const selectedBriefing = dailyBriefings.find((briefing) => briefing.date === selectedBriefingDate) ?? null;

  return (
    <>
      <WeatherForecastStrip
        briefings={dailyBriefings}
        locale={locale}
        selectedDate={selectedBriefingDate}
        onSelect={setSelectedBriefingDate}
      />
      <WeatherBriefingDrawer
        briefing={selectedBriefing}
        locale={locale}
        canEdit={canEdit}
        isOpen={Boolean(selectedBriefing)}
        onClose={() => setSelectedBriefingDate(null)}
        onSaveOverrides={onSaveDailyBriefingOverrides}
      />
    </>
  );
}
