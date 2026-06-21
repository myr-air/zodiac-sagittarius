import { enPhotoCopy } from "./TripPhotosPage.copy.en";
import { thPhotoCopy } from "./TripPhotosPage.copy.th";

export const photoCopy = {
  en: enPhotoCopy,
  th: thPhotoCopy,
} as const;

export type PhotoCopy = typeof photoCopy.en | typeof photoCopy.th;
