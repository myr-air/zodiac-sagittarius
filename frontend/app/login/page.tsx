import { AccountEntryShell } from "@/components/auth/AccountEntryShell";
import { SignInForm } from "@/components/auth/SignInForm";

export default function LoginPage() {
  return (
    <main className="min-h-dvh w-full">
      <AccountEntryShell route="/login">
        <SignInForm />
      </AccountEntryShell>
    </main>
  );
}
