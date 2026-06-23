import { describe, expect, it } from "vitest";
import type { ApiVersionInfo, WebVersionInfo } from "@/src/app-version";
import {
  type AboutAppPageLabels,
  aboutApiVersionValue,
  buildAboutDetailRows,
  buildAboutStatusModel,
  buildAboutVersionPanels,
} from "../AboutAppPage.model";

const labels: AboutAppPageLabels = {
  apiHost: "API host",
  apiVersion: "API version",
  apiVersionUnavailable: "API version unavailable",
  buildSha: "Build SHA",
  buildTime: "Build time",
  checkingApiVersion: "Checking API version",
  environment: "Environment",
  runtimeMode: "Runtime mode",
  schemaVersion: "Schema version",
  status: {
    checking: "Checking API",
    connected: "API connected",
    unavailable: "API unavailable",
  },
  unavailableValue: "unavailable",
  webVersion: "Web app version",
};

const webVersion: WebVersionInfo = {
  apiHost: "api.example.test",
  apiVersionUrl: "https://api.example.test/api/v1/version",
  buildSha: "abc1234",
  buildTime: "2026-06-08T01:02:03.000Z",
  environment: "staging",
  runtimeMode: "api",
  schemaVersion: "frontend-static",
  service: "sagittarius-web",
  version: "0.1.5",
};

const apiVersion: ApiVersionInfo = {
  buildSha: "def5678",
  buildTime: "2026-06-08T02:03:04.000Z",
  environment: "production",
  schemaVersion: "0019_photo_album_links",
  service: "sagittarius-api",
  version: "0.1.5",
};

describe("AboutAppPage model", () => {
  it("builds status labels, icons, and tones from API loading state", () => {
    expect(buildAboutStatusModel({ status: "loading" }, labels)).toEqual({
      icon: "clock",
      label: "Checking API",
      tone: "loading",
    });
    expect(buildAboutStatusModel({ status: "ready", value: apiVersion }, labels)).toEqual({
      icon: "check",
      label: "API connected",
      tone: "ready",
    });
    expect(buildAboutStatusModel({ status: "unavailable" }, labels)).toEqual({
      icon: "warning",
      label: "API unavailable",
      tone: "unavailable",
    });
  });

  it("builds version panels with API fallback values", () => {
    expect(
      buildAboutVersionPanels({
        apiVersion: { status: "ready", value: apiVersion },
        labels,
        webVersion,
      }),
    ).toEqual([
      {
        details: [
          ["Build SHA", "abc1234"],
          ["Build time", "2026-06-08T01:02:03.000Z"],
        ],
        icon: "layout",
        label: "Web app version",
        value: "sagittarius-web v0.1.5",
      },
      {
        details: [
          ["Build SHA", "def5678"],
          ["Build time", "2026-06-08T02:03:04.000Z"],
        ],
        icon: "cloud",
        label: "API version",
        muted: false,
        value: "sagittarius-api v0.1.5",
      },
    ]);

    expect(
      buildAboutVersionPanels({
        apiVersion: { status: "unavailable" },
        labels,
        webVersion,
      })[1],
    ).toEqual({
      details: [
        ["Build SHA", "unavailable"],
        ["Build time", "unavailable"],
      ],
      icon: "cloud",
      label: "API version",
      muted: true,
      value: "API version unavailable",
    });
  });

  it("prefers API environment and schema details when available", () => {
    expect(aboutApiVersionValue({ status: "ready", value: apiVersion })).toBe(apiVersion);
    expect(aboutApiVersionValue({ status: "loading" })).toBeNull();
    expect(
      buildAboutDetailRows({
        apiVersion: { status: "ready", value: apiVersion },
        labels,
        webVersion,
      }),
    ).toEqual([
      { label: "Environment", value: "production" },
      { label: "Runtime mode", value: "api" },
      { label: "API host", value: "api.example.test" },
      { label: "Schema version", value: "0019_photo_album_links" },
    ]);
  });
});
