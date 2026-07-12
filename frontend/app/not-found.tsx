"use client";

import Link from "next/link";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Button } from "@/src/ui";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <section className="flex max-w-xs flex-col items-center gap-5 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-8 text-center shadow-[var(--shadow-panel)] sm:max-w-sm">
        <h1 className="text-6xl font-extrabold tracking-tight text-(--color-text)">404</h1>
        <p className="text-(--color-text-muted)">{t.access.messages.notFound}</p>
        <Button asChild variant="primary">
          <Link href="/">{t.access.backToHome}</Link>
        </Button>
      </section>
    </main>
  );
}
