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
import { sanitizeBarcode, sanitizeImei } from '@/lib/barcode/imei-sanitizer';
import type {
  CameraBarcodeScannerDialogProps,
  CameraDeviceOption,
  TorchConstraint
} from '@/types/barcode';
import {
  cropVideoToReticle,
  preloadOcrWorker,
  preprocessForOcr,
  recognizeNumbersFromCanvas,
  type OcrCandidate
} from '@/lib/barcode/ocr-number-extractor';
import { cn } from '@/lib/utils';

export type { CameraBarcodeScannerDialogProps };

function playScanBeep() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext;
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
    return;
  }
}

export function CameraBarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
  mode = 'imei',
  title,
  description
}: CameraBarcodeScannerDialogProps) {
  const t = useT();
  const containerId = React.useId().replace(/[:]/g, '-');
  const elementId = `scanner-viewfinder-${containerId}`;

  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const [scanType, setScanType] = React.useState<'barcode' | 'ocr'>('barcode');
  const [cameras, setCameras] = React.useState<CameraDeviceOption[]>([]);
  const [selectedCameraId, setSelectedCameraId] = React.useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = React.useState(false);
  const [hasTorch, setHasTorch] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [isOcrScanning, setIsOcrScanning] = React.useState(false);
  const [ocrCandidates, setOcrCandidates] = React.useState<OcrCandidate[]>([]);

  const effTitle =
    title ?? (mode === 'barcode' ? t('scanner.scanBarcodeTitle') : t('scanner.scanImeiTitle'));
  const effDescription =
    description ??
    (mode === 'barcode' ? t('scanner.scanBarcodeDescription') : t('scanner.scanImeiDescription'));

  const stopScanner = React.useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      scannerRef.current = null;
    } finally {
      scannerRef.current = null;
    }
  }, []);

  const handleScanSuccess = React.useCallback(
    (decodedText: string) => {
      // Ignore barcode frames while the user is deliberately using OCR mode
      if (scanType === 'ocr') {
        return;
      }

      if (mode === 'barcode') {
        const result = sanitizeBarcode(decodedText);
        if (result.success) {
          playScanBeep();
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(100);
          }
          void stopScanner();
          onScan(result.barcode);
          onOpenChange(false);
        } else {
          setWarningMessage(t('scanner.invalidBarcodeScanned'));
        }
      } else {
        const result = sanitizeImei(decodedText);
        if (result.success) {
          playScanBeep();
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(100);
          }
          void stopScanner();
          onScan(result.imei);
          onOpenChange(false);
        } else {
          setWarningMessage(
            t('scanner.invalidImeiScanned', {
              scanned: decodedText.length > 18 ? `${decodedText.slice(0, 18)}...` : decodedText
            })
          );
        }
      }
    },
    [mode, scanType, onScan, onOpenChange, stopScanner, t]
  );

  const startScanner = React.useCallback(
    async (cameraId?: string) => {
      await stopScanner();

      const el = document.getElementById(elementId);
      if (!el) return;

      setIsInitializing(true);
      setErrorMessage(null);
      setWarningMessage(null);
      setOcrCandidates([]);

      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        setErrorMessage(
          'Camera access requires a secure connection (HTTPS). Please open this site using HTTPS or localhost.'
        );
        setIsInitializing(false);
        return;
      }

      try {
        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX
          ],
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        });
        scannerRef.current = scanner;

        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: 'environment' };

        await scanner.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const width = Math.min(Math.floor(viewfinderWidth * 0.9), 420);
              const height = Math.min(Math.floor(viewfinderHeight * 0.55), 240);
              return { width, height };
            }
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => undefined
        );

        // Fetch cameras list safely AFTER camera starts and permission is granted
        try {
          const deviceList = await Html5Qrcode.getCameras();
          if (deviceList && deviceList.length > 0) {
            setCameras(deviceList);
          }
        } catch {
          // Camera listing might fail if single camera or permission-restricted
        }

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
    [elementId, stopScanner, handleScanSuccess, t]
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

  // Warm up the OCR engine as soon as the user switches to "Read Numbers"
  React.useEffect(() => {
    if (open && scanType === 'ocr') {
      preloadOcrWorker();
    }
  }, [open, scanType]);

  const handleToggleTorch = async () => {
    const scanner = scannerRef.current;
    if (!scanner || !hasTorch) return;
    try {
      const nextTorch = !isTorchOn;
      const torchConfig: TorchConstraint = { torch: nextTorch };
      await scanner.applyVideoConstraints({
        advanced: [torchConfig]
      });
      setIsTorchOn(nextTorch);
    } catch {
      setIsTorchOn(false);
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

  const handleSelectCandidate = (candidate: OcrCandidate) => {
    playScanBeep();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
    void stopScanner();
    onScan(candidate.imei);
    onOpenChange(false);
  };

  const handleCaptureOcr = async () => {
    const container = document.getElementById(elementId);
    const video = container?.querySelector('video');
    if (!video) {
      setWarningMessage(t('scanner.scanFailed'));
      return;
    }

    setIsOcrScanning(true);
    setWarningMessage(null);

    try {
      const centerCrop = cropVideoToReticle(video, {
        xRatio: 0.05,
        yRatio: 0.2,
        widthRatio: 0.9,
        heightRatio: 0.6
      });
      const fullFrame = cropVideoToReticle(video, {
        xRatio: 0,
        yRatio: 0,
        widthRatio: 1,
        heightRatio: 1
      });

      // Try progressively wider / rawer inputs until a 15-digit number is found
      const attempts: HTMLCanvasElement[] = [
        preprocessForOcr(centerCrop),
        centerCrop,
        preprocessForOcr(fullFrame)
      ];

      let found: OcrCandidate[] = [];
      for (const attempt of attempts) {
        found = await recognizeNumbersFromCanvas(attempt);
        if (found.some((c) => c.isLuhnValid)) break;
      }

      if (found.length === 0) {
        setOcrCandidates([]);
        setWarningMessage(t('scanner.ocrNoNumbersFound'));
      } else if (found.length === 1 && found[0] && found[0].isLuhnValid) {
        // Exactly one valid candidate -> Instant auto-fill!
        handleSelectCandidate(found[0]);
      } else {
        // Either multiple candidates or check digit warning
        setOcrCandidates(found);
        if (found.some((c) => !c.isLuhnValid)) {
          setWarningMessage(t('scanner.ocrChecksumWarning'));
        }
      }
    } catch (err) {
      console.error('[OCR Error]', err);
      setWarningMessage(t('scanner.scanFailed'));
    } finally {
      setIsOcrScanning(false);
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

        {/* Mode switcher tab (available in IMEI scan mode) */}
        {mode === 'imei' && (
          <div className='mt-2 flex rounded-lg bg-muted p-0.5 text-xs font-medium'>
            <button
              type='button'
              onClick={() => {
                setScanType('barcode');
                setWarningMessage(null);
                setOcrCandidates([]);
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors',
                scanType === 'barcode'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icons.barcode className='h-3.5 w-3.5' />
              <span>{t('scanner.modeBarcode')}</span>
            </button>
            <button
              type='button'
              onClick={() => {
                setScanType('ocr');
                setWarningMessage(null);
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors',
                scanType === 'ocr'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icons.text className='h-3.5 w-3.5' />
              <span>{t('scanner.modeOcr')}</span>
            </button>
          </div>
        )}

        <div className='relative mt-3 flex flex-col items-center justify-center overflow-hidden rounded-xl bg-black/90 p-1'>
          <div
            id={elementId}
            className='h-[260px] w-full overflow-hidden rounded-lg [&_video]:h-full [&_video]:w-full [&_video]:object-cover'
          />

          {/* OCR Guide Overlay */}
          {scanType === 'ocr' && !isInitializing && !errorMessage && (
            <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-4'>
              <div className='relative h-28 w-4/5 rounded-lg border-2 border-dashed border-primary/80 bg-primary/5 shadow-sm'>
                <div className='absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-2.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm'>
                  {t('scanner.ocrGuide')}
                </div>
              </div>
            </div>
          )}

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
                type='button'
                variant='outline'
                size='sm'
                className='mt-4'
                onClick={() => void startScanner(selectedCameraId ?? undefined)}
              >
                {t('common.tryAgain')}
              </Button>
            </div>
          )}

          {/* Controls Bar */}
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

            {scanType === 'ocr' && (
              <Button
                type='button'
                size='sm'
                disabled={isOcrScanning || isInitializing}
                className='h-8 gap-1.5 rounded-full px-4 text-xs font-semibold shadow-lg'
                onClick={() => void handleCaptureOcr()}
              >
                {isOcrScanning ? (
                  <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Icons.camera className='h-3.5 w-3.5' />
                )}
                <span>
                  {isOcrScanning ? t('scanner.ocrCapturing') : t('scanner.ocrCaptureBtn')}
                </span>
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

        {/* OCR Candidate Chips */}
        {ocrCandidates.length > 0 && (
          <div className='mt-3 rounded-lg border bg-muted/40 p-3'>
            <p className='text-xs font-medium text-foreground'>
              {t('scanner.ocrMultipleFound', { count: ocrCandidates.length })}
            </p>
            <div className='mt-2 flex flex-wrap gap-2'>
              {ocrCandidates.map((candidate) => (
                <Button
                  key={candidate.imei}
                  type='button'
                  size='sm'
                  variant={candidate.isLuhnValid ? 'default' : 'outline'}
                  className='h-8 gap-1.5 text-xs font-mono font-medium'
                  onClick={() => handleSelectCandidate(candidate)}
                >
                  {candidate.isLuhnValid ? (
                    <Icons.check className='h-3.5 w-3.5 text-emerald-400' />
                  ) : (
                    <Icons.warning className='h-3.5 w-3.5 text-amber-500' />
                  )}
                  <span>
                    {candidate.label ? `${candidate.label}: ` : ''}
                    {candidate.imei}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

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
