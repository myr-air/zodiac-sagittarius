"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "./icons";

const workflowStepMeta = [
  {
    key: "invite",
    icon: "users",
    tone: "teal",
  },
  {
    key: "plan",
    icon: "list",
    tone: "sand",
  },
  {
    key: "travel",
    icon: "wallet",
    tone: "violet",
  },
] satisfies Array<{ key: "invite" | "plan" | "travel"; icon: "users" | "list" | "wallet"; tone: "teal" | "sand" | "violet" }>;

const previewDayKeys = ["first", "second", "third"] as const;
const checklistKeys = ["flights", "hotel", "cash", "packing"] as const;

export function HomeLanding() {
  const { t } = useI18n();
  const landing = t.homeLanding;

  return (
    <main className="home-page" aria-labelledby="home-title">
      <nav className="home-nav" aria-label={landing.navLabel}>
        <Link className="home-brand" href="/" aria-label={landing.brandHomeLabel}>
          <span className="home-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48">
              <path d="M13 35 35 13M22 13h13v13" />
              <path d="M12 18c8 2 16 8 18 18" />
            </svg>
          </span>
          Joii Travel Planning
        </Link>

        <div className="home-nav-actions">
          <div className="home-nav-secondary-actions">
            <LanguageSwitch className="home-language-switch" />
            <Link className="home-link-button" href="/login">
              {landing.actions.login}
            </Link>
          </div>
          <Link className="home-primary-button" href="/join">
            {landing.actions.tripAccess}
            <Icon name="key" />
          </Link>
        </div>
      </nav>

      <section className="home-hero" aria-labelledby="home-title">
        <svg className="home-hero-route" viewBox="0 0 1440 420" aria-hidden="true" focusable="false">
          <path d="M-48 260C170 132 364 116 548 178C738 242 876 244 1038 182C1168 132 1306 88 1488 76" />
        </svg>
        <div className="home-hero-copy">
          <div className="home-title-scene">
            <h1 id="home-title">
              <span>{landing.hero.titleLines.first}</span>
              <span>{landing.hero.titleLines.second}</span>
            </h1>
          </div>
          <p>{landing.hero.detail}</p>

          <div className="home-hero-actions">
            <Link className="home-primary-button home-large-button" href="/register">
              {landing.actions.startPlanning}
              <Icon name="route" />
            </Link>
            <Link className="home-secondary-button home-large-button" href="/join">
              {landing.actions.joinTrip}
              <Icon name="key" />
            </Link>
          </div>

          <div className="home-social-proof" aria-label={landing.hero.socialLabel}>
            <div className="home-avatar-stack" aria-hidden="true">
              <span>MA</span>
              <span>NO</span>
              <span>BE</span>
              <span>+8</span>
            </div>
            <p>{landing.hero.socialProof}</p>
          </div>
        </div>

        <div className="home-product-preview" id="features" aria-label={landing.preview.label}>
          <div className="home-preview-shell">
            <div className="home-preview-topbar">
              <div>
                <p>{landing.preview.tripTitle}</p>
                <strong>{landing.preview.tripMeta}</strong>
              </div>
              <div className="home-preview-friends" aria-hidden="true">
                <span />
                <span />
                <span />
                <em>+2</em>
              </div>
            </div>

            <div className="home-preview-grid">
              <div className="home-preview-menu" aria-label={landing.preview.sectionsLabel} role="list">
                <span data-active="true" role="listitem">{landing.preview.sections.overview}</span>
                <span role="listitem">{landing.preview.sections.itinerary}</span>
                <span role="listitem">{landing.preview.sections.map}</span>
                <span role="listitem">{landing.preview.sections.budget}</span>
                <span role="listitem">{landing.preview.sections.checklist}</span>
              </div>

              <div className="home-preview-main">
                <div className="home-day-strip">
                  {previewDayKeys.map((dayKey, artIndex) => (
                    <article className="home-day-card" key={dayKey}>
                      <span>{landing.preview.days[dayKey].day}</span>
                      <h2>{landing.preview.days[dayKey].title}</h2>
                      <p>{landing.preview.days[dayKey].detail}</p>
                      <div
                        className="home-day-image"
                        style={{ backgroundPosition: `${artIndex * 33.333}% 50%` }}
                        aria-hidden="true"
                      />
                    </article>
                  ))}
                </div>

                <div className="home-preview-bottom">
                  <div className="home-map-card" aria-label={landing.preview.mapLabel}>
                    <svg viewBox="0 0 420 220" role="img" aria-label={landing.preview.mapAria}>
                      <path className="home-map-water" d="M280 0h140v220H244c52-42 64-83 36-132-13-23-13-52 0-88Z" />
                      <path className="home-map-route" d="M62 158C122 92 170 77 223 113s84 29 132-20" />
                      <circle cx="62" cy="158" r="12" />
                      <circle cx="223" cy="113" r="12" />
                      <circle cx="355" cy="93" r="12" />
                      <text x="32" y="192">{landing.preview.mapStops.tokyo}</text>
                      <text x="188" y="146">{landing.preview.mapStops.yokohama}</text>
                      <text x="314" y="126">{landing.preview.mapStops.kamakura}</text>
                    </svg>
                  </div>

                  <div className="home-checklist-card">
                    <div>
                      <strong>{landing.preview.sections.checklist}</strong>
                      <span>{landing.preview.checklistProgress}</span>
                    </div>
                    <meter min="0" max="100" value="66">
                      66%
                    </meter>
                    <ul>
                      {checklistKeys.map((itemKey) => (
                        <li key={itemKey}>{landing.preview.checklistItems[itemKey]}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-workflow" id="workflow" aria-labelledby="workflow-title">
        <h2 id="workflow-title">
          {landing.workflow.titleLead} <span>{landing.workflow.titleHighlight}</span>
        </h2>
        <p>{landing.workflow.detail}</p>
        <div className="home-workflow-grid">
          {workflowStepMeta.map((step, index) => (
            <article className="home-workflow-item" data-tone={step.tone} key={step.key}>
              <span className="home-workflow-number">{index + 1}</span>
              <span className="home-workflow-icon" aria-hidden="true">
                <Icon name={step.icon} />
              </span>
              <h3>{landing.workflow.steps[step.key].title}</h3>
              <p>{landing.workflow.steps[step.key].text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-feature-band" aria-label={landing.finalCta.label}>
        <div>
          <h2>{landing.finalCta.title}</h2>
          <p>{landing.finalCta.detail}</p>
        </div>
        <Link className="home-primary-button home-large-button" href="/register">
          {landing.actions.createTrip}
          <Icon name="plus" />
        </Link>
      </section>

      <footer className="home-footer">
        <div className="home-footer-brand">
          <Link className="home-brand" href="/" aria-label={landing.brandHomeLabel}>
            <span className="home-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <path d="M13 35 35 13M22 13h13v13" />
                <path d="M12 18c8 2 16 8 18 18" />
              </svg>
            </span>
            Joii
          </Link>
          <p>{landing.footer.copy}</p>
        </div>

        <div className="home-footer-links">
          <Link href="/login">{landing.actions.login}</Link>
          <Link href="/join">{landing.actions.tripAccess}</Link>
          <Link href="/register">{landing.actions.createAccount}</Link>
          <a href="https://github.com/GLINCKER/thesvg" target="_blank" rel="noreferrer">
            <Image src="/icons/github-thesvg.svg" alt="" width={16} height={16} />
            {landing.footer.svgSource}
          </a>
        </div>
      </footer>
    </main>
  );
}
