import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function EntitySkeleton({ index = 0 }: { index?: number }) {
  // Add variety to skeleton widths
  const nameWidths = ['w-3/4', 'w-2/3', 'w-4/5', 'w-1/2']
  const descWidths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4']
  const categoryWidths = ['w-20', 'w-24', 'w-16', 'w-28']
  
  const nameWidth = nameWidths[index % nameWidths.length]
  const descWidth = descWidths[index % descWidths.length]
  const categoryWidth = categoryWidths[index % categoryWidths.length]
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Entity name */}
            <Skeleton className={`h-5 ${nameWidth}`} />
            
            {/* Entity description */}
            <div className="space-y-2">
              <Skeleton className={`h-4 ${descWidth}`} />
              <Skeleton className="h-4 w-2/3" />
            </div>
            
            {/* Category and date */}
            <div className="flex items-center gap-2 mt-3">
              <Skeleton className={`h-6 ${categoryWidth} rounded-full`} />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          {/* Image placeholder */}
          <div className="ml-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EntityListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <EntitySkeleton key={index} index={index} />
      ))}
    </div>
  )
}
