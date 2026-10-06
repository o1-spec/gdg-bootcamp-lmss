/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { redirect } from "next/navigation";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { getCurrentUser, getRoleDashboardPath } from "@/lib/auth/session";

/*
|--------------------------------------------------
| constants
|--------------------------------------------------
*/
export const dynamic = "force-dynamic";

/*
|----------------------------------------------------------------------------------------------------
| HomePage
|----------------------------------------------------------------------------------------------------
| Root landing route that redirects authenticated users to their role portal.
| Unauthenticated guests are redirected to the login page.
*/
export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(getRoleDashboardPath(user.role));
}
