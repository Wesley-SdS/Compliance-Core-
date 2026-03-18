export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-slate-200 rounded" />
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl bg-slate-200 h-20" />
        ))}
      </div>
      <div className="rounded-xl bg-slate-200 h-96" />
    </div>
  );
}
