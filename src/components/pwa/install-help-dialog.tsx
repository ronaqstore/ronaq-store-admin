'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { InstallHelpDialogProps } from '@/types';
import { useTranslations } from 'next-intl';

export function InstallHelpDialog({
  open,
  onOpenChange,
  surface,
  needsReinstall,
  stillInstalledHint,
  appsUrl,
  canPrompt,
  prompting,
  onCopyAppsUrl,
  onRemovedAndInstall,
  onShowIosHowTo,
  onTryNativeInstall
}: InstallHelpDialogProps) {
  const t = useTranslations();

  const helpTitle = needsReinstall
    ? stillInstalledHint
      ? t('pwa.stillInstalledTitle')
      : t('pwa.removeAndNewTitle')
    : surface === 'ios'
      ? t('pwa.iosTitle')
      : surface === 'desktop'
        ? t('pwa.desktopTitle')
        : t('pwa.androidTitle');

  const helpBody = needsReinstall
    ? stillInstalledHint
      ? t('pwa.stillInstalledBody')
      : surface === 'ios'
        ? t('pwa.againBodyIos')
        : surface === 'desktop'
          ? t('pwa.removeAndNewBodyDesktop')
          : t('pwa.removeAndNewBodyAndroid')
    : surface === 'ios'
      ? t('pwa.iosBody')
      : surface === 'desktop'
        ? t('pwa.desktopBody')
        : t('pwa.androidBody');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>{helpTitle}</DialogTitle>
          <DialogDescription>{helpBody}</DialogDescription>
        </DialogHeader>

        <ol className='text-muted-foreground list-decimal space-y-2 ps-4 text-sm'>
          {needsReinstall ? (
            surface === 'ios' ? (
              <>
                <li>{t('pwa.againIosStep1')}</li>
                <li>{t('pwa.againIosStep2')}</li>
                <li>{t('pwa.againIosStep3')}</li>
              </>
            ) : surface === 'desktop' ? (
              <>
                <li>
                  {t('pwa.againDesktopStep1Prefix')}{' '}
                  <span className='text-foreground font-medium'>{appsUrl}</span>
                </li>
                <li>{t('pwa.againDesktopStep2')}</li>
                <li>{t('pwa.againDesktopStep3')}</li>
                <li>{t('pwa.againDesktopStep4')}</li>
              </>
            ) : (
              <>
                <li>{t('pwa.againAndroidStep1')}</li>
                <li>{t('pwa.againAndroidStep2')}</li>
                <li>{t('pwa.againAndroidStep3')}</li>
                <li>{t('pwa.againAndroidStep4')}</li>
              </>
            )
          ) : surface === 'ios' ? (
            <>
              <li>{t('pwa.iosStep1')}</li>
              <li>{t('pwa.iosStep2')}</li>
              <li>{t('pwa.iosStep3')}</li>
            </>
          ) : surface === 'desktop' ? (
            <>
              <li>{t('pwa.desktopStep1')}</li>
              <li>{t('pwa.desktopStep2')}</li>
              <li>{t('pwa.desktopStep3')}</li>
            </>
          ) : (
            <>
              <li>{t('pwa.androidStep1')}</li>
              <li>{t('pwa.androidStep2')}</li>
              <li>{t('pwa.androidStep3')}</li>
            </>
          )}
        </ol>

        {needsReinstall && surface !== 'ios' ? (
          <div className='mt-3 flex flex-col gap-2'>
            <Button type='button' variant='outline' className='w-full' onClick={onCopyAppsUrl}>
              {t('pwa.copyAppsUrl')}
            </Button>
            <Button
              type='button'
              className='w-full'
              isLoading={prompting}
              onClick={onRemovedAndInstall}
            >
              {t('pwa.reloadAndInstall')}
            </Button>
          </div>
        ) : null}

        {needsReinstall && surface === 'ios' ? (
          <Button type='button' className='mt-3 w-full' onClick={onShowIosHowTo}>
            {t('pwa.howToInstall')}
          </Button>
        ) : null}

        {!needsReinstall && surface !== 'ios' ? (
          <Button
            type='button'
            className='mt-2 w-full'
            isLoading={prompting}
            disabled={!canPrompt && !prompting}
            onClick={onTryNativeInstall}
          >
            {canPrompt || prompting ? t('pwa.installApp') : t('pwa.installUnavailable')}
          </Button>
        ) : null}

        <p className='text-muted-foreground mt-2 text-center text-xs'>
          {needsReinstall ? t('pwa.againFooter') : t('pwa.installFooter')}
        </p>
      </DialogContent>
    </Dialog>
  );
}
