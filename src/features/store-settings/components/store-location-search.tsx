'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { cn } from '@/lib/utils';
import { INPUT_LIMITS, clampText } from '@/lib/input-limits';
import {
  cityFromPlaceComponents,
  loadGoogleMapsPlaces
} from '@/lib/google-maps-loader';
import { useT } from '@/i18n/use-t';
import type { StoreLocationSearchProps } from '@/types/store-settings';

export function StoreLocationSearch({
  value,
  onChange,
  onCitySuggest,
  disabled,
  error
}: StoreLocationSearchProps) {
  const t = useT();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const onChangeRef = useRef(onChange);
  const onCitySuggestRef = useRef(onCitySuggest);
  const [bootError, setBootError] = useState('');
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState(value.placeLabel ?? '');

  useEffect(() => {
    onChangeRef.current = onChange;
    onCitySuggestRef.current = onCitySuggest;
  }, [onChange, onCitySuggest]);

  useEffect(() => {
    if (value.placeLabel) setQuery(value.placeLabel);
  }, [value.placeLabel]);

  useEffect(() => {
    let cancelled = false;
    let listenerAttached = false;

    loadGoogleMapsPlaces()
      .then((google) => {
        if (cancelled || !inputRef.current) return;

        const bounds = new google.maps.LatLngBounds(
          { lat: 23.6, lng: 60.9 },
          { lat: 37.1, lng: 77.8 }
        );

        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'pk' },
          fields: ['formatted_address', 'geometry', 'address_components', 'name'],
          bounds,
          strictBounds: false
        });

        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const loc = place.geometry?.location;
          if (!loc) {
            setBootError(t('storeSettings.locationPickRequired'));
            return;
          }
          const lat = loc.lat();
          const lng = loc.lng();
          const placeLabel =
            place.name?.trim() ||
            place.formatted_address?.trim() ||
            `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          const city = cityFromPlaceComponents(place.address_components);
          const label = clampText(placeLabel, INPUT_LIMITS.address);
          setBootError('');
          setQuery(label);
          onChangeRef.current({
            placeLabel: label,
            latitude: lat,
            longitude: lng
          });
          if (city) onCitySuggestRef.current?.(clampText(city, INPUT_LIMITS.city));
        });

        autocompleteRef.current = ac;
        listenerAttached = true;
        setReady(true);
        setBootError('');
      })
      .catch(() => {
        if (!cancelled) {
          setBootError(t('storeSettings.locationMapsUnavailable'));
          setReady(false);
        }
      });

    return () => {
      cancelled = true;
      if (listenerAttached && autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
  }, [t]);

  const hasPin =
    value.latitude != null &&
    value.longitude != null &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude);

  const pinLat = hasPin ? value.latitude : null;
  const pinLng = hasPin ? value.longitude : null;

  const handleClear = () => {
    setQuery('');
    onChange({ placeLabel: null, latitude: null, longitude: null });
    setBootError('');
  };

  const handleQueryChange = (next: string) => {
    const clipped = clampText(next, INPUT_LIMITS.address);
    setQuery(clipped);
    if (hasPin || value.placeLabel) {
      onChange({ placeLabel: null, latitude: null, longitude: null });
    }
  };

  const showError = error || bootError;

  return (
    <div className='space-y-2'>
      <Label htmlFor={inputId}>{t('storeSettings.location')}</Label>
      <div className='flex gap-2'>
        <Input
          id={inputId}
          ref={inputRef}
          value={query}
          disabled={disabled || !ready}
          placeholder={t('storeSettings.locationPlaceholder')}
          maxLength={INPUT_LIMITS.address}
          autoComplete='off'
          className={cn(showError && 'border-destructive')}
          aria-invalid={!!showError}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
        {hasPin || query ? (
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='shrink-0'
            disabled={disabled}
            onClick={handleClear}
            aria-label={t('storeSettings.locationClear')}
          >
            <Icons.close className='h-4 w-4' />
          </Button>
        ) : null}
      </div>
      <p className='text-xs text-muted-foreground'>{t('storeSettings.locationHint')}</p>
      {hasPin && pinLat != null && pinLng != null ? (
        <p className='flex items-start gap-1.5 text-xs text-foreground/80'>
          <Icons.mapPin className='mt-0.5 h-3.5 w-3.5 shrink-0 text-primary' />
          <span className='min-w-0 break-words'>
            {value.placeLabel || t('storeSettings.locationPinned')}
            <span className='mt-0.5 block font-mono text-[11px] text-muted-foreground' dir='ltr'>
              {pinLat.toFixed(6)}, {pinLng.toFixed(6)}
            </span>
          </span>
        </p>
      ) : null}
      <DialogFieldError id={`${inputId}-error`} message={showError} />
    </div>
  );
}
