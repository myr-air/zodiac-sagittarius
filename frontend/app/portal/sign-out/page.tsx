import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function PortalSignOutPage() {
  return <SagittariusApp accessMode="account-portal" portalSection="sign-out" requireJoin dataSource="api" />;
}
