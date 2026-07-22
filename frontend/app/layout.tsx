import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { UnregisterLegacyServiceWorker } from "@/components/pwa/UnregisterLegacyServiceWorker";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Joii",
  description: "Group trip planning for shared itineraries, people, and decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSansThai.className} antialiased`}>
        <UnregisterLegacyServiceWorker />
        {children}
      </body>
    </html>
  );
}
