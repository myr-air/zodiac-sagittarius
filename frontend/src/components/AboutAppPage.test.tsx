import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { AboutAppPage } from "./AboutAppPage";

const webVersion = {
  apiHost: "api.example.test",
  apiVersionUrl: "https://api.example.test/api/v1/version",
  buildSha: "abc1234",
  buildTime: "2026-06-08T01:02:03.000Z",
  environment: "staging",
  runtimeMode: "api",
  schemaVersion: "frontend-static",
  service: "sagittarius-web",
  version: "0.1.4",
} as const;

describe("AboutAppPage", () => {
  it("shows web and API version details without exposing raw configuration", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          buildSha: "def5678",
          buildTime: "2026-06-08T02:03:04.000Z",
          environment: "production",
          schemaVersion: "0019_photo_album_links",
          service: "sagittarius-api",
          version: "0.1.4",
        }),
      }),
    );

    renderWithI18n(<AboutAppPage webVersion={webVersion} />);

    expect(await screen.findByRole("heading", { name: "About Joii" })).toBeInTheDocument();
    expect(screen.getByText("Web app version")).toBeInTheDocument();
    expect(screen.getByText("sagittarius-web v0.1.4")).toBeInTheDocument();
    expect(await screen.findByText("sagittarius-api v0.1.4")).toBeInTheDocument();
    expect(screen.getByText("abc1234")).toBeInTheDocument();
    expect(screen.getByText("def5678")).toBeInTheDocument();
    expect(screen.getByText("api.example.test")).toBeInTheDocument();
    expect(screen.getByText("0019_photo_album_links")).toBeInTheDocument();
    expect(screen.queryByText(/NEXT_PUBLIC/i)).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("https://api.example.test/api/v1/version", { cache: "no-store" });
  });

  it("keeps the page usable when API version details are unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    renderWithI18n(<AboutAppPage webVersion={{ ...webVersion, runtimeMode: "local", apiHost: "local" }} />);

    expect(await screen.findByText("sagittarius-web v0.1.4")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("API version unavailable")).toBeInTheDocument();
    });
    expect(screen.getAllByText("local")).toHaveLength(2);
  });

  it("renders the status page in Thai", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          buildSha: "def5678",
          buildTime: "2026-06-08T02:03:04.000Z",
          environment: "production",
          schemaVersion: "0019_photo_album_links",
          service: "sagittarius-api",
          version: "0.1.4",
        }),
      }),
    );

    renderWithI18n(<AboutAppPage webVersion={webVersion} />, { locale: "th" });

    expect(await screen.findByRole("heading", { name: "เกี่ยวกับ Joii" })).toBeInTheDocument();
    expect(screen.getByText("เวอร์ชันเว็บแอป")).toBeInTheDocument();
    expect(await screen.findByText("เชื่อมต่อ API แล้ว")).toBeInTheDocument();
  });
});
