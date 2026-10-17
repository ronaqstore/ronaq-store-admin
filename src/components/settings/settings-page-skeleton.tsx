import { Skeleton } from '@/components/ui/skeleton';

export function SettingsPageSkeleton() {
  return (
    <div
      role='status'
      className='flex min-w-0 flex-col gap-10'
      aria-busy='true'
    >
      <section className='space-y-4'>
        <div className='flex items-start gap-3'>
          <Skeleton className='h-10 w-10 shrink-0 rounded-xl' />
          <div className='space-y-2'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-4 w-56' />
          </div>
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          <Skeleton className='h-44 w-full rounded-xl' />
          <Skeleton className='h-44 w-full rounded-xl' />
        </div>
      </section>

      <Skeleton className='h-px w-full' />

      <section className='space-y-4'>
        <div className='flex items-start gap-3'>
          <Skeleton className='h-10 w-10 shrink-0 rounded-xl' />
          <div className='space-y-2'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-4 w-64' />
          </div>
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          <Skeleton className='h-52 w-full rounded-xl' />
          <Skeleton className='h-52 w-full rounded-xl' />
          <Skeleton className='h-72 w-full rounded-xl lg:col-span-2' />
        </div>
      </section>
    </div>
  );
}

export function AppearancePageSkeleton() {
  return (
    <div
      role='status'
      className='grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]'
      aria-busy='true'
    >
      <div className='min-w-0 space-y-6'>
        <div className='flex items-start justify-between gap-4'>
          <div className='space-y-2'>
            <Skeleton className='h-7 w-40' />
            <Skeleton className='h-4 w-72' />
          </div>
          <Skeleton className='h-9 w-36' />
        </div>
        <Skeleton className='h-36 w-full rounded-xl' />
        <Skeleton className='h-64 w-full rounded-xl' />
        <Skeleton className='h-52 w-full rounded-xl' />
        <Skeleton className='h-48 w-full rounded-xl' />
      </div>
      <Skeleton className='hidden h-80 w-full rounded-xl lg:block' />
    </div>
  );
}
