export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-48 bg-slate-200 rounded" />
      <div className="bg-slate-200 rounded-xl h-32" />
      <div className="flex gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-slate-200 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-200 rounded-xl h-64" />
        <div className="bg-slate-200 rounded-xl h-64" />
      </div>
    </div>
  );
}
