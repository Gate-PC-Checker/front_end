import { ReactNode } from "react";
import { Header } from "./Header";

interface PortalLayoutProps {
  children: ReactNode;
  title?: string;
  onLogout?: () => void;
  showLogout?: boolean;
}

export function PortalLayout({
  children,
  title,
  onLogout,
  showLogout = false,
}: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header title={title} onLogout={onLogout} showLogout={showLogout} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
