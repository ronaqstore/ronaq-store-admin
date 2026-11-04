# Spec: Narrow scanner viewfinder (barcode + number reader)

Status: implemented · Owner: scanner (`src/components/barcode`) · Pure logic: `src/lib/barcode/scanner-viewfinder.ts`

## 1. Problem
The camera dialog used a tall 260px viewfinder with a 420x240 scan box. IMEI labels are
**wide and short** (a 1D barcode and one line of 15 digits), so most of the frame was wasted,
the dialog pushed the form off-screen on phones/tablets, and the OCR crop (90% x 60% of the
frame) pulled in a lot of unrelated text. Retail scanner apps (e.g. PTA DES) use a short
horizontal strip instead.

## 2. Requirements (testable)
| ID | Requirement |
|----|-------------|
| R1 | The viewfinder is a narrow strip: fixed height `VIEWFINDER_HEIGHT_PX = 140`, full width. |
| R2 | The reticle (scan box) is wide and short: width = 90% of viewfinder width capped at 460px; height = 50% of viewfinder height clamped to 50..90px (50px is the html5-qrcode minimum). It is horizontally and vertically centered. |
| R3 | The barcode decoder (`qrbox`) uses exactly the R2 reticle, never larger than the viewfinder and never below the library minimum of 50px. |
| R4 | The OCR guide box drawn on screen uses the same R2 reticle size, so what the user aligns is what is read. |
| R5 | OCR crops **only the reticle area (+ small tolerance padding)** from the video. The crop is computed in video pixels and accounts for `object-cover` (the visible video is a centered, scaled crop of the real frame). |
| R6 | OCR attempts: reticle crop (preprocessed) -> reticle crop (raw) -> full frame (preprocessed). Stops early on a Luhn-valid IMEI. (unchanged) |
| R7 | Action buttons (switch camera / read numbers / flash) sit **below** the strip, not on top of it, so they never cover the reticle. |
| R8 | Pure geometry has no DOM access and is covered by unit tests. |

## 3. Design
- `scanner-viewfinder.ts` (pure): `VIEWFINDER_HEIGHT_PX`, `getReticleSize(viewW, viewH)`,
  `computeOcrCropRatios({ video, view, reticle, padding })`.
- `camera-barcode-scanner-dialog.tsx`: consumes the helpers for `qrbox`, the OCR overlay, and
  the OCR crop; renders the controls row under the strip.
- `cropVideoToReticle` (existing) receives the ratios computed from R5.

### Crop maths (R5)
`scale = max(viewW/videoW, viewH/videoH)`; the displayed video is `videoW*scale x videoH*scale`,
centered, so offset `= (displayed - view) / 2`. Reticle origin in view space is
`((viewW - rw)/2, (viewH - rh)/2)`; in video pixels it is `(origin + offset) / scale`. Padding
expands each side by `padding * reticle size`; ratios are clamped to 0..1.

## 4. Out of scope
Torch/camera-switch behaviour, OCR engine, and sanitizers are unchanged.
