export default function Loading() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-40 bg-slate-200 rounded" />
        <div className="h-4 w-64 bg-slate-200 rounded" />
      </div>
      <div className="bg-slate-200 rounded-xl h-64" />
      <div className="bg-slate-200 rounded-xl h-40" />
    </div>
  );
}
