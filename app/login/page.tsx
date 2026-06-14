"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">ログイン</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Googleアカウントでログインして、BodyMake Trackerを開始しましょう。
      </p>
      <Button onClick={handleLogin} disabled={loading}>
        Googleでログイン
      </Button>
    </main>
  );
}
