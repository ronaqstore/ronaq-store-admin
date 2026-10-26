'use client';

import { IconCopy, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/use-t';
import type { SetupLinkCopyRowProps } from '../api/types';

export function SetupLinkCopyRow({ setupUrl }: SetupLinkCopyRowProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copySetupUrl = async () => {
    try {
      await navigator.clipboard.writeText(setupUrl);
      setCopied(true);
      toast.success(t('platform.setupLinkCopied'));
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('platform.setupLinkCopyFailed'));
    }
  };

  return (
    <div className='bg-muted flex items-start gap-2 rounded-md p-2'>
      <code className='min-w-0 flex-1 break-all px-1 py-1.5 text-xs'>{setupUrl}</code>
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='shrink-0 gap-1.5'
        onClick={() => void copySetupUrl()}
        aria-label={t('platform.copySetupLink')}
      >
        {copied ? <IconCheck className='h-4 w-4' /> : <IconCopy className='h-4 w-4' />}
        {t('platform.copySetupLink')}
      </Button>
    </div>
  );
}
