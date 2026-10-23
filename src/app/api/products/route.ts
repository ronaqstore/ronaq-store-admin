import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/products', {
    allowedParams: [
      'page',
      'pageSize',
      'search',
      'categoryId',
      'brandId',
      'trackingType',
      'isActive',
      'isPublished',
      'inStockOnly',
      'quantityOnHand',
      'minSellingPrice',
      'maxSellingPrice',
      'sortBy',
      'sortOrder'
    ]
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/products');
}
