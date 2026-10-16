'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { shopLogoSrc } from '@/constants/placeholders';
import { formatEmpty } from '@/lib/format-empty';
import { storeSettingsQueryOptions } from '../api/queries';
import {
  useRemoveShopLogo,
  useUpdateStoreSettings,
  useUploadShopLogo
} from '../api/mutations';

export function StoreSettingsForm() {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data } = useSuspenseQuery(storeSettingsQueryOptions());
  const updateMutation = useUpdateStoreSettings();
  const uploadMutation = useUploadShopLogo();
  const removeMutation = useRemoveShopLogo();

  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [showExactStock, setShowExactStock] = useState(false);

  useEffect(() => {
    setDisplayName(data.displayName ?? '');
    setAbout(data.about ?? '');
    setWhatsappNumber(data.whatsappNumber ?? '');
    setPhoneNumber(data.phoneNumber ?? '');
    setAddress(data.address ?? '');
    setCity(data.city ?? '');
    setOpeningHours(data.openingHours ?? '');
    setGoogleMapsUrl(data.googleMapsUrl ?? '');
    setIsEnabled(Boolean(data.isEnabled));
    setShowExactStock(Boolean(data.showExactStock));
  }, [data]);

  const handleSave = () => {
    updateMutation.mutate({
      displayName: displayName.trim(),
      about: about.trim() || null,
      whatsappNumber: whatsappNumber.trim() || null,
      phoneNumber: phoneNumber.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      openingHours: openingHours.trim() || null,
      googleMapsUrl: googleMapsUrl.trim() || null,
      isEnabled,
      showExactStock
    });
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file, {
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handlePickLogo = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    removeMutation.mutate();
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCity(e.target.value);
  };

  const handleAboutChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAbout(e.target.value);
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappNumber(e.target.value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpeningHours(e.target.value);
  };

  const handleMapsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoogleMapsUrl(e.target.value);
  };

  const logoSrc = shopLogoSrc(data.logoUrl);

  return (
    <div className='mx-auto grid max-w-4xl gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('storeSettings.logoTitle')}</CardTitle>
          <CardDescription>{t('storeSettings.logoHint')}</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <div className='relative h-24 w-24 overflow-hidden rounded-2xl border bg-muted'>
            <Image
              src={logoSrc}
              alt={formatEmpty(data.displayName)}
              fill
              unoptimized
              className='object-cover'
            />
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handlePickLogo}
              isLoading={uploadMutation.isPending}
            >
              <Icons.upload className='me-2 h-4 w-4' />
              {data.logoUrl ? t('storeSettings.changeLogo') : t('storeSettings.uploadLogo')}
            </Button>
            {data.logoUrl ? (
              <Button
                type='button'
                variant='ghost'
                onClick={handleRemoveLogo}
                isLoading={removeMutation.isPending}
              >
                {t('storeSettings.removeLogo')}
              </Button>
            ) : null}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp'
              className='hidden'
              onChange={handleLogoSelect}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('storeSettings.profileTitle')}</CardTitle>
          <CardDescription>
            {t('storeSettings.slugLabel')}: {formatEmpty(data.slug)}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='displayName'>{t('storeSettings.displayName')}</Label>
              <Input id='displayName' value={displayName} onChange={handleDisplayNameChange} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='city'>{t('storeSettings.city')}</Label>
              <Input id='city' value={city} onChange={handleCityChange} />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='about'>{t('storeSettings.about')}</Label>
            <Textarea id='about' value={about} onChange={handleAboutChange} rows={3} />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='whatsapp'>{t('storeSettings.whatsapp')}</Label>
              <Input
                id='whatsapp'
                value={whatsappNumber}
                onChange={handleWhatsappChange}
                placeholder='923001234567'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='phone'>{t('storeSettings.phone')}</Label>
              <Input
                id='phone'
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder='0300-1234567'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='address'>{t('storeSettings.address')}</Label>
            <Input id='address' value={address} onChange={handleAddressChange} />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='hours'>{t('storeSettings.openingHours')}</Label>
              <Input id='hours' value={openingHours} onChange={handleHoursChange} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='maps'>{t('storeSettings.googleMaps')}</Label>
              <Input
                id='maps'
                value={googleMapsUrl}
                onChange={handleMapsChange}
                placeholder={t('storeSettings.googleMapsPlaceholder')}
              />
            </div>
          </div>

          <div className='flex flex-col gap-4 rounded-lg border p-4'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm font-medium'>{t('storeSettings.enableStore')}</p>
                <p className='text-xs text-muted-foreground'>{t('storeSettings.enableHint')}</p>
              </div>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-sm font-medium'>{t('storeSettings.showExactStock')}</p>
                <p className='text-xs text-muted-foreground'>
                  {t('storeSettings.showExactStockHint')}
                </p>
              </div>
              <Switch checked={showExactStock} onCheckedChange={setShowExactStock} />
            </div>
          </div>

          <Button
            type='button'
            onClick={handleSave}
            isLoading={updateMutation.isPending}
            disabled={!displayName.trim()}
          >
            {t('storeSettings.save')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
