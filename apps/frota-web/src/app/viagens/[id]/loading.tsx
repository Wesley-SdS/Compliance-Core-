export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-40" />
      <div className="rounded-xl bg-slate-200 h-32" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-200 h-48" />
        <div className="rounded-xl bg-slate-200 h-48" />
      </div>
    </div>
  );
}
