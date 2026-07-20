"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  startTransition,
  useDeferredValue,
} from "react";
import { useRouter } from "next/navigation";
import { classifyAccountTripSeed, createAccountTrip } from "@/src/account/account-api";
import { accountHomeGate } from "@/src/account/account-home-gate";
import { defaultApiBaseUrl } from "@/src/auth/email-challenge";
import { saveMemberSession } from "@/src/landing/create-trip";
import {
  loadPortalTrips,
  type PortalTripsLoadedData,
} from "@/src/portal/portal-trips-load";
import {
  filterPortalTripRows,
  type PortalTripFilter,
} from "@/src/portal/trip-rows";
import { CreateTripForm } from "./CreateTripForm";
import { PortalNav } from "./PortalNav";
import { PortalTripRows } from "./PortalTripRows";

const EMPTY: PortalTripsLoadedData = { rows: [], trips: [] };

const FILTERS = ["Upcoming", "Planning", "Past", "All"] as const satisfies readonly PortalTripFilter[];

function readSessionToken(): string | null {
  const gate = accountHomeGate(
    typeof window !== "undefined" ? window.localStorage : null,
  );
  return gate.kind === "home" ? gate.session.sessionToken : null;
}

function useAccountSessionToken(): string | null | undefined {
  return useSyncExternalStore(
    () => () => {},
    readSessionToken,
    () => undefined,
  );
}

export function PortalTripsPage() {
  const router = useRouter();
  const sessionToken = useAccountSessionToken();
  const [data, setData] = useState<PortalTripsLoadedData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PortalTripFilter>("Upcoming");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (sessionToken === null) {
      router.replace("/login");
    }
  }, [sessionToken, router]);

  useEffect(() => {
    if (!sessionToken) return;

    let cancelled = false;

    void loadPortalTrips(
      { sessionToken },
      { fetch, apiBaseUrl: defaultApiBaseUrl() },
    ).then((loaded) => {
      if (cancelled) return;
      startTransition(() => {
        setData(loaded);
        setLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  const visibleRows = filterPortalTripRows(data.rows, {
    filter,
    query: deferredQuery,
  });
  const noMatch = data.rows.length > 0 && visibleRows.length === 0;

  if (sessionToken === undefined || sessionToken === null) {
    return (
      <div className="min-h-dvh bg-(--color-page)" aria-busy="true">
        <span className="sr-only">
          {sessionToken === null ? "Redirecting to login…" : "Checking session…"}
        </span>
      </div>
    );
  }

  return (
    <div className="portal-shell-root min-h-dvh text-(--color-text)">
      <PortalNav />

      <main className="portal-shell">
        <div className="portal-page-head">
          <div>
            <p className="portal-eyebrow">Your atlas</p>
            <h1>Trips</h1>
            <p>
              Every journey in one calm place — open a trip, invite friends, or
              start something new.
            </p>
          </div>
          <div className="portal-page-actions">
            <button className="portal-btn portal-btn--ghost" type="button">
              Import
            </button>
            <button
              className="portal-btn portal-btn--primary"
              type="button"
              onClick={() => setCreating(true)}
            >
              Create trip
            </button>
          </div>
        </div>

        {creating ? (
          <div className="mb-6">
            <CreateTripForm
              sessionToken={sessionToken}
              classifyTripSeed={async (text) => {
                const outcome = await classifyAccountTripSeed(
                  { sessionToken, text },
                  { fetch, apiBaseUrl: defaultApiBaseUrl() },
                );
                if (!outcome.ok) {
                  throw new Error(outcome.error);
                }
                return outcome.seed;
              }}
              createAccountTrip={(input) =>
                createAccountTrip(input, {
                  fetch,
                  apiBaseUrl: defaultApiBaseUrl(),
                })
              }
              saveMemberSession={(session) =>
                saveMemberSession(
                  typeof window !== "undefined" ? window.localStorage : null,
                  session,
                )
              }
              navigate={(path) => router.push(path)}
              onCancel={() => setCreating(false)}
            />
          </div>
        ) : null}

        <div className="portal-filters" role="toolbar" aria-label="Trip filters">
          {FILTERS.map((label) => (
            <button
              key={label}
              className="portal-filter"
              type="button"
              aria-pressed={filter === label}
              onClick={() => setFilter(label)}
            >
              {label}
            </button>
          ))}
          <input
            className="portal-search"
            type="search"
            placeholder="Search trips"
            aria-label="Search trips"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {loading ? (
          <p className="portal-pass-loading" aria-busy="true">
            Loading trips…
          </p>
        ) : (
          <PortalTripRows rows={visibleRows} noMatch={noMatch} />
        )}
      </main>
    </div>
  );
}
