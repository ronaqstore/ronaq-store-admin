'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FloatingActionButton } from '@/components/common/floating-action-button';
import { TablePageBody } from '@/components/layout/table-page-body';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/use-t';
import { useRouter } from '@/i18n/navigation';
import { CameraBarcodeScannerDialog } from '@/components/barcode/camera-barcode-scanner-dialog';
import { SaleCreateDialog } from '@/components/sales/sale-create-dialog';
import { resolveScan } from '@/features/inventory/api/service';
import type { ProductDTO } from '@/lib/api/types';
import { ProductsTable } from './products-table';
import type { ProductsHeaderActionProps } from '@/types/products';

export function ProductsHeaderAction({ onAdd, onScanSell }: ProductsHeaderActionProps) {
  const t = useT();
  const router = useRouter();

  const handleOpen = () => {
    if (onAdd) onAdd();
    else router.push('/dashboard/products/new');
  };

  return (
    <div className='flex items-center gap-2 w-full sm:w-auto'>
      {onScanSell ? (
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={onScanSell}
          className='h-8 gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10'
        >
          <Icons.scan className='h-4 w-4' />
          <span>{t('scanner.quickScanSell')}</span>
        </Button>
      ) : null}
      <Button
        type='button'
        size='sm'
        className='h-8 gap-1.5 text-xs hidden lg:inline-flex'
        onClick={handleOpen}
      >
        <Icons.add className='me-2 h-4 w-4' />
        {t('dukaan.product.add')}
      </Button>
    </div>
  );
}

export function ProductsPageClient() {
  const t = useT();
  const router = useRouter();
  const [scanSellOpen, setScanSellOpen] = useState(false);
  const [quickSellProduct, setQuickSellProduct] = useState<ProductDTO | null>(null);

  const handleAdd = () => {
    router.push('/dashboard/products/new');
  };

  const handleScan = async (code: string) => {
    try {
      const res = await resolveScan(code);
      if (res.found && res.product) {
        setQuickSellProduct(res.product);
        toast.success(t('scanner.quickSellLoaded', { name: res.product.name }));
      } else {
        if (res.reason === 'NOT_IN_STOCK') {
          toast.warning(res.message || t('scanner.unitNotFoundInStock', { imei: code }));
        } else if (res.reason === 'INACTIVE') {
          toast.warning(res.message || t('dukaan.product.inactiveDescription'));
        } else {
          toast.error(res.message || t('scanner.itemNotFound'));
        }
      }
    } catch {
      toast.error(t('scanner.scanFailed'));
    }
  };

  return (
    <TablePageBody>
      <ProductsTable
        toolbarAction={
          <ProductsHeaderAction onAdd={handleAdd} onScanSell={() => setScanSellOpen(true)} />
        }
      />
      <FloatingActionButton label={t('dukaan.product.add')} onClick={handleAdd} />

      <CameraBarcodeScannerDialog
        open={scanSellOpen}
        onOpenChange={setScanSellOpen}
        mode='barcode'
        title={t('scanner.scanToSellTitle')}
        description={t('scanner.scanToSellDesc')}
        onScan={(code) => void handleScan(code)}
      />

      <SaleCreateDialog
        open={quickSellProduct != null}
        onOpenChange={(open) => {
          if (!open) setQuickSellProduct(null);
        }}
        initialProduct={quickSellProduct}
      />
    </TablePageBody>
  );
}
