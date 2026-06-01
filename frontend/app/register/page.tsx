import { SagittariusApp } from "@/src/app/SagittariusApp";
import { appRoutes } from "@/src/routes/app-routes";

export default function RegisterPage() {
  return <SagittariusApp accessMode="account-register" accountSuccessRedirectHref={appRoutes.portal()} requireJoin dataSource="api" />;
}
