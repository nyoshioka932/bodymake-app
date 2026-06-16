"use client";

import { useEffect, useState } from "react";
import { WorkoutExercises } from "@/components/workout/workout-exercises";
import { WorkoutSessionHeader } from "@/components/workout/workout-session-header";
import { WorkoutStartScreen } from "@/components/workout/workout-start-screen";
import { fetchTemplates } from "@/lib/workout/template-queries";
import { fetchInProgressWorkout } from "@/lib/workout/workout-queries";
import type { TemplateExercise, WorkoutSession, WorkoutTemplate } from "@/lib/workout/types";

type PageState = "loading" | "start" | "session";

export function WorkoutPageClient() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchInProgressWorkout(), fetchTemplates()])
      .then(([inProgress, tmpl]) => {
        if (cancelled) return;
        setTemplates(tmpl);
        if (inProgress) {
          setSession(inProgress);
          setTemplateExercises([]);
          setPageState("session");
        } else {
          setPageState("start");
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("読み込みに失敗しました");
      });
    return () => { cancelled = true; };
  }, []);

  if (pageState === "loading") {
    return <p className="text-muted-foreground p-4 text-sm">読み込み中...</p>;
  }

  if (loadError) {
    return <p className="text-destructive p-4 text-sm">{loadError}</p>;
  }

  if (pageState === "start") {
    return (
      <div className="p-4">
        <WorkoutStartScreen
          templates={templates}
          onStart={(s, tmplExercises) => {
            setSession(s);
            setTemplateExercises(tmplExercises);
            setPageState("session");
          }}
        />
      </div>
    );
  }

  if (!session) return null;

  const resetToStart = () => {
    setSession(null);
    setTemplateExercises([]);
    setPageState("start");
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <WorkoutSessionHeader
        session={session}
        onComplete={resetToStart}
        onDiscard={resetToStart}
      />
      <WorkoutExercises
        workoutId={session.id}
        initialTemplateExercises={templateExercises}
      />
    </div>
  );
}
