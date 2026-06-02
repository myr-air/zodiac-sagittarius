"use client";

import { ComponentProps, CSSProperties, Dispatch, FormEvent, KeyboardEvent, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { geoCentroid, geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countriesTopology from "world-atlas/countries-110m.json";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import type {
  AccountApiClient,
  AccountSession,
  AccountExplorerSummary,
  AccountSettings,
  AccountSettingsUpdateRequest,
  AccountTodoSummary,
  AccountTripCreateRequest,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemCreateRequest,
  AccountVaultItemSummary,
  EmailLoginStartResponse,
} from "@/src/account/api-client";
import { appRoutes } from "@/src/routes/app-routes";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { Badge, Button } from "./ui";
import { Icon } from "./icons";
import { TripJoinGate } from "./TripJoinGate";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";

interface AccountAccessPanelProps {
  accessMode?: "combined" | "account-login" | "account-register" | "account-portal" | "trip-access";
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  accountSessionLoaded?: boolean;
  accountSuccessRedirectHref?: string;
  portalSection?: PortalSection;
  apiClient?: TripApiClient;
  initialError?: string | null;
  initialJoinCode?: string;
  trip?: Trip;
  onAccountSessionChange: (session: AccountSession | null) => void;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
  onTripChange: (trip: Trip) => void;
}

type AccessMode = "account" | "temp";
type AuthFlow = "login" | "register";
type AuthTransitionDirection = "forward" | "back" | "mode";
type PortalSection = "dashboard" | "trips" | "new-trip" | "explorer" | "todos" | "vault" | "settings" | "sign-out";
type TripContinent = "all" | "asia" | "europe" | "north-america" | "south-america" | "oceania" | "africa";

const accountEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface TripCountryOption {
  code: string;
  name: string;
  continent: Exclude<TripContinent, "all">;
  currency: string;
  cities: string[];
  x: number;
  y: number;
}

interface TripCountrySelection {
  name: string;
  currency: string;
}

const ACCESS_ERROR_CODES = {
  accountLoadFailed: "account-load-failed",
  passkeyRegistrationCredential: "passkey-registration-credential",
  passkeyLoginCredential: "passkey-login-credential",
  passkeyUnsupported: "passkey-unsupported",
} as const;

const defaultTripForm = (ownerDisplayName = ""): AccountTripCreateRequest => ({
  name: "",
  destinationLabel: "",
  countries: [],
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
  ownerDisplayName,
  joinId: generateJoinId(),
  joinPassword: generateJoinPassword(),
});

const tripContinents: Array<{ id: TripContinent; label: string }> = [
  { id: "all", label: "World" },
  { id: "asia", label: "Asia" },
  { id: "europe", label: "Europe" },
  { id: "north-america", label: "North America" },
  { id: "south-america", label: "South America" },
  { id: "oceania", label: "Oceania" },
  { id: "africa", label: "Africa" },
];

const tripCountryOptions: TripCountryOption[] = [
  { code: "JP", name: "Japan", continent: "asia", currency: "JPY", cities: ["Tokyo", "Osaka", "Kyoto", "Sapporo"], x: 78, y: 42 },
  { code: "KR", name: "South Korea", continent: "asia", currency: "KRW", cities: ["Seoul", "Busan", "Jeju"], x: 74, y: 41 },
  { code: "TH", name: "Thailand", continent: "asia", currency: "THB", cities: ["Bangkok", "Chiang Mai", "Phuket"], x: 68, y: 54 },
  { code: "SG", name: "Singapore", continent: "asia", currency: "SGD", cities: ["Singapore"], x: 69, y: 61 },
  { code: "CN", name: "China", continent: "asia", currency: "CNY", cities: ["Beijing", "Shanghai", "Shenzhen"], x: 71, y: 44 },
  { code: "HK", name: "Hong Kong", continent: "asia", currency: "HKD", cities: ["Hong Kong"], x: 72, y: 51 },
  { code: "TW", name: "Taiwan", continent: "asia", currency: "TWD", cities: ["Taipei", "Kaohsiung"], x: 75, y: 51 },
  { code: "VN", name: "Vietnam", continent: "asia", currency: "VND", cities: ["Hanoi", "Da Nang", "Ho Chi Minh City"], x: 70, y: 55 },
  { code: "FR", name: "France", continent: "europe", currency: "EUR", cities: ["Paris", "Nice", "Lyon"], x: 48, y: 38 },
  { code: "IT", name: "Italy", continent: "europe", currency: "EUR", cities: ["Rome", "Milan", "Venice"], x: 51, y: 42 },
  { code: "ES", name: "Spain", continent: "europe", currency: "EUR", cities: ["Madrid", "Barcelona", "Seville"], x: 45, y: 43 },
  { code: "GB", name: "United Kingdom", continent: "europe", currency: "GBP", cities: ["London", "Edinburgh", "Manchester"], x: 46, y: 34 },
  { code: "DE", name: "Germany", continent: "europe", currency: "EUR", cities: ["Berlin", "Munich", "Frankfurt"], x: 51, y: 36 },
  { code: "CH", name: "Switzerland", continent: "europe", currency: "CHF", cities: ["Zurich", "Lucerne", "Geneva"], x: 50, y: 40 },
  { code: "US", name: "United States", continent: "north-america", currency: "USD", cities: ["New York", "Los Angeles", "San Francisco"], x: 20, y: 41 },
  { code: "CA", name: "Canada", continent: "north-america", currency: "CAD", cities: ["Vancouver", "Toronto", "Montreal"], x: 19, y: 30 },
  { code: "MX", name: "Mexico", continent: "north-america", currency: "MXN", cities: ["Mexico City", "Cancun", "Oaxaca"], x: 19, y: 52 },
  { code: "BR", name: "Brazil", continent: "south-america", currency: "BRL", cities: ["Rio de Janeiro", "Sao Paulo", "Salvador"], x: 34, y: 70 },
  { code: "PE", name: "Peru", continent: "south-america", currency: "PEN", cities: ["Lima", "Cusco"], x: 27, y: 69 },
  { code: "AU", name: "Australia", continent: "oceania", currency: "AUD", cities: ["Sydney", "Melbourne", "Perth"], x: 80, y: 76 },
  { code: "NZ", name: "New Zealand", continent: "oceania", currency: "NZD", cities: ["Auckland", "Queenstown", "Wellington"], x: 88, y: 82 },
  { code: "MA", name: "Morocco", continent: "africa", currency: "MAD", cities: ["Marrakech", "Casablanca", "Fes"], x: 45, y: 51 },
  { code: "EG", name: "Egypt", continent: "africa", currency: "EGP", cities: ["Cairo", "Luxor", "Alexandria"], x: 56, y: 52 },
  { code: "ZA", name: "South Africa", continent: "africa", currency: "ZAR", cities: ["Cape Town", "Johannesburg"], x: 55, y: 80 },
];

const worldMapSize = { width: 960, height: 500 };
const mapCountryNameAliases: Record<string, string> = {
  "United States of America": "United States",
};
const worldMapProjection = geoEqualEarth().fitExtent([[12, 12], [worldMapSize.width - 12, worldMapSize.height - 12]], { type: "Sphere" });
const worldMapPath = geoPath(worldMapProjection);
const worldMapFeatureCollection = feature<{ name: string }>(
  countriesTopology as unknown as Topology,
  "countries",
) as unknown as FeatureCollection<Geometry, { name: string }>;
const worldMapCountries = worldMapFeatureCollection.features
  .map((country) => ({
    feature: country,
    name: mapCountryNameAliases[country.properties.name] ?? country.properties.name,
    path: worldMapPath(country),
    region: mapCountryRegion(country),
  }))
  .filter((country): country is { feature: Feature<Geometry, { name: string }>; name: string; path: string; region: TripContinent } => Boolean(country.path));
const portalSectionOrder: PortalSection[] = ["dashboard", "trips", "new-trip", "explorer", "todos", "vault", "settings", "sign-out"];
const portalSectionStorageKey = "sagittarius:portal-section-index";

interface AccountPortalDataCache {
  explorer: AccountExplorerSummary | null;
  settings: AccountSettings | null;
  stats: AccountTripStats | null;
  todos: AccountTodoSummary[];
  trips: AccountTripSummary[];
  vaultItems: AccountVaultItemSummary[];
}

let accountPortalDataCache: (AccountPortalDataCache & { sessionToken: string }) | null = null;

export function AccountAccessPanel({
  accessMode = "combined",
  accountClient,
  accountSession,
  accountSessionLoaded = true,
  accountSuccessRedirectHref,
  apiClient,
  initialError,
  initialJoinCode,
  onAccountSessionChange,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
  portalSection = "dashboard",
  trip,
}: AccountAccessPanelProps) {
  const { t } = useI18n();
  const accessMessages = t.access.messages;
  const [clientPortalRedirected, setClientPortalRedirected] = useState(false);
  const effectiveAccessMode = clientPortalRedirected ? "account-portal" : accessMode;
  const [entryFlowOverride, setEntryFlowOverride] = useState<AuthFlow | null>(null);
  const entryFlow = entryFlowOverride ?? (accessMode === "account-register" ? "register" : "login");
  const effectiveEntryAccessMode = isAccountEntryMode(effectiveAccessMode)
    ? entryFlow === "register" ? "account-register" : "account-login"
    : effectiveAccessMode;
  const forcedMode = effectiveAccessMode === "trip-access" ? "temp" : effectiveAccessMode === "combined" ? null : "account";
  const isAccountEntry = effectiveAccessMode === "account-login" || effectiveAccessMode === "account-register";
  const isPortalEntry = effectiveAccessMode === "account-portal";
  const [selectedMode, setSelectedMode] = useState<AccessMode>(() => (accountSession ? "account" : "temp"));
  const mode = forcedMode ?? (accountSession ? "account" : selectedMode);
  const initialPortalData = accountSession ? getAccountPortalDataCache(accountSession.sessionToken) : null;
  const [settings, setSettings] = useState<AccountSettings | null>(() => initialPortalData?.settings ?? null);
  const [trips, setTrips] = useState<AccountTripSummary[]>(() => initialPortalData?.trips ?? []);
  const [stats, setStats] = useState<AccountTripStats | null>(() => initialPortalData?.stats ?? null);
  const [explorer, setExplorer] = useState<AccountExplorerSummary | null>(() => initialPortalData?.explorer ?? null);
  const [todos, setTodos] = useState<AccountTodoSummary[]>(() => initialPortalData?.todos ?? []);
  const [vaultItems, setVaultItems] = useState<AccountVaultItemSummary[]>(() => initialPortalData?.vaultItems ?? []);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAccountSession, setPendingAccountSession] = useState<AccountSession | null>(null);
  const displayError = localizeAccessError(error ?? initialError ?? null, accessMessages);
  const currentPortalCache = accountSession ? getAccountPortalDataCache(accountSession.sessionToken) : null;
  const displayedSettings = settings ?? currentPortalCache?.settings ?? null;
  const displayedTrips = trips.length ? trips : currentPortalCache?.trips ?? [];
  const displayedStats = stats ?? currentPortalCache?.stats ?? null;
  const displayedExplorer = explorer ?? currentPortalCache?.explorer ?? null;
  const displayedTodos = todos.length ? todos : currentPortalCache?.todos ?? [];
  const displayedVaultItems = vaultItems.length ? vaultItems : currentPortalCache?.vaultItems ?? [];

  useEffect(() => {
    if (!accountSession || isAccountEntry) {
      return;
    }

    let cancelled = false;
    const cachedData = getAccountPortalDataCache(accountSession.sessionToken);

    Promise.allSettled([
      accountClient.loadSettings(accountSession.sessionToken),
      accountClient.listTrips(accountSession.sessionToken),
      accountClient.loadStats(accountSession.sessionToken),
      accountClient.loadExplorer(accountSession.sessionToken),
      accountClient.listToDos(accountSession.sessionToken),
      accountClient.listVault(accountSession.sessionToken),
    ])
      .then(([nextSettings, nextTrips, nextStats, nextExplorer, nextTodos, nextVaultItems]) => {
        if (cancelled) return;
        const failures = [nextSettings, nextTrips, nextStats, nextExplorer, nextTodos, nextVaultItems]
          .filter((result) => result.status === "rejected");
        if (nextSettings.status === "fulfilled") setSettings(nextSettings.value);
        if (nextTrips.status === "fulfilled") setTrips(nextTrips.value);
        if (nextStats.status === "fulfilled") setStats(nextStats.value);
        if (nextExplorer.status === "fulfilled") setExplorer(nextExplorer.value);
        if (nextTodos.status === "fulfilled") setTodos(nextTodos.value);
        if (nextVaultItems.status === "fulfilled") setVaultItems(nextVaultItems.value);
        cacheAccountPortalData(accountSession.sessionToken, {
          settings: nextSettings.status === "fulfilled" ? nextSettings.value : cachedData?.settings ?? null,
          trips: nextTrips.status === "fulfilled" ? nextTrips.value : cachedData?.trips ?? [],
          stats: nextStats.status === "fulfilled" ? nextStats.value : cachedData?.stats ?? null,
          explorer: nextExplorer.status === "fulfilled" ? nextExplorer.value : cachedData?.explorer ?? null,
          todos: nextTodos.status === "fulfilled" ? nextTodos.value : cachedData?.todos ?? [],
          vaultItems: nextVaultItems.status === "fulfilled" ? nextVaultItems.value : cachedData?.vaultItems ?? [],
        });
        if (failures.length) {
          setError(rawErrorMessage(failures[0].reason, ACCESS_ERROR_CODES.accountLoadFailed));
        } else {
          setError(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountClient, accountSession, isAccountEntry]);

  useEffect(() => {
    if (!pendingAccountSession) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onAccountSessionChange(pendingAccountSession);
      if (accountSuccessRedirectHref) {
        if (pendingAccountSession.kind === "trusted") {
          window.location.replace(accountSuccessRedirectHref);
        } else {
          window.history.replaceState(null, "", accountSuccessRedirectHref);
          setClientPortalRedirected(true);
        }
      }
      setPendingAccountSession(null);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [accountSuccessRedirectHref, onAccountSessionChange, pendingAccountSession]);

  async function refreshAccount(sessionToken: string) {
    const [nextSettings, nextTrips, nextStats] = await Promise.all([
      accountClient.loadSettings(sessionToken),
      accountClient.listTrips(sessionToken),
      accountClient.loadStats(sessionToken),
    ]);
    setSettings(nextSettings);
    setTrips(nextTrips);
    setStats(nextStats);
    cacheAccountPortalData(sessionToken, {
      settings: nextSettings,
      trips: nextTrips,
      stats: nextStats,
      explorer,
      todos,
      vaultItems,
    });
  }

  return (
    <main
      className={[
        "account-page",
        isAccountEntry ? "account-page--entry" : "",
        isPortalEntry ? "account-page--portal" : "",
        isPortalEntry && portalSection === "new-trip" ? "account-page--portal-new-trip" : "",
      ].filter(Boolean).join(" ")}
      aria-label={mainLabel(effectiveEntryAccessMode, t.access.mainLabels)}
    >
      <section className={["account-shell", isAccountEntry ? "account-shell--entry" : ""].filter(Boolean).join(" ")}>
        {isAccountEntry ? <LanguageSwitch className="access-language-switch account-entry-language-switch" /> : null}
        <div className="account-hero">
          <div className="join-mark account-hero-mark" aria-hidden="true">
            <Icon name="route" />
          </div>
          <div>
            <p className="join-eyebrow">{isAccountEntry ? t.access.entryHero.brand : t.access.eyebrow}</p>
            {isAccountEntry ? <p className="account-entry-brand-tagline">{t.access.entryHero.tagline}</p> : null}
            <h1>{isAccountEntry ? t.access.entryHero.title : heroTitle(effectiveEntryAccessMode, t.access.titles)}</h1>
            <div className="h-6"></div>
            <p>{isAccountEntry ? t.access.entryHero.detail : heroDetail(effectiveEntryAccessMode, t.access.details)}</p>
            {isAccountEntry ? null : <LanguageSwitch className="access-language-switch" />}
          </div>
          {isAccountEntry ? <AuthTravelCollage labels={t.access.entryHero} /> : null}
          {isAccountEntry ? <AuthHighlights flow={entryFlow} highlights={t.access.highlights} entryHero={t.access.entryHero} /> : null}
        </div>

        {effectiveAccessMode === "combined" ? (
          <div className="account-mode-tabs" role="tablist" aria-label={t.access.tabs.label}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "account"}
              className={mode === "account" ? "account-tab account-tab--active" : "account-tab"}
              onClick={() => setSelectedMode("account")}
            >
              <Icon name="users" />
              {t.access.tabs.account}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "temp"}
              className={mode === "temp" ? "account-tab account-tab--active" : "account-tab"}
              onClick={() => setSelectedMode("temp")}
            >
              <Icon name="clock" />
              {t.access.tabs.temp}
            </button>
          </div>
        ) : null}

        {isAccountEntry && (message || displayError) ? (
          <div className="account-toast-stack" aria-live="polite">
            {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
            {displayError ? <StatusMessage tone="danger">{displayError}</StatusMessage> : null}
          </div>
        ) : null}

        {!isAccountEntry && message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
        {!isAccountEntry && displayError ? <StatusMessage tone="danger">{displayError}</StatusMessage> : null}

        {mode === "temp" ? (
          <TripJoinGate
            apiClient={apiClient}
            embedded
            initialJoinCode={initialJoinCode}
            trip={trip}
            onAuthenticated={onAuthenticated}
            onCockpitLoaded={onCockpitLoaded}
            onTripChange={onTripChange}
          />
        ) : pendingAccountSession ? (
          <StatusMessage tone="success">{t.access.portalDelay.detail}</StatusMessage>
        ) : isAccountEntry ? (
          <EmailLoginPanel
            flow={entryFlow}
            accountClient={accountClient}
            showRouteTabs
            onFlowChange={setEntryFlowOverride}
            onLoggedIn={(session) => {
              setMessage(session.kind === "trusted" ? t.access.messages.trustedLogin : t.access.messages.temporaryLogin);
              setPendingAccountSession(session);
            }}
            onError={setError}
          />
        ) : !accountSessionLoaded && effectiveAccessMode === "account-portal" ? (
          <AccountPortalLoadingFrame portalSection={portalSection} />
        ) : accountSession ? (
          <AccountDashboard
            accountClient={accountClient}
            accountSession={accountSession}
            isLoading={!displayedSettings}
            settings={displayedSettings}
            stats={displayedStats}
            explorer={displayedExplorer}
            trips={displayedTrips}
            todos={displayedTodos}
            vaultItems={displayedVaultItems}
            key={portalSection}
            portalSection={portalSection}
            onSettingsChanged={setSettings}
            onVaultItemCreated={(item) => setVaultItems((current) => [item, ...current])}
            onCreatedTrip={async (session) => {
              onAuthenticated(session);
              if (apiClient) {
                const cockpit = await apiClient.loadTrip(session.tripId, session.sessionToken);
                onTripChange(cockpit.trip);
                onCockpitLoaded?.(cockpit);
              }
              await refreshAccount(accountSession.sessionToken);
            }}
            onLogout={async () => {
              await accountClient.logout(accountSession.sessionToken);
              clearAccountPortalDataCache(accountSession.sessionToken);
              onAccountSessionChange(null);
              setMessage(t.access.messages.loggedOut);
            }}
            onSessionCleared={() => {
              clearAccountPortalDataCache(accountSession.sessionToken);
              onAccountSessionChange(null);
            }}
            onMessage={setMessage}
            onError={setError}
          />
        ) : (
          <EmailLoginPanel
            flow={entryFlow}
            accountClient={accountClient}
            showRouteTabs={isAccountEntry}
            onFlowChange={setEntryFlowOverride}
            onLoggedIn={(session) => {
              setMessage(session.kind === "trusted" ? t.access.messages.trustedLogin : t.access.messages.temporaryLogin);
              setPendingAccountSession(session);
            }}
            onError={setError}
          />
        )}
      </section>
    </main>
  );
}

function AuthTravelCollage({ labels }: { labels: Messages["access"]["entryHero"] }) {
  const photos = [
    { id: "krabi", label: "Krabi, Thailand", alt: "Krabi beach lagoon with limestone cliffs and a longtail boat" },
    { id: "cappadocia", label: "Cappadocia, Turkiye", alt: "Cappadocia sunrise landscape with hot air balloons" },
    { id: "kyoto", label: "Kyoto, Japan", alt: "Kyoto traditional street with wooden houses and a pagoda" },
    { id: "santorini", label: "Santorini, Greece", alt: "Santorini coast with blue domes and the Aegean sea" },
  ];

  return (
    <div className="account-travel-collage" aria-label={labels.collageLabel}>
      {photos.map((photo) => (
        <figure className={`travel-photo-card travel-photo-card--${photo.id}`} key={photo.id}>
          <Image alt={photo.alt} className="travel-photo-image" fill sizes="220px" src={`/landing/auth/photo-${photo.id}.png`} />
          <span className="travel-photo-heart" aria-hidden="true" />
          <figcaption className="travel-photo-caption">{photo.label}</figcaption>
        </figure>
      ))}
      <span className="travel-next-card">
        <Icon name="location" />
        <span>
          <small>{labels.nextLabel}</small>
          <strong>{labels.nextTrip}</strong>
          <small>{labels.nextDate}</small>
        </span>
      </span>
    </div>
  );
}

function AuthHighlights({
  entryHero,
  flow,
  highlights,
}: {
  entryHero?: Messages["access"]["entryHero"];
  flow: "login" | "register";
  highlights: Messages["access"]["highlights"];
}) {
  const items = flow === "register"
    ? [highlights.registerSecure, highlights.registerHistory, highlights.registerOwner]
    : [highlights.secure, highlights.history, highlights.trusted];
  const entryItems = entryHero
    ? [
        { title: entryHero.safeTitle, detail: entryHero.safeDetail },
        { title: entryHero.syncTitle, detail: entryHero.syncDetail },
        { title: entryHero.exploreTitle, detail: entryHero.exploreDetail },
      ]
    : null;

  return (
    <ul className="account-auth-highlights" aria-label={highlights.label}>
      <li className="account-auth-highlight">
        <Icon name="check" />
        <span>{entryItems ? <><strong>{entryItems[0].title}</strong><small>{entryItems[0].detail}</small></> : items[0]}</span>
      </li>
      <li className="account-auth-highlight">
        <Icon name="clock" />
        <span>{entryItems ? <><strong>{entryItems[1].title}</strong><small>{entryItems[1].detail}</small></> : items[1]}</span>
      </li>
      <li className="account-auth-highlight">
        <Icon name="key" />
        <span>{entryItems ? <><strong>{entryItems[2].title}</strong><small>{entryItems[2].detail}</small></> : items[2]}</span>
      </li>
    </ul>
  );
}

function AccountPortalLoadingFrame({ portalSection }: { portalSection: PortalSection }) {
  const { t } = useI18n();
  const portalNavItems = getPortalNavItems(t);
  const cachedEmail = accountPortalDataCache?.settings?.profile.primaryEmail ?? t.access.dashboard.noEmail;

  return (
    <div className="account-dashboard" id="account-portal" aria-busy="true">
      <nav className="portal-nav" aria-label={t.access.portal.nav.label}>
        <div className="portal-nav-brand">
          <div>
            <strong>{t.access.portal.title}</strong>
            <span>{cachedEmail}</span>
          </div>
        </div>
        <div className="portal-nav-links">
          {portalNavItems.map((item) => (
            <Link href={item.href} key={item.href} className={item.id === portalSection ? "portal-nav-link portal-nav-link--active" : "portal-nav-link"} aria-current={item.id === portalSection ? "page" : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            href={appRoutes.portalSignOut()}
            className={portalSection === "sign-out" ? "portal-nav-link portal-nav-link--active" : "portal-nav-link"}
            aria-current={portalSection === "sign-out" ? "page" : undefined}
          >
            <Icon name="x" />
            <span>{t.access.dashboard.logout}</span>
          </Link>
        </div>
      </nav>
      <div className="portal-content">
        <section className="account-card portal-loading-card">
          <span className="portal-skeleton portal-skeleton--title" />
          <span className="portal-skeleton portal-skeleton--line" />
          <span className="portal-skeleton portal-skeleton--block" />
        </section>
      </div>
    </div>
  );
}

function mainLabel(accessMode: AccountAccessPanelProps["accessMode"], labels: Messages["access"]["mainLabels"]): string {
  if (accessMode === "account-login") return labels.accountLogin;
  if (accessMode === "account-register") return labels.accountRegister;
  if (accessMode === "account-portal") return labels.accountPortal;
  if (accessMode === "trip-access") return labels.tripAccess;
  return labels.combined;
}

function getPortalNavItems(t: Messages) {
  return [
    { id: "dashboard" as const, href: appRoutes.portal(), icon: "home" as const, label: t.access.portal.nav.dashboard },
    { id: "trips" as const, href: appRoutes.portalMyTrips(), icon: "calendar" as const, label: t.access.portal.nav.trips },
    { id: "explorer" as const, href: appRoutes.portalExplorer(), icon: "map" as const, label: t.access.portal.nav.explorer },
    { id: "todos" as const, href: appRoutes.portalToDos(), icon: "list" as const, label: t.access.portal.nav.todos },
    { id: "vault" as const, href: appRoutes.portalVault(), icon: "document" as const, label: t.access.portal.nav.vault },
    { id: "settings" as const, href: appRoutes.portalSettings(), icon: "settings" as const, label: t.access.portal.nav.settings },
  ];
}

function getAccountPortalDataCache(sessionToken: string): AccountPortalDataCache | null {
  if (accountPortalDataCache?.sessionToken !== sessionToken) return null;
  return accountPortalDataCache;
}

function cacheAccountPortalData(sessionToken: string, data: AccountPortalDataCache) {
  accountPortalDataCache = { ...data, sessionToken };
}

function clearAccountPortalDataCache(sessionToken: string) {
  if (accountPortalDataCache?.sessionToken === sessionToken) accountPortalDataCache = null;
}

function heroTitle(accessMode: AccountAccessPanelProps["accessMode"], titles: Messages["access"]["titles"]): string {
  if (accessMode === "account-login") return titles.accountLogin;
  if (accessMode === "account-register") return titles.accountRegister;
  if (accessMode === "account-portal") return titles.accountPortal;
  if (accessMode === "trip-access") return titles.tripAccess;
  return titles.combined;
}

function heroDetail(accessMode: AccountAccessPanelProps["accessMode"], details: Messages["access"]["details"]): string {
  if (accessMode === "account-login") return details.accountLogin;
  if (accessMode === "account-register") return details.accountRegister;
  if (accessMode === "account-portal") return details.accountPortal;
  if (accessMode === "trip-access") return details.tripAccess;
  return details.combined;
}

function isAccountEntryMode(accessMode: AccountAccessPanelProps["accessMode"]): accessMode is "account-login" | "account-register" {
  return accessMode === "account-login" || accessMode === "account-register";
}

function EmailLoginPanel({
  flow,
  accountClient,
  onError,
  onFlowChange,
  onLoggedIn,
  showRouteTabs = false,
}: {
  flow: AuthFlow;
  accountClient: AccountApiClient;
  onError: (message: string | null) => void;
  onFlowChange?: (flow: AuthFlow) => void;
  onLoggedIn: (session: AccountSession) => void;
  showRouteTabs?: boolean;
}) {
  const { locale, t } = useI18n();
  const activeFlow = flow;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [homeBase, setHomeBase] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [authStep, setAuthStep] = useState<"email" | "methods" | "password" | "setup">("email");
  const [transitionDirection, setTransitionDirection] = useState<AuthTransitionDirection>("forward");
  const [challenge, setChallenge] = useState<EmailLoginStartResponse | null>(null);
  const [verifiedRegistrationSession, setVerifiedRegistrationSession] = useState<AccountSession | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const normalizedEmail = email.trim();
  const isEmailValid = accountEmailPattern.test(normalizedEmail);

  useEffect(() => {
    if (!challenge || resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [challenge, resendCooldown]);

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isEmailValid) return;
    onError(null);
    goToStep(activeFlow === "register" ? "password" : "methods");
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeFlow === "register") {
      await requestEmailCode();
      return;
    }
    await signInWithPassword();
  }

  async function requestEmailCode() {
    setIsSubmitting(true);
    try {
      const nextChallenge = await accountClient.startEmailLogin(normalizedEmail);
      setTransitionDirection("forward");
      setChallenge(nextChallenge);
      setResendCooldown(30);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.startFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge) return;
    setIsSubmitting(true);
    try {
      const session = await accountClient.finishEmailLogin({
        challengeId: challenge.challengeId,
        code,
        trustDevice: activeFlow === "login" ? trustDevice : true,
        deviceLabel: "",
      });
      if (activeFlow === "register") {
        setVerifiedRegistrationSession(session);
        goToStep("setup");
        setChallenge(null);
        setCode("");
        onError(null);
        return;
      }
      onLoggedIn(session);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.invalidCode, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verifiedRegistrationSession) return;
    setIsSubmitting(true);
    try {
      const session = await accountClient.finishPasswordLogin({
        flow: "register",
        email: normalizedEmail,
        password,
        trustDevice: true,
        deviceLabel: "",
      });
      await accountClient.updateSettings(session.sessionToken, {
        displayName: displayName.trim() || normalizedEmail.split("@")[0] || t.access.dashboard.fallbackName,
        avatarColor: "#0f766e",
        locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.passwordRegisterFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithPassword() {
    setIsSubmitting(true);
    try {
      const session = await accountClient.finishPasswordLogin({
        flow: activeFlow,
        email: normalizedEmail,
        password,
        trustDevice: activeFlow === "login" ? trustDevice : true,
        deviceLabel: "",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, activeFlow === "register" ? t.access.emailLogin.errors.passwordRegisterFailed : t.access.emailLogin.errors.passwordLoginFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithPasskey() {
    setIsSubmitting(true);
    try {
      const loginStart = await accountClient.startPasskeyLogin(normalizedEmail);
      const credential = await getPasskeyCredential(loginStart.challenge, loginStart.allowCredentials.map((credential) => credential.credentialId));
      const session = await accountClient.finishPasskeyLogin({
        challengeId: loginStart.challengeId,
        credentialId: arrayBufferToBase64Url(credential.rawId),
        clientDataJson: arrayBufferToBase64Url(credential.response.clientDataJSON),
        authenticatorData: arrayBufferToBase64Url(credential.response.authenticatorData),
        signature: arrayBufferToBase64Url(credential.response.signature),
        trustDevice: activeFlow === "login" ? trustDevice : false,
        deviceLabel: "",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.passkeyLoginFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetChallenge() {
    setChallenge(null);
    setCode("");
    setResendCooldown(0);
    goToStep(activeFlow === "register" ? "password" : "methods", "back");
    onError(null);
  }

  function changeEmail() {
    resetEntryState("back");
  }

  function resetEntryState(direction: AuthTransitionDirection = "back") {
    setChallenge(null);
    setCode("");
    setPassword("");
    setDisplayName("");
    setHomeBase("");
    setResendCooldown(0);
    setVerifiedRegistrationSession(null);
    goToStep("email", direction);
    onError(null);
  }

  function showPasswordStep() {
    setPassword("");
    goToStep("password");
    onError(null);
  }

  function chooseMethods() {
    goToStep("methods", "back");
    onError(null);
  }

  function goToStep(nextStep: typeof authStep, direction: AuthTransitionDirection = "forward") {
    setTransitionDirection(direction);
    setAuthStep(nextStep);
  }

  function switchFlow(nextFlow: AuthFlow) {
    if (nextFlow === activeFlow) return;
    onFlowChange?.(nextFlow);
    resetEntryState("mode");
    const nextHref = nextFlow === "register" ? appRoutes.register() : appRoutes.login();
    window.history.replaceState(null, "", nextHref);
  }

  const visualStep = challenge ? "otp" : authStep;
  const stepLabel = activeFlow === "register"
    ? t.access.emailLogin.stepRegister({ current: visualStep === "email" ? 1 : visualStep === "password" ? 2 : visualStep === "otp" ? 3 : 4, total: 4 })
    : t.access.emailLogin.stepLogin({ current: visualStep === "email" ? 1 : visualStep === "methods" || visualStep === "password" ? 2 : 3, total: 3 });

  const trustDeviceFields = (
    <label className="account-check">
      <input checked={trustDevice} onChange={(event) => setTrustDevice(event.target.checked)} type="checkbox" suppressHydrationWarning />
      {t.access.emailLogin.trustDevice}
    </label>
  );

  return (
    <div className="account-login-flow">
      {showRouteTabs ? (
        <nav className="account-entry-tabs" aria-label={t.access.mainLabels.combined}>
          <button type="button" className={activeFlow === "login" ? "account-entry-tab account-entry-tab--active" : "account-entry-tab"} aria-current={activeFlow === "login" ? "page" : undefined} onClick={() => switchFlow("login")}>
            {t.access.titles.accountLogin}
          </button>
          <button type="button" className={activeFlow === "register" ? "account-entry-tab account-entry-tab--active" : "account-entry-tab"} aria-current={activeFlow === "register" ? "page" : undefined} onClick={() => switchFlow("register")}>
            {t.access.titles.accountRegister}
          </button>
        </nav>
      ) : null}
      <form className="account-card account-form account-auth-card" onSubmit={authStep === "setup" ? submitSetup : challenge ? submitCode : authStep === "password" ? submitPassword : submitEmail}>
        <span className="account-step-kicker">{stepLabel}</span>
        <div className={`account-step-stage account-step-stage--${transitionDirection}`} key={visualStep}>
          <PanelHeading
            icon={challenge ? "settings" : authStep === "password" ? "key" : "users"}
            title={challenge ? t.access.emailLogin.verifyTitle : authStep === "setup" ? t.access.emailLogin.setupTitle : authStep === "methods" ? t.access.emailLogin.methodTitle : authStep === "password" ? t.access.emailLogin.passwordTitle : t.access.emailLogin.emailTitle}
            detail={
              challenge
                ? t.access.emailLogin.expiresAt({ value: formatDateTime(challenge.expiresAt, locale) })
                : authStep === "setup"
                  ? t.access.emailLogin.setupDetail
                  : authStep === "methods"
                    ? t.access.emailLogin.methodDetail
                    : authStep === "password"
                      ? activeFlow === "register" ? t.access.emailLogin.registerPasswordDetail : t.access.emailLogin.passwordDetail
                      : t.access.emailLogin.emailDetail
            }
          />
          {challenge ? (
            <>
            <div className="account-step-summary">
              <span>{t.access.emailLogin.sentCodeTo}</span>
              <strong>{normalizedEmail}</strong>
            </div>
            <label>
              <span>{t.access.emailLogin.verificationCode}</span>
              <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" required suppressHydrationWarning />
            </label>
            {activeFlow === "login" ? trustDeviceFields : null}
            <Button type="submit" disabled={isSubmitting}>
              <Icon name="check" />
              {activeFlow === "register" ? t.access.emailLogin.createAccount : t.access.emailLogin.signInAccount}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting || resendCooldown > 0} onClick={() => void requestEmailCode()}>
              {t.access.emailLogin.resendCode}
              {resendCooldown > 0 ? t.access.emailLogin.resendCooldown({ seconds: resendCooldown }) : ""}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={resetChallenge}>
              {t.access.emailLogin.changeEmail}
            </Button>
            </>
          ) : authStep === "email" ? (
            <>
            <label>
              <span>{t.access.emailLogin.email}</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required suppressHydrationWarning />
            </label>
            {activeFlow === "login" ? trustDeviceFields : null}
            <Button type="submit" disabled={!isEmailValid || isSubmitting}>
              <Icon name="chevronRight" />
              {t.access.emailLogin.continue}
            </Button>
            <SocialAuthButtons labels={t.access.emailLogin} />
            </>
          ) : authStep === "methods" ? (
            <>
            <div className="account-step-summary">
              <span>{activeFlow === "register" ? t.access.emailLogin.createFor : t.access.emailLogin.signInAs}</span>
              <strong>{normalizedEmail}</strong>
            </div>
            <Button type="button" disabled={isSubmitting} onClick={() => void requestEmailCode()}>
              <Icon name="check" />
              {activeFlow === "register" ? t.access.emailLogin.sendRegisterCode : t.access.emailLogin.sendSignInCode}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={showPasswordStep}>
              <Icon name="key" />
              {activeFlow === "register" ? t.access.emailLogin.createWithPassword : t.access.emailLogin.signInWithPassword}
            </Button>
            {activeFlow === "login" ? (
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => void signInWithPasskey()}>
                <Icon name="key" />
                {t.access.emailLogin.signInWithPasskey}
              </Button>
            ) : null}
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={changeEmail}>
              {t.access.emailLogin.changeEmail}
            </Button>
            </>
          ) : authStep === "setup" ? (
            <>
            <div className="account-step-summary">
              <span>{t.access.emailLogin.createFor}</span>
              <strong>{normalizedEmail}</strong>
            </div>
            <label>
              <span>{t.access.emailLogin.displayName}</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" placeholder="Aom Traveler" required suppressHydrationWarning />
            </label>
            <label>
              <span>{t.access.emailLogin.homeBase}</span>
              <input value={homeBase} onChange={(event) => setHomeBase(event.target.value)} autoComplete="address-level2" placeholder="Bangkok" suppressHydrationWarning />
            </label>
            <Button type="submit" disabled={!displayName.trim() || isSubmitting}>
              <Icon name="check" />
              {t.access.emailLogin.finishSetup}
            </Button>
            </>
          ) : (
            <>
            <div className="account-step-summary">
              <span>{activeFlow === "register" ? t.access.emailLogin.createFor : t.access.emailLogin.signInAs}</span>
              <strong>{normalizedEmail}</strong>
            </div>
            <label>
              <span>{t.access.emailLogin.password}</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={activeFlow === "register" ? "new-password" : "current-password"}
                required
                suppressHydrationWarning
              />
            </label>
            {activeFlow === "login" ? trustDeviceFields : null}
            <Button type="submit" disabled={password.length < 8 || isSubmitting}>
              <Icon name="key" />
              {activeFlow === "register" ? t.access.emailLogin.continueToOtp : t.access.emailLogin.signInWithPassword}
            </Button>
            {activeFlow === "login" ? (
              <Button type="button" variant="ghost" disabled={isSubmitting} onClick={chooseMethods}>
                {t.access.emailLogin.chooseAnotherMethod}
              </Button>
            ) : (
              <Button type="button" variant="ghost" disabled={isSubmitting} onClick={changeEmail}>
                {t.access.emailLogin.changeEmail}
              </Button>
            )}
            </>
          )}
        </div>
      </form>
      {!challenge ? (
        <p className="account-flow-switch">
          {activeFlow === "register" ? (
            <>
              {t.access.emailLogin.hasAccount} <button type="button" onClick={() => switchFlow("login")}>{t.access.emailLogin.signInLink}</button>
            </>
          ) : (
            <>
              {t.access.emailLogin.noAccount} <button type="button" onClick={() => switchFlow("register")}>{t.access.emailLogin.registerLink}</button>
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}

function SocialAuthButtons({ labels }: { labels: Messages["access"]["emailLogin"] }) {
  return (
    <div className="account-social-block" aria-label={labels.socialLabel}>
      <div className="account-divider"><span>{labels.socialDivider}</span></div>
      <p className="sr-only" id="account-social-disabled-hint">{labels.socialDisabledHint}</p>
      <button className="account-social-button" type="button" disabled aria-describedby="account-social-disabled-hint" title={labels.socialDisabledHint}>
        <span className="account-social-glyph account-social-glyph--google">G</span>
        {labels.google}
      </button>
      <button className="account-social-button" type="button" disabled aria-describedby="account-social-disabled-hint" title={labels.socialDisabledHint}>
        <span className="account-social-glyph account-social-glyph--apple">A</span>
        {labels.apple}
      </button>
    </div>
  );
}

function AccountDashboard({
  accountClient,
  accountSession,
  explorer,
  isLoading,
  onCreatedTrip,
  onError,
  onLogout,
  onSessionCleared,
  onMessage,
  onSettingsChanged,
  onVaultItemCreated,
  portalSection,
  settings,
  stats,
  todos,
  trips,
  vaultItems,
}: {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  explorer: AccountExplorerSummary | null;
  isLoading: boolean;
  onCreatedTrip: (session: TripParticipantSession) => Promise<void>;
  onError: (message: string | null) => void;
  onLogout: () => Promise<void>;
  onSessionCleared: () => void;
  onMessage: (message: string | null) => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  onVaultItemCreated: (item: AccountVaultItemSummary) => void;
  portalSection: PortalSection;
  settings: AccountSettings | null;
  stats: AccountTripStats | null;
  todos: AccountTodoSummary[];
  trips: AccountTripSummary[];
  vaultItems: AccountVaultItemSummary[];
}) {
  const { t } = useI18n();
  const defaultOwnerDisplayName = settings?.profile.displayName ?? t.access.dashboard.fallbackName;
  const [tripForm, setTripForm] = useState(() => defaultTripForm());
  const [transitionDirection] = useState<"forward" | "back">(() => {
    const currentIndex = portalSectionOrder.indexOf(portalSection);
    return currentIndex < readPreviousPortalSectionIndex(currentIndex) ? "back" : "forward";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vaultForm, setVaultForm] = useState<AccountVaultItemCreateRequest>({ kind: "note", title: "", detail: "", externalUrl: "" });
  const [explorerQuery, setExplorerQuery] = useState("");
  const sessionKindLabel = accountSession.kind === "trusted" ? t.access.dashboard.sessionKinds.trusted : t.access.dashboard.sessionKinds.temporary;
  const sharedTrips = trips.filter((trip) => !trip.isOwner);
  const explorerTrips = (sharedTrips.length ? sharedTrips : trips).filter((trip) => {
    const query = explorerQuery.trim().toLocaleLowerCase();
    if (!query) return true;
    return `${trip.name} ${trip.destinationLabel} ${trip.role}`.toLocaleLowerCase().includes(query);
  });

  async function submitTrip() {
    setIsSubmitting(true);
    try {
      const response = await accountClient.createTrip(accountSession.sessionToken, normalizedTripForm(tripForm, defaultOwnerDisplayName));
      await onCreatedTrip(response.memberSession);
      setTripForm(defaultTripForm());
      onMessage(t.access.dashboard.createTrip.success);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.dashboard.createTrip.error, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitVaultItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = vaultForm.title.trim();
    if (!title) return;
    try {
      const item = await accountClient.createVaultItem(accountSession.sessionToken, {
        ...vaultForm,
        title,
        detail: vaultForm.detail.trim(),
        externalUrl: vaultForm.externalUrl?.trim() || null,
      });
      onVaultItemCreated(item);
      setVaultForm({ kind: "note", title: "", detail: "", externalUrl: "" });
      onMessage(t.access.portal.vaultCreate.success);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.portal.vaultCreate.error, t.access.messages));
    }
  }

  async function registerPasskey() {
    if (!settings) return;
    try {
      const registrationStart = await accountClient.startPasskeyRegistration(accountSession.sessionToken);
      const credential = await createPasskeyCredential(registrationStart.challenge, settings);
      const passkey = await accountClient.finishPasskeyRegistration(accountSession.sessionToken, {
        challengeId: registrationStart.challengeId,
        credentialId: arrayBufferToBase64Url(credential.rawId),
        clientDataJson: arrayBufferToBase64Url(credential.response.clientDataJSON),
        attestationObject: arrayBufferToBase64Url(credential.response.attestationObject),
        nickname: `${settings.profile.displayName} passkey`,
      });
      onSettingsChanged({
        ...settings,
        passkeys: [passkey, ...settings.passkeys.filter((candidate) => candidate.id !== passkey.id)],
      });
      onMessage(t.access.settings.messages.passkeyCreated);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.passkeyFailed, t.access.messages));
    }
  }

  const portalNavItems = getPortalNavItems(t);
  const activePortalSection = portalSection === "new-trip" ? "trips" : portalSection;
  const currentPortalSectionIndex = portalSectionOrder.indexOf(portalSection);

  useEffect(() => {
    window.sessionStorage.setItem(portalSectionStorageKey, String(currentPortalSectionIndex));
  }, [currentPortalSectionIndex]);

  return (
    <div className="account-dashboard" id="account-portal" data-transition-direction={transitionDirection}>
      <nav className="portal-nav" aria-label={t.access.portal.nav.label}>
        <div className="portal-nav-brand">
          <div>
            <strong>{t.access.portal.title}</strong>
            <span>{settings?.profile.primaryEmail ?? t.access.dashboard.noEmail}</span>
          </div>
        </div>
        <div className="portal-nav-links">
          {portalNavItems.map((item) => (
            <Link href={item.href} key={item.href} className={item.id === activePortalSection ? "portal-nav-link portal-nav-link--active" : "portal-nav-link"} aria-current={item.id === activePortalSection ? "page" : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            href={appRoutes.portalSignOut()}
            className={activePortalSection === "sign-out" ? "portal-nav-link portal-nav-link--active" : "portal-nav-link"}
            aria-current={activePortalSection === "sign-out" ? "page" : undefined}
          >
            <Icon name="x" />
            <span>{t.access.dashboard.logout}</span>
          </Link>
        </div>
      </nav>

      <div className="portal-content">
        {portalSection === "dashboard" ? <section className="account-card account-profile-card" id="portal-dashboard">
          <PanelHeading icon="home" title={t.access.portal.sections.dashboard.title} detail={t.access.portal.sections.dashboard.detail} />
          <div className="account-profile-row">
            <span className="person-avatar" style={{ backgroundColor: settings?.profile.avatarColor ?? "#0f766e" }} aria-hidden="true">
              {(settings?.profile.displayName ?? t.access.dashboard.fallbackName).slice(0, 1)}
            </span>
            <div>
              <strong>{settings?.profile.displayName ?? t.access.dashboard.fallbackName}</strong>
              <span>{settings?.profile.primaryEmail ?? t.access.dashboard.noEmail}</span>
            </div>
            <Badge tone={accountSession.kind === "trusted" ? "success" : "warning"}>{sessionKindLabel}</Badge>
          </div>
          <div className="account-stat-grid">
            {isLoading && !stats ? (
              <PortalStatSkeleton />
            ) : (
              <>
                <Stat label={t.access.dashboard.stats.trips} value={stats?.tripsTotal ?? 0} />
                <Stat label={t.access.dashboard.stats.owned} value={stats?.tripsOwned ?? 0} />
                <Stat label={t.access.dashboard.stats.active} value={stats?.activeTrips ?? 0} />
                <Stat label={t.access.dashboard.stats.claims} value={stats?.tempClaimsCompleted ?? 0} />
              </>
            )}
          </div>
        </section> : null}

        {portalSection === "trips" ? <section className="account-card account-history" id="portal-trips">
          <div className="portal-section-topline">
            <PanelHeading
              icon="calendar"
              title={t.access.portal.sections.trips.title}
              detail={isLoading ? t.access.dashboard.history.loading : t.access.dashboard.history.visibleTrips({ count: trips.length })}
            />
            <Button asChild>
              <Link href={appRoutes.portalNewTrip()}>
                <Icon name="plus" />
                Create trip
              </Link>
            </Button>
          </div>
          {isLoading && !trips.length ? (
            <PortalListSkeleton rows={2} />
          ) : trips.length ? (
            <div className="account-trip-list">
              {trips.map((trip) => (
                <article className="account-trip-row" key={trip.id}>
                  <span className="account-trip-icon" aria-hidden="true"><Icon name="location" /></span>
                  <div>
                    <strong>{trip.name}</strong>
                    <span>{trip.destinationLabel} · {trip.startDate} - {trip.endDate}</span>
                  </div>
                  <Badge tone={trip.isOwner ? "success" : "neutral"}>{trip.isOwner ? t.access.dashboard.history.owner : t.appShell.roles[trip.role]}</Badge>
                  <Button asChild variant="secondary">
                    <Link href={appRoutes.tripOverview(trip.id)}>
                      <Icon name="chevronRight" />
                      Open
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <p className="account-empty">{t.access.dashboard.history.empty}</p>
          )}
        </section> : null}

        {portalSection === "new-trip" ? <section className="account-card account-history portal-new-trip-card" id="portal-new-trip">
          <div className="trip-builder-topbar">
            <Button asChild variant="secondary">
              <Link href={appRoutes.portalMyTrips()}>
                <Icon name="chevronLeft" />
                My trips
              </Link>
            </Button>
            <div>
              <span>Trip builder</span>
              <strong>Create trip</strong>
            </div>
            <Badge tone="neutral">Draft</Badge>
          </div>
          <PortalTripWizard
            defaultOwnerDisplayName={defaultOwnerDisplayName}
            isSubmitting={isSubmitting}
            tripForm={tripForm}
            onChange={setTripForm}
            onSubmit={submitTrip}
          />
        </section> : null}

        {portalSection === "explorer" ? <section className="account-card portal-feature-card portal-explorer-card" id="portal-explorer">
          <PanelHeading icon="map" title={t.access.portal.sections.explorer.title} detail="Find shared trips from people in your system." />
          {isLoading && !explorer ? <PortalListSkeleton rows={1} compact /> : (
            <div className="account-settings-grid">
              <SettingLine label={t.access.portal.explorerStats.upcoming} value={`${explorer?.upcomingTrips ?? 0}`} />
              <SettingLine label={t.access.portal.explorerStats.destinations} value={`${explorer?.destinationCount ?? 0}`} />
            </div>
          )}
          {explorer?.nextTrip ? (
            <div className="account-step-summary">
              <span>{t.access.portal.explorerStats.nextTrip}</span>
              <strong>{explorer.nextTrip.name}</strong>
            </div>
          ) : null}
          <div className="portal-search">
            <Icon name="map" />
            <input
              aria-label="Search shared trips"
              placeholder="Search city, trip, or role"
              value={explorerQuery}
              onChange={(event) => setExplorerQuery(event.target.value)}
            />
          </div>
          <div className="portal-map-preview" aria-label="Shared trip map preview">
            {explorerTrips.slice(0, 4).map((trip, index) => (
              <span
                className="portal-map-pin"
                key={trip.id}
                style={{ "--pin-x": `${22 + index * 17}%`, "--pin-y": `${32 + (index % 2) * 26}%` } as CSSProperties}
                title={`${trip.name}, ${trip.destinationLabel}`}
              >
                <Icon name="location" />
              </span>
            ))}
          </div>
          {explorerTrips.length ? (
            <div className="account-trip-list">
              {explorerTrips.map((trip) => (
                <article className="account-trip-row" key={trip.id}>
                  <span className="account-trip-icon" aria-hidden="true"><Icon name="map" /></span>
                  <div>
                    <strong>{trip.name}</strong>
                    <span>{trip.destinationLabel} · {trip.startDate} - {trip.endDate}</span>
                  </div>
                  <Badge tone={trip.isOwner ? "success" : "neutral"}>{trip.isOwner ? "Owned" : "Shared"}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <p className="account-empty">No shared trips match this search.</p>
          )}
        </section> : null}

        {portalSection === "todos" ? <section className="account-card portal-feature-card" id="portal-to-dos">
          <PanelHeading icon="list" title={t.access.portal.sections.todos.title} detail={t.access.portal.sections.todos.detail} />
          {isLoading && !todos.length ? (
            <PortalListSkeleton rows={1} />
          ) : todos.length ? (
            <div className="account-trip-list">
              {todos.map((todo) => (
                <article className="account-trip-row" key={todo.id}>
                  <span className="account-trip-icon" aria-hidden="true"><Icon name="list" /></span>
                  <div>
                    <strong>{todo.title}</strong>
                    <span>{todo.tripName} · {todo.visibility} · {todo.kind ?? "prep"}</span>
                  </div>
                  <Badge tone={todo.status === "done" ? "success" : "warning"}>{todo.status}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <p className="account-empty">{t.access.portal.sections.todos.empty}</p>
          )}
        </section> : null}

        {portalSection === "vault" ? <section className="account-card portal-feature-card" id="portal-vault">
          <PanelHeading icon="document" title={t.access.portal.sections.vault.title} detail={t.access.portal.sections.vault.detail} />
          <div className="cloud-provider-panel" aria-label="Cloud provider options">
            <div>
              <strong>Use your own cloud</strong>
              <span>Save links to Google Drive, iCloud, Dropbox, OneDrive, or any private folder. Files stay in your provider; Joii keeps only the link and note.</span>
            </div>
            <div className="cloud-provider-grid">
              {["Google Drive", "iCloud", "Dropbox", "OneDrive"].map((provider) => (
                <button className="cloud-provider-button" type="button" key={provider}>
                  <Icon name="cloud" />
                  {provider}
                </button>
              ))}
            </div>
          </div>
          <form className="account-form account-settings-form" onSubmit={submitVaultItem}>
            <div className="account-two-col">
              <label>
                <span>{t.access.portal.vaultCreate.kind}</span>
                <select value={vaultForm.kind} onChange={(event) => setVaultForm((current) => ({ ...current, kind: event.target.value as "note" | "file" }))}>
                  <option value="note">{t.access.portal.vaultCreate.note}</option>
                  <option value="file">{t.access.portal.vaultCreate.file}</option>
                </select>
              </label>
              <label>
                <span>{t.access.portal.vaultCreate.title}</span>
                <input value={vaultForm.title} onChange={(event) => setVaultForm((current) => ({ ...current, title: event.target.value }))} required />
              </label>
            </div>
            <label>
              <span>{t.access.portal.vaultCreate.detail}</span>
              <input value={vaultForm.detail} onChange={(event) => setVaultForm((current) => ({ ...current, detail: event.target.value }))} />
            </label>
            <label>
              <span>{t.access.portal.vaultCreate.externalUrl}</span>
              <input
                value={vaultForm.externalUrl ?? ""}
                onChange={(event) => setVaultForm((current) => ({ ...current, externalUrl: event.target.value }))}
                placeholder="https://drive.google.com/..."
                type="url"
              />
            </label>
            <Button type="submit"><Icon name="plus" />{t.access.portal.vaultCreate.submit}</Button>
          </form>
          {isLoading && !vaultItems.length ? (
            <PortalListSkeleton rows={1} />
          ) : vaultItems.length ? (
            <div className="account-trip-list">
              {vaultItems.map((item) => (
                <article className="account-trip-row" key={`${item.source}-${item.id}`}>
                  <span className="account-trip-icon" aria-hidden="true"><Icon name={item.kind === "file" ? "document" : "note"} /></span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.tripName ?? t.access.portal.vaultCreate.personal} · {item.detail}</span>
                  </div>
                  <Badge tone={item.kind === "file" ? "neutral" : "success"}>{item.kind}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <p className="account-empty">{t.access.portal.sections.vault.empty}</p>
          )}
        </section> : null}

        {portalSection === "settings" ? <section className="account-card account-settings-card" id="portal-settings">
          <PanelHeading icon="settings" title={t.access.settings.title} detail={t.access.settings.detail} />
          {settings ? (
            <AccountSettingsEditor
              accountClient={accountClient}
              accountSession={accountSession}
              settings={settings}
              onError={onError}
              onMessage={onMessage}
              onSessionCleared={onSessionCleared}
              onSettingsChanged={onSettingsChanged}
            />
          ) : (
            <p className="account-empty">{t.access.settings.loading}</p>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={!settings}
            onClick={() => void registerPasskey()}
          >
            <Icon name="key" />
            {t.access.settings.startPasskeySetup}
          </Button>
        </section> : null}

        {portalSection === "sign-out" ? <section className="account-card account-profile-card" id="portal-sign-out">
          <PanelHeading icon="x" title={t.access.portal.sections.signOut.title} detail={t.access.portal.sections.signOut.detail} />
          <Button type="button" variant="secondary" onClick={() => void onLogout()}>
            <Icon name="x" />
            {t.access.dashboard.logout}
          </Button>
        </section> : null}
      </div>
    </div>
  );
}

function PortalTripWizard({
  defaultOwnerDisplayName,
  isSubmitting,
  onChange,
  onSubmit,
  tripForm,
}: {
  defaultOwnerDisplayName: string;
  isSubmitting: boolean;
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
  onSubmit: () => void;
  tripForm: AccountTripCreateRequest;
}) {
  const { t } = useI18n();
  const [countryQuery, setCountryQuery] = useState("");
  const [activeContinent, setActiveContinent] = useState<TripContinent>("all");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [hasEditedOwnerDisplayName, setHasEditedOwnerDisplayName] = useState(false);
  const [hasCopiedJoinCode, setHasCopiedJoinCode] = useState(false);
  const [inspirationOffset, setInspirationOffset] = useState(0);
  const destinationSearchRef = useRef<HTMLInputElement | null>(null);
  const ownerDisplayName = tripForm.ownerDisplayName;
  const effectiveOwnerDisplayName = hasEditedOwnerDisplayName ? ownerDisplayName : ownerDisplayName || defaultOwnerDisplayName;
  const selectedCountries = selectedTripCountries(tripForm.countries, tripForm.destinationLabel);
  const selectedCountryNames = selectedCountries.map((country) => country.name);
  const destinationComplete = selectedCountries.length > 0;
  const datesComplete = Boolean(tripForm.startDate && tripForm.endDate);
  const accessComplete = Boolean(effectiveOwnerDisplayName.trim() && tripForm.joinId.trim() && tripForm.joinPassword.length >= 12);
  const canSubmit = Boolean(tripForm.name.trim()) && destinationComplete && datesComplete && accessComplete;
  const suggestedCountries = countrySuggestions(countryQuery, activeContinent, selectedCountryNames);
  const destinationSummary = selectedCountryNames.length ? selectedCountryNames.join(", ") : "Add at least one place";
  const currencySummary = selectedCountries.length ? uniqueList(selectedCountries.map((country) => country.currency).filter(Boolean)).join(", ") || "Currency by country" : "Currency";
  const previewTripName = tripForm.name.trim() || "Untitled trip";
  const inviteStatus = accessComplete ? "Invite ready" : "Invite draft";
  const inspirationCards = rotateList(tripPreviewCards(selectedCountryNames), inspirationOffset);
  const destinationCards = tripDestinationCards(selectedCountryNames);
  const previewStartDate = formatPreviewTravelDate(tripForm.startDate);
  const previewEndDate = formatPreviewTravelDate(tripForm.endDate);
  const previewNightCount = tripNightCount(tripForm.startDate, tripForm.endDate);
  const routeDestinationCode = selectedCountryNames.includes("Japan") ? "KIX" : selectedCountryNames[0]?.slice(0, 3).toUpperCase() || "DST";
  const joinCode = tripForm.joinId || "JOII-26A1";

  function seedOwnerDisplayName() {
    onChange((current) => current.ownerDisplayName.trim() ? current : { ...current, ownerDisplayName: defaultOwnerDisplayName });
  }

  function regenerateCredentials() {
    onChange((current) => ({
      ...current,
      joinId: generateJoinId(),
      joinPassword: generateJoinPassword(),
    }));
  }

  function updateCountries(nextCountries: string[]) {
    onChange((current) => ({ ...current, countries: nextCountries, destinationLabel: nextCountries.join(", ") }));
    setCountryQuery("");
  }

  function toggleCountry(countryName: string) {
    const nextCountries = selectedCountryNames.includes(countryName)
      ? selectedCountryNames.filter((name) => name !== countryName)
      : [...selectedCountryNames, countryName];
    updateCountries(nextCountries);
  }

  function focusDestinationSearch() {
    destinationSearchRef.current?.focus();
  }

  function swapTravelDates() {
    onChange((current) => ({ ...current, startDate: current.endDate, endDate: current.startDate }));
  }

  async function copyJoinCode() {
    const text = joinCode.trim();
    if (!text) return;
    try {
      await navigator.clipboard?.writeText(text);
      setHasCopiedJoinCode(true);
    } catch {
      setHasCopiedJoinCode(false);
    }
  }

  function shiftInspiration(direction: -1 | 1) {
    setInspirationOffset((current) => current + direction);
  }

  function submitWizard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    seedOwnerDisplayName();
    if (canSubmit && !isSubmitting) onSubmit();
  }

  return (
    <form className="account-form account-settings-form portal-create-trip-inline portal-trip-simple" onSubmit={submitWizard}>
      <div className="trip-simple-head">
        <div>
          <strong>Create trip <Badge tone={canSubmit ? "success" : "neutral"}>{canSubmit ? "Ready" : "Draft"}</Badge></strong>
          <p>สร้างแผนการเดินทางและเชิญเพื่อนร่วมทริปของคุณ</p>
        </div>
      </div>
      <div className="trip-wizard-layout">
        <div className="trip-wizard-main">
          <div className="trip-wizard-pane">
            <div className="trip-scope-panel">
              <section className="trip-step-section">
                <div className="trip-step-heading">
                  <strong>1. Trip name</strong>
                  <span>ตั้งชื่อทริปของคุณ</span>
                </div>
                <label className="trip-name-field">
                  <span className="sr-only">{t.access.dashboard.createTrip.labels.name}</span>
                <input
                  value={tripForm.name}
                  onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Kyoto & Osaka Winter Escape"
                    maxLength={100}
                  required
                />
                  <small>{tripForm.name.length} / 100</small>
                </label>
              </section>

              <section className="trip-step-section">
                <div className="trip-step-heading">
                  <strong>2. Where are you going?</strong>
                  <span>เลือกจุดหมายปลายทาง</span>
                </div>
                <div className="trip-country-picker">
                {selectedCountryNames.length ? (
                  <div className="trip-form-destination-row" aria-label="Selected destinations">
                    <div className="sr-only" aria-label="Selected countries">
                      {selectedCountryNames.map((countryName) => (
                        <button type="button" key={countryName} aria-label={countryName} onClick={() => toggleCountry(countryName)}>
                          {countryName}
                        </button>
                      ))}
                    </div>
                    {destinationCards.map((card) => (
                      <article key={card.title} className="trip-mini-destination">
                        <span className="trip-place-thumb" aria-hidden="true" />
                        <div>
                          <strong>{card.title}</strong>
                          <small>{card.detail}</small>
                        </div>
                        <button type="button" aria-label={`Remove ${card.countryName}`} onClick={() => toggleCountry(card.countryName)}>
                          <Icon name="x" />
                        </button>
                      </article>
                    ))}
                    <button className="trip-mini-add" type="button" onClick={focusDestinationSearch}>
                      <Icon name="plus" />
                      เพิ่มจุดหมาย
                    </button>
                    <div className="trip-form-destination-search">
                      <label>
                        <span className="sr-only">Search destinations</span>
                        <input
                          aria-label="Search destinations"
                          ref={destinationSearchRef}
                          value={countryQuery}
                          onChange={(event) => setCountryQuery(event.target.value)}
                          placeholder="เพิ่มเมืองหรือประเทศ..."
                        />
                      </label>
                      {countryQuery.trim() && suggestedCountries.length ? (
                        <div className="trip-country-suggestions" aria-label="Destination suggestions">
                          {suggestedCountries.map((country) => (
                            <button type="button" key={country.code} aria-label={country.name} onClick={() => toggleCountry(country.name)}>
                              <strong>{country.name}</strong>
                              <span>{country.cities.slice(0, 3).join(", ")} · {country.currency}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="trip-country-search">
                      <label>
                        <span className="sr-only">Where are you going?</span>
                        <input
                          aria-label="Search destinations"
                          ref={destinationSearchRef}
                          value={countryQuery}
                          onChange={(event) => setCountryQuery(event.target.value)}
                          placeholder="Hong Kong, Shenzhen, Hokkaido..."
                        />
                      </label>
                      {suggestedCountries.length ? (
                        <div className="trip-country-suggestions" aria-label="Destination suggestions">
                          {suggestedCountries.map((country) => (
                            <button type="button" key={country.code} aria-label={country.name} onClick={() => toggleCountry(country.name)}>
                              <strong>{country.name}</strong>
                              <span>{country.cities.slice(0, 3).join(", ")} · {country.currency}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="trip-selected-countries" aria-label="Selected destinations">
                      <span>Add a country, city, or region.</span>
                    </div>
                  </>
                )}
                <button className="trip-map-toggle" type="button" onClick={() => setIsMapOpen((current) => !current)}>
                  <Icon name="map" />
                  {isMapOpen ? "Hide map" : "Pick on map"}
                </button>
                {isMapOpen ? (
                  <div className="trip-map-drawer">
                    <div className="trip-continent-filter" aria-label="Filter map by continent">
                      {tripContinents.map((continent) => (
                        <button
                          className={continent.id === activeContinent ? "trip-continent-chip trip-continent-chip--active" : "trip-continent-chip"}
                          type="button"
                          key={continent.id}
                          onClick={() => setActiveContinent(continent.id)}
                        >
                          {continent.label}
                        </button>
                      ))}
                    </div>
                    <CountryWorldMap
                      activeContinent={activeContinent}
                      selectedCountryNames={selectedCountryNames}
                      onToggleCountry={toggleCountry}
                    />
                  </div>
                ) : null}
              </div>
              </section>

              <section className="trip-step-section">
                <div className="trip-step-heading">
                  <strong>3. When are you going?</strong>
                  <span>กำหนดวันเดินทาง</span>
                </div>
              <fieldset className="trip-roundtrip-field">
                <legend>Round trip dates</legend>
                <div className="trip-roundtrip-row">
                  <label className="trip-date-leg">
                    <span>Depart</span>
                    <input
                      aria-label={t.access.dashboard.createTrip.labels.startDate}
                      value={tripForm.startDate}
                      onChange={(event) => onChange((current) => ({ ...current, startDate: event.target.value }))}
                      type="date"
                      required
                    />
                  </label>
                  <button className="trip-date-arrow" type="button" onClick={swapTravelDates} aria-label="Swap depart and return dates">
                    <Icon name="route" />
                  </button>
                  <label className="trip-date-leg">
                    <span>Return</span>
                    <input
                      aria-label={t.access.dashboard.createTrip.labels.endDate}
                      value={tripForm.endDate}
                      onChange={(event) => onChange((current) => ({ ...current, endDate: event.target.value }))}
                      type="date"
                      required
                    />
                  </label>
                </div>
                <small>Round trip dates are used as the first trip window.</small>
              </fieldset>
              </section>

              <section className="trip-step-section trip-step-section--compact">
              <details className="trip-access-panel">
                <summary>
                    <span>4. Trip owner & settings</span>
                  <strong>{effectiveOwnerDisplayName || defaultOwnerDisplayName}</strong>
                </summary>
                <label>
                  <span>{t.access.dashboard.createTrip.labels.ownerDisplayName}</span>
                  <input
                    value={effectiveOwnerDisplayName}
                    onChange={(event) => {
                      setHasEditedOwnerDisplayName(true);
                      onChange((current) => ({ ...current, ownerDisplayName: event.target.value }));
                    }}
                    autoComplete="name"
                    required
                  />
                  <small>Defaulted from your account profile.</small>
                </label>
                <div className="trip-generated-access">
                  <label>
                    <span>{t.access.dashboard.createTrip.labels.joinId}</span>
                    <input value={tripForm.joinId} readOnly />
                  </label>
                  <label>
                    <span>{t.access.dashboard.createTrip.labels.joinPassword}</span>
                    <input value={tripForm.joinPassword} readOnly />
                  </label>
                  <Button type="button" variant="secondary" onClick={regenerateCredentials}>
                    <Icon name="route" />
                    Regenerate
                  </Button>
                </div>
              </details>
              </section>

              <section className="trip-step-section trip-step-section--compact">
                <details className="trip-access-panel">
                  <summary>
                    <span>5. Invite & join code</span>
                    <strong>เชิญเพื่อนและโค้ดเข้าร่วม</strong>
                  </summary>
                  <div className="trip-generated-access">
                    <label>
                      <span>{t.access.dashboard.createTrip.labels.joinId}</span>
                      <input value={tripForm.joinId} readOnly />
                    </label>
                    <label>
                      <span>{t.access.dashboard.createTrip.labels.joinPassword}</span>
                      <input value={tripForm.joinPassword} readOnly />
                    </label>
                    <Button type="button" variant="secondary" onClick={regenerateCredentials}>
                      <Icon name="route" />
                      Regenerate
                    </Button>
                  </div>
                </details>
              </section>

              <div className="trip-access-note">
                <Icon name="key" />
                <span>คุณสามารถแก้ไขรายละเอียดทั้งหมดได้หลังจากสร้างทริป</span>
              </div>
              <div className="trip-ticket-review">
                <div>
                  <span>Trip</span>
                  <strong>{tripForm.name || "New trip"}</strong>
                </div>
                <div>
                  <span>Destinations</span>
                  <strong>{destinationSummary}</strong>
                </div>
                <div>
                  <span>Dates</span>
                  <strong>{tripForm.startDate} - {tripForm.endDate}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        <aside className="trip-live-preview" role="region" aria-label="Live trip preview">
          <div className="trip-boarding-pass">
            <div className="trip-main-ticket">
              <div className="trip-preview-ticket-top">
                <span>Trip preview</span>
              </div>
              <strong>{previewTripName}</strong>
              <p>Trip ID: TRP-26-0001 <Badge tone={canSubmit ? "success" : "neutral"}>{canSubmit ? "Ready" : "Draft"}</Badge></p>
              <div className="trip-flight-route">
                <div>
                  <strong>BKK</strong>
                  <span>Bangkok</span>
                </div>
                <span className="trip-flight-line"><Icon name="route" /></span>
                <div>
                  <strong>{routeDestinationCode}</strong>
                  <span>{selectedCountryNames[0] ?? "Destination"}</span>
                </div>
              </div>
              <TripPreviewLiveMap selectedCountryNames={selectedCountryNames} />
              <div className="trip-preview-destination-row">
                <span>Destinations</span>
                <div>
                  {destinationCards.map((card) => (
                    <article key={card.title} className="trip-mini-destination">
                      <span className="trip-place-thumb" aria-hidden="true" />
                      <div>
                        <strong>{card.title}</strong>
                        <small>{card.detail}</small>
                      </div>
                      <Badge tone="primary">{card.nights}</Badge>
                    </article>
                  ))}
                  <button className="trip-mini-add" type="button" onClick={focusDestinationSearch}>
                    <Icon name="plus" />
                    เพิ่มจุดหมาย
                  </button>
                </div>
              </div>
            </div>
            <div className="trip-ticket-stub">
              <Icon name="route" />
              <div>
                <strong>{previewStartDate} - {previewEndDate}</strong>
                <span>{previewNightCount}</span>
              </div>
              <div>
                <span>สกุลเงิน</span>
                <strong>{currencySummary}</strong>
              </div>
              <div>
                <span>สถานะ</span>
                <Badge tone={canSubmit ? "warning" : "neutral"}>{inviteStatus}</Badge>
              </div>
              <span className="trip-ticket-barcode" aria-label="Ticket barcode" />
            </div>
          </div>
          <div className="trip-preview-inspiration">
            <div>
              <strong>Inspiration board</strong>
              <span>ไอเดียสำหรับทริปนี้</span>
              <div className="trip-inspiration-controls">
                <button type="button" onClick={() => shiftInspiration(-1)} aria-label="Previous inspiration">
                  <Icon name="chevronLeft" />
                </button>
                <button type="button" onClick={() => shiftInspiration(1)} aria-label="Next inspiration">
                  <Icon name="chevronRight" />
                </button>
              </div>
            </div>
            <ul aria-label="Destination inspiration">
              {inspirationCards.map((card) => (
                <li key={card.title} style={{ "--card-accent": card.accent } as CSSProperties}>
                  <span aria-hidden="true" />
                  <div>
                    <strong>{card.title}</strong>
                    <small>{card.detail}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="trip-share-strip">
            <span><Icon name="users" /> แชร์โค้ดนี้กับเพื่อนเพื่อเข้าร่วมทริป</span>
            <span>Join code: <strong>{joinCode}</strong></span>
            <Button type="button" variant="secondary" onClick={() => void copyJoinCode()}>
              {hasCopiedJoinCode ? "Copied" : "คัดลอก"}
            </Button>
          </div>
        </aside>
      </div>
      <div className="trip-wizard-actions">
        <Button asChild type="button" variant="secondary">
          <Link href={appRoutes.portalMyTrips()}>
            <Icon name="chevronLeft" />
            Cancel
          </Link>
        </Button>
        <Button type="submit" disabled={isSubmitting || !canSubmit}>
          <Icon name="check" />
          {isSubmitting ? "Creating..." : t.access.dashboard.createTrip.submit}
        </Button>
      </div>
    </form>
  );
}

function tripPreviewCards(selectedCountryNames: string[]): Array<{ title: string; detail: string; accent: string }> {
  if (selectedCountryNames.includes("Japan")) {
    return [
      { title: "ย่านกิออน เกียวโต", detail: "Kyoto", accent: "#0f766e" },
      { title: "วัดคินคะคุจิ", detail: "Kyoto", accent: "#38bdf8" },
      { title: "ปราสาทโอซาก้า", detail: "Osaka", accent: "#fb7185" },
      { title: "ชินเซไก", detail: "Osaka", accent: "#0f766e" },
    ];
  }
  const selected = selectedCountryNames.length ? selectedCountryNames.slice(0, 4) : ["ย่านกิออน เกียวโต", "วัดคินคะคุจิ", "ปราสาทโอซาก้า", "ชินเซไก"];
  return selected.map((name, index) => ({
    title: name,
    detail: selectedCountryNames.length ? name : index < 2 ? "Kyoto" : "Osaka",
    accent: ["#0f766e", "#38bdf8", "#fb7185"][index % 3],
  }));
}

function rotateList<T>(items: T[], offset: number): T[] {
  if (items.length <= 1) return items;
  const normalizedOffset = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(normalizedOffset), ...items.slice(0, normalizedOffset)];
}

function tripDestinationCards(selectedCountryNames: string[]): Array<{ title: string; detail: string; nights: string; countryName: string }> {
  const cards: Array<{ title: string; detail: string; nights: string; countryName: string }> = [];
  if (selectedCountryNames.includes("Japan")) {
    cards.push(
      { title: "Kyoto", detail: "Japan", nights: "4 คืน", countryName: "Japan" },
      { title: "Osaka", detail: "Japan", nights: "6 คืน", countryName: "Japan" },
    );
  }
  selectedCountryNames
    .filter((name) => name !== "Japan")
    .forEach((name, index) => {
      cards.push({ title: name, detail: name, nights: `${index + 3} คืน`, countryName: name });
    });
  if (cards.length) return cards.slice(0, 4);
  return [{ title: "Destination", detail: "Trip stop", nights: "3 คืน", countryName: "Destination" }];
}

function formatPreviewTravelDate(value: string): string {
  if (!value) return "--";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function tripNightCount(startDate: string, endDate: string): string {
  const start = Date.parse(`${startDate}T00:00:00`);
  const end = Date.parse(`${endDate}T00:00:00`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "ยังไม่กำหนด";
  const days = Math.round((end - start) / 86_400_000);
  return `${days} คืน (${days + 1} วัน)`;
}

function TripPreviewLiveMap({ selectedCountryNames }: { selectedCountryNames: string[] }) {
  const coordinates = useMemo(() => tripPreviewMapCoordinates(selectedCountryNames), [selectedCountryNames]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<Array<import("maplibre-gl").Marker>>([]);
  const [mapState, setMapState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const liveMapEnabled = process.env.NODE_ENV !== "test";

  useEffect(() => {
    if (!liveMapEnabled || selectedCountryNames.length === 0 || !mapContainerRef.current) return undefined;
    let disposed = false;
    const markers = markersRef.current;

    async function mountMap() {
      setMapState("loading");

      try {
        const maplibregl = await import("maplibre-gl");
        const container = mapContainerRef.current;
        if (!container || disposed) return;
        container.inert = true;
        container.tabIndex = -1;

        const map = new maplibregl.Map({
          attributionControl: { compact: true },
          center: previewMapCenter(coordinates),
          container,
          interactive: false,
          style: "https://tiles.openfreemap.org/styles/positron",
          zoom: coordinates.length > 1 ? 2.4 : 3.2,
        });
        mapRef.current = map;

        coordinates.forEach((coordinate, index) => {
          const markerElement = document.createElement("span");
          markerElement.className = "trip-preview-live-marker";
          markerElement.textContent = String(index + 1);
          markerElement.setAttribute("aria-hidden", "true");
          const marker = new maplibregl.Marker({ element: markerElement })
            .setLngLat(coordinate)
            .addTo(map);
          markers.push(marker);
        });

        map.on("load", () => {
          if (disposed) return;
          fitPreviewMap(map, coordinates);
          container.inert = false;
          setMapState("ready");
        });
        map.on("error", () => {
          if (!disposed) setMapState("error");
        });
      } catch {
        if (!disposed) setMapState("error");
      }
    }

    void mountMap();

    return () => {
      disposed = true;
      markers.forEach((marker) => marker.remove());
      markers.length = 0;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [coordinates, liveMapEnabled, selectedCountryNames.length]);

  return (
    <div className={mapState === "ready" ? "trip-preview-map trip-preview-map--live trip-preview-map--ready" : "trip-preview-map trip-preview-map--live"}>
      <div className="trip-preview-map-canvas" ref={mapContainerRef} aria-hidden="true" />
      {mapState !== "ready" ? (
        <div className="trip-preview-map-fallback" aria-hidden="true">
          <span className="trip-preview-pin trip-preview-pin--origin"><Icon name="location" /></span>
          <span className="trip-preview-pin trip-preview-pin--destination"><Icon name="map" /></span>
          <span className="trip-preview-route-line" />
        </div>
      ) : null}
      <span className="trip-preview-map-source">
        <Icon name="map" />
        OpenFreeMap live map
      </span>
    </div>
  );
}

function tripPreviewMapCoordinates(selectedCountryNames: string[]): Array<[number, number]> {
  const coordinates = selectedCountryNames
    .map((countryName) => worldMapCountries.find((country) => country.name === countryName)?.feature)
    .filter((country): country is Feature<Geometry, { name: string }> => Boolean(country))
    .map((country) => geoCentroid(country) as [number, number]);
  return coordinates.length ? coordinates : [[100, 20]];
}

function previewMapCenter(coordinates: Array<[number, number]>): [number, number] {
  const totals = coordinates.reduce(
    (current, coordinate) => [current[0] + coordinate[0], current[1] + coordinate[1]] as [number, number],
    [0, 0] as [number, number],
  );
  return [totals[0] / coordinates.length, totals[1] / coordinates.length];
}

function fitPreviewMap(map: import("maplibre-gl").Map, coordinates: Array<[number, number]>) {
  if (coordinates.length <= 1) {
    map.flyTo({ center: coordinates[0], zoom: 3.2, duration: 0 });
    return;
  }
  const lngs = coordinates.map((coordinate) => coordinate[0]);
  const lats = coordinates.map((coordinate) => coordinate[1]);
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
  map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 4.2 });
}

function CountryWorldMap({
  activeContinent,
  onToggleCountry,
  selectedCountryNames,
}: {
  activeContinent: TripContinent;
  onToggleCountry: (countryName: string) => void;
  selectedCountryNames: string[];
}) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  function countryClassName(countryName: string, region: TripContinent) {
    const isSelected = selectedCountryNames.includes(countryName);
    const isDimmed = activeContinent !== "all" && region !== activeContinent;
    return [
      "trip-map-shape",
      isSelected ? "trip-map-shape--selected" : "",
      hoveredCountry === countryName ? "trip-map-shape--hovered" : "",
      isDimmed ? "trip-map-shape--dimmed" : "",
    ].filter(Boolean).join(" ");
  }

  function toggleFromKeyboard(event: KeyboardEvent<SVGPathElement>, countryName: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onToggleCountry(countryName);
  }

  function changeZoom(delta: number) {
    setZoom((current) => clampNumber(Number((current + delta).toFixed(1)), 1, 2.4));
  }

  function resetZoom() {
    setZoom(1);
  }

  const viewBox = zoomedMapViewBox(activeContinent, zoom);

  return (
    <div className="trip-world-map" aria-label="World map country picker">
      <div className="trip-map-controls" aria-label="Map zoom controls">
        <button type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 1} aria-label="Zoom out">
          -
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.4} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={resetZoom}>Reset</button>
      </div>
      <svg viewBox={viewBox} role="img" aria-label="World countries">
        <path className="trip-map-sphere" d={worldMapPath({ type: "Sphere" }) ?? ""} />
        {worldMapCountries.map((country) => (
          <path
            aria-label={country.name}
            aria-pressed={selectedCountryNames.includes(country.name)}
            className={countryClassName(country.name, country.region)}
            d={country.path}
            key={country.name}
            role="button"
            tabIndex={0}
            onBlur={() => setHoveredCountry(null)}
            onClick={() => onToggleCountry(country.name)}
            onFocus={() => setHoveredCountry(country.name)}
            onKeyDown={(event) => toggleFromKeyboard(event, country.name)}
            onMouseEnter={() => setHoveredCountry(country.name)}
            onMouseLeave={() => setHoveredCountry(null)}
          >
            <title>{country.name}</title>
          </path>
        ))}
      </svg>
      {hoveredCountry ? <span className="trip-map-hover-label">{hoveredCountry}</span> : null}
    </div>
  );
}

function baseContinentViewBox(continent: TripContinent): [number, number, number, number] {
  if (continent === "asia") return [500, 80, 390, 300];
  if (continent === "europe") return [365, 70, 255, 210];
  if (continent === "north-america") return [35, 70, 365, 245];
  if (continent === "south-america") return [205, 245, 230, 235];
  if (continent === "oceania") return [680, 270, 255, 175];
  if (continent === "africa") return [385, 170, 280, 305];
  return [0, 0, worldMapSize.width, worldMapSize.height];
}

function zoomedMapViewBox(continent: TripContinent, zoom: number): string {
  const [x, y, width, height] = baseContinentViewBox(continent);
  const nextWidth = width / zoom;
  const nextHeight = height / zoom;
  const nextX = x + (width - nextWidth) / 2;
  const nextY = y + (height - nextHeight) / 2;
  return `${nextX} ${nextY} ${nextWidth} ${nextHeight}`;
}

function mapCountryRegion(country: Feature<Geometry, { name: string }>): TripContinent {
  const [longitude, latitude] = geoCentroid(country);
  if (longitude < -25) return latitude >= 12 ? "north-america" : "south-america";
  if (longitude >= 110 && latitude < -5) return "oceania";
  if (longitude >= -25 && longitude <= 60 && latitude >= -37 && latitude < 35) return "africa";
  if (longitude >= -25 && longitude <= 65 && latitude >= 35) return "europe";
  if (longitude >= 25 && latitude >= -12) return "asia";
  return "all";
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizedTripForm(form: AccountTripCreateRequest, defaultOwnerDisplayName: string): AccountTripCreateRequest {
  const name = form.name.trim();
  const countries = selectedTripCountries(form.countries, form.destinationLabel);
  const countryNames = countries.map((country) => country.name);
  return {
    ...form,
    name,
    countries: countryNames,
    destinationLabel: countryNames.length ? countryNames.join(", ") : form.destinationLabel.trim() || name,
    ownerDisplayName: form.ownerDisplayName.trim() || defaultOwnerDisplayName,
  };
}

function selectedTripCountries(countries: string[], destinationLabel: string): TripCountrySelection[] {
  const selectedNames = (countries.length ? countries : destinationLabel.split(",")).map((value) => value.trim()).filter(Boolean);
  return selectedNames
    .map((name) => {
      const option = tripCountryOptions.find((country) => country.name.toLocaleLowerCase() === name.toLocaleLowerCase());
      return option ? { name: option.name, currency: option.currency } : { name, currency: "" };
    });
}

function countrySuggestions(query: string, activeContinent: TripContinent, selectedCountryNames: string[]): TripCountryOption[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const pool = activeContinent === "all" ? tripCountryOptions : tripCountryOptions.filter((country) => country.continent === activeContinent);
  return pool
    .filter((country) => !selectedCountryNames.includes(country.name))
    .filter((country) => {
      if (!normalizedQuery) return true;
      return [country.name, country.code, country.currency, ...country.cities]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    })
    .slice(0, normalizedQuery ? 6 : 4);
}

function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values));
}

function generateJoinId(): string {
  return `JOII-${randomToken(3)}-${randomToken(3)}`.toUpperCase();
}

function generateJoinPassword(): string {
  return `${randomToken(4)}-${randomToken(4)}-${randomToken(4)}`;
}

function randomToken(length: number): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const values = new Uint8Array(length);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < values.length; index += 1) values[index] = Math.floor(Math.random() * 256);
  }
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

function readPreviousPortalSectionIndex(fallbackIndex: number): number {
  if (typeof window === "undefined") return fallbackIndex;
  const storedIndex = Number(window.sessionStorage.getItem(portalSectionStorageKey));
  return Number.isFinite(storedIndex) ? storedIndex : fallbackIndex;
}

function PortalStatSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <div className="account-stat portal-skeleton-card" key={index}>
          <span className="portal-skeleton portal-skeleton--number" />
          <span className="portal-skeleton portal-skeleton--short" />
        </div>
      ))}
    </>
  );
}

function PortalListSkeleton({ compact = false, rows }: { compact?: boolean; rows: number }) {
  return (
    <div className={compact ? "portal-list-skeleton portal-list-skeleton--compact" : "portal-list-skeleton"} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div className="portal-skeleton-row" key={index}>
          <span className="portal-skeleton portal-skeleton--icon" />
          <span className="portal-skeleton portal-skeleton--line" />
          <span className="portal-skeleton portal-skeleton--short" />
        </div>
      ))}
    </div>
  );
}

function AccountSettingsEditor({
  accountClient,
  accountSession,
  onError,
  onMessage,
  onSessionCleared,
  onSettingsChanged,
  settings,
}: {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
  onSessionCleared: () => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  settings: AccountSettings;
}) {
  const { locale, t } = useI18n();
  const [form, setForm] = useState<AccountSettingsUpdateRequest>(() => profileToForm(settings));
  const [isSaving, setIsSaving] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const nextSettings = await accountClient.updateSettings(accountSession.sessionToken, form);
      onSettingsChanged(nextSettings);
      setForm(profileToForm(nextSettings));
      onMessage(t.access.settings.messages.saved);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.saveFailed, t.access.messages));
    } finally {
      setIsSaving(false);
    }
  }

  async function revokeDevice(deviceId: string) {
    setRevokingDeviceId(deviceId);
    try {
      await accountClient.revokeTrustedDevice(accountSession.sessionToken, deviceId);
      if (accountSession.trustedDeviceId === deviceId) {
        onSessionCleared();
        onMessage(t.access.settings.messages.currentDeviceRevoked);
        onError(null);
        return;
      }
      const nextSettings = await accountClient.loadSettings(accountSession.sessionToken);
      onSettingsChanged(nextSettings);
      onMessage(t.access.settings.messages.deviceRevoked);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.revokeFailed, t.access.messages));
    } finally {
      setRevokingDeviceId(null);
    }
  }

  return (
    <>
      <div className="settings-profile-preview">
        <span className="person-avatar" style={{ backgroundColor: form.avatarColor }} aria-hidden="true">
          {form.displayName.slice(0, 1) || "A"}
        </span>
        <div>
          <strong>{form.displayName}</strong>
          <span>{settings.profile.primaryEmail ?? t.access.dashboard.noEmail}</span>
        </div>
      </div>
      <form className="account-form account-settings-form" onSubmit={submitSettings}>
        <div className="account-two-col">
          <label>
            <span>{t.access.settings.form.displayName}</span>
            <input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} required />
          </label>
          <label>
            <span>{t.access.settings.form.avatarColor}</span>
            <input
              value={form.avatarColor}
              onChange={(event) => setForm((current) => ({ ...current, avatarColor: event.target.value }))}
              pattern="#[0-9a-fA-F]{6}"
              type="color"
              required
            />
          </label>
          <label>
            <span>{t.access.settings.form.locale}</span>
            <select value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))} required>
              <option value="th-TH">Thai</option>
              <option value="en-US">English</option>
            </select>
          </label>
          <label>
            <span>{t.access.settings.form.timezone}</span>
            <input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} required />
          </label>
        </div>
        <Button type="submit" disabled={isSaving}>
          <Icon name="check" />
          {t.access.settings.form.save}
        </Button>
      </form>

      <div className="account-settings-grid">
        <SettingLine label={t.access.settings.passkeys} value={`${settings.passkeys.length}`} />
        <SettingLine label={t.access.settings.trustedDevices} value={`${settings.trustedDevices.length}`} />
      </div>

      <div className="account-device-list" aria-label={t.access.settings.trustedDevicesLabel}>
        {settings.trustedDevices.length ? (
          settings.trustedDevices.map((device) => (
            <div className="account-device-row" key={device.id}>
              <div>
                <strong>{device.label}</strong>
                <span>
                  {device.userAgent || t.access.settings.unknownBrowser} ·{" "}
                  {device.lastSeenAt ? formatDateTime(device.lastSeenAt, locale) : formatDateTime(device.createdAt, locale)}
                </span>
              </div>
              <Button type="button" variant="secondary" onClick={() => void revokeDevice(device.id)} disabled={revokingDeviceId === device.id}>
                <Icon name="x" />
                {t.access.settings.revoke}
              </Button>
            </div>
          ))
        ) : (
          <p className="account-empty">{t.access.settings.noTrustedDevices}</p>
        )}
      </div>
    </>
  );
}

function PanelHeading({ detail, icon, title }: { detail: string; icon: ComponentProps<typeof Icon>["name"]; title: string }) {
  return (
    <div className="account-panel-heading">
      <span aria-hidden="true"><Icon name={icon} /></span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="account-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SettingLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="account-setting-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusMessage({ children, tone }: { children: ReactNode; tone: "danger" | "success" }) {
  return (
    <p className={tone === "danger" ? "join-alert" : "account-success"} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={tone === "danger" ? "alertCircle" : "check"} />
      {children}
    </p>
  );
}

function errorMessage(caught: unknown, fallback: string, labels: Messages["access"]["messages"]): string {
  return localizeAccessError(rawErrorMessage(caught, fallback), labels) ?? fallback;
}

function rawErrorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof Error && caught.message) return caught.message;
  return fallback;
}

function localizeAccessError(message: string | null, labels: Messages["access"]["messages"]): string | null {
  if (!message) return null;
  return friendlyErrorText(message, message, labels);
}

function friendlyErrorText(message: string, fallback: string, labels: Messages["access"]["messages"]): string {
  const normalized = message.trim();
  if (normalized === ACCESS_ERROR_CODES.accountLoadFailed) return labels.accountLoadFailed;
  if (normalized === ACCESS_ERROR_CODES.passkeyRegistrationCredential) return labels.passkeyRegistrationCredential;
  if (normalized === ACCESS_ERROR_CODES.passkeyLoginCredential) return labels.passkeyLoginCredential;
  if (normalized === ACCESS_ERROR_CODES.passkeyUnsupported) return labels.passkeyUnsupported;
  if (normalized === "404") return labels.notFound;
  if (normalized === "401" || normalized === "403" || normalized === "unauthenticated" || normalized === "unauthorized") return labels.unauthorized;
  if (!normalized || /^\d{3}$/.test(normalized)) return fallback;
  return normalized;
}

function formatDateTime(value: string, locale: "en" | "th"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function profileToForm(settings: AccountSettings): AccountSettingsUpdateRequest {
  return {
    displayName: settings.profile.displayName,
    avatarColor: settings.profile.avatarColor,
    locale: settings.profile.locale,
    timezone: settings.profile.timezone,
  };
}

async function createPasskeyCredential(challenge: string, settings: AccountSettings) {
  const credentials = assertCredentialApi();
  const userName = settings.profile.primaryEmail ?? settings.profile.displayName;
  const rpId = getPasskeyRpId();
  const credential = await credentials.create({
    publicKey: {
      challenge: base64UrlToArrayBuffer(challenge),
      rp: { name: "Joii", ...(rpId ? { id: rpId } : {}) },
      user: {
        id: new TextEncoder().encode(settings.profile.id),
        name: userName,
        displayName: settings.profile.displayName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
      attestation: "none",
      timeout: 60_000,
    },
  });

  if (!isRegistrationCredential(credential)) {
    throw new Error(ACCESS_ERROR_CODES.passkeyRegistrationCredential);
  }

  return credential;
}

async function getPasskeyCredential(challenge: string, credentialIds: string[]) {
  const credentials = assertCredentialApi();
  const credential = await credentials.get({
    publicKey: {
      challenge: base64UrlToArrayBuffer(challenge),
      allowCredentials: credentialIds.map((credentialId) => ({
        type: "public-key",
        id: base64UrlToArrayBuffer(credentialId),
      })),
      userVerification: "required",
      timeout: 60_000,
    },
  });

  if (!isAssertionCredential(credential)) {
    throw new Error(ACCESS_ERROR_CODES.passkeyLoginCredential);
  }

  return credential;
}

type RegistrationCredential = PublicKeyCredential & {
  response: AuthenticatorAttestationResponse;
};

type AssertionCredential = PublicKeyCredential & {
  response: AuthenticatorAssertionResponse;
};

function assertCredentialApi(): CredentialsContainer {
  if (typeof navigator === "undefined" || !navigator.credentials) {
    throw new Error(ACCESS_ERROR_CODES.passkeyUnsupported);
  }
  return navigator.credentials;
}

function isRegistrationCredential(credential: Credential | null): credential is RegistrationCredential {
  return isPublicKeyCredential(credential) && "attestationObject" in credential.response && credential.response.attestationObject instanceof ArrayBuffer;
}

function isAssertionCredential(credential: Credential | null): credential is AssertionCredential {
  return (
    isPublicKeyCredential(credential) &&
    "authenticatorData" in credential.response &&
    "signature" in credential.response &&
    credential.response.authenticatorData instanceof ArrayBuffer &&
    credential.response.signature instanceof ArrayBuffer
  );
}

function getPasskeyRpId(): string | null {
  const rpHost = window.location.hostname;
  if (!rpHost) return null;
  if (rpHost === "localhost") return rpHost;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(rpHost)) return null;
  if (/^([0-9a-fA-F:]+)$/.test(rpHost)) return null;
  return rpHost;
}

function isPublicKeyCredential(credential: Credential | null): credential is PublicKeyCredential {
  return (
    !!credential &&
    "rawId" in credential &&
    credential.rawId instanceof ArrayBuffer &&
    "response" in credential &&
    typeof credential.response === "object" &&
    credential.response !== null &&
    "clientDataJSON" in credential.response &&
    credential.response.clientDataJSON instanceof ArrayBuffer
  );
}

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}
