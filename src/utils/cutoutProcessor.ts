export interface ProcessedCutout {
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
  isCutout: boolean;
}

const cutoutCache = new Map<string, Promise<ProcessedCutout>>();

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

function sampleCornerBg(
  data: Uint8ClampedArray,
  w: number,
  h: number
): [number, number, number] {
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const pad = Math.max(4, Math.min(16, Math.floor(Math.min(w, h) * 0.03)));

  const corners = [
    [0, 0],
    [w - pad, 0],
    [0, h - pad],
    [w - pad, h - pad],
  ];

  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + pad; y += 2) {
      for (let x = cx; x < cx + pad; x += 2) {
        const idx = (y * w + x) * 4;
        rs.push(data[idx]);
        gs.push(data[idx + 1]);
        bs.push(data[idx + 2]);
      }
    }
  }

  rs.sort((a, b) => a - b);
  gs.sort((a, b) => a - b);
  bs.sort((a, b) => a - b);
  const mid = Math.floor(rs.length / 2);
  return [rs[mid], gs[mid], bs[mid]];
}

function colorDist(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Checks whether two colors share a similar pastel tint (useful for gently
 * removing soft studio floor shadows that are merely darker versions of the backdrop).
 */
function isSimilarTint(
  r: number,
  g: number,
  b: number,
  bgR: number,
  bgG: number,
  bgB: number
): boolean {
  const lum = (r + g + b) / 3;
  const bgLum = (bgR + bgG + bgB) / 3;
  if (lum < bgLum * 0.62 || lum > bgLum * 1.15) return false;
  const scale = bgLum > 1 ? lum / bgLum : 1;
  const normDist = colorDist(r, g, b, bgR * scale, bgG * scale, bgB * scale);
  return normDist < 20;
}

export async function processCutout(
  url: string,
  options: { keyInteriorBg?: boolean } = {}
): Promise<ProcessedCutout> {
  const cacheKey = `${url}::${options.keyInteriorBg ? 'int' : 'ext'}`;
  const cached = cutoutCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async (): Promise<ProcessedCutout> => {
    try {
      const img = await loadImage(url);
      const maxDim = 960;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        return {
          src: url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          isCutout: false,
        };
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // Check if corners already have genuine PNG transparency
      const cornerOffsets = [
        0,
        (w - 1) * 4,
        (h - 1) * w * 4,
        ((h - 1) * w + (w - 1)) * 4,
      ];
      const alreadyTransparent = cornerOffsets.every((off) => data[off + 3] < 32);

      if (alreadyTransparent) {
        let minX = w;
        let minY = h;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const a = data[(y * w + x) * 4 + 3];
            if (a > 24) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX > minX && maxY > minY) {
          const padPx = 2;
          const sx = Math.max(0, minX - padPx);
          const sy = Math.max(0, minY - padPx);
          const sw = Math.min(w - sx, maxX - minX + 1 + padPx * 2);
          const sh = Math.min(h - sy, maxY - minY + 1 + padPx * 2);
          const outCanvas = document.createElement('canvas');
          outCanvas.width = sw;
          outCanvas.height = sh;
          const outCtx = outCanvas.getContext('2d');
          if (outCtx) {
            outCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
            return {
              src: outCanvas.toDataURL('image/png'),
              width: sw,
              height: sh,
              aspectRatio: sw / sh,
              isCutout: true,
            };
          }
        }
        return {
          src: url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          isCutout: true,
        };
      }

      const [bgR, bgG, bgB] = sampleCornerBg(data, w, h);
      const total = w * h;
      const bgMask = new Uint8Array(total);
      const queue = new Int32Array(total);
      let head = 0;
      let tail = 0;

      const trySeed = (idx: number) => {
        if (bgMask[idx]) return;
        const p = idx * 4;
        const d = colorDist(data[p], data[p + 1], data[p + 2], bgR, bgG, bgB);
        if (d < 44 || isSimilarTint(data[p], data[p + 1], data[p + 2], bgR, bgG, bgB)) {
          bgMask[idx] = 1;
          queue[tail++] = idx;
        }
      };

      // Seed perimeter pixels
      for (let x = 0; x < w; x++) {
        trySeed(x);
        trySeed((h - 1) * w + x);
      }
      for (let y = 1; y < h - 1; y++) {
        trySeed(y * w);
        trySeed(y * w + (w - 1));
      }

      // Optionally seed interior exact-bg islands (e.g. inside silk cord loop or letter counters)
      if (options.keyInteriorBg) {
        for (let i = 0; i < total; i++) {
          if (bgMask[i]) continue;
          const p = i * 4;
          const d = colorDist(data[p], data[p + 1], data[p + 2], bgR, bgG, bgB);
          if (d < 18) {
            bgMask[i] = 1;
            queue[tail++] = i;
          }
        }
      }

      // BFS flood-fill from perimeter
      while (head < tail) {
        const idx = queue[head++];
        const x = idx % w;
        const y = (idx - x) / w;
        const p0 = idx * 4;
        const r0 = data[p0];
        const g0 = data[p0 + 1];
        const b0 = data[p0 + 2];

        const neighbors = [
          x > 0 ? idx - 1 : -1,
          x < w - 1 ? idx + 1 : -1,
          y > 0 ? idx - w : -1,
          y < h - 1 ? idx + w : -1,
        ];

        for (let n = 0; n < 4; n++) {
          const nIdx = neighbors[n];
          if (nIdx < 0 || bgMask[nIdx]) continue;
          const np = nIdx * 4;
          const nr = data[np];
          const ng = data[np + 1];
          const nb = data[np + 2];

          const dBg = colorDist(nr, ng, nb, bgR, bgG, bgB);
          const dLocal = colorDist(nr, ng, nb, r0, g0, b0);

          if (dBg < 26 || (dBg < 44 && dLocal < 14) || (isSimilarTint(nr, ng, nb, bgR, bgG, bgB) && dLocal < 12)) {
            bgMask[nIdx] = 1;
            queue[tail++] = nIdx;
          }
        }
      }

      // Apply alpha + soft anti-aliased edge feathering & spill cleanup
      let minX = w;
      let minY = h;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const p = idx * 4;
          if (bgMask[idx]) {
            data[p + 3] = 0;
            continue;
          }

          // Check if pixel borders any transparent pixel for smooth feathering
          const touchesBg =
            (x > 0 && bgMask[idx - 1]) ||
            (x < w - 1 && bgMask[idx + 1]) ||
            (y > 0 && bgMask[idx - w]) ||
            (y < h - 1 && bgMask[idx + w]);

          if (touchesBg) {
            const dBg = colorDist(data[p], data[p + 1], data[p + 2], bgR, bgG, bgB);
            const t = Math.max(0, Math.min(1, (dBg - 18) / 30));
            const alpha = Math.round(t * t * (3 - 2 * t) * 255);
            data[p + 3] = alpha;

            // Gentle color decontamination against bg tint
            if (alpha > 10 && alpha < 245) {
              const a = alpha / 255;
              data[p] = Math.max(0, Math.min(255, Math.round((data[p] - bgR * (1 - a)) / a)));
              data[p + 1] = Math.max(0, Math.min(255, Math.round((data[p + 1] - bgG * (1 - a)) / a)));
              data[p + 2] = Math.max(0, Math.min(255, Math.round((data[p + 2] - bgB * (1 - a)) / a)));
            }
          }

          if (data[p + 3] > 28) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX <= minX || maxY <= minY) {
        return {
          src: url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          isCutout: false,
        };
      }

      ctx.putImageData(imageData, 0, 0);

      // Tight crop with 2px padding
      const cropPad = 2;
      const sx = Math.max(0, minX - cropPad);
      const sy = Math.max(0, minY - cropPad);
      const sw = Math.min(w - sx, maxX - minX + 1 + cropPad * 2);
      const sh = Math.min(h - sy, maxY - minY + 1 + cropPad * 2);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = sw;
      outCanvas.height = sh;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) {
        return {
          src: url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          isCutout: false,
        };
      }

      outCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      const dataUrl = outCanvas.toDataURL('image/png');

      return {
        src: dataUrl,
        width: sw,
        height: sh,
        aspectRatio: sw / sh,
        isCutout: true,
      };
    } catch {
      return {
        src: url,
        width: 1000,
        height: 1000,
        aspectRatio: 1,
        isCutout: false,
      };
    }
  })();

  cutoutCache.set(cacheKey, promise);
  return promise;
}
