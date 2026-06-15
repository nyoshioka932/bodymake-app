import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Header } from "@/components/layout/header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col pb-16">{children}</main>
      <BottomNavigation />
    </div>
  );
}
