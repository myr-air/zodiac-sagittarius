/** Independent φ fractions: form:media = 1:φ ≈ 0.382:0.618 (draft v3). */
const PHI = (1 + Math.sqrt(5)) / 2;

const SHARED_SPLIT = {
  form: 1 / (PHI * PHI),
  media: 1 / PHI,
} as const;

const TABS = [
  { label: "Sign in", href: "/login" },
  { label: "Register", href: "/register" },
] as const;

const LOCALES = ["EN", "TH"] as const;

const BACK_HOME = {
  href: "/",
  label: "← Back to Joii home",
} as const;

export type AccountEntryRoute = "/login" | "/register";

export type AccountEntryLocale = "EN" | "TH";

export type AccountEntryShellChrome = {
  tabs: { signIn: string; register: string };
  headings: { signIn: string; register: string };
  backHome: string;
};

export type AccountEntryShellConfig = {
  shell: "AccountEntryShell";
  split: { form: number; media: number };
  brand: "Joii";
  tabs: ReadonlyArray<{ label: string; href: string }>;
  activeTab: "Sign in" | "Register";
  locales: ReadonlyArray<"EN" | "TH">;
  backHome: { href: string; label: string };
  publicCopy: string[];
};

const CHROME_BY_LOCALE: Record<AccountEntryLocale, AccountEntryShellChrome> = {
  EN: {
    tabs: { signIn: "Sign in", register: "Register" },
    headings: {
      signIn: "Welcome back",
      register: "Create your Joii account",
    },
    backHome: "← Back to Joii home",
  },
  TH: {
    tabs: { signIn: "เข้าสู่ระบบ", register: "สมัคร" },
    headings: {
      signIn: "ยินดีต้อนรับกลับ",
      register: "สร้างบัญชี Joii ของคุณ",
    },
    backHome: "← กลับหน้าแรก Joii",
  },
};

export function accountEntryShellChrome(
  locale: AccountEntryLocale,
): AccountEntryShellChrome {
  return CHROME_BY_LOCALE[locale];
}

export function accountEntryShellForRoute(
  route: AccountEntryRoute,
): AccountEntryShellConfig {
  const activeTab = route === "/login" ? "Sign in" : "Register";

  return {
    shell: "AccountEntryShell",
    split: { form: SHARED_SPLIT.form, media: SHARED_SPLIT.media },
    brand: "Joii",
    tabs: [...TABS],
    activeTab,
    locales: [...LOCALES],
    backHome: { ...BACK_HOME },
    publicCopy: [
      "Joii",
      "Sign in",
      "Register",
      "EN",
      "TH",
      BACK_HOME.label,
    ],
  };
}
