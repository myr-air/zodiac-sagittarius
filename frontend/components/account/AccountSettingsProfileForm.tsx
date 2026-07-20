"use client";

import { useEffect, useId, useState } from "react";
import {
  ACCOUNT_AVATAR_SWATCHES,
  applyHometownSuggestion,
  changeHomeCity,
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

export function AccountSettingsProfileForm({
  form,
  onChange,
  fetch: fetchImpl = globalThis.fetch,
  hometownDebounceMs = DEFAULT_HOMETOWN_DEBOUNCE_MS,
}: AccountSettingsProfileFormProps) {
  const localeOptions = ensureOption(LOCALE_OPTIONS, form.locale);
  const timezoneOptions = ensureOption(TIMEZONE_OPTIONS, form.timezone);
  const listId = useId();
  const [suggestions, setSuggestions] = useState<HometownSuggestion[]>([]);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    const q = form.homeCity.trim();
    if (!q) {
      setSuggestions([]);
      setListOpen(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void searchHometownSuggestions(q, { fetch: fetchImpl }).then((next) => {
        if (cancelled) return;
        setSuggestions(next);
        setListOpen(next.length > 0);
      });
    }, hometownDebounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.homeCity, fetchImpl, hometownDebounceMs]);

  function selectSuggestion(suggestion: HometownSuggestion) {
    onChange(applyHometownSuggestion(form, suggestion));
    setSuggestions([]);
    setListOpen(false);
  }

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
            <label htmlFor="account-timezone">Timezone</label>
            <select
              className="account-settings-control"
              id="account-timezone"
              value={form.timezone}
              onChange={(e) => onChange({ ...form, timezone: e.target.value })}
            >
              {timezoneOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="account-settings-grid account-settings-grid--spaced">
          <div className="account-settings-field account-settings-suggest">
            <label htmlFor="account-home-city">City</label>
            <input
              className="account-settings-control"
              id="account-home-city"
              value={form.homeCity}
              placeholder="Start typing…"
              autoComplete="off"
              role="combobox"
              aria-expanded={listOpen}
              aria-controls={listId}
              aria-autocomplete="list"
              onChange={(e) => onChange(changeHomeCity(form, e.target.value))}
              onBlur={() => {
                window.setTimeout(() => setListOpen(false), 120);
              }}
            />
            <ul
              className={
                listOpen
                  ? "account-settings-suggest-list account-settings-suggest-list--open"
                  : "account-settings-suggest-list"
              }
              id={listId}
              role="listbox"
              hidden={!listOpen}
            >
              {suggestions.map((suggestion) => (
                <li key={`${suggestion.city}|${suggestion.country}`} role="option">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(suggestion);
                    }}
                  >
                    <b>{suggestion.city}</b>
                    <i>{suggestion.country}</i>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="account-settings-field">
            <label htmlFor="account-home-country">Country</label>
            <input
              className="account-settings-control"
              id="account-home-country"
              value={form.homeCountry}
              placeholder="From suggestion"
              readOnly
            />
          </div>
        </div>
      </section>
    </>
  );
}
