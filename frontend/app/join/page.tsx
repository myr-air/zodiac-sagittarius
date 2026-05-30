import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function JoinPage() {
  return <SagittariusApp accessMode="trip-access" requireJoin dataSource="api" />;
}
