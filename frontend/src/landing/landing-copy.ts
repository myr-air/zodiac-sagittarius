import type { AuthLocale } from "../auth/locale";

export type LandingCopy = {
  languageGroup: string;
  search: string;
  home: string;
  explore: string;
  tripIdeas: string;
  logIn: string;
  tripAccess: string;
};

const EN: LandingCopy = {
  languageGroup: "Language",
  search: "Search",
  home: "Home",
  explore: "Explore",
  tripIdeas: "Trip ideas",
  logIn: "Log in",
  tripAccess: "Trip access",
};

const TH: LandingCopy = {
  languageGroup: "ภาษา",
  search: "ค้นหา",
  home: "หน้าแรก",
  explore: "สำรวจ",
  tripIdeas: "ไอเดียทริป",
  logIn: "เข้าสู่ระบบ",
  tripAccess: "เข้าทริป",
};

const BY_LOCALE: Record<AuthLocale, LandingCopy> = { EN, TH };

export function landingCopy(locale: AuthLocale): LandingCopy {
  return BY_LOCALE[locale];
}
