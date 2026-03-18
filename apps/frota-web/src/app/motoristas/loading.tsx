export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-10 bg-slate-200 rounded w-40" />
      </div>
      <div className="rounded-xl bg-slate-200 h-96" />
    </div>
  );
}
