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

  return (
    <div className='space-y-6'>
      <Card className='border-border/80 bg-card/50 shadow-xs'>
        <CardContent className='p-4 md:p-6'>
          <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-3'>
            <div className='relative flex-1'>
              <Icons.search className='absolute inset-s-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
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
              <Button type='submit' disabled={!inputValue.trim() || isFetching} className='gap-2'>
                {isFetching ? (
                  <>
                    <Icons.spinner className='h-4 w-4 animate-spin' />
                    <span>{t('searching')}</span>
                  </>
                ) : (
                  <>
                    <Icons.search className='h-4 w-4' />
                    <span>{t('search')}</span>
                  </>
                )}
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
