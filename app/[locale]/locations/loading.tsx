/**
 * Loading State Component
 * =======================
 * Skeleton loader for locations index page
 */

export default function Loading() {
  return (
    <div className="animate-pulse container mx-auto px-4 py-8">
      {/* Title */}
      <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-8" />

      {/* Countries Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow">
            <div className="aspect-video bg-gray-200 dark:bg-gray-800" />
            <div className="p-4 space-y-3">
              <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
