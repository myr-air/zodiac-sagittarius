import { SagittariusApp } from "@/src/app/SagittariusApp";
import { redirect } from "next/navigation";

export default async function JoinPage({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;
  const decodedJoinCode = decodeURIComponent(joinCode);
  if (decodedJoinCode.toLowerCase() === "demo") redirect("/join");
  return <SagittariusApp accessMode="trip-access" requireJoin dataSource="api" initialJoinCode={decodedJoinCode} />;
}
