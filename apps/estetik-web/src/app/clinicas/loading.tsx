export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-32 mt-2" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-40" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-gray-200 rounded-lg w-24" />
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="h-12 bg-gray-100" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
