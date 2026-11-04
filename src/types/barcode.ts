import type { ResponseResolveScanDto } from '@/lib/api/types';

export interface CameraBarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
  mode?: 'imei' | 'barcode';
  title?: string;
  description?: string;
}

export interface CameraDeviceOption {
  id: string;
  label: string;
}

export type TorchConstraint = MediaTrackConstraintSet & { torch?: boolean };

export interface ImeiCameraScanButtonProps {
  onScan: (code: string) => void;
  mode?: 'imei' | 'barcode';
  title?: string;
  className?: string;
  disabled?: boolean;
}

export interface SaleScanBarProps {
  onItemResolved: (result: ResponseResolveScanDto) => void;
  className?: string;
  placeholder?: string;
}

export interface WhatsAppReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  imei?: string | null;
  warrantyDays?: number | null;
}

export interface WhatsAppReceiptData {
  shopName?: string;
  saleNo: string;
  saleDate?: string;
  customerName?: string | null;
  customerPhone?: string | null;
  items: WhatsAppReceiptItem[];
  totalAmount: number;
  discount?: number;
  paidAmount?: number;
  paymentMethod?: string;
}

export interface SaleWhatsAppShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: WhatsAppReceiptData | null;
}

export type SanitizeImeiResult =
  | { success: true; imei: string }
  | { success: false; error: 'empty_scan' | 'too_short' | 'invalid_format'; raw: string };

export type SanitizeBarcodeResult =
  | { success: true; barcode: string }
  | { success: false; error: 'empty_scan'; raw: string };

export interface WindowWithWebkitAudio {
  webkitAudioContext?: typeof AudioContext;
}

export interface OcrCandidate {
  imei: string;
  isLuhnValid: boolean;
  label: string;
  rawContext?: string;
}

export interface CropRatioArea {
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}

export interface ScannerControlsBarProps {
  hasMultipleCameras: boolean;
  scanType: 'barcode' | 'ocr';
  isOcrScanning: boolean;
  isInitializing: boolean;
  hasTorch: boolean;
  isTorchOn: boolean;
  onSwitchCamera: () => void;
  onCaptureOcr: () => void;
  onToggleTorch: () => void;
}

export interface ScannerOcrCandidatesProps {
  candidates: OcrCandidate[];
  onSelectCandidate: (candidate: OcrCandidate) => void;
}

export interface ViewfinderSize {
  width: number;
  height: number;
}

export interface CropRatios {
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}

export interface ComputeOcrCropRatiosParams {
  video: ViewfinderSize;
  view: ViewfinderSize;
  reticle: ViewfinderSize;
  padding: number;
}
