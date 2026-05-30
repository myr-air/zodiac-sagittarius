import { SagittariusApp } from "@/src/app/SagittariusApp";
import { localTripJoinId } from "@/src/trip/auth";

export default function DemoJoinPage() {
  return <SagittariusApp accessMode="trip-access" requireJoin dataSource="demo" initialJoinCode={localTripJoinId} />;
}
