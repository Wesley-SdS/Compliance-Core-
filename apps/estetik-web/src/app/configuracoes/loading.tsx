export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-4 bg-gray-200 rounded w-64 mt-2" />
      </div>
      <div className="h-40 bg-gray-200 rounded-xl" />
      <div className="h-60 bg-gray-200 rounded-xl" />
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="h-32 bg-gray-200 rounded-xl" />
    </div>
  );
}
