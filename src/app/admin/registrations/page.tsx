/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { PageHeader } from "@/components/ui/page-header";
import { RosterImportForm } from "@/components/registrations/roster-import-form";
import { requireAdmin } from "@/lib/auth/session";

/*
|--------------------------------------------------
| metadata
|--------------------------------------------------
*/
export const metadata = { title: "Registration Roster | Admin Console" };

/*
|----------------------------------------------------------------------------------------------------
| RegistrationsPage
|----------------------------------------------------------------------------------------------------
| Renders the Registrations page view.
*/
export default async function RegistrationsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader title="Registration roster" description="Bulk-import approved participants so they can create accounts without individual invite links." />
      <RosterImportForm />
    </div>
  );
}
