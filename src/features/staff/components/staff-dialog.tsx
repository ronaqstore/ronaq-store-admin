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
import { cn } from '@/lib/utils';
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
      setRole(staff.role === 'OWNER' ? 'MANAGER' : staff.role);
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
      <DialogContent className='sm:max-w-[460px]'>
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
                <SelectTrigger id='staff-role' className='h-10 w-full justify-between'>
                  <SelectValue placeholder={t('selectRole')}>
                    {role === 'SALESMAN' ? (
                      <span className='flex items-center gap-2'>
                        <Icons.lock className='h-3.5 w-3.5 text-amber-500 shrink-0' />
                        <span className='font-medium text-foreground'>{t('roleSalesman')}</span>
                      </span>
                    ) : role === 'MANAGER' ? (
                      <span className='flex items-center gap-2'>
                        <Icons.check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                        <span className='font-medium text-foreground'>{t('roleManager')}</span>
                      </span>
                    ) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className='w-(--anchor-width) min-w-[320px]'>
                  <SelectItem value='SALESMAN' className='py-2.5 pe-8 cursor-pointer'>
                    <div className='flex flex-col text-start gap-1 whitespace-normal'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <Icons.lock className='h-3.5 w-3.5 text-amber-500 shrink-0' />
                        <span className='font-medium text-foreground'>{t('roleSalesman')}</span>
                        <span className='rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-medium'>
                          {t('salesmanRestrictedTag')}
                        </span>
                      </div>
                      <span className='text-xs text-muted-foreground leading-normal ps-5'>
                        {t('roleSalesmanDesc')}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value='MANAGER' className='py-2.5 pe-8 cursor-pointer'>
                    <div className='flex flex-col text-start gap-1 whitespace-normal'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <Icons.check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                        <span className='font-medium text-foreground'>{t('roleManager')}</span>
                        <span className='rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-medium'>
                          {t('managerStandardTag')}
                        </span>
                      </div>
                      <span className='text-xs text-muted-foreground leading-normal ps-5'>
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
                  <SelectTrigger id='staff-status' className='h-10 w-full justify-between'>
                    <SelectValue placeholder={t('selectStatus')}>
                      <span className='flex items-center gap-2'>
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full shrink-0',
                            status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                          )}
                        />
                        <span className='font-medium text-foreground'>
                          {status === 'ACTIVE' ? t('statusActive') : t('statusSuspended')}
                        </span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className='w-(--anchor-width) min-w-[200px]'>
                    <SelectItem value='ACTIVE' className='py-2.5 pe-8 cursor-pointer'>
                      <div className='flex items-center gap-2'>
                        <span className='h-2 w-2 rounded-full bg-emerald-500 shrink-0' />
                        <span className='font-medium text-foreground'>{t('statusActive')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='SUSPENDED' className='py-2.5 pe-8 cursor-pointer'>
                      <div className='flex items-center gap-2'>
                        <span className='h-2 w-2 rounded-full bg-amber-500 shrink-0' />
                        <span className='font-medium text-foreground'>{t('statusSuspended')}</span>
                      </div>
                    </SelectItem>
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
