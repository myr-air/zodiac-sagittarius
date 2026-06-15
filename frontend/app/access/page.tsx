import { AccountApp } from "@/src/account/AccountApp";
import { appRoutes } from "@/src/routes/app-routes";

interface AccessPageProps {
  searchParams?: Promise<{ mode?: string }>;
}

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const params = await searchParams;
  const accessMode = params?.mode === "register" ? "account-register" : "account-login";

  return <AccountApp accessMode={accessMode} accountSuccessRedirectHref={appRoutes.portal()} />;
}
