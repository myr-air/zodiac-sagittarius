import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function MapPage() {
  return <SagittariusApp initialView="map" requireJoin dataSource="api" />;
}
