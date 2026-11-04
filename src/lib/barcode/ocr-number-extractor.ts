/**
 * Validates a numeric string against the standard Luhn checksum algorithm (Mod 10).
 * Standard for 15-digit GSM/3GPP IMEI numbers.
 */
export function isLuhnValid(digits: string): boolean {
  if (!/^\d{15}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let double = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (double) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}

export interface OcrCandidate {
  imei: string;
  isLuhnValid: boolean;
  label: string;
  rawContext?: string;
}

/**
 * Extracts 15-digit IMEI candidate numbers from messy OCR text.
 * Handles spaces, hyphens, colons, "IMEI1:", "IMEI 2", and multi-line phone screens.
 */
export function extractImeiCandidates(rawText: unknown): OcrCandidate[] {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return [];
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const candidates: OcrCandidate[] = [];
  const seenImeis = new Set<string>();

  // Helper to add candidate
  const addCandidate = (imei: string, label: string, context?: string) => {
    if (/^\d{15}$/.test(imei) && !seenImeis.has(imei)) {
      seenImeis.add(imei);
      candidates.push({
        imei,
        isLuhnValid: isLuhnValid(imei),
        label,
        rawContext: context
      });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : '';

    // Determine likely label from line or previous line (e.g. "IMEI 1", "IMEI 2", "SIM 1")
    const combinedContext = `${prevLine} ${line}`.toLowerCase();
    let detectedLabel = '';
    if (
      combinedContext.includes('imei 1') ||
      combinedContext.includes('imei1') ||
      combinedContext.includes('sim 1') ||
      combinedContext.includes('slot 1')
    ) {
      detectedLabel = 'IMEI 1';
    } else if (
      combinedContext.includes('imei 2') ||
      combinedContext.includes('imei2') ||
      combinedContext.includes('sim 2') ||
      combinedContext.includes('slot 2')
    ) {
      detectedLabel = 'IMEI 2';
    }

    // 1. Check for hyphen/space-separated digits within line (e.g. 354892-10-284759-1 or 354892 10 284759 1)
    const normalizedLine = line.replace(/[\s\-_]/g, '');

    // Find all digit chunks with 15+ digits
    const digitChunks = normalizedLine.match(/\d{15,17}/g);
    if (digitChunks) {
      for (const chunk of digitChunks) {
        const baseImei = chunk.slice(0, 15);
        const label =
          detectedLabel || (candidates.length === 0 ? 'IMEI 1' : `IMEI ${candidates.length + 1}`);
        addCandidate(baseImei, label, line);
      }
    }
  }

  // 2. Global fallback across the whole text if line-by-line missed fragmented strings
  if (candidates.length === 0) {
    // Remove all non-digits
    const allDigits = rawText.replace(/\D/g, '');
    const matches = allDigits.match(/\d{15}/g);
    if (matches) {
      for (let idx = 0; idx < matches.length; idx++) {
        const label = idx === 0 ? 'IMEI 1' : `IMEI ${idx + 1}`;
        addCandidate(matches[idx], label, rawText.slice(0, 50));
      }
    }
  }

  return candidates;
}

/**
 * Crops a video element's current frame down to the central viewfinder reticle
 * to optimize OCR speed and eliminate surrounding visual noise.
 */
export function cropVideoToReticle(
  video: HTMLVideoElement,
  cropArea: { xRatio: number; yRatio: number; widthRatio: number; heightRatio: number }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 480;

  const sx = Math.max(0, Math.floor(vw * cropArea.xRatio));
  const sy = Math.max(0, Math.floor(vh * cropArea.yRatio));
  const sWidth = Math.max(1, Math.min(vw - sx, Math.floor(vw * cropArea.widthRatio)));
  const sHeight = Math.max(1, Math.min(vh - sy, Math.floor(vh * cropArea.heightRatio)));

  canvas.width = sWidth;
  canvas.height = sHeight;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
  }

  return canvas;
}

// Shared worker cache for rapid OCR responses without repeatedly redownloading
type OcrWorker = import('tesseract.js').Worker;

let cachedWorker: OcrWorker | null = null;
let workerInitPromise: Promise<OcrWorker> | null = null;

const OCR_WHITELIST = '0123456789 -:/IMEIimeiSlotSLOTSimSIM';
const WORKER_INIT_TIMEOUT_MS = 30_000;
const RECOGNIZE_TIMEOUT_MS = 20_000;

/**
 * Rejects if the given promise does not settle within `ms`.
 * Tesseract can hang silently when an asset fails to load, so every call is guarded.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`[OCR] ${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function createConfiguredWorker(useLocalAssets: boolean): Promise<OcrWorker> {
  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await withTimeout(
    createWorker(
      'eng',
      1,
      useLocalAssets
        ? {
            workerPath: '/tesseract/worker.min.js',
            corePath: '/tesseract',
            langPath: '/tesseract/lang-data'
          }
        : {}
    ),
    WORKER_INIT_TIMEOUT_MS,
    'Worker init'
  );

  await worker.setParameters({
    tessedit_char_whitelist: OCR_WHITELIST,
    tessedit_pageseg_mode: PSM.SPARSE_TEXT
  });

  return worker;
}

export async function getOcrWorker(): Promise<OcrWorker> {
  if (cachedWorker) {
    return cachedWorker;
  }

  if (workerInitPromise) {
    return workerInitPromise;
  }

  workerInitPromise = (async () => {
    const isBrowser = typeof window !== 'undefined';
    try {
      // Prefer self-hosted local assets (served from /public/tesseract)
      cachedWorker = await createConfiguredWorker(isBrowser);
    } catch (localErr) {
      console.warn('[OCR] Local assets worker init failed, attempting CDN fallback:', localErr);
      cachedWorker = await createConfiguredWorker(false);
    }
    return cachedWorker;
  })();

  try {
    return await workerInitPromise;
  } finally {
    workerInitPromise = null;
  }
}

/**
 * Starts loading the OCR engine in the background so the first "Read Numbers" tap is fast.
 */
export function preloadOcrWorker(): void {
  void getOcrWorker().catch((err: unknown) => {
    console.warn('[OCR] Preload failed:', err);
  });
}

async function resetOcrWorker(): Promise<void> {
  const worker = cachedWorker;
  cachedWorker = null;
  if (worker) {
    try {
      await worker.terminate();
    } catch {
      // Worker already dead
    }
  }
}

/**
 * Converts a camera frame into a high-contrast, upscaled grayscale image.
 * Tesseract reads digits far more reliably from black-on-white, larger text.
 */
export function preprocessForOcr(source: HTMLCanvasElement): HTMLCanvasElement {
  const minWidth = 1200;
  const scale = source.width < minWidth ? Math.min(3, minWidth / Math.max(1, source.width)) : 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return source;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;

  // Grayscale + compute average brightness
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
    total += gray;
  }
  const avg = total / (data.length / 4);

  // Light text on dark background (e.g. phone screens) -> invert so text becomes dark
  const invert = avg < 110;

  // Stretch contrast around the average brightness
  const contrast = 1.8;
  for (let i = 0; i < data.length; i += 4) {
    let v = data[i];
    if (invert) v = 255 - v;
    const pivot = invert ? 255 - avg : avg;
    v = (v - pivot) * contrast + 128;
    v = v < 0 ? 0 : v > 255 ? 255 : v;
    data[i] = data[i + 1] = data[i + 2] = v;
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Runs client-side OCR on a canvas using cached tesseract.js worker.
 * Processes the cropped canvas to extract 15-digit IMEI candidates.
 */
export async function recognizeNumbersFromCanvas(
  canvas: HTMLCanvasElement
): Promise<OcrCandidate[]> {
  const worker = await getOcrWorker();
  try {
    const ret = await withTimeout(worker.recognize(canvas), RECOGNIZE_TIMEOUT_MS, 'Recognize');
    return extractImeiCandidates(ret.data.text);
  } catch (err) {
    // A hung/crashed worker must not be reused for the next attempt
    await resetOcrWorker();
    throw err;
  }
}
