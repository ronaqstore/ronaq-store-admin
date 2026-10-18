export const INPUT_LIMITS = {
  name: 100,
  nameLong: 150,
  phone: 20,
  phoneLoose: 30,
  address: 300,
  addressCustomer: 255,
  city: 100,
  notes: 1000,
  description: 1000,
  publicDescription: 4000,
  about: 2000,
  cancelReason: 1000,
  invoiceRef: 100,
  openingHours: 200,
  model: 100,
  color: 50,
  ram: 50,
  storage: 50,
  sku: 100,
  barcode: 100,
  imageUrl: 500,
  password: 72,
  passwordMin: 8,
  imei: 20,
  imeiCountMax: 50_000,
  imeiList: 50_000 * 21,
  shopAddress: 250,
  amountRupeesMax: 999_999_999_999,
  quantityMax: 9_999_999,
  lowStockMax: 1_000_000
} as const;

export function clampText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}
