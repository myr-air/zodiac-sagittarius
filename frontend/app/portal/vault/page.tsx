import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function PortalVaultPage() {
  return <SagittariusApp accessMode="account-portal" portalSection="vault" requireJoin dataSource="api" />;
}
