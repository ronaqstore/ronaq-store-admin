'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { issuePasswordSetupLink } from '../api/service';
import { resolveSetupPasswordUrl } from '../utils/setup-password-url';
import { SetupLinkCopyRow } from './setup-link-copy-row';
import { useT } from '@/i18n/use-t';
import type { IssueSetupLinkDialogProps } from '../api/types';

export function IssueSetupLinkDialog({
  open,
  onOpenChange,
  shopId,
  shopName,
  hasPassword
}: IssueSetupLinkDialogProps) {
  const t = useT();
  const [setupUrl, setSetupUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setSetupUrl(null);
  }, [open]);

  const issue = useMutation({
    mutationFn: () => issuePasswordSetupLink(shopId),
    onSuccess: (res) => {
      setSetupUrl(resolveSetupPasswordUrl(res.setupUrl));
      toast.success(t('platform.setupLinkIssued'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('platform.setupLinkFailed'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-full sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {hasPassword
              ? t('platform.resetPasswordTitle')
              : t('platform.reissueSetupLink')}
          </DialogTitle>
          <DialogDescription>
            {hasPassword
              ? t('platform.resetPasswordDescription', { name: shopName })
              : t('platform.reissueSetupDescription', { name: shopName })}
          </DialogDescription>
        </DialogHeader>

        {setupUrl ? (
          <div className='space-y-3 pt-2'>
            <p className='text-muted-foreground text-sm'>{t('platform.setupLinkOnce')}</p>
            <SetupLinkCopyRow setupUrl={setupUrl} />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                {t('common.close')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <DialogFooter className='pt-2'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type='button'
              loading={issue.isPending}
              disabled={issue.isPending}
              onClick={() => issue.mutate()}
            >
              {t('platform.generateSetupLink')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
