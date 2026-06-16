export function WeeklyActionSection({ items }: { items: string[] }) {
  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <h2 className="mb-2 text-sm font-semibold">改善アクション</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-xs">今週の改善アクションはありません</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-foreground flex items-start gap-1.5 text-xs">
              <span className="mt-0.5 shrink-0">・</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
