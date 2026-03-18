export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-slate-200 rounded" />
        <div className="h-10 w-44 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-96 bg-slate-200 rounded-xl" />
    </div>
  );
}
