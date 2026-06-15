"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { bottomNavItems } from "@/lib/constants/navigation";

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-background border-border fixed inset-x-0 bottom-0 z-50 border-t">
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {bottomNavItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
