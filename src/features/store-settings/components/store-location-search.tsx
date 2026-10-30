'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Icons } from '@/components/icons';
import { DialogFieldError } from '@/components/forms/dialog-field-error';
import { cn } from '@/lib/utils';
import { INPUT_LIMITS, clampText } from '@/lib/input-limits';
import {
  geocodeAddress,
  getGoogleMapsApiKey,
  reverseGeocode,
  type GeocodePlace
} from '@/lib/google-geocode';
import { googleMapsSearchUrl } from '@/constants/api';
import { useT } from '@/i18n/use-t';
import type { StoreLocationSearchProps } from '@/types/store-settings';

const COORDS_LABEL_RE = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
const SEARCH_DEBOUNCE_MS = 350;

function needsPlaceName(label: string | null | undefined): boolean {
  const trimmed = label?.trim() ?? '';
  return !trimmed || COORDS_LABEL_RE.test(trimmed);
}

export function StoreLocationSearch({
  value,
  onChange,
  onCitySuggest,
  disabled,
  error
}: StoreLocationSearchProps) {
  const t = useT();
  const inputId = useId();
  const listId = useId();
  const onChangeRef = useRef(onChange);
  const onCitySuggestRef = useRef(onCitySuggest);
  const [bootError, setBootError] = useState('');
  const [ready, setReady] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState(value.placeLabel ?? '');
  const [predictions, setPredictions] = useState<GeocodePlace[]>([]);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
    onCitySuggestRef.current = onCitySuggest;
  }, [onChange, onCitySuggest]);

  useEffect(() => {
    if (value.placeLabel && !needsPlaceName(value.placeLabel)) {
      setQuery(value.placeLabel);
    }
  }, [value.placeLabel]);

  useEffect(() => {
    if (getGoogleMapsApiKey()) {
      setReady(true);
      setBootError('');
      return;
    }
    setReady(false);
    setBootError(t('storeSettings.locationMapsUnavailable'));
  }, [t]);

  useEffect(() => {
    const lat = value.latitude;
    const lng = value.longitude;
    if (
      lat == null ||
      lng == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      !needsPlaceName(value.placeLabel) ||
      !ready
    ) {
      return;
    }

    let cancelled = false;
    setResolving(true);
    reverseGeocode(lat, lng)
      .then((places) => {
        if (cancelled) return;
        setResolving(false);
        const place = places[0];
        if (!place) return;
        const label = clampText(place.label, INPUT_LIMITS.address);
        setQuery(label);
        onChangeRef.current({
          placeLabel: label,
          latitude: lat,
          longitude: lng,
          typedWithoutPin: false
        });
        if (place.city) onCitySuggestRef.current?.(clampText(place.city, INPUT_LIMITS.city));
      })
      .catch(() => {
        if (!cancelled) setResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, value.latitude, value.longitude, value.placeLabel]);

  useEffect(() => {
    if (!ready) return;

    const trimmed = query.trim();
    const hasPin =
      value.latitude != null &&
      value.longitude != null &&
      Number.isFinite(value.latitude) &&
      Number.isFinite(value.longitude);

    if (!trimmed || (hasPin && value.placeLabel === trimmed)) {
      setPredictions([]);
      setSearching(false);
      setListOpen(false);
      return;
    }

    if (!value.typedWithoutPin && hasPin) {
      setPredictions([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      geocodeAddress(trimmed)
        .then((places) => {
          if (cancelled) return;
          setSearching(false);
          setBootError('');
          setPredictions(places);
          setListOpen(trimmed.length > 0);
        })
        .catch(() => {
          if (cancelled) return;
          setSearching(false);
          setPredictions([]);
          setListOpen(false);
          setBootError(t('storeSettings.locationMapsUnavailable'));
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, ready, value.latitude, value.longitude, value.placeLabel, value.typedWithoutPin, t]);

  const hasPin =
    value.latitude != null &&
    value.longitude != null &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude);

  const pinLat = hasPin ? value.latitude : null;
  const pinLng = hasPin ? value.longitude : null;
  const showLoader = searching || resolving;

  const handleClear = () => {
    setQuery('');
    setPredictions([]);
    setListOpen(false);
    onChange({
      placeLabel: null,
      latitude: null,
      longitude: null,
      typedWithoutPin: false
    });
    if (getGoogleMapsApiKey()) setBootError('');
  };

  const handleQueryChange = (next: string) => {
    const clipped = clampText(next, INPUT_LIMITS.address);
    setQuery(clipped);
    onChange({
      placeLabel: null,
      latitude: null,
      longitude: null,
      typedWithoutPin: clipped.trim().length > 0
    });
  };

  const handlePickPlace = (place: GeocodePlace) => {
    const label = clampText(place.label, INPUT_LIMITS.address);
    setBootError('');
    setListOpen(false);
    setPredictions([]);
    setQuery(label);
    onChange({
      placeLabel: label,
      latitude: place.latitude,
      longitude: place.longitude,
      typedWithoutPin: false
    });
    if (place.city) onCitySuggest?.(clampText(place.city, INPUT_LIMITS.city));
  };

  const showError = error || bootError;

  return (
    <div className='space-y-2'>
      <Label htmlFor={inputId}>{t('storeSettings.location')}</Label>
      <div className='relative flex gap-2'>
        <div className='relative min-w-0 flex-1'>
          <Input
            id={inputId}
            value={query}
            disabled={disabled || !ready}
            placeholder={t('storeSettings.locationPlaceholder')}
            maxLength={INPUT_LIMITS.address}
            autoComplete='off'
            role='combobox'
            aria-expanded={listOpen}
            aria-controls={listId}
            aria-autocomplete='list'
            className={cn('pe-9', showError && 'border-destructive')}
            aria-invalid={!!showError}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (predictions.length > 0) setListOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setListOpen(false), 150);
            }}
          />
          {showLoader ? (
            <span className='pointer-events-none absolute inset-e-2.5 top-1/2 -translate-y-1/2'>
              <Spinner className='size-3.5 text-muted-foreground' />
            </span>
          ) : null}
          {listOpen && (predictions.length > 0 || searching) ? (
            <div
              id={listId}
              className='absolute inset-x-0 top-[calc(100%+0.25rem)] z-[10001] max-h-56 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-md'
            >
              {searching && predictions.length === 0 ? (
                <div className='space-y-1.5 px-2.5 py-2' aria-busy='true'>
                  <Skeleton className='h-8 w-full rounded-md' />
                  <Skeleton className='h-8 w-[92%] rounded-md' />
                  <Skeleton className='h-8 w-[85%] rounded-md' />
                </div>
              ) : null}
              {predictions.map((item) => (
                <button
                  key={item.placeId}
                  type='button'
                  className='flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-2.5 py-2 text-start hover:bg-muted'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePickPlace(item)}
                >
                  <span className='text-sm font-medium text-foreground'>{item.label}</span>
                  {item.city ? (
                    <span className='text-xs text-muted-foreground'>{item.city}</span>
                  ) : null}
                </button>
              ))}
              {!searching && predictions.length === 0 && query.trim() ? (
                <div className='px-2.5 py-2 text-xs text-muted-foreground'>
                  {t('storeSettings.locationNoResults')}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {hasPin && pinLat != null && pinLng != null ? (
          <a
            href={googleMapsSearchUrl(pinLat, pinLng)}
            target='_blank'
            rel='noopener noreferrer'
            className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'shrink-0')}
            aria-label={t('storeSettings.viewMap')}
          >
            <Icons.externalLink className='h-4 w-4' />
          </a>
        ) : null}
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
      <DialogFieldError id={`${inputId}-error`} message={showError} />
    </div>
  );
}
