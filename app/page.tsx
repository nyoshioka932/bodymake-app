import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">BodyMake Tracker</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        体組成・摂取/PFC・消費カロリー・筋トレ・体型写真を管理し、週次PDCAを回すためのアプリです。
      </p>
      <Button>Get Started</Button>
    </main>
  );
}
