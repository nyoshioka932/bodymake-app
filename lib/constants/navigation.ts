import { Bell, Dumbbell, Home, Settings, Upload } from "lucide-react";

export const bottomNavItems = [
  { label: "ホーム", href: "/", icon: Home },
  { label: "筋トレ", href: "/workout", icon: Dumbbell },
  { label: "取込", href: "/import", icon: Upload },
  { label: "アラート", href: "/alerts", icon: Bell },
  { label: "設定", href: "/settings/goals", icon: Settings },
] as const;
