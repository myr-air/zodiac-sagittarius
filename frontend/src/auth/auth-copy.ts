import type { AuthLocale } from "./locale";

export type AuthCopy = {
  languageGroup: string;
  tabs: { signIn: string; register: string };
  backHome: string;
  signIn: {
    heading: string;
    lede: string;
    email: string;
    password: string;
    submit: string;
    or: string;
    useCode: string;
    usePasskey: string;
    showPassword: string;
    hidePassword: string;
    noAccount: string;
    registerLink: string;
    haveInvite: string;
    tripAccessLink: string;
  };
  register: {
    heading: string;
    lede: string;
    email: string;
    password: string;
    confirmPassword: string;
    passwordHint: string;
    submit: string;
    hasAccount: string;
    signInLink: string;
    mismatch: string;
  };
  emailCode: {
    heading: string;
    lede: string;
    email: string;
    code: string;
    send: string;
    verify: string;
    backToPassword: string;
    enterEmail: string;
    enterCode: string;
  };
  trip: {
    kicker: string;
    heading: string;
    lede: string;
    codeLabel: string;
    codeHint: string;
    codePlaceholder: string;
    enter: string;
    who: string;
    memberPassword: string;
    useDifferentCode: string;
    needWorkspace: string;
    registerLink: string;
    organizers: string;
    logInLink: string;
    manageOwnership: string;
    selectMember: string;
    mediaTitle: string;
    mediaCopy: string;
  };
  gallery: ReadonlyArray<{ title: string; copy: string }>;
};

const EN: AuthCopy = {
  languageGroup: "Language",
  tabs: { signIn: "Sign in", register: "Register" },
  backHome: "← Back to Joii home",
  signIn: {
    heading: "Welcome back",
    lede: "Sign in to manage trips, invites, and your planning cockpit.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    or: "or",
    useCode: "Use sign-in code instead",
    usePasskey: "Use a passkey",
    showPassword: "Show password",
    hidePassword: "Hide password",
    noAccount: "No account?",
    registerLink: "Register",
    haveInvite: "Have an invite?",
    tripAccessLink: "Trip access",
  },
  register: {
    heading: "Create your Joii account",
    lede: "Keep trips and ownership with you — free to start, no app store.",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    passwordHint: "At least 8 characters.",
    submit: "Create account",
    hasAccount: "Already have an account?",
    signInLink: "Sign in",
    mismatch: "Passwords do not match.",
  },
  emailCode: {
    heading: "Use a sign-in code",
    lede: "We’ll email a one-time code — same account session as password or passkey.",
    email: "Email",
    code: "Verification code",
    send: "Send sign-in code",
    verify: "Verify and sign in",
    backToPassword: "← Back to password sign in",
    enterEmail: "Enter your email to receive a sign-in code.",
    enterCode: "Enter the verification code from your email.",
  },
  trip: {
    kicker: "Trip access",
    heading: "Already have a trip?",
    lede: "Join with an access code from your organizer — no account required to enter the room.",
    codeLabel: "Trip access code",
    codeHint: "Paste the code or invite link your host shared.",
    codePlaceholder: "e.g. JOII-7K2M",
    enter: "Enter trip",
    who: "Who are you?",
    memberPassword: "Member password",
    useDifferentCode: "Use a different code",
    needWorkspace: "Need your own workspace?",
    registerLink: "Register",
    organizers: "Organizers",
    logInLink: "log in",
    manageOwnership: "to manage ownership.",
    selectMember: "Select a trip member to continue.",
    mediaTitle: "Enter the shared trip room",
    mediaCopy: "Itinerary, members, and plans — already waiting for your group.",
  },
  gallery: [
    {
      title: "Plan the trip the group can share",
      copy: "One calm cockpit for routes, people, and shared costs.",
    },
    {
      title: "Routes that stay readable",
      copy: "Keep the itinerary clear while the scenery does the talking.",
    },
    {
      title: "Invite the group once",
      copy: "Members join with a code — organizers keep ownership calm.",
    },
    {
      title: "Shared costs without the chaos",
      copy: "Estimates and actuals stay in one trustworthy place.",
    },
  ],
};

const TH: AuthCopy = {
  languageGroup: "ภาษา",
  tabs: { signIn: "เข้าสู่ระบบ", register: "สมัคร" },
  backHome: "← กลับหน้าแรก Joii",
  signIn: {
    heading: "ยินดีต้อนรับกลับ",
    lede: "เข้าสู่ระบบเพื่อจัดการทริป คำเชิญ และโต๊ะวางแผนของคุณ",
    email: "อีเมล",
    password: "รหัสผ่าน",
    submit: "เข้าสู่ระบบ",
    or: "หรือ",
    useCode: "ใช้รหัสเข้าสู่ระบบแทน",
    usePasskey: "ใช้พาสคีย์",
    showPassword: "แสดงรหัสผ่าน",
    hidePassword: "ซ่อนรหัสผ่าน",
    noAccount: "ยังไม่มีบัญชี?",
    registerLink: "สมัคร",
    haveInvite: "มีคำเชิญ?",
    tripAccessLink: "เข้าทริป",
  },
  register: {
    heading: "สร้างบัญชี Joii ของคุณ",
    lede: "เก็บทริปและความเป็นเจ้าของไว้กับคุณ — เริ่มฟรี ไม่ต้องลงแอป",
    email: "อีเมล",
    password: "รหัสผ่าน",
    confirmPassword: "ยืนยันรหัสผ่าน",
    passwordHint: "อย่างน้อย 8 ตัวอักษร",
    submit: "สร้างบัญชี",
    hasAccount: "มีบัญชีอยู่แล้ว?",
    signInLink: "เข้าสู่ระบบ",
    mismatch: "รหัสผ่านไม่ตรงกัน",
  },
  emailCode: {
    heading: "ใช้รหัสเข้าสู่ระบบ",
    lede: "เราจะส่งรหัสครั้งเดียวทางอีเมล — เซสชันเดียวกับรหัสผ่านหรือพาสคีย์",
    email: "อีเมล",
    code: "รหัสยืนยัน",
    send: "ส่งรหัสเข้าสู่ระบบ",
    verify: "ยืนยันและเข้าสู่ระบบ",
    backToPassword: "← กลับไปเข้าสู่ระบบด้วยรหัสผ่าน",
    enterEmail: "กรอกอีเมลเพื่อรับรหัสเข้าสู่ระบบ",
    enterCode: "กรอกรหัสยืนยันจากอีเมลของคุณ",
  },
  trip: {
    kicker: "เข้าทริป",
    heading: "มีทริปอยู่แล้ว?",
    lede: "เข้าร่วมด้วยรหัสจากผู้จัด — ไม่ต้องมีบัญชีก็เข้าห้องได้",
    codeLabel: "รหัสเข้าทริป",
    codeHint: "วางรหัสหรือลิงก์คำเชิญที่โฮสต์แชร์มา",
    codePlaceholder: "เช่น JOII-7K2M",
    enter: "เข้าทริป",
    who: "คุณคือใคร?",
    memberPassword: "รหัสผ่านสมาชิก",
    useDifferentCode: "ใช้รหัสอื่น",
    needWorkspace: "ต้องการพื้นที่ของคุณเอง?",
    registerLink: "สมัคร",
    organizers: "ผู้จัด",
    logInLink: "เข้าสู่ระบบ",
    manageOwnership: "เพื่อจัดการความเป็นเจ้าของ",
    selectMember: "เลือกสมาชิกทริปเพื่อดำเนินการต่อ",
    mediaTitle: "เข้าห้องทริปที่แชร์กัน",
    mediaCopy: "แผนการเดินทาง สมาชิก และแผน — พร้อมรอกลุ่มของคุณแล้ว",
  },
  gallery: [
    {
      title: "วางแผนทริปที่กลุ่มแชร์ได้",
      copy: "โต๊ะวางแผนสงบ ๆ สำหรับเส้นทาง คน และค่าใช้จ่ายร่วม",
    },
    {
      title: "เส้นทางที่อ่านง่าย",
      copy: "รักษาแผนการเดินทางให้ชัด ขณะที่ภาพทิวทัศน์เล่าเรื่อง",
    },
    {
      title: "เชิญกลุ่มครั้งเดียว",
      copy: "สมาชิกเข้าด้วยรหัส — ผู้จัดยังถือความเป็นเจ้าของอย่างสงบ",
    },
    {
      title: "ค่าใช้จ่ายร่วมโดยไม่วุ่นวาย",
      copy: "ประมาณการและยอดจริงอยู่ในที่เดียวที่ไว้ใจได้",
    },
  ],
};

const BY_LOCALE: Record<AuthLocale, AuthCopy> = { EN, TH };

export function authCopy(locale: AuthLocale): AuthCopy {
  return BY_LOCALE[locale];
}
