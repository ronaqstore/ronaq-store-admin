import PageContainer from '@/components/layout/page-container';
import { PurchaseCreatePageClient } from '@/features/purchases/components/purchase-create-page';
import { auth } from '@/auth';
import { localize } from '@/lib/auth/routes';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('metadata');
  return {
    title: t('purchaseNew')
  };
}

export default async function Page() {
  const session = await auth();
  if (session?.user?.role === 'SALESMAN') {
    const locale = await getLocale();
    redirect(localize('/dashboard/sales', locale));
  }

  return (
    <PageContainer pageTitle='dukaan.purchase.newTitle'>
      <PurchaseCreatePageClient />
    </PageContainer>
  );
}
