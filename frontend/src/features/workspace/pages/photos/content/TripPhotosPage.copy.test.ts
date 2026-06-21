import { describe, expect, it } from "vitest";

import { photoCopy } from "./TripPhotosPage.copy";
import { enPhotoCopy } from "./TripPhotosPage.copy.en";
import { thPhotoCopy } from "./TripPhotosPage.copy.th";

describe("TripPhotosPage copy", () => {
  it("keeps locale copy payloads split behind the stable aggregate export", () => {
    expect(photoCopy.en).toBe(enPhotoCopy);
    expect(photoCopy.th).toBe(thPhotoCopy);
  });

  it("keeps localized photo page labels available for each supported workspace locale", () => {
    expect(photoCopy.en.title).toBe("Photos & Albums");
    expect(photoCopy.th.title).toBe("รูปภาพและอัลบั้ม");
    expect(photoCopy.en.accessLabels.upload_request).toBe("Upload request");
    expect(photoCopy.th.accessLabels.upload_request).toBe("คำขออัปโหลด");
  });
});
