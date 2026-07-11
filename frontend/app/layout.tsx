import type { Metadata } from "next";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Joii Travel Planning",
  description: "A friendly collaborative trip planner for decisions, routes, checklists, and shared plans.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== "undefined" && "serviceWorker" in navigator) {
                window.addEventListener("load", () => {
                  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
                    // Service worker registration failure is non-blocking
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
