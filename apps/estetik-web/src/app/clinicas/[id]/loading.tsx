export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-8 bg-gray-200 rounded w-8" />
        <div className="h-8 bg-gray-200 rounded w-64" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-lg w-24" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded-xl" />
    </div>
  );
}
