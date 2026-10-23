import { AppError } from '@/lib/errors';

const PRODUCT_MAX_EDGE = 1600;
const LOGO_EDGE = 512;
const BANNER_WIDTH = 1600;
const BANNER_HEIGHT = 700;
const JPEG_QUALITY = 0.85;

export async function prepareProductImage(
  file: File,
  maxEdge = PRODUCT_MAX_EDGE
): Promise<File> {
  const img = await loadImage(file);
  const { width, height } = fitInside(img.width, img.height, maxEdge);
  const blob = await drawToJpeg(img, width, height, 0, 0, img.width, img.height);
  return toJpegFile(blob, file.name);
}

export async function prepareShopLogo(file: File, edge = LOGO_EDGE): Promise<File> {
  const img = await loadImage(file);
  const side = Math.min(img.width, img.height);
  const sx = Math.floor((img.width - side) / 2);
  const sy = Math.floor((img.height - side) / 2);
  const blob = await drawToJpeg(img, edge, edge, sx, sy, side, side);
  return toJpegFile(blob, file.name);
}

export async function prepareShopBanner(
  file: File,
  width = BANNER_WIDTH,
  height = BANNER_HEIGHT
): Promise<File> {
  const img = await loadImage(file);
  const targetRatio = width / height;
  const sourceRatio = img.width / img.height;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (sourceRatio > targetRatio) {
    sw = Math.round(img.height * targetRatio);
    sx = Math.floor((img.width - sw) / 2);
  } else if (sourceRatio < targetRatio) {
    sh = Math.round(img.width / targetRatio);
    sy = Math.floor((img.height - sh) / 2);
  }

  const blob = await drawToJpeg(img, width, height, sx, sy, sw, sh);
  return toJpegFile(blob, file.name);
}

function fitInside(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = Math.min(max / w, max / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new AppError('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new AppError('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

function drawToJpeg(
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  sx: number,
  sy: number,
  sw: number,
  sh: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new AppError('Canvas context not available');
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new AppError('Failed to process image'));
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

function toJpegFile(blob: Blob, originalName: string): File {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${base}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now()
  });
}
