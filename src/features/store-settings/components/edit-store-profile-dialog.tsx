'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DialogCancelButton, DialogPrimaryButton } from '@/components/common/dialog-actions';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { cn } from '@/lib/utils';
import { INPUT_LIMITS, clampText } from '@/lib/input-limits';
import {
  OPENING_HOUR_TIME_OPTIONS,
  composeOpeningHours,
  formatTimeOptionLabel,
  isClosingAfterOpening,
  parseOpeningHours
} from '@/lib/opening-hours';
import { useT } from '@/i18n/use-t';
import { formatPkMobileLocal, isValidPkMobile } from '@/lib/auth/phone';
import { ApiError } from '@/lib/api/types';
import type {
  EditStoreProfileDialogBodyProps,
  EditStoreProfileDialogProps,
  StoreLocationValue
} from '@/types/store-settings';
import { googleMapsSearchUrl } from '@/constants/api';
import { useUpdateStoreSettings } from '../api/mutations';
import { StoreLocationSearch } from './store-location-search';

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

  const initialHours = parseOpeningHours(settings.openingHours);

  const [displayName, setDisplayName] = useState(settings.displayName ?? '');
  const [about, setAbout] = useState(settings.about ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(
    formatPkMobileLocal(settings.whatsappNumber)
  );
  const [phoneNumber, setPhoneNumber] = useState(formatPkMobileLocal(settings.phoneNumber));
  const [city, setCity] = useState(settings.city ?? '');
  const [address, setAddress] = useState(settings.address ?? '');
  const [location, setLocation] = useState<StoreLocationValue>(() => ({
    placeLabel: null,
    latitude: settings.latitude ?? null,
    longitude: settings.longitude ?? null
  }));
  const [opensAt, setOpensAt] = useState(initialHours?.opens ?? '');
  const [closesAt, setClosesAt] = useState(initialHours?.closes ?? '');
  const [displayNameError, setDisplayNameError] = useState('');
  const [hoursError, setHoursError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [whatsappError, setWhatsappError] = useState('');
  const [locationError, setLocationError] = useState('');

  const timeItems = useMemo(
    () =>
      OPENING_HOUR_TIME_OPTIONS.map((value) => ({
        value,
        label: formatTimeOptionLabel(value)
      })),
    []
  );

  useEffect(() => {
    const parsed = parseOpeningHours(settings.openingHours);
    setDisplayName(settings.displayName ?? '');
    setAbout(settings.about ?? '');
    setWhatsappNumber(formatPkMobileLocal(settings.whatsappNumber));
    setPhoneNumber(formatPkMobileLocal(settings.phoneNumber));
    setCity(settings.city ?? '');
    setAddress(settings.address ?? '');
    setLocation({
      placeLabel: null,
      latitude: settings.latitude ?? null,
      longitude: settings.longitude ?? null
    });
    setOpensAt(parsed?.opens ?? '');
    setClosesAt(parsed?.closes ?? '');
    setHoursError('');
    setPhoneError('');
    setWhatsappError('');
    setLocationError('');
  }, [settings]);

  const handleOpensAtChange = (val: string | null) => {
    setOpensAt(val ?? '');
    setHoursError('');
  };

  const handleClosesAtChange = (val: string | null) => {
    setClosesAt(val ?? '');
    setHoursError('');
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setDisplayNameError(t('validation.nameRequired'));
      return;
    }
    setDisplayNameError('');

    if ((opensAt && !closesAt) || (!opensAt && closesAt)) {
      setHoursError(t('storeSettings.openingHoursBothRequired'));
      return;
    }
    if (opensAt && closesAt && !isClosingAfterOpening(opensAt, closesAt)) {
      setHoursError(t('storeSettings.openingHoursInvalidRange'));
      return;
    }
    setHoursError('');

    const phoneTrimmed = phoneNumber.trim();
    const whatsappTrimmed = whatsappNumber.trim();
    if (phoneTrimmed && !isValidPkMobile(phoneTrimmed)) {
      setPhoneError(t('validation.phoneInvalidPk'));
      return;
    }
    if (whatsappTrimmed && !isValidPkMobile(whatsappTrimmed)) {
      setWhatsappError(t('validation.phoneInvalidPk'));
      return;
    }
    setPhoneError('');
    setWhatsappError('');
    setLocationError('');

    const hasCoords =
      location.latitude != null &&
      location.longitude != null &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude);

    updateMutation.mutate(
      {
        displayName: displayName.trim(),
        about: about.trim() || null,
        whatsappNumber: whatsappTrimmed || null,
        phoneNumber: phoneTrimmed || null,
        address: address.trim() || null,
        city: city.trim() || null,
        latitude: hasCoords ? location.latitude : null,
        longitude: hasCoords ? location.longitude : null,
        googleMapsUrl:
          hasCoords && location.latitude != null && location.longitude != null
            ? googleMapsSearchUrl(location.latitude, location.longitude)
            : null,
        openingHours: composeOpeningHours(opensAt, closesAt)
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          if (!(error instanceof ApiError)) return;
          const code = error.details?.code;
          const raw = Array.isArray(error.details?.message)
            ? error.details.message.join(' ')
            : error.message;
          const lower = raw.toLowerCase();
          const taken =
            code === 'PHONE_ALREADY_TAKEN' ||
            lower.includes('already in use') ||
            lower.includes('already used');
          const invalid =
            lower.includes('pakistani mobile') || lower.includes('not a valid phone');
          const msg = taken
            ? t('validation.phoneAlreadyTaken')
            : invalid
              ? t('validation.phoneInvalidPk')
              : null;
          if (!msg) return;
          const digits = raw.replace(/\D/g, '');
          const phoneDigits = phoneTrimmed.replace(/\D/g, '');
          const waDigits = whatsappTrimmed.replace(/\D/g, '');
          const hitPhone =
            !!phoneDigits &&
            (digits.includes(phoneDigits) || digits.includes(phoneDigits.replace(/^0/, '92')));
          const hitWa =
            !!waDigits &&
            (digits.includes(waDigits) || digits.includes(waDigits.replace(/^0/, '92')));
          if (hitPhone && !hitWa) setPhoneError(msg);
          else if (hitWa && !hitPhone) setWhatsappError(msg);
          else if (hitPhone && hitWa) {
            setPhoneError(msg);
            setWhatsappError(msg);
          } else {
            setPhoneError(msg);
          }
        }
      }
    );
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(clampText(e.target.value, INPUT_LIMITS.name));
    setDisplayNameError('');
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCity(clampText(e.target.value, INPUT_LIMITS.city));
  };

  const handleAboutChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAbout(clampText(e.target.value, INPUT_LIMITS.about));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(clampText(e.target.value, INPUT_LIMITS.address));
  };

  const handleLocationChange = (next: StoreLocationValue) => {
    setLocation(next);
    setLocationError('');
  };

  const handleLocationCitySuggest = (suggested: string) => {
    if (!city.trim()) setCity(suggested);
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappNumber(clampText(e.target.value, INPUT_LIMITS.phone));
    setWhatsappError('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(clampText(e.target.value, INPUT_LIMITS.phoneLoose));
    setPhoneError('');
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
              onChange={handleDisplayNameChange}
              maxLength={INPUT_LIMITS.name}
              className={cn(displayNameError && 'border-destructive')}
              aria-invalid={!!displayNameError}
              required
            />
            <DialogFieldError id='edit-displayName-error' message={displayNameError} />
          </div>
          <div className='space-y-2 sm:col-span-2'>
            <Label htmlFor='edit-city'>{t('storeSettings.city')}</Label>
            <Input
              id='edit-city'
              value={city}
              onChange={handleCityChange}
              maxLength={INPUT_LIMITS.city}
            />
          </div>
          <div className='space-y-2 sm:col-span-2'>
            <Label>{t('storeSettings.openingHours')}</Label>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='edit-opens-at'
                  className='text-xs font-normal text-muted-foreground'
                >
                  {t('storeSettings.opensAt')}
                </Label>
                <Select
                  value={opensAt || null}
                  onValueChange={handleOpensAtChange}
                  items={timeItems}
                >
                  <SelectTrigger
                    id='edit-opens-at'
                    className={cn(
                      'h-9 w-full justify-between text-sm font-normal',
                      hoursError && 'border-destructive'
                    )}
                  >
                    <SelectValue placeholder={t('storeSettings.selectTime')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {OPENING_HOUR_TIME_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value} className='text-sm'>
                          {formatTimeOptionLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='edit-closes-at'
                  className='text-xs font-normal text-muted-foreground'
                >
                  {t('storeSettings.closesAt')}
                </Label>
                <Select
                  value={closesAt || null}
                  onValueChange={handleClosesAtChange}
                  items={timeItems}
                >
                  <SelectTrigger
                    id='edit-closes-at'
                    className={cn(
                      'h-9 w-full justify-between text-sm font-normal',
                      hoursError && 'border-destructive'
                    )}
                  >
                    <SelectValue placeholder={t('storeSettings.selectTime')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {OPENING_HOUR_TIME_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value} className='text-sm'>
                          {formatTimeOptionLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFieldError id='edit-hours-error' message={hoursError} />
          </div>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='edit-whatsapp'>{t('storeSettings.whatsapp')}</Label>
            <Input
              id='edit-whatsapp'
              value={whatsappNumber}
              onChange={handleWhatsappChange}
              maxLength={INPUT_LIMITS.phone}
              placeholder='03001234567'
              className={cn(whatsappError && 'border-destructive')}
              aria-invalid={!!whatsappError}
            />
            <DialogFieldError id='edit-whatsapp-error' message={whatsappError} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit-phone'>{t('storeSettings.phone')}</Label>
            <Input
              id='edit-phone'
              value={phoneNumber}
              onChange={handlePhoneChange}
              maxLength={INPUT_LIMITS.phoneLoose}
              placeholder='03001234567'
              className={cn(phoneError && 'border-destructive')}
              aria-invalid={!!phoneError}
            />
            <DialogFieldError id='edit-phone-error' message={phoneError} />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='edit-address'>{t('storeSettings.address')}</Label>
          <Input
            id='edit-address'
            value={address}
            onChange={handleAddressChange}
            maxLength={INPUT_LIMITS.address}
            placeholder={t('storeSettings.addressPlaceholder')}
          />
          <p className='text-xs text-muted-foreground'>{t('storeSettings.addressHint')}</p>
        </div>

        <StoreLocationSearch
          value={location}
          disabled={busy}
          error={locationError}
          onChange={handleLocationChange}
          onCitySuggest={handleLocationCitySuggest}
        />

        <div className='space-y-2'>
          <Label htmlFor='edit-about'>{t('storeSettings.about')}</Label>
          <Textarea
            id='edit-about'
            value={about}
            onChange={handleAboutChange}
            maxLength={INPUT_LIMITS.about}
            rows={3}
          />
        </div>

        <DialogFooter>
          <DialogCancelButton onClick={() => onOpenChange(false)} disabled={busy} />
          <DialogPrimaryButton mode='save' loading={busy} disabled={busy} />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
