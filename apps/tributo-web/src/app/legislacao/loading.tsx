export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="h-4 w-72 bg-slate-200 rounded" />
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-28 bg-slate-200 rounded-lg" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-slate-200 rounded-xl h-32" />
      ))}
    </div>
  );
}
