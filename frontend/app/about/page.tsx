import type { Metadata } from "next";
import { AboutAppPage } from "@/src/features/public-site/pages/about/AboutAppPage";
import { getWebAppVersionInfo } from "@/src/app-version";

export const metadata: Metadata = {
  title: "About Joii | Joii Travel Planning",
  description: "Application version and deployment details for Joii.",
};

export default function AboutPage() {
  return <AboutAppPage webVersion={getWebAppVersionInfo()} />;
}
