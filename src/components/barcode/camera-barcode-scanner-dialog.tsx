'use client';

import * as React from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import { sanitizeImei } from '@/lib/barcode/imei-sanitizer';

export interface CameraBarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (imei: string) => void;
  title?: string;
  description?: string;
}

function playScanBeep() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio autoplay restrictions or unsupported in environment
  }
}

export function CameraBarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
  title,
  description
}: CameraBarcodeScannerDialogProps) {
  const t = useT();
  const containerId = React.useId().replace(/[:]/g, '-');
  const elementId = `scanner-viewfinder-${containerId}`;

  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = React.useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = React.useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = React.useState(false);
  const [hasTorch, setHasTorch] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(false);

  const effTitle = title ?? t('scanner.scanImeiTitle');
  const effDescription = description ?? t('scanner.scanImeiDescription');

  const stopScanner = React.useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // Ignore cleanup error on unmount/dialog close
    } finally {
      scannerRef.current = null;
    }
  }, []);

  const startScanner = React.useCallback(
    async (cameraId?: string) => {
      await stopScanner();

      const el = document.getElementById(elementId);
      if (!el) return;

      setIsInitializing(true);
      setErrorMessage(null);
      setWarningMessage(null);

      try {
        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX
          ],
          verbose: false
        });
        scannerRef.current = scanner;

        // Check cameras list
        try {
          const deviceList = await Html5Qrcode.getCameras();
          if (deviceList && deviceList.length > 0) {
            setCameras(deviceList);
          }
        } catch {
          // Camera listing might fail if permissions aren't granted yet
        }

        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: 'environment' };

        await scanner.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const width = Math.min(Math.floor(viewfinderWidth * 0.85), 320);
              const height = Math.min(Math.floor(viewfinderHeight * 0.45), 180);
              return { width, height };
            }
          },
          (decodedText) => {
            const result = sanitizeImei(decodedText);
            if (result.success) {
              playScanBeep();
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(100);
              }
              stopScanner();
              onScan(result.imei);
              onOpenChange(false);
            } else {
              setWarningMessage(
                t('scanner.invalidImeiScanned', {
                  scanned: decodedText.length > 18 ? `${decodedText.slice(0, 18)}...` : decodedText
                })
              );
            }
          },
          () => {
            // Frame failed to detect barcode, normal behavior per frame
          }
        );

        // Check torch capabilities
        try {
          const capabilities = scanner.getRunningTrackCapabilities() as { torch?: boolean } | null;
          setHasTorch(Boolean(capabilities?.torch));
        } catch {
          setHasTorch(false);
        }
      } catch (err: unknown) {
        const msg = String(err);
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
          setErrorMessage(t('scanner.cameraPermissionDenied'));
        } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('device')) {
          setErrorMessage(t('scanner.cameraNotFound'));
        } else {
          setErrorMessage(t('scanner.scanFailed'));
        }
      } finally {
        setIsInitializing(false);
      }
    },
    [elementId, stopScanner, onScan, onOpenChange, t]
  );

  React.useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => {
        void startScanner(selectedCameraId ?? undefined);
      }, 100);
      return () => {
        window.clearTimeout(timer);
        void stopScanner();
      };
    } else {
      void stopScanner();
    }
  }, [open, selectedCameraId, startScanner, stopScanner]);

  const handleToggleTorch = async () => {
    const scanner = scannerRef.current;
    if (!scanner || !hasTorch) return;
    try {
      const nextTorch = !isTorchOn;
      await scanner.applyVideoConstraints({
        // @ts-expect-error torch is valid in MediaTrackConstraints for supported mobile browsers
        advanced: [{ torch: nextTorch }]
      });
      setIsTorchOn(nextTorch);
    } catch {
      // Failed to toggle torch
    }
  };

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    if (nextCamera) {
      setSelectedCameraId(nextCamera.id);
      void startScanner(nextCamera.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-lg font-semibold'>
            <Icons.scan className='h-5 w-5 text-primary' />
            {effTitle}
          </DialogTitle>
          <DialogDescription className='text-sm text-muted-foreground'>
            {effDescription}
          </DialogDescription>
        </DialogHeader>

        <div className='relative mt-3 flex flex-col items-center justify-center overflow-hidden rounded-xl bg-black/90 p-1'>
          <div
            id={elementId}
            className='h-[260px] w-full overflow-hidden rounded-lg [&_video]:h-full [&_video]:w-full [&_video]:object-cover'
          />

          {isInitializing && (
            <div className='absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-foreground'>
              <Icons.spinner className='h-8 w-8 animate-spin text-primary' />
              <p className='mt-2 text-xs font-medium'>{t('common.loading')}</p>
            </div>
          )}

          {errorMessage && (
            <div className='absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-background text-foreground'>
              <Icons.alertCircle className='h-10 w-10 text-destructive' />
              <p className='mt-3 text-sm font-semibold'>{errorMessage}</p>
              <Button
                variant='outline'
                size='sm'
                className='mt-4'
                onClick={() => void startScanner(selectedCameraId ?? undefined)}
              >
                {t('table.resetFilters')}
              </Button>
            </div>
          )}

          {/* Quick controls bar */}
          <div className='absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 px-3'>
            {cameras.length > 1 && (
              <Button
                type='button'
                variant='secondary'
                size='sm'
                className='h-8 gap-1.5 rounded-full bg-background/80 text-xs shadow-md backdrop-blur-sm'
                onClick={handleSwitchCamera}
              >
                <Icons.cameraRotate className='h-3.5 w-3.5' />
                <span>{t('scanner.switchCamera')}</span>
              </Button>
            )}

            {hasTorch && (
              <Button
                type='button'
                variant={isTorchOn ? 'default' : 'secondary'}
                size='sm'
                className='h-8 gap-1.5 rounded-full bg-background/80 text-xs shadow-md backdrop-blur-sm'
                onClick={() => void handleToggleTorch()}
              >
                {isTorchOn ? (
                  <Icons.flash className='h-3.5 w-3.5 text-amber-400' />
                ) : (
                  <Icons.flashOff className='h-3.5 w-3.5' />
                )}
                <span>{t('scanner.toggleFlash')}</span>
              </Button>
            )}
          </div>
        </div>

        {warningMessage && (
          <div className='mt-2 rounded-md bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400'>
            {warningMessage}
          </div>
        )}

        <DialogFooter className='mt-4 flex sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='w-full sm:w-auto'
          >
            {t('scanner.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
