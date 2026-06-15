import Link from "next/link";
import { KpiSection } from "@/components/dashboard/kpi-section";
import { SectionPlaceholder } from "@/components/dashboard/section-placeholder";
import { TrendSection } from "@/components/dashboard/trend-section";
import { Button } from "@/components/ui/button";
import { getTodayJST } from "@/lib/dashboard/calculations";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">BodyMake Tracker</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          体組成・摂取/PFC・消費カロリー・筋トレ・体型写真を管理し、週次PDCAを回すためのアプリです。
        </p>
        <Button render={<Link href="/login" />}>ログイン</Button>
      </div>
    );
  }

  const today = getTodayJST();

  return (
    <div className="flex flex-col gap-4 p-4">
      <KpiSection userId={user.id} today={today} />
      <TrendSection userId={user.id} today={today} />
      <SectionPlaceholder title="直近7日サマリー" />
      <SectionPlaceholder title="アラート要約" />
      <SectionPlaceholder title="改善アクション要約" />
      <SectionPlaceholder title="詳細グラフ" />
      <form action="/auth/signout" method="post" className="flex justify-center">
        <Button type="submit" variant="outline" size="sm">
          ログアウト
        </Button>
      </form>
    </div>
  );
}
