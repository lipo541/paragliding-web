/**
 * Loading State Component
 * =======================
 * Skeleton loader for location pages during SSR/ISR
 */

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="relative h-[50vh] bg-gray-200 dark:bg-gray-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
        
        {/* Description */}
        <div className="space-y-3 mb-8">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>

        {/* Gallery Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
