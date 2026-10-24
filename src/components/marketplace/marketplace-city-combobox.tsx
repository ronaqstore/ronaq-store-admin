'use client';

import { InfiniteEntitySelect } from '@/components/forms/infinite-entity-select';
import { fetchMarketplaceHubsPage } from '@/features/marketplace/api/service';
import { useT } from '@/i18n/use-t';
import type { MarketplaceCityComboboxProps, MarketplaceCityOption } from '@/types/marketplace';

export function MarketplaceCityCombobox({
  id,
  value,
  onChange,
  required,
  disabled,
  className
}: MarketplaceCityComboboxProps) {
  const t = useT();

  return (
    <>
      <InfiniteEntitySelect<MarketplaceCityOption>
        value={value}
        onValueChange={(next) => onChange(next)}
        queryKey={['marketplace-hubs']}
        fetchPage={fetchMarketplaceHubsPage}
        placeholder={t('auth.cityPlaceholder')}
        searchPlaceholder={t('auth.citySearch')}
        emptyMessage={t('auth.cityEmpty')}
        selectedLabel={value || undefined}
        activeOnly={false}
        disabled={disabled}
        className={className}
      />
      {required ? (
        <input
          id={id}
          className='sr-only'
          value={value}
          required
          readOnly
          tabIndex={-1}
        />
      ) : id ? (
        <input id={id} className='sr-only' value={value} readOnly tabIndex={-1} />
      ) : null}
    </>
  );
}
