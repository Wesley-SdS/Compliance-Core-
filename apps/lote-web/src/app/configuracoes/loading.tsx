export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-40 bg-slate-100 rounded" />
      <div className="flex gap-6">
        <div className="w-48 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded" />)}
        </div>
        <div className="flex-1 h-64 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}
