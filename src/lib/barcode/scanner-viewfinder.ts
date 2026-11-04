/**
 * Pure geometry for the narrow scanner viewfinder.
 * Spec: docs/specs/scanner-narrow-viewfinder.md (R1-R5, R8). No DOM access here.
 */

/** R1: the camera preview is a short horizontal strip. */
export const VIEWFINDER_HEIGHT_PX = 140;

const RETICLE_WIDTH_RATIO = 0.9;
const RETICLE_MAX_WIDTH_PX = 460;
const RETICLE_HEIGHT_RATIO = 0.5;
/** html5-qrcode rejects a qrbox smaller than 50px. */
const RETICLE_MIN_SIDE_PX = 50;
const RETICLE_MAX_HEIGHT_PX = 90;

export interface Size {
  width: number;
  height: number;
}

export interface CropRatios {
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** R2/R3/R4: wide-and-short scan box shared by the decoder and the on-screen guide. */
export function getReticleSize(viewWidth: number, viewHeight: number): Size {
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

/**
 * R5: crop ratios (0..1, relative to the real video frame) for the centered reticle.
 * The visible video uses `object-cover`: it is scaled by max(viewW/videoW, viewH/videoH)
 * and centered, so the reticle must be mapped through that scale and offset.
 */
export function computeOcrCropRatios(params: {
  video: Size;
  view: Size;
  reticle: Size;
  /** Extra tolerance around the reticle, as a fraction of its own size. */
  padding: number;
}): CropRatios {
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
