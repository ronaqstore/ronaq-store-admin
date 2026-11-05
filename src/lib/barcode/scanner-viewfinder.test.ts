import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  VIEWFINDER_HEIGHT_PX,
  computeOcrCropRatios,
  getBarcodeQrboxSize,
  getReticleSize
} from './scanner-viewfinder.ts';

describe('scanner-viewfinder', () => {
  describe('getReticleSize (R2, R3)', () => {
    it('is wide and short: 90% width, 60% height of the strip', () => {
      const r = getReticleSize(400, VIEWFINDER_HEIGHT_PX);
      assert.equal(r.width, 360);
      assert.equal(r.height, 60);
      assert.ok(r.width > r.height * 3);
    });

    it('caps the width at 460px on wide tablets', () => {
      assert.equal(getReticleSize(900, VIEWFINDER_HEIGHT_PX).width, 460);
    });

    it('clamps height to 50..90px (50px is the html5-qrcode minimum)', () => {
      assert.equal(getReticleSize(400, 60).height, 50);
      assert.equal(getReticleSize(400, 400).height, 90);
    });

    it('stays inside a normal viewfinder', () => {
      const normal = getReticleSize(320, VIEWFINDER_HEIGHT_PX);
      assert.ok(normal.width <= 320 && normal.height <= VIEWFINDER_HEIGHT_PX);
      assert.ok(getReticleSize(40, 40).width >= 50);
    });
  });

  describe('getBarcodeQrboxSize (R3)', () => {
    it('sizes qrbox against the visible 100px strip even when the natural video surface is taller', () => {
      const qrbox = getBarcodeQrboxSize(400, 533);
      assert.deepEqual(qrbox, { width: 360, height: 60 });
    });

    it('shrinks safely if the video surface is shorter than the strip', () => {
      const qrbox = getBarcodeQrboxSize(400, 70);
      assert.equal(qrbox.width, 360);
      assert.equal(qrbox.height, 50);
      assert.ok(qrbox.height <= 70);
    });
  });

  describe('computeOcrCropRatios (R5)', () => {
    it('maps a centered reticle when video and view share the same aspect ratio', () => {
      const c = computeOcrCropRatios({
        video: { width: 800, height: 400 },
        view: { width: 400, height: 200 },
        reticle: { width: 200, height: 100 },
        padding: 0
      });
      assert.deepEqual([c.xRatio, c.yRatio, c.widthRatio, c.heightRatio], [0.25, 0.25, 0.5, 0.5]);
    });

    it('accounts for object-cover when a tall video fills a short strip', () => {
      // 600x800 portrait video shown in a 400x140 strip: width fills, height is cropped.
      const c = computeOcrCropRatios({
        video: { width: 600, height: 800 },
        view: { width: 400, height: 140 },
        reticle: { width: 360, height: 70 },
        padding: 0
      });
      // scale = max(400/600, 140/800) = 0.6667 -> displayed 400x533; visible height ratio 140/533
      assert.ok(Math.abs(c.widthRatio - 0.9) < 1e-6);
      assert.ok(Math.abs(c.xRatio - 0.05) < 1e-6);
      assert.ok(Math.abs(c.heightRatio - 70 / 533.3333333) < 1e-4);
      assert.ok(Math.abs(c.yRatio - (1 - c.heightRatio) / 2) < 1e-6);
    });

    it('expands by padding but stays inside the frame', () => {
      const c = computeOcrCropRatios({
        video: { width: 800, height: 400 },
        view: { width: 400, height: 200 },
        reticle: { width: 380, height: 180 },
        padding: 0.5
      });
      assert.ok(c.xRatio >= 0 && c.yRatio >= 0);
      assert.ok(c.xRatio + c.widthRatio <= 1 + 1e-9);
      assert.ok(c.yRatio + c.heightRatio <= 1 + 1e-9);
    });

    it('falls back to the whole frame for invalid dimensions', () => {
      const c = computeOcrCropRatios({
        video: { width: 0, height: 0 },
        view: { width: 0, height: 0 },
        reticle: { width: 100, height: 50 },
        padding: 0.1
      });
      assert.deepEqual([c.xRatio, c.yRatio, c.widthRatio, c.heightRatio], [0, 0, 1, 1]);
    });
  });
});
