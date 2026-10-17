import { redirect } from 'next/navigation';
import type { LocaleParamsPageProps } from '@/types';

export default async function PlatformSubscriptionsPage({ params }: LocaleParamsPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/platform/shops`);
}
