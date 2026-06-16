import type {
  ItineraryExportDocument,
  ItineraryExportItem,
  ItineraryExportRecords,
} from "@/src/trip/itinerary-import-export";

export interface PendingItineraryImport {
  fileName: string;
  items: ItineraryExportItem[];
  records: ItineraryExportRecords;
}

export function emptyItineraryExportRecords(): ItineraryExportRecords {
  return { bookingDocs: [], expenses: [], stopNotes: [], tasks: [] };
}

export function pendingItineraryImportFromDocument({
  document,
  fileName,
}: {
  document: Pick<ItineraryExportDocument, "items" | "records">;
  fileName: string;
}): PendingItineraryImport {
  return {
    fileName,
    items: document.items,
    records: document.records ?? emptyItineraryExportRecords(),
  };
}

export function shouldUseApiItineraryImport({
  contentType,
  fileName,
}: {
  contentType: string;
  fileName: string;
}): boolean {
  const lowerName = fileName.toLowerCase();
  const lowerType = contentType.toLowerCase();
  if (
    lowerType.includes("csv") ||
    lowerType.includes("tab-separated") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".tsv") ||
    lowerName.endsWith(".txt")
  ) {
    return false;
  }
  return true;
}
