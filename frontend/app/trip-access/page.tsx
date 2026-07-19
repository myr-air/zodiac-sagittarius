import { TripAccessForm } from "@/components/auth/TripAccessForm";
import { TripAccessShell } from "@/components/auth/TripAccessShell";

export default function TripAccessPage() {
  return (
    <main className="min-h-dvh w-full">
      <TripAccessShell>
        <TripAccessForm />
      </TripAccessShell>
    </main>
  );
}
