import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-40 mt-2" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-64 rounded-lg" />
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-2 w-24 rounded-full" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-5 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
