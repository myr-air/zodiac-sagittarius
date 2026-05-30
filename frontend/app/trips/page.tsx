import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function TripsPage() {
  return <SagittariusApp requireJoin dataSource="api" />;
}
