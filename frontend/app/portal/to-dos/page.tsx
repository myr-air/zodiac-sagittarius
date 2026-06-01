import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function PortalToDosPage() {
  return <SagittariusApp accessMode="account-portal" portalSection="todos" requireJoin dataSource="api" />;
}
