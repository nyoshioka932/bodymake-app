export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {description ?? "準備中です。"}
      </p>
    </div>
  );
}
