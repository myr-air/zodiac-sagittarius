import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function DemoJoinPage() {
  return <SagittariusApp accessMode="trip-access" requireJoin dataSource="demo" />;
}
