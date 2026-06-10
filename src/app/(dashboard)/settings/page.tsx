import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/settings-form";
import { UserRole } from "@prisma/client";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure AI, WooCommerce, and integrations</p>
      </div>
      <SettingsForm isAdmin={user?.role === UserRole.ADMIN} />
    </div>
  );
}
