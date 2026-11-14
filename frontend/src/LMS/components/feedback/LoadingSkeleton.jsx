export default function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl bg-slate-200/80"
        />
      ))}
    </div>
  );
}

