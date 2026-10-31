'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { InstallHelpDialog } from '@/components/pwa/install-help-dialog';
import { useTranslations } from 'next-intl';
import { isIosInstallCandidate, isStandaloneDisplay } from '@/lib/pwa';
import type { Surface, InstallPromptProps } from '@/types';
export type { InstallPromptProps };
import {
  bumpInstallVisitsOnce,
  canPromptNativeInstall,
  clearInstalledMark,
  clearInstallReloadOnce,
  consumeInstallReloadSlot,
  detectPwaAlreadyInstalled,
  ensureInstallListeners,
  getBrowserAppsUrl,
  isDesktopInstallSurface,
  isInstallMarkedInstalled,
  isInstallPrompting,
  promptNativeInstall,
  scheduleInstallPageReload,
  subscribeInstallState,
  takeAutoPromptFlag,
  waitAndPromptNativeInstall
} from '@/lib/pwa-install';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_DAYS = 14;
const MIN_VISITS = 2;

function readDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function resolveSurface(): Surface {
  if (isIosInstallCandidate()) return 'ios';
  if (isDesktopInstallSurface()) return 'desktop';
  return 'android';
}

export function InstallPrompt({ variant = 'both', className }: InstallPromptProps) {
  const t = useTranslations();
  const [standalone, setStandalone] = React.useState(false);
  const [alreadyInstalled, setAlreadyInstalled] = React.useState(false);
  const [canPrompt, setCanPrompt] = React.useState(false);
  const [prompting, setPrompting] = React.useState(false);
  const [showBanner, setShowBanner] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [needsReinstall, setNeedsReinstall] = React.useState(false);
  const [stillInstalledHint, setStillInstalledHint] = React.useState(false);
  const [eligible, setEligible] = React.useState(false);
  const [surface, setSurface] = React.useState<Surface>('desktop');
  const [appsUrl, setAppsUrl] = React.useState('chrome://apps');
  const autoPromptTried = React.useRef(false);

  React.useEffect(() => {
    if (isStandaloneDisplay()) {
      setStandalone(true);
      return;
    }

    ensureInstallListeners();
    setSurface(resolveSurface());
    setAppsUrl(getBrowserAppsUrl());
    const visits = bumpInstallVisitsOnce();
    setEligible(visits >= MIN_VISITS && !readDismissed());
    setCanPrompt(canPromptNativeInstall());
    setPrompting(isInstallPrompting());
    setAlreadyInstalled(isInstallMarkedInstalled());

    void detectPwaAlreadyInstalled().then((yes) => {
      if (yes) setAlreadyInstalled(true);
    });

    return subscribeInstallState(() => {
      setStandalone(isStandaloneDisplay());
      setAlreadyInstalled(isInstallMarkedInstalled());
      setCanPrompt(canPromptNativeInstall());
      setPrompting(isInstallPrompting());
    });
  }, []);

  React.useEffect(() => {
    if (standalone || surface === 'ios' || autoPromptTried.current) return;
    if (!takeAutoPromptFlag()) return;
    autoPromptTried.current = true;

    void (async () => {
      clearInstalledMark();
      setPrompting(true);
      const outcome = await waitAndPromptNativeInstall(5000);
      setPrompting(false);

      if (outcome === 'accepted') {
        clearInstallReloadOnce();
        setAlreadyInstalled(true);
        toast.success(t('pwa.installSuccess'));
        return;
      }

      const stillThere = await detectPwaAlreadyInstalled();
      setStillInstalledHint(stillThere);
      setNeedsReinstall(true);
      setHelpOpen(true);
      if (stillThere) {
        toast.error(t('pwa.stillInstalledToast'));
      } else {
        toast.message(t('pwa.useBrowserInstallMenu'));
      }
    })();
  }, [standalone, surface, t]);

  React.useEffect(() => {
    if (!eligible || standalone) return;
    if (variant === 'menu') return;
    const timer = window.setTimeout(() => setShowBanner(true), 2500);
    return () => window.clearTimeout(timer);
  }, [eligible, standalone, variant]);

  const dismissBanner = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      setShowBanner(false);
      setEligible(false);
      return;
    }
    setShowBanner(false);
    setEligible(false);
  };

  const openHelp = (reinstall: boolean) => {
    setNeedsReinstall(reinstall);
    setStillInstalledHint(false);
    setHelpOpen(true);
  };

  const finishAccepted = () => {
    clearInstallReloadOnce();
    setShowBanner(false);
    setHelpOpen(false);
    setAlreadyInstalled(true);
    setNeedsReinstall(false);
    setStillInstalledHint(false);
    toast.success(t('pwa.installSuccess'));
  };

  const tryNativeInstall = () => {
    void promptNativeInstall().then(async (outcome) => {
      if (outcome === 'accepted') {
        finishAccepted();
        return;
      }
      if (outcome === 'dismissed') {
        toast.message(t('pwa.installCancelled'));
        return;
      }
      const stillThere = await detectPwaAlreadyInstalled();
      setStillInstalledHint(stillThere);
      openHelp(true);
    });
  };

  const onInstallClick = () => {
    if (surface === 'ios') {
      openHelp(alreadyInstalled);
      return;
    }

    if (canPromptNativeInstall() || canPrompt) {
      tryNativeInstall();
      return;
    }

    openHelp(true);
  };

  const copyAppsUrl = async () => {
    try {
      await navigator.clipboard.writeText(appsUrl);
      toast.success(t('pwa.copiedAppsUrl'));
    } catch {
      toast.message(appsUrl);
    }
  };

  const onRemovedAndInstall = () => {
    if (surface === 'ios') {
      openHelp(false);
      return;
    }

    clearInstalledMark();
    setAlreadyInstalled(false);
    setPrompting(true);

    void (async () => {
      const outcome = await waitAndPromptNativeInstall(3500);
      setPrompting(false);

      if (outcome === 'accepted') {
        finishAccepted();
        return;
      }

      if (outcome === 'dismissed') {
        toast.message(t('pwa.installCancelled'));
        return;
      }

      const stillThere = await detectPwaAlreadyInstalled();
      setStillInstalledHint(stillThere);
      if (stillThere) {
        toast.error(t('pwa.stillInstalledToast'));
        setNeedsReinstall(true);
        setHelpOpen(true);
        return;
      }

      if (consumeInstallReloadSlot()) {
        toast.message(t('pwa.reloadingForInstall'));
        scheduleInstallPageReload();
        return;
      }

      clearInstallReloadOnce();
      toast.message(t('pwa.useBrowserInstallMenu'));
      setNeedsReinstall(true);
      setHelpOpen(true);
    })();
  };

  if (standalone) return null;

  const showMenu = variant === 'menu' || variant === 'both';
  const showBannerUi = (variant === 'banner' || variant === 'both') && showBanner && eligible;

  const menuLabel = prompting
    ? t('pwa.installing')
    : alreadyInstalled
      ? t('pwa.removeAndNewIcon')
      : t('pwa.installApp');

  return (
    <>
      {showMenu ? (
        <button
          type='button'
          className={cn(
            'hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
            className
          )}
          onClick={onInstallClick}
          disabled={prompting}
        >
          <Icons.download className='size-4' />
          {menuLabel}
        </button>
      ) : null}

      {showBannerUi ? (
        <div
          role='region'
          aria-label={menuLabel}
          className='border-border bg-card fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 rounded-xl border p-3 shadow-lg sm:inset-x-auto sm:inset-e-4 sm:bottom-4 sm:max-w-sm'
        >
          <p className='text-sm font-medium'>
            {alreadyInstalled ? t('pwa.removeAndNewIcon') : t('pwa.installApp')}
          </p>
          <p className='text-muted-foreground mt-1 text-xs'>
            {alreadyInstalled
              ? t('pwa.removeAndNewBanner')
              : surface === 'ios'
                ? t('pwa.iosBody')
                : surface === 'desktop'
                  ? t('pwa.installDesktopHint')
                  : t('pwa.androidBody')}
          </p>
          <div className='mt-3 flex gap-2'>
            <Button
              type='button'
              size='sm'
              className='flex-1'
              onClick={onInstallClick}
              isLoading={prompting}
            >
              {surface === 'ios' && !alreadyInstalled
                ? t('pwa.howToInstall')
                : alreadyInstalled
                  ? t('pwa.removeAndNewIcon')
                  : t('pwa.installApp')}
            </Button>
            <Button type='button' size='sm' variant='ghost' onClick={dismissBanner}>
              {t('pwa.dismiss')}
            </Button>
          </div>
        </div>
      ) : null}

      <InstallHelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        surface={surface}
        needsReinstall={needsReinstall}
        stillInstalledHint={stillInstalledHint}
        appsUrl={appsUrl}
        canPrompt={canPrompt}
        prompting={prompting}
        onCopyAppsUrl={() => void copyAppsUrl()}
        onRemovedAndInstall={onRemovedAndInstall}
        onShowIosHowTo={() => openHelp(false)}
        onTryNativeInstall={tryNativeInstall}
      />
    </>
  );
}
