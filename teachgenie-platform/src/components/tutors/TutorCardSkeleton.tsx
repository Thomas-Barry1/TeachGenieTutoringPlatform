export default function TutorCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col min-h-[370px] max-h-[370px] animate-pulse">
      <div className="p-6 flex flex-col h-full">
        {/* Tutor Header Skeleton */}
        <div className="flex items-center space-x-4">
          {/* Avatar skeleton */}
          <div className="h-16 w-16 rounded-full bg-gray-200 flex-shrink-0"></div>
          
          {/* Name and details skeleton */}
          <div className="min-w-0 flex-1">
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
        
        {/* Bio skeleton */}
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-3/5"></div>
        </div>
        
        {/* Subject tags skeleton */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-14"></div>
          <div className="h-6 bg-gray-200 rounded-full w-18"></div>
        </div>
        
        {/* Button skeleton */}
        <div className="mt-auto pt-6">
          <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
        </div>
      </div>
    </div>
  )
}
