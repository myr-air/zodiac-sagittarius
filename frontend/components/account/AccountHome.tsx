"use client";

import { useEffect, useState, useSyncExternalStore, startTransition } from "react";
import { useRouter } from "next/navigation";
import { accountHomeGate } from "@/src/account/account-home-gate";
import {
  loadAccountHomeData,
  type AccountHomeLoadedData,
} from "@/src/account/account-home-load";
import { defaultApiBaseUrl } from "@/src/auth/email-challenge";
import { AccountHomeNav } from "./AccountHomeNav";
import {
  FriendsLocationPlaceholder,
  ItinerarySummaryCard,
  PlacesPlaceholder,
  StoriesPlaceholder,
} from "./PlaceholderSections";
import { UpcomingTrips } from "./UpcomingTrips";

const EMPTY_DATA: AccountHomeLoadedData = {
  greeting: "Home",
  displayName: "Traveler",
  upcomingTrips: [],
  itinerary: null,
  stories: { dataSource: "placeholder" },
  friends: { dataSource: "placeholder" },
  places: { dataSource: "placeholder" },
};

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

export function AccountHome() {
  const router = useRouter();
  const sessionToken = useAccountSessionToken();
  const [data, setData] = useState<AccountHomeLoadedData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionToken === null) {
      router.replace("/login");
    }
  }, [sessionToken, router]);

  useEffect(() => {
    if (!sessionToken) return;

    let cancelled = false;

    void loadAccountHomeData(
      { sessionToken },
      {
        fetch,
        apiBaseUrl: defaultApiBaseUrl(),
        now: new Date(),
      },
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
    <div className="account-home min-h-dvh overflow-x-hidden bg-(--ah-page) text-(--ah-text)">
      <AccountHomeNav />

      <main className="ah-shell">
        <header className="ah-hero" data-region="greeting" data-source="live">
          <div>
            <h1>{loading ? "…" : data.greeting}</h1>
            <p>Plan your itinerary with us.</p>
          </div>
          <div className="ah-hero-tools">
            <button className="ah-tool" type="button" aria-label="Search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            <button className="ah-tool ah-tool--dot" type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
                <path d="M10 19a2 2 0 0 0 4 0" />
              </svg>
            </button>
            <button className="ah-get-apps" type="button">
              Get Apps
            </button>
          </div>
        </header>

        <div className="ah-compose" data-compose="account-home">
          <StoriesPlaceholder />
          <FriendsLocationPlaceholder />
          <UpcomingTrips trips={data.upcomingTrips} />
          <PlacesPlaceholder />
          <ItinerarySummaryCard
            itinerary={data.itinerary}
            displayName={data.displayName}
          />
        </div>
      </main>
    </div>
  );
}
