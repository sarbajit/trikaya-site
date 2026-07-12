/**
 * Deterministic "topographic contour" art generated from a slug/name, used
 * everywhere a real property/room photo would eventually go (Cloudinary
 * uploads land in Phase 6 admin CRUD). Colors are read from the brand CSS
 * vars at render time (see components PropertyImage/RoomImage), never
 * hardcoded, so it stays on-theme with SiteSettings per CLAUDE.md Tier 1.
 */

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothClosedPath(points: Array<[number, number]>): string {
  const n = points.length;
  const get = (i: number) => points[((i % n) + n) % n];
  let d = `M ${get(0)[0].toFixed(1)} ${get(0)[1].toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  return d + "Z";
}

export interface ContourArt {
  rings: Array<{ d: string; opacity: number }>;
  peakX: number;
  peakY: number;
  rotation: number;
}

/** Builds 4-5 nested, irregular closed contour rings evoking hillside topo lines. */
export function buildContourArt(key: string, width = 400, height = 300): ContourArt {
  const seed = hashString(key);
  const rand = mulberry32(seed);
  const cx = width * (0.35 + rand() * 0.3);
  const cy = height * (0.55 + rand() * 0.25);
  const ringCount = 4 + Math.floor(rand() * 2);
  const pointCount = 9;
  const freqA = 2 + Math.floor(rand() * 2);
  const freqB = 3 + Math.floor(rand() * 3);
  const phase = rand() * Math.PI * 2;
  const baseR = Math.min(width, height) * (0.62 + rand() * 0.1);

  const rings: Array<{ d: string; opacity: number }> = [];
  for (let ring = 0; ring < ringCount; ring++) {
    const ringR = baseR * (1 - ring / (ringCount + 0.5));
    const points: Array<[number, number]> = [];
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2;
      const wobble =
        Math.sin(angle * freqA + phase) * (ringR * 0.14) + Math.cos(angle * freqB - phase) * (ringR * 0.08);
      const r = ringR + wobble;
      points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.72]);
    }
    rings.push({ d: smoothClosedPath(points), opacity: 0.9 - ring * (0.55 / ringCount) });
  }

  return { rings, peakX: cx, peakY: cy, rotation: Math.floor(rand() * 6) - 3 };
}
