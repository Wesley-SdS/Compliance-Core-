export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-40 bg-slate-100 rounded" />
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-xl" />)}
    </div>
  );
}
