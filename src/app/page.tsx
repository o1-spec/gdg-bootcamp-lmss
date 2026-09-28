import { redirect } from "next/navigation";
import { getCurrentUser, getRoleDashboardPath } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(getRoleDashboardPath(user.role));
}
