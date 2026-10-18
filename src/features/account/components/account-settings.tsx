'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { formatEmpty } from '@/lib/format-empty';
import { useT } from '@/i18n/use-t';
import { ChangePasswordDialog } from './change-password-dialog';

export function AccountSettings() {
  const t = useT();
  const { data, status } = useSession();
  const [passwordOpen, setPasswordOpen] = useState(false);

  const userName = formatEmpty(data?.user?.name, t('user.user'));
  const shopName = formatEmpty(data?.user?.shopName);

  const openPasswordDialog = () => {
    setPasswordOpen(true);
  };

  return (
    <>
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='min-w-0'>
          <CardHeader className='flex flex-row items-start gap-3 space-y-0 pb-3'>
            <div className='bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'>
              <Icons.user className='text-muted-foreground h-4 w-4' />
            </div>
            <div className='min-w-0 space-y-1'>
              <CardTitle className='text-base'>{t('account.profileTitle')}</CardTitle>
              <CardDescription>{t('account.profileDescription')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {status === 'loading' ? (
              <div className='space-y-3'>
                <Skeleton className='h-14 w-full' />
                <Skeleton className='h-14 w-full' />
              </div>
            ) : (
              <dl className='grid gap-3 sm:grid-cols-2'>
                <div className='bg-muted/40 rounded-lg border px-3 py-3'>
                  <dt className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    {t('user.name')}
                  </dt>
                  <dd className='mt-1 truncate text-sm font-semibold'>{userName}</dd>
                </div>
                <div className='bg-muted/40 rounded-lg border px-3 py-3'>
                  <dt className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                    {t('nav.shop')}
                  </dt>
                  <dd className='mt-1 truncate text-sm font-semibold'>{shopName}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card className='min-w-0'>
          <CardHeader className='flex flex-row items-start gap-3 space-y-0 pb-3'>
            <div className='bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'>
              <Icons.lock className='text-muted-foreground h-4 w-4' />
            </div>
            <div className='min-w-0 space-y-1'>
              <CardTitle className='text-base'>{t('account.securityTitle')}</CardTitle>
              <CardDescription>{t('account.securityDescription')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className='flex h-full flex-col justify-between gap-4'>
            <p className='text-muted-foreground text-sm'>{t('account.changePasswordHint')}</p>
            <div className='flex justify-end'>
              <Button type='button' onClick={openPasswordDialog}>
                <Icons.lock className='me-2 h-4 w-4' />
                {t('account.changePasswordTitle')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
