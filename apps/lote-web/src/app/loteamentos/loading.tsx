export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div><div className="h-6 w-40 bg-slate-100 rounded" /><div className="h-4 w-32 bg-slate-100 rounded mt-2" /></div>
        <div className="h-10 w-36 bg-slate-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-slate-100">
            <div className="h-4 w-40 bg-slate-100 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-12 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
