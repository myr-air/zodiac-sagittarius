"use client";

import { PortalNav } from "./PortalNav";

type PortalStubPageProps = {
  title: string;
};

export function PortalStubPage({ title }: PortalStubPageProps) {
  return (
    <div className="portal-shell-root min-h-dvh bg-(--color-page) text-(--color-text)">
      <PortalNav />
      <main className="portal-shell">
        <div className="portal-page-head">
          <div>
            <h1>{title}</h1>
            <p>Coming soon.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
