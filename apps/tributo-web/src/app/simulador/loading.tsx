export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-64 bg-slate-200 rounded" />
        <div className="h-4 w-96 bg-slate-200 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-slate-200 rounded-xl h-96" />
        <div className="lg:col-span-8 bg-slate-200 rounded-xl h-96" />
      </div>
    </div>
  );
}
