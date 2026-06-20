import type {
  ImportItineraryApiRequest,
} from "@/src/trip/api-client";

export {
  buildImportedItineraryItemCreateRequest,
} from "./itinerary-import-item-api-requests";
export {
  buildImportedBookingDocCreateRequest,
  buildImportedExpenseCreateRequest,
  buildImportedStopNoteCreateRequest,
  buildImportedTaskCreateRequest,
  buildImportedTaskStatusPatchRequest,
} from "./itinerary-import-record-api-requests";

export interface BuildImportItineraryRequestInput {
  content: string;
  contentType?: string;
  fileName?: string;
}

export function buildImportItineraryRequest({
  content,
  contentType,
  fileName,
}: BuildImportItineraryRequestInput): ImportItineraryApiRequest {
  return {
    fileName,
    contentType,
    mode: "auto",
    content,
  };
}
