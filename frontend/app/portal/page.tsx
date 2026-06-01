import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function PortalPage() {
  return <SagittariusApp accessMode="account-portal" requireJoin dataSource="api" />;
}
