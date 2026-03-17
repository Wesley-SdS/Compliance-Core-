export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="h-4 bg-gray-200 rounded w-48 mt-2" />
      </div>
      <div className="h-16 bg-red-100 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-4 px-6 py-4 border-b border-gray-100">
            <div className="h-2 w-2 bg-gray-200 rounded-full mt-2" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
