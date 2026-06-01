import { SagittariusApp } from "@/src/app/SagittariusApp";
import { appRoutes } from "@/src/routes/app-routes";

export default function LoginPage() {
  return <SagittariusApp accessMode="account-login" accountSuccessRedirectHref={appRoutes.portal()} requireJoin dataSource="api" />;
}
