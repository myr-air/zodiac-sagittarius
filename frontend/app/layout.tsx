import type { Metadata } from "next";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sagittarius Travel Planning Cockpit",
  description: "A production-oriented collaborative travel planning cockpit.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
