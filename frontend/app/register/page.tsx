import { redirect } from "next/navigation";
import { appRoutes } from "@/src/routes/app-routes";

export default function RegisterPage() {
  redirect(appRoutes.register());
}
