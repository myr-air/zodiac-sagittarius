import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function PortalExplorerPage() {
  return <SagittariusApp accessMode="account-portal" portalSection="explorer" requireJoin dataSource="api" />;
}
