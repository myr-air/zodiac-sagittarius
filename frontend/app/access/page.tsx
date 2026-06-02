import { SagittariusApp } from "@/src/app/SagittariusApp";
import { appRoutes } from "@/src/routes/app-routes";

interface AccessPageProps {
  searchParams?: Promise<{ mode?: string }>;
}

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const params = await searchParams;
  const accessMode = params?.mode === "register" ? "account-register" : "account-login";

  return <SagittariusApp accessMode={accessMode} accountSuccessRedirectHref={appRoutes.portal()} requireJoin dataSource="api" />;
}
