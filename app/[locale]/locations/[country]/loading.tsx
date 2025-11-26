/**
 * Loading State Component
 * =======================
 * Skeleton loader for country pages during SSR/ISR
 */

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="relative h-[40vh] bg-gray-200 dark:bg-gray-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-40 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="h-10 w-56 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
        
        {/* Description */}
        <div className="space-y-3 mb-8">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>

        {/* Locations Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow">
              <div className="aspect-video bg-gray-200 dark:bg-gray-800" />
              <div className="p-4 space-y-3">
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
