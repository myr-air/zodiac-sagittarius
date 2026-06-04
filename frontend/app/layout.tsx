import type { Metadata } from "next";
import { Noto_Sans_Thai, Inter } from "next/font/google";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-thai",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Joii Travel Planning",
  description: "A friendly collaborative trip planner for decisions, routes, checklists, and shared plans.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${noto.variable} ${inter.variable}`}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
