export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-slate-200 rounded" />
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-slate-200 rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-slate-200 rounded-xl" />
    </div>
  );
}
