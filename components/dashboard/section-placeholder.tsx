export function SectionPlaceholder({ title }: { title: string }) {
  return (
    <section className="border-border bg-card rounded-lg border p-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-xs">準備中です。</p>
    </section>
  );
}
