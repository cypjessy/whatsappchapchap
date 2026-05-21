import { type ReactNode } from "react";

export default function CheckoutLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-dvh w-full overflow-y-auto overscroll-y-contain bg-surface-container-lowest">
      {children}
    </div>
  );
}
