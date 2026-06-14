import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">BodyMake Tracker</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        体組成・摂取/PFC・消費カロリー・筋トレ・体型写真を管理し、週次PDCAを回すためのアプリです。
      </p>
      {user ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm">{user.email} としてログイン中</p>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline">
              ログアウト
            </Button>
          </form>
        </div>
      ) : (
        <Button render={<Link href="/login" />}>ログイン</Button>
      )}
    </main>
  );
}
