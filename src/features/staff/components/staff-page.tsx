'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatIsoDate } from '@/lib/dates';
import { staffListQueryOptions, staffKeys } from '../api/queries';
import { deleteStaff, updateStaff } from '../api/service';
import { getRoleBadgeVariant, getRoleLabel, getStatusBadgeVariant } from '../helpers/staff-helpers';
import { StaffDialog } from './staff-dialog';
import type { StaffUserDto } from '@/lib/api/types';

export function StaffPage() {
  const t = useTranslations('staff');
  const queryClient = useQueryClient();

  const { data: staffList = [], isLoading, error } = useQuery(staffListQueryOptions());

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedStaff, setSelectedStaff] = React.useState<StaffUserDto | null>(null);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  const handleAddClick = () => {
    setSelectedStaff(null);
    setDialogOpen(true);
  };

  const handleEditClick = (staff: StaffUserDto) => {
    setSelectedStaff(staff);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (staff: StaffUserDto) => {
    const newStatus = staff.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      setActionLoadingId(staff.id);
      if (newStatus === 'SUSPENDED') {
        await deleteStaff(staff.id);
        toast.success(t('staffSuspended'));
      } else {
        await updateStaff(staff.id, { status: 'ACTIVE' });
        toast.success(t('staffActivated'));
      }
      await queryClient.invalidateQueries({ queryKey: staffKeys.all });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('actionFailed');
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className='space-y-6'>
      <Card className='border-sky-500/30 bg-sky-500/5 shadow-none'>
        <CardContent className='p-4 flex items-start gap-3'>
          <Icons.info className='h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5' />
          <div className='text-xs space-y-1 text-foreground'>
            <p className='font-semibold text-sm'>{t('rbacExplainerTitle')}</p>
            <p className='text-muted-foreground leading-relaxed'>
              <span className='font-medium text-foreground'>{t('roleSalesman')}:</span>{' '}
              {t('salesmanPermissionsText')}
            </p>
            <p className='text-muted-foreground leading-relaxed'>
              <span className='font-medium text-foreground'>{t('roleManager')}:</span>{' '}
              {t('managerPermissionsText')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className='shadow-none border-border/70'>
        <CardHeader className='pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0'>
          <div>
            <CardTitle className='text-base font-semibold'>{t('staffListTitle')}</CardTitle>
            <CardDescription>{t('staffListDesc')}</CardDescription>
          </div>
          <Button
            type='button'
            onClick={handleAddClick}
            size='sm'
            className='gap-1.5 shrink-0 self-start sm:self-auto'
          >
            <Icons.add className='h-4 w-4' />
            <span>{t('addStaffButton')}</span>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Icons.spinner className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : error ? (
            <div className='py-8 text-center text-destructive text-sm'>{t('loadError')}</div>
          ) : staffList.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center space-y-3'>
              <div className='p-3 rounded-full bg-muted text-muted-foreground'>
                <Icons.teams className='h-6 w-6' />
              </div>
              <p className='font-semibold text-foreground'>{t('noStaffTitle')}</p>
              <p className='text-xs text-muted-foreground max-w-sm'>{t('noStaffDesc')}</p>
              <Button type='button' variant='outline' onClick={handleAddClick}>
                <Icons.add className='me-2 h-4 w-4' />
                {t('addStaffButton')}
              </Button>
            </div>
          ) : (
            <div className='rounded-md border border-border/60 overflow-x-auto'>
              <Table className='min-w-[650px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-start'>{t('name')}</TableHead>
                    <TableHead className='text-start'>{t('phone')}</TableHead>
                    <TableHead className='text-start'>{t('role')}</TableHead>
                    <TableHead className='text-start'>{t('permissionsSummary')}</TableHead>
                    <TableHead className='text-start'>{t('status')}</TableHead>
                    <TableHead className='text-start'>{t('dateJoined')}</TableHead>
                    <TableHead className='text-end'>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className='font-medium text-foreground text-start'>
                        {staff.name}
                      </TableCell>
                      <TableCell className='font-mono text-xs text-muted-foreground text-start'>
                        {staff.phone}
                      </TableCell>
                      <TableCell className='text-start'>
                        <Badge variant={getRoleBadgeVariant(staff.role)}>
                          {getRoleLabel(staff.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-xs text-muted-foreground text-start'>
                        {staff.role === 'SALESMAN' ? (
                          <span className='inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium'>
                            <Icons.lock className='h-3.5 w-3.5' />
                            {t('salesmanRestrictedTag')}
                          </span>
                        ) : (
                          <span className='inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium'>
                            <Icons.check className='h-3.5 w-3.5' />
                            {t('managerStandardTag')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='text-start'>
                        <Badge variant={getStatusBadgeVariant(staff.status)}>
                          {staff.status === 'ACTIVE' ? t('statusActive') : t('statusSuspended')}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-xs text-muted-foreground text-start'>
                        {formatIsoDate(staff.createdAt)}
                      </TableCell>
                      <TableCell className='text-end'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEditClick(staff)}
                            disabled={actionLoadingId === staff.id}
                          >
                            <Icons.userPen className='h-3.5 w-3.5 me-1' />
                            {t('edit')}
                          </Button>
                          <Button
                            type='button'
                            variant={staff.status === 'ACTIVE' ? 'outline' : 'secondary'}
                            size='sm'
                            onClick={() => handleToggleStatus(staff)}
                            disabled={actionLoadingId === staff.id}
                          >
                            {actionLoadingId === staff.id ? (
                              <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
                            ) : staff.status === 'ACTIVE' ? (
                              t('suspend')
                            ) : (
                              t('activate')
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <StaffDialog open={dialogOpen} onOpenChange={setDialogOpen} staff={selectedStaff} />
    </div>
  );
}
