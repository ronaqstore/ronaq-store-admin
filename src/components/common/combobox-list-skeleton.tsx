import { Skeleton } from '@/components/ui/skeleton';

const ROW_COUNT = 5;

export function ComboboxListSkeleton() {
  return (
    <div className='space-y-1 p-1' aria-busy='true' aria-live='polite'>
      {Array.from({ length: ROW_COUNT }, (_, index) => (
        <div key={index} className='flex items-center gap-2.5 rounded-md px-2.5 py-2'>
          <Skeleton className='size-4 shrink-0 rounded' />
          <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
            <Skeleton className='h-3.5 w-[72%]' />
            <Skeleton className='h-3 w-[44%]' />
          </div>
        </div>
      ))}
    </div>
  );
}
