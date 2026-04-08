import AppLayout from "@/components/AppLayout";
import DashboardProtection from "@/components/DashboardProtection";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <DashboardProtection>{children}</DashboardProtection>
    </AppLayout>
  );
}
