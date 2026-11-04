'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import type { ScannerControlsBarProps } from '@/types/barcode';

export function ScannerControlsBar({
  hasMultipleCameras,
  scanType,
  isOcrScanning,
  isInitializing,
  hasTorch,
  isTorchOn,
  onSwitchCamera,
  onCaptureOcr,
  onToggleTorch
}: ScannerControlsBarProps) {
  const t = useT();

  return (
    <div className='mt-2 flex flex-wrap items-center justify-center gap-2'>
      {hasMultipleCameras && (
        <Button
          type='button'
          variant='secondary'
          size='sm'
          className='h-8 gap-1.5 rounded-full bg-background/80 text-xs shadow-md backdrop-blur-sm'
          onClick={onSwitchCamera}
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
          onClick={onCaptureOcr}
        >
          {isOcrScanning ? (
            <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
          ) : (
            <Icons.camera className='h-3.5 w-3.5' />
          )}
          <span>{isOcrScanning ? t('scanner.ocrCapturing') : t('scanner.ocrCaptureBtn')}</span>
        </Button>
      )}

      {hasTorch && (
        <Button
          type='button'
          variant={isTorchOn ? 'default' : 'secondary'}
          size='sm'
          className='h-8 gap-1.5 rounded-full bg-background/80 text-xs shadow-md backdrop-blur-sm'
          onClick={onToggleTorch}
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
  );
}
