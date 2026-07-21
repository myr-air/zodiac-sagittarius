"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ACCOUNT_AVATAR_SWATCHES,
  applyHometownSuggestion,
  type AccountSettingsForm,
  type HometownSuggestion,
} from "@/src/account/account-settings-form";
import { searchHometownSuggestions } from "@/src/account/hometown-geocode";

const LOCALE_OPTIONS = [
  { value: "th-TH", label: "ไทย (th-TH)" },
  { value: "en-US", label: "English (en-US)" },
  { value: "en-GB", label: "English (en-GB)" },
  { value: "ja-JP", label: "日本語 (ja-JP)" },
] as const;

const TIMEZONE_OPTIONS = [
  { value: "Asia/Bangkok", label: "Asia/Bangkok" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong" },
  { value: "UTC", label: "UTC" },
] as const;

const DEFAULT_HOMETOWN_DEBOUNCE_MS = 250;

const CITY_LABEL_ID = "account-home-city-label";
const CITY_DIALOG_TITLE = "Choose city";
const CITY_DIALOG_TITLE_ID = "account-city-picker-title";
const CITY_DIALOG_LEDE = "Search places. Selecting fills city and country.";
const CITY_SEARCH_LABEL = "Search cities";
const CITY_SEARCH_PLACEHOLDER = "Search city or country…";
const CITY_PLACEHOLDER = "Choose a city…";

const TIMEZONE_LABEL_ID = "account-timezone-label";
const TIMEZONE_DIALOG_TITLE = "Choose timezone";
const TIMEZONE_DIALOG_TITLE_ID = "account-timezone-picker-title";
const TIMEZONE_DIALOG_LEDE = "Search IANA timezones.";
const TIMEZONE_SEARCH_LABEL = "Search timezones";
const TIMEZONE_SEARCH_PLACEHOLDER = "Search timezone…";
const TIMEZONE_PLACEHOLDER = "Choose a timezone…";

const CANCEL_LABEL = "Cancel";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export type AccountSettingsProfileFormProps = {
  form: AccountSettingsForm;
  onChange: (next: AccountSettingsForm) => void;
  /** Injectable fetch for hometown geocode (tests). Defaults to global fetch. */
  fetch?: typeof globalThis.fetch;
  /** Debounce for city suggestions (ms). Default 250. */
  hometownDebounceMs?: number;
};

function ensureOption(
  options: readonly { value: string; label: string }[],
  value: string,
): { value: string; label: string }[] {
  if (options.some((o) => o.value === value)) return [...options];
  return [...options, { value, label: value }];
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

export function AccountSettingsProfileForm({
  form,
  onChange,
  fetch: fetchImpl = globalThis.fetch,
  hometownDebounceMs = DEFAULT_HOMETOWN_DEBOUNCE_MS,
}: AccountSettingsProfileFormProps) {
  const localeOptions = ensureOption(LOCALE_OPTIONS, form.locale);
  const timezoneOptions = ensureOption(TIMEZONE_OPTIONS, form.timezone);
  const listId = useId();
  const searchId = useId();
  const timezoneListId = useId();
  const timezoneSearchId = useId();
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [suggestions, setSuggestions] = useState<HometownSuggestion[]>([]);
  const [timezoneDialogOpen, setTimezoneDialogOpen] = useState(false);
  const [timezoneQuery, setTimezoneQuery] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const timezoneDialogRef = useRef<HTMLDivElement>(null);
  const timezoneSearchRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const filteredTimezones = timezoneOptions.filter((opt) => {
    const q = timezoneQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  });

  function openCityDialog(trigger: HTMLElement) {
    restoreFocusRef.current = trigger;
    setCityQuery("");
    setSuggestions([]);
    setCityDialogOpen(true);
  }

  function closeCityDialog() {
    setCityDialogOpen(false);
    setCityQuery("");
    setSuggestions([]);
  }

  function selectSuggestion(suggestion: HometownSuggestion) {
    onChange(applyHometownSuggestion(form, suggestion));
    closeCityDialog();
  }

  function openTimezoneDialog(trigger: HTMLElement) {
    restoreFocusRef.current = trigger;
    setTimezoneQuery("");
    setTimezoneDialogOpen(true);
  }

  function closeTimezoneDialog() {
    setTimezoneDialogOpen(false);
    setTimezoneQuery("");
  }

  function selectTimezone(value: string) {
    onChange({ ...form, timezone: value });
    closeTimezoneDialog();
  }

  useEffect(() => {
    if (!cityDialogOpen) return;

    const q = cityQuery.trim();
    if (!q) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void searchHometownSuggestions(q, { fetch: fetchImpl }).then((next) => {
        if (cancelled) return;
        setSuggestions(next);
      });
    }, hometownDebounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cityDialogOpen, cityQuery, fetchImpl, hometownDebounceMs]);

  useEffect(() => {
    if (!cityDialogOpen) return;

    const panel = dialogRef.current;
    const search = searchRef.current;
    if (!panel || !search) return;

    search.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeCityDialog();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const list = getFocusable(panel);
      if (!list.length) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const restore = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (restore && typeof restore.focus === "function") {
        restore.focus();
      }
    };
  }, [cityDialogOpen]);

  useEffect(() => {
    if (!timezoneDialogOpen) return;

    const panel = timezoneDialogRef.current;
    const search = timezoneSearchRef.current;
    if (!panel || !search) return;

    search.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeTimezoneDialog();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const list = getFocusable(panel);
      if (!list.length) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const restore = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (restore && typeof restore.focus === "function") {
        restore.focus();
      }
    };
  }, [timezoneDialogOpen]);

  return (
    <>
      <section className="account-settings-card" aria-labelledby="account-profile-heading">
        <h2 id="account-profile-heading">Profile</h2>
        <div className="account-settings-field">
          <label htmlFor="account-display-name">Display name</label>
          <input
            className="account-settings-control"
            id="account-display-name"
            value={form.displayName}
            maxLength={80}
            autoComplete="nickname"
            onChange={(e) =>
              onChange({ ...form, displayName: e.target.value })
            }
          />
        </div>
        <div className="account-settings-field">
          <span id="account-avatar-label">Avatar color</span>
          <div
            className="account-settings-swatches"
            role="radiogroup"
            aria-labelledby="account-avatar-label"
          >
            {ACCOUNT_AVATAR_SWATCHES.map((color) => {
              const checked = form.avatarColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  className="account-settings-swatch"
                  role="radio"
                  aria-checked={checked}
                  aria-label={color}
                  style={{ backgroundColor: color }}
                  onClick={() => onChange({ ...form, avatarColor: color })}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="account-settings-card"
        aria-labelledby="account-locale-heading"
      >
        <h2 id="account-locale-heading">Locale &amp; hometown</h2>
        <div className="account-settings-grid">
          <div className="account-settings-field">
            <label htmlFor="account-locale">Locale</label>
            <select
              className="account-settings-control"
              id="account-locale"
              value={form.locale}
              onChange={(e) => onChange({ ...form, locale: e.target.value })}
            >
              {localeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="account-settings-field">
            <span id={TIMEZONE_LABEL_ID}>Timezone</span>
            <button
              type="button"
              className="account-settings-control account-settings-picker-trigger"
              aria-labelledby={TIMEZONE_LABEL_ID}
              aria-haspopup="dialog"
              onClick={(e) => openTimezoneDialog(e.currentTarget)}
            >
              <span
                className={
                  form.timezone
                    ? undefined
                    : "account-settings-picker-placeholder"
                }
              >
                {form.timezone || TIMEZONE_PLACEHOLDER}
              </span>
              <span className="account-settings-picker-chevron" aria-hidden="true">
                ▾
              </span>
            </button>
          </div>
        </div>
        <div className="account-settings-grid account-settings-grid--spaced">
          <div className="account-settings-field">
            <span id={CITY_LABEL_ID}>City</span>
            <button
              type="button"
              className="account-settings-control account-settings-picker-trigger"
              aria-labelledby={CITY_LABEL_ID}
              aria-haspopup="dialog"
              onClick={(e) => openCityDialog(e.currentTarget)}
            >
              <span
                className={
                  form.homeCity
                    ? undefined
                    : "account-settings-picker-placeholder"
                }
              >
                {form.homeCity || CITY_PLACEHOLDER}
              </span>
              <span className="account-settings-picker-chevron" aria-hidden="true">
                ▾
              </span>
            </button>
          </div>
          <div className="account-settings-field">
            <label htmlFor="account-home-country">Country</label>
            <input
              className="account-settings-control"
              id="account-home-country"
              value={form.homeCountry}
              placeholder="From city pick"
              readOnly
            />
          </div>
        </div>
      </section>

      {cityDialogOpen ? (
        <div className="account-settings-dialog-root">
          <div
            className="account-settings-dialog-backdrop"
            onClick={closeCityDialog}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={CITY_DIALOG_TITLE_ID}
            className="account-settings-dialog"
          >
            <h3 id={CITY_DIALOG_TITLE_ID}>{CITY_DIALOG_TITLE}</h3>
            <p className="account-settings-soon-note">{CITY_DIALOG_LEDE}</p>
            <div className="account-settings-picker-search">
              <label className="sr-only" htmlFor={searchId}>
                {CITY_SEARCH_LABEL}
              </label>
              <input
                ref={searchRef}
                className="account-settings-control"
                id={searchId}
                type="search"
                placeholder={CITY_SEARCH_PLACEHOLDER}
                autoComplete="off"
                value={cityQuery}
                onChange={(e) => {
                  const next = e.target.value;
                  setCityQuery(next);
                  if (!next.trim()) setSuggestions([]);
                }}
              />
            </div>
            <ul
              className="account-settings-picker-list"
              id={listId}
              role="listbox"
            >
              {suggestions.map((suggestion) => (
                <li
                  key={`${suggestion.city}|${suggestion.country}`}
                  role="option"
                  aria-selected={false}
                >
                  <button
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <b>{suggestion.city}</b>
                    <i>{suggestion.country}</i>
                  </button>
                </li>
              ))}
            </ul>
            <div className="account-settings-dialog-actions">
              <button
                type="button"
                className="portal-btn portal-btn--ghost"
                onClick={closeCityDialog}
              >
                {CANCEL_LABEL}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {timezoneDialogOpen ? (
        <div className="account-settings-dialog-root">
          <div
            className="account-settings-dialog-backdrop"
            onClick={closeTimezoneDialog}
          />
          <div
            ref={timezoneDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={TIMEZONE_DIALOG_TITLE_ID}
            className="account-settings-dialog"
          >
            <h3 id={TIMEZONE_DIALOG_TITLE_ID}>{TIMEZONE_DIALOG_TITLE}</h3>
            <p className="account-settings-soon-note">{TIMEZONE_DIALOG_LEDE}</p>
            <div className="account-settings-picker-search">
              <label className="sr-only" htmlFor={timezoneSearchId}>
                {TIMEZONE_SEARCH_LABEL}
              </label>
              <input
                ref={timezoneSearchRef}
                className="account-settings-control"
                id={timezoneSearchId}
                type="search"
                placeholder={TIMEZONE_SEARCH_PLACEHOLDER}
                autoComplete="off"
                value={timezoneQuery}
                onChange={(e) => setTimezoneQuery(e.target.value)}
              />
            </div>
            <ul
              className="account-settings-picker-list"
              id={timezoneListId}
              role="listbox"
            >
              {filteredTimezones.map((opt) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === form.timezone}
                >
                  <button
                    type="button"
                    onClick={() => selectTimezone(opt.value)}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="account-settings-dialog-actions">
              <button
                type="button"
                className="portal-btn portal-btn--ghost"
                onClick={closeTimezoneDialog}
              >
                {CANCEL_LABEL}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
