'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { usePathname, useRouter } from '@/i18n/navigation';

import { imeiLookupQueryOptions } from '../api/queries';
import { ImeiSearchDeviceDetails } from './imei-search-device-details';
import { ImeiCameraScanButton } from '@/components/barcode';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/dates';
import { sanitizeImei } from '@/lib/barcode/imei-sanitizer';
import type { ImeiTimelineEventDto } from '@/lib/api/types';

function getTimelineIcon(type: string) {
  switch (type) {
    case 'PURCHASE':
    case 'CONSIGNMENT':
      return <Icons.truck className='h-4 w-4 text-sky-600 dark:text-sky-400' />;
    case 'SALE':
      return <Icons.receipt className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />;
    case 'ADJUSTMENT':
    case 'PRICE_CHANGE':
      return <Icons.adjustments className='h-4 w-4 text-amber-600 dark:text-amber-400' />;
    case 'WARRANTY_CHECK':
      return <Icons.check className='h-4 w-4 text-blue-600 dark:text-blue-400' />;
    case 'DAMAGE_LOSS':
      return <Icons.warning className='h-4 w-4 text-rose-600 dark:text-rose-400' />;
    default:
      return <Icons.circle className='h-3 w-3 text-muted-foreground' />;
  }
}

export function ImeiSearchPage() {
  const t = useTranslations('imeiSearch');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialImei = searchParams.get('imei') ?? '';
  const [inputValue, setInputValue] = React.useState(initialImei);
  const [activeImei, setActiveImei] = React.useState(initialImei.trim());

  React.useEffect(() => {
    const urlImei = searchParams.get('imei') ?? '';
    if (urlImei !== activeImei) {
      setInputValue(urlImei);
      setActiveImei(urlImei.trim());
    }
  }, [searchParams, activeImei]);

  const {
    data: result,
    isLoading,
    isFetching,
    error
  } = useQuery(imeiLookupQueryOptions(activeImei));

  const handleSearch = React.useCallback(
    (imeiToSearch: string) => {
      const sanitized = sanitizeImei(imeiToSearch);
      const queryImei = sanitized.success ? sanitized.imei : imeiToSearch.trim();

      setActiveImei(queryImei);
      const params = new URLSearchParams(searchParams.toString());
      if (queryImei) {
        params.set('imei', queryImei);
      } else {
        params.delete('imei');
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleSearch(inputValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setActiveImei('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('imei');
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleCameraScan = (scannedCode: string) => {
    const sanitized = sanitizeImei(scannedCode);
    const resolvedImei = sanitized.success ? sanitized.imei : scannedCode.trim();
    setInputValue(resolvedImei);
    handleSearch(resolvedImei);
    toast.success(t('scannedSuccess', { imei: resolvedImei }));
  };

  const handleCopyImei = async (imeiToCopy: string) => {
    try {
      await navigator.clipboard.writeText(imeiToCopy);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  const device = result?.device;
  const intake = result?.intake;
  const latestSale = result?.latestSale;

  return (
    <div className='space-y-6'>
      <Card className='border-border/80 bg-card/50 shadow-xs'>
        <CardContent className='p-4 md:p-6'>
          <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-3'>
            <div className='relative flex-1'>
              <Icons.search className='absolute inset-s-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('inputPlaceholder')}
                className='ps-10 font-mono tracking-wider text-base'
                autoFocus
              />
              {inputValue && (
                <button
                  type='button'
                  onClick={handleClear}
                  className='absolute inset-e-3 top-3 text-muted-foreground hover:text-foreground text-xs p-0.5'
                  title={t('clear')}
                >
                  <Icons.close className='h-4 w-4' />
                </button>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <Button type='submit' disabled={!inputValue.trim() || isFetching} className='gap-2'>
                <Icons.search className='h-4 w-4' />
                <span>{isFetching ? t('searching') : t('search')}</span>
              </Button>

              <ImeiCameraScanButton
                onScan={handleCameraScan}
                className='h-9 w-9'
                title={t('scanWithCamera')}
              />

              {activeImei && (
                <Button type='button' variant='ghost' onClick={handleClear}>
                  {t('clear')}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className='space-y-4'>
          <Skeleton className='h-32 w-full rounded-xl' />
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Skeleton className='h-48 rounded-xl' />
            <Skeleton className='h-48 rounded-xl' />
            <Skeleton className='h-48 rounded-xl' />
            <Skeleton className='h-48 rounded-xl' />
          </div>
        </div>
      )}

      {!isLoading && !activeImei && (
        <Card className='border-dashed border-2 border-border/80 bg-muted/10 p-12 text-center'>
          <div className='flex flex-col items-center justify-center max-w-md mx-auto space-y-3'>
            <div className='p-3 rounded-full bg-primary/10 text-primary'>
              <Icons.scan className='h-8 w-8' />
            </div>
            <h3 className='text-lg font-semibold'>{t('emptyStateTitle')}</h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>{t('emptyStateDesc')}</p>
          </div>
        </Card>
      )}

      {!isLoading && activeImei && result && !result.found && (
        <Card className='border-destructive/40 bg-destructive/5 p-8 text-center'>
          <div className='flex flex-col items-center justify-center max-w-md mx-auto space-y-3'>
            <div className='p-3 rounded-full bg-destructive/10 text-destructive'>
              <Icons.warning className='h-6 w-6' />
            </div>
            <div className='space-y-2'>
              <h3 className='text-base font-semibold text-destructive'>{t('notFoundTitle')}</h3>
              <p className='text-sm text-muted-foreground'>
                {t('notFoundDesc', { imei: activeImei })}
              </p>
              <p className='text-xs text-muted-foreground/90'>{t('notFoundTip')}</p>
            </div>
          </div>
        </Card>
      )}

      {!isLoading && error && (
        <Card className='border-destructive/30 bg-destructive/[0.03] p-6 text-destructive'>
          <div className='flex items-center gap-3'>
            <Icons.alertCircle className='h-5 w-5' />
            <p className='text-sm font-medium'>
              {error instanceof Error ? error.message : 'Error fetching device lifecycle'}
            </p>
          </div>
        </Card>
      )}

      {!isLoading && result?.found && device && (
        <div className='space-y-6'>
          <ImeiSearchDeviceDetails
            device={device}
            intake={intake}
            latestSale={latestSale}
            onCopyImei={handleCopyImei}
          />

          <Card className='shadow-none border-border/70'>
            <CardHeader>
              <CardTitle className='text-base font-semibold flex items-center gap-2'>
                <Icons.history className='h-5 w-5 text-primary' />
                {t('timelineCard')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.timeline.length === 0 ? (
                <p className='text-sm text-muted-foreground py-4 text-center'>{t('noTimeline')}</p>
              ) : (
                <div className='relative ps-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border'>
                  {result.timeline.map((event: ImeiTimelineEventDto) => (
                    <div key={event.id} className='relative group'>
                      <div className='absolute -left-6 top-1 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center'>
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className='bg-muted/30 rounded-lg p-3.5 border border-border/50 hover:border-border transition-colors'>
                        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-semibold text-foreground'>
                              {event.title}
                            </span>
                            {event.referenceNo && (
                              <Badge variant='outline' className='font-mono text-[10px]'>
                                {event.referenceNo}
                              </Badge>
                            )}
                          </div>
                          <span className='text-xs text-muted-foreground font-mono'>
                            {formatDateTime(event.date)}
                          </span>
                        </div>
                        <p className='text-xs text-muted-foreground'>{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
