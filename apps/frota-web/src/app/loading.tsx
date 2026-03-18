export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl bg-slate-200 h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-200 h-72" />
        <div className="rounded-xl bg-slate-200 h-72" />
      </div>
      <div className="rounded-xl bg-slate-200 h-48" />
    </div>
  );
}
