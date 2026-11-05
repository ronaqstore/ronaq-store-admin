import type { ComputeOcrCropRatiosParams, CropRatios, ViewfinderSize } from '@/types/barcode';

export const VIEWFINDER_HEIGHT_PX = 100;

const RETICLE_WIDTH_RATIO = 0.9;
const RETICLE_MAX_WIDTH_PX = 460;
const RETICLE_HEIGHT_RATIO = 0.6;
const RETICLE_MIN_SIDE_PX = 50;
const RETICLE_MAX_HEIGHT_PX = 90;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function getReticleSize(viewWidth: number, viewHeight: number): ViewfinderSize {
  const width = Math.max(
    RETICLE_MIN_SIDE_PX,
    Math.min(Math.floor(viewWidth * RETICLE_WIDTH_RATIO), RETICLE_MAX_WIDTH_PX)
  );
  const height = clamp(
    Math.floor(viewHeight * RETICLE_HEIGHT_RATIO),
    RETICLE_MIN_SIDE_PX,
    RETICLE_MAX_HEIGHT_PX
  );
  return { width, height };
}

const FULL_FRAME: CropRatios = { xRatio: 0, yRatio: 0, widthRatio: 1, heightRatio: 1 };

export function computeOcrCropRatios(params: ComputeOcrCropRatiosParams): CropRatios {
  const { video, view, reticle, padding } = params;
  if (video.width <= 0 || video.height <= 0 || view.width <= 0 || view.height <= 0) {
    return FULL_FRAME;
  }

  const scale = Math.max(view.width / video.width, view.height / video.height);
  const offsetX = (video.width * scale - view.width) / 2;
  const offsetY = (video.height * scale - view.height) / 2;

  const padX = reticle.width * padding;
  const padY = reticle.height * padding;
  const left = (view.width - reticle.width) / 2 - padX;
  const top = (view.height - reticle.height) / 2 - padY;
  const right = left + reticle.width + padX * 2;
  const bottom = top + reticle.height + padY * 2;

  const toRatioX = (v: number) => clamp((v + offsetX) / scale / video.width, 0, 1);
  const toRatioY = (v: number) => clamp((v + offsetY) / scale / video.height, 0, 1);

  const x0 = toRatioX(left);
  const y0 = toRatioY(top);
  return {
    xRatio: x0,
    yRatio: y0,
    widthRatio: toRatioX(right) - x0,
    heightRatio: toRatioY(bottom) - y0
  };
}
