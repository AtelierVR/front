import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function InstanceLayoutSkeleton() {
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <Card className="relative overflow-hidden pt-0">
            <Skeleton className="w-full h-48" />
            <div className="px-6 py-4 space-y-3">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-9 w-28 mt-2" />
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-20 w-full" />
          </Card>
        </div>
        <div className="hidden md:block space-y-6">
          <Card className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
