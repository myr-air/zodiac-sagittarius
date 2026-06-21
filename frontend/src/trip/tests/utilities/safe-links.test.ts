import { describe, expect, it } from "vitest";
import { safeExternalHost, safeExternalHref } from "../../safe-links";

describe("safe links", () => {
  it("normalizes http and https external hrefs", () => {
    expect(safeExternalHref(" https://photos.example.com/trip/album ")).toBe("https://photos.example.com/trip/album");
    expect(safeExternalHref("http://maps.example.com/place")).toBe("http://maps.example.com/place");
  });

  it("rejects non-web and invalid hrefs", () => {
    expect(safeExternalHref("javascript:alert(1)")).toBe("");
    expect(safeExternalHref("not a url")).toBe("");
    expect(safeExternalHref(null)).toBe("");
  });

  it("extracts hosts using the shared external-link safety rules", () => {
    expect(safeExternalHost("https://photos.example.com/trip/album")).toBe("photos.example.com");
    expect(safeExternalHost("ftp://files.example.com/archive")).toBeNull();
    expect(safeExternalHost("not a url")).toBeNull();
    expect(safeExternalHost(null)).toBeNull();
  });
});
