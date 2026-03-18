export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl bg-slate-200 h-24" />
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl bg-slate-200 h-40" />
      ))}
    </div>
  );
}
