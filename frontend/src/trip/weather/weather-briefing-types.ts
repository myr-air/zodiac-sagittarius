export interface BriefingCoordinates {
  lat: number;
  lng: number;
}

export interface BriefingSourceMeta {
  source: string;
  sourceUrl: string | null;
  fetchedAt: string | null;
  expiresAt: string | null;
  confidence: "high" | "medium" | "low" | "unknown";
  unavailableReason: string | null;
}

export interface WeatherBriefingBlock {
  conditionCode: string;
  conditionLabel: string;
  temperatureMaxCelsius: number | null;
  temperatureMinCelsius: number | null;
  apparentTemperatureMaxCelsius?: number | null;
  apparentTemperatureMinCelsius?: number | null;
  sunrise: string | null;
  sunset: string | null;
  daylightDurationSeconds?: number | null;
  sunshineDurationSeconds?: number | null;
  uvIndexMax?: number | null;
  precipitationSumMm?: number | null;
  precipitationHours?: number | null;
  rainSumMm?: number | null;
  humidityPercent: number | null;
  windSpeedKph: number | null;
  windGustsKph?: number | null;
  windDirectionDegrees?: number | null;
  cloudCoverMeanPercent?: number | null;
  visibilityMeanMeters?: number | null;
  visibilityMinMeters?: number | null;
  dewPointMeanCelsius?: number | null;
  pressureMslMeanHpa?: number | null;
  rainChancePercent: number | null;
  meta: BriefingSourceMeta;
}

export interface TextBriefingBlock {
  title: string;
  body: string;
  meta: BriefingSourceMeta;
}

export interface DailyBriefingOverrides {
  dayTitle?: string | null;
  outfitAdvice?: string | null;
  festivalNote?: string | null;
  factsNote?: string | null;
}

export interface TripDailyBriefing {
  tripId: string;
  date: string;
  locationKey: string;
  locationLabel: string;
  coordinates: BriefingCoordinates | null;
  weather: WeatherBriefingBlock | null;
  holiday: TextBriefingBlock | null;
  festival: TextBriefingBlock | null;
  facts: TextBriefingBlock | null;
  outfitAdvice: TextBriefingBlock | null;
  manualOverrides: DailyBriefingOverrides;
  updatedAt: string;
  version: number;
}
