import AppLayout from "@/components/AppLayout";
import DashboardProtection from "@/components/DashboardProtection";
import { ModeProvider } from "@/context/ModeContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeProvider>
      <AppLayout>
        <DashboardProtection>{children}</DashboardProtection>
      </AppLayout>
    </ModeProvider>
  );
}
