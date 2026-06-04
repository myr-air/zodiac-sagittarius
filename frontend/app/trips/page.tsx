import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function TripsPage() {
  return <SagittariusApp accessMode="account-portal" portalSection="trips" requireJoin dataSource="api" />;
}
