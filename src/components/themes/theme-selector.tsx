'use client';

import { useThemeConfig } from '@/components/themes/active-theme';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { Icons } from '../icons';
import { Kbd } from '@/components/ui/kbd';
import { THEMES } from './theme.config';
import { translateMaybe, useT } from '@/i18n/use-t';

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const t = useT();

  return (
    <div className='flex items-center gap-2'>
      <Label htmlFor='theme-selector' className='sr-only'>
        {t('appearance.theme')}
      </Label>
      <Select
        items={THEMES.map((theme) => ({
          value: theme.value,
          label: translateMaybe(`appearance.themeNames.${theme.value}`, t)
        }))}
        value={activeTheme}
        onValueChange={(value) => {
          if (value !== null) setActiveTheme(value);
        }}
      >
        <SelectTrigger
          id='theme-selector'
          className='h-8 gap-1.5 px-2 text-xs justify-start *:data-[slot=select-value]:max-w-[90px] sm:*:data-[slot=select-value]:w-32'
        >
          <span className='text-muted-foreground'>
            <Icons.palette className='size-3.5 shrink-0' />
          </span>
          <SelectValue placeholder={t('appearance.selectTheme')} />
          <Kbd className='hidden md:inline-flex'>T</Kbd>
          <Kbd className='hidden md:inline-flex'>T</Kbd>
        </SelectTrigger>
        <SelectContent align='end' className='min-w-[140px]'>
          {THEMES.length > 0 && (
            <>
              <SelectGroup>
                <SelectLabel>{t('appearance.themes')}</SelectLabel>
                {THEMES.map((theme) => (
                  <SelectItem key={theme.name} value={theme.value}>
                    {translateMaybe(`appearance.themeNames.${theme.value}`, t)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
