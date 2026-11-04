'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useT } from '@/i18n/use-t';
import type { ScannerOcrCandidatesProps } from '@/types/barcode';

export function ScannerOcrCandidates({ candidates, onSelectCandidate }: ScannerOcrCandidatesProps) {
  const t = useT();

  if (candidates.length === 0) return null;

  return (
    <div className='mt-3 rounded-lg border bg-muted/40 p-3'>
      <p className='text-xs font-medium text-foreground'>
        {t('scanner.ocrMultipleFound', { count: candidates.length })}
      </p>
      <div className='mt-2 flex flex-wrap gap-2'>
        {candidates.map((candidate) => (
          <Button
            key={candidate.imei}
            type='button'
            size='sm'
            variant={candidate.isLuhnValid ? 'default' : 'outline'}
            className='h-8 gap-1.5 text-xs font-mono font-medium'
            onClick={() => onSelectCandidate(candidate)}
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
  );
}
