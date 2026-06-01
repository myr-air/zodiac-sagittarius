import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function PortalSettingsPage() {
  return <SagittariusApp accessMode="account-portal" portalSection="settings" requireJoin dataSource="api" />;
}
