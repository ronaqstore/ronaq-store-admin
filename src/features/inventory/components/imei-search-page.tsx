'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { usePathname, useRouter } from '@/i18n/navigation';

import { imeiLookupQueryOptions } from '../api/queries';
import { ImeiSearchResult } from './imei-search-result';
import { ImeiCameraScanButton } from '@/components/barcode';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { sanitizeImei } from '@/lib/barcode/imei-sanitizer';

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
  };

  const handleCopyImei = (imei: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(imei);
      toast.success(t('copied'));
    }
  };

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full'>
      <Card className='border-border/60 shadow-sm'>
        <CardContent className='p-4 md:p-6'>
          <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-3 items-stretch'>
            <div className='relative flex-1'>
              <Icons.search className='absolute inset-s-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                type='text'
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('inputPlaceholder')}
                className='ps-10 pe-10 font-mono tracking-wide'
                autoFocus
              />
              {inputValue && (
                <button
                  type='button'
                  onClick={handleClear}
                  className='absolute inset-e-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1'
                  aria-label={t('clear')}
                >
                  <Icons.close className='h-4 w-4' />
                </button>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <ImeiCameraScanButton
                onScan={handleCameraScan}
                mode='imei'
                title={t('scanWithCamera')}
                className='h-10 w-10 shrink-0'
              />
              <Button
                type='submit'
                disabled={!inputValue.trim() || isFetching}
                className='min-w-28'
              >
                {isFetching ? (
                  <>
                    <Icons.spinner className='me-2 h-4 w-4 animate-spin' />
                    {t('searching')}
                  </>
                ) : (
                  <>
                    <Icons.search className='me-2 h-4 w-4' />
                    {t('search')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-6 w-24' />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Skeleton className='h-48 rounded-xl' />
            <Skeleton className='h-48 rounded-xl' />
            <Skeleton className='h-48 rounded-xl' />
            <Skeleton className='h-48 rounded-xl' />
          </div>
          <Skeleton className='h-64 rounded-xl' />
        </div>
      )}

      {!isLoading && !activeImei && (
        <Card className='border-dashed border-2 bg-muted/20 text-center py-12 px-6'>
          <CardContent className='flex flex-col items-center justify-center space-y-4'>
            <div className='h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
              <Icons.scan className='h-7 w-7' />
            </div>
            <div className='space-y-2 max-w-md'>
              <h3 className='text-lg font-semibold tracking-tight'>{t('emptyStateTitle')}</h3>
              <p className='text-sm text-muted-foreground leading-relaxed'>{t('emptyStateDesc')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && activeImei && result && !result.found && (
        <Card className='border-destructive/30 bg-destructive/[0.03] p-6'>
          <div className='flex items-start gap-4'>
            <div className='p-2 rounded-full bg-destructive/10 text-destructive shrink-0'>
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
              {error instanceof Error ? error.message : t('lookupError')}
            </p>
          </div>
        </Card>
      )}

      {!isLoading && result?.found ? (
        <ImeiSearchResult result={result} onCopyImei={handleCopyImei} />
      ) : null}
    </div>
  );
}
