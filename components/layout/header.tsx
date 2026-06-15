import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Header() {
  return (
    <header className="bg-background border-border sticky top-0 z-50 border-b">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <span className="text-base font-semibold">BodyMake Tracker</span>
        <ThemeToggle />
      </div>
    </header>
  );
}
