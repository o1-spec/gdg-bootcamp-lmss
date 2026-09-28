import { requireStudent } from "@/lib/auth/session";
import { getUserNotifications } from "@/lib/notifications/queries";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const user = await requireStudent();
  const notifications = await getUserNotifications(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay up to date with assignments, grades, and announcements."
      />
      <NotificationsClient initialNotifications={notifications} />
    </div>
  );
}
