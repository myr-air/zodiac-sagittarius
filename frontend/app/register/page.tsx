import { AccountEntryShell } from "@/components/auth/AccountEntryShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-dvh w-full">
      <AccountEntryShell route="/register">
        <RegisterForm />
      </AccountEntryShell>
    </main>
  );
}
