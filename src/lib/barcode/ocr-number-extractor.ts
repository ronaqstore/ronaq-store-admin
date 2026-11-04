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
let cachedWorker: any = null;
let workerInitPromise: Promise<any> | null = null;

export async function getOcrWorker(): Promise<any> {
  if (cachedWorker) {
    return cachedWorker;
  }

  if (workerInitPromise) {
    return workerInitPromise;
  }

  workerInitPromise = (async () => {
    const { createWorker } = await import('tesseract.js');
    const isBrowser = typeof window !== 'undefined';

    try {
      // Prefer self-hosted local assets if running in browser
      const worker = await createWorker(
        'eng',
        1,
        isBrowser
          ? {
              workerPath: '/tesseract/worker.min.js',
              corePath: '/tesseract',
              langPath: '/tesseract/lang-data/'
            }
          : undefined
      );

      await worker.setParameters({
        tessedit_char_whitelist: '0123456789 -:IMEIimeiSlotSLOTSimSIM',
        tessedit_pageseg_mode: '6'
      });

      cachedWorker = worker;
      return worker;
    } catch (localErr) {
      console.warn('[OCR] Local assets worker init failed, attempting CDN fallback:', localErr);
      const fallbackWorker = await createWorker('eng');
      await fallbackWorker.setParameters({
        tessedit_char_whitelist: '0123456789 -:IMEIimeiSlotSLOTSimSIM'
      });
      cachedWorker = fallbackWorker;
      return fallbackWorker;
    } finally {
      workerInitPromise = null;
    }
  })();

  return workerInitPromise;
}

/**
 * Runs client-side OCR on a canvas using cached tesseract.js worker.
 * Processes the cropped canvas to extract 15-digit IMEI candidates.
 */
export async function recognizeNumbersFromCanvas(
  canvas: HTMLCanvasElement
): Promise<OcrCandidate[]> {
  const worker = await getOcrWorker();
  const ret = await worker.recognize(canvas);
  return extractImeiCandidates(ret.data.text);
}
