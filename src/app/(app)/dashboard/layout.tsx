import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Chap Chap - Dashboard",
  description: "AI-Powered Sales Automation for WhatsApp Sellers",
  keywords: ["WhatsApp", "sales", "automation", "AI", "e-commerce", "dashboard"],
  authors: [{ name: "WhatsApp Chap Chap" }],
  openGraph: {
    title: "WhatsApp Chap Chap - Dashboard",
    description: "AI-Powered Sales Automation for WhatsApp Sellers",
    type: "website",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      {children}
    </div>
  );
}