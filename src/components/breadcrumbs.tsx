'use client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { Icons } from '@/components/icons';
import { Fragment } from 'react';
import { Link } from '@/i18n/navigation';

export function Breadcrumbs() {
  const items = useBreadcrumbs();
  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList className='flex-nowrap whitespace-nowrap overflow-hidden text-xs sm:text-sm'>
        {items.map((item, index) => (
          <Fragment key={item.link}>
            {index !== items.length - 1 && (
              <BreadcrumbItem className='hidden shrink-0 md:inline-flex'>
                <BreadcrumbLink render={<Link href={item.link} aria-label={item.title} />}>
                  {item.title}
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
            {index < items.length - 1 && (
              <BreadcrumbSeparator className='hidden shrink-0 md:inline-flex'>
                <Icons.slash />
              </BreadcrumbSeparator>
            )}
            {index === items.length - 1 && (
              <BreadcrumbPage className='truncate font-medium'>{item.title}</BreadcrumbPage>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
