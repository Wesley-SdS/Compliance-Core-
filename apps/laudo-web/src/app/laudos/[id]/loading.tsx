export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-slate-200 rounded" />
      <div className="flex gap-6">
        <div className="w-[35%] space-y-4">
          <div className="h-48 bg-slate-200 rounded-xl" />
          <div className="h-40 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-48 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
