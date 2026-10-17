import { redirect } from 'next/navigation';

export default async function PlatformSubscriptionsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/platform/shops`);
}
