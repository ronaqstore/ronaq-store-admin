'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { staffKeys } from '../api/queries';
import { createStaff, updateStaff } from '../api/service';
import type { UserStatus } from '@/lib/api/types';
import type { StaffDialogProps } from '@/types';

export function StaffDialog({ open, onOpenChange, staff, onSuccess }: StaffDialogProps) {
  const t = useTranslations('staff');
  const queryClient = useQueryClient();

  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [role, setRole] = React.useState<'MANAGER' | 'SALESMAN'>('SALESMAN');
  const [status, setStatus] = React.useState<UserStatus>('ACTIVE');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (staff) {
      setName(staff.name);
      setPhone(staff.phone);
      setRole(staff.role);
      setStatus(staff.status);
      setPassword('');
      setErrorMessage(null);
    } else {
      setName('');
      setPhone('');
      setRole('SALESMAN');
      setStatus('ACTIVE');
      setPassword('');
      setErrorMessage(null);
    }
  }, [staff, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage(t('nameRequired'));
      return;
    }
    if (!trimmedPhone) {
      setErrorMessage(t('phoneRequired'));
      return;
    }
    if (!staff && (!password || password.length < 6)) {
      setErrorMessage(t('passwordMinLength'));
      return;
    }
    if (staff && password && password.length < 6) {
      setErrorMessage(t('passwordMinLength'));
      return;
    }

    try {
      setIsSubmitting(true);
      if (staff) {
        await updateStaff(staff.id, {
          name: trimmedName,
          role,
          status,
          ...(password ? { password } : {})
        });
        toast.success(t('staffUpdated'));
      } else {
        await createStaff({
          name: trimmedName,
          phone: trimmedPhone,
          role,
          password
        });
        toast.success(t('staffCreated'));
      }
      await queryClient.invalidateQueries({ queryKey: staffKeys.all });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('errorSaving');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader className='text-start'>
            <DialogTitle>{staff ? t('editStaffTitle') : t('addStaffTitle')}</DialogTitle>
            <DialogDescription>{staff ? t('editStaffDesc') : t('addStaffDesc')}</DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className='my-3 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2'>
              <Icons.warning className='h-4 w-4 shrink-0' />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className='grid gap-4 py-4'>
            <div className='grid gap-1.5 text-start'>
              <Label htmlFor='staff-name'>{t('nameLabel')}</Label>
              <Input
                id='staff-name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className='grid gap-1.5 text-start'>
              <Label htmlFor='staff-phone'>{t('phoneLabel')}</Label>
              <Input
                id='staff-phone'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='03001234567'
                disabled={isSubmitting || !!staff}
                required
              />
              {staff && (
                <span className='text-[11px] text-muted-foreground'>{t('phoneCannotChange')}</span>
              )}
            </div>

            <div className='grid gap-1.5 text-start'>
              <Label htmlFor='staff-role'>{t('roleLabel')}</Label>
              <Select
                value={role}
                onValueChange={(val) => setRole(val as 'MANAGER' | 'SALESMAN')}
                disabled={isSubmitting}
              >
                <SelectTrigger id='staff-role'>
                  <SelectValue placeholder={t('selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='SALESMAN'>
                    <div className='flex flex-col text-start'>
                      <span className='font-medium'>{t('roleSalesman')}</span>
                      <span className='text-[11px] text-muted-foreground'>
                        {t('roleSalesmanDesc')}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value='MANAGER'>
                    <div className='flex flex-col text-start'>
                      <span className='font-medium'>{t('roleManager')}</span>
                      <span className='text-[11px] text-muted-foreground'>
                        {t('roleManagerDesc')}
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {staff && (
              <div className='grid gap-1.5 text-start'>
                <Label htmlFor='staff-status'>{t('statusLabel')}</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as UserStatus)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id='staff-status'>
                    <SelectValue placeholder={t('selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ACTIVE'>{t('statusActive')}</SelectItem>
                    <SelectItem value='SUSPENDED'>{t('statusSuspended')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className='grid gap-1.5 text-start'>
              <Label htmlFor='staff-password'>
                {staff ? t('passwordOptional') : t('passwordLabel')}
              </Label>
              <Input
                id='staff-password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={staff ? t('leaveBlankToKeep') : t('minChars')}
                disabled={isSubmitting}
                required={!staff}
              />
            </div>
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting && <Icons.spinner className='me-2 h-4 w-4 animate-spin' />}
              {staff ? t('saveChanges') : t('createStaffButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
