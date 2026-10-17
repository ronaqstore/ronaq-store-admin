'use client';

import { useEffect, useState, type FormEvent } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { useT } from '@/i18n/use-t';
import type {
  EditStoreProfileDialogBodyProps,
  EditStoreProfileDialogProps
} from '@/types/store-settings';
import { useUpdateStoreSettings } from '../api/mutations';

export function EditStoreProfileDialog({
  open,
  onOpenChange,
  settings
}: EditStoreProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <EditStoreProfileDialogBody settings={settings} onOpenChange={onOpenChange} />
      ) : null}
    </Dialog>
  );
}

function EditStoreProfileDialogBody({
  settings,
  onOpenChange
}: EditStoreProfileDialogBodyProps) {
  const t = useT();
  const updateMutation = useUpdateStoreSettings();

  const [displayName, setDisplayName] = useState(settings.displayName ?? '');
  const [about, setAbout] = useState(settings.about ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber ?? '');
  const [phoneNumber, setPhoneNumber] = useState(settings.phoneNumber ?? '');
  const [address, setAddress] = useState(settings.address ?? '');
  const [city, setCity] = useState(settings.city ?? '');
  const [openingHours, setOpeningHours] = useState(settings.openingHours ?? '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(settings.googleMapsUrl ?? '');

  useEffect(() => {
    setDisplayName(settings.displayName ?? '');
    setAbout(settings.about ?? '');
    setWhatsappNumber(settings.whatsappNumber ?? '');
    setPhoneNumber(settings.phoneNumber ?? '');
    setAddress(settings.address ?? '');
    setCity(settings.city ?? '');
    setOpeningHours(settings.openingHours ?? '');
    setGoogleMapsUrl(settings.googleMapsUrl ?? '');
  }, [settings]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    updateMutation.mutate(
      {
        displayName: displayName.trim(),
        about: about.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        openingHours: openingHours.trim() || null,
        googleMapsUrl: googleMapsUrl.trim() || null
      },
      {
        onSuccess: () => onOpenChange(false)
      }
    );
  };

  const busy = updateMutation.isPending;

  return (
    <DialogContent className='max-h-[92vh] w-full overflow-y-auto sm:max-w-lg'>
      <DialogHeader>
        <DialogTitle>{t('storeSettings.editProfileTitle')}</DialogTitle>
        <DialogDescription>{t('storeSettings.editProfileDescription')}</DialogDescription>
      </DialogHeader>

      <form className='space-y-4 pt-2' onSubmit={handleSubmit}>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2 sm:col-span-2'>
            <Label htmlFor='edit-displayName'>{t('storeSettings.displayName')}</Label>
            <Input
              id='edit-displayName'
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit-city'>{t('storeSettings.city')}</Label>
            <Input id='edit-city' value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit-hours'>{t('storeSettings.openingHours')}</Label>
            <Input
              id='edit-hours'
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='edit-about'>{t('storeSettings.about')}</Label>
          <Textarea
            id='edit-about'
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={3}
          />
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='edit-whatsapp'>{t('storeSettings.whatsapp')}</Label>
            <Input
              id='edit-whatsapp'
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder='923001234567'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit-phone'>{t('storeSettings.phone')}</Label>
            <Input
              id='edit-phone'
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder='0300-1234567'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='edit-address'>{t('storeSettings.address')}</Label>
          <Input
            id='edit-address'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='edit-maps'>{t('storeSettings.googleMaps')}</Label>
          <Input
            id='edit-maps'
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            placeholder={t('storeSettings.googleMapsPlaceholder')}
          />
        </div>

        <DialogFooter>
          <DialogCancelButton onClick={() => onOpenChange(false)} disabled={busy} />
          <DialogPrimaryButton
            mode='save'
            loading={busy}
            disabled={busy || !displayName.trim()}
          />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
