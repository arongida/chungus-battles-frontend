// Procedural pixel-art VFX sprite sheets for combat (hit sparks, DoTs, heal, status loops).
// Zero dependencies — PNGs are encoded with node:zlib. Re-run after tweaking:
//   node tools/vfx/generate-sprites.mjs
// Output: src/assets/vfx/px/<name>.png — horizontal strips, frame 0 leftmost. Frame size and
// count per sheet must match the `.vfx-*` classes in src/styles.scss.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../src/assets/vfx/px');

// ── PNG encoding ────────────────────────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Drawing helpers ─────────────────────────────────────────────────────────
/** VFX_PREVIEW=<dir> also writes 8× upscaled copies over a dark checker with frame dividers,
 *  for eyeballing the art (the real sheets are tiny). */
const PREVIEW_DIR = process.env.VFX_PREVIEW;
function writePreview(name, w, h, fw, buf) {
  const Z = 8, W = w * Z, H = h * Z, out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = Math.floor(x / Z), sy = Math.floor(y / Z), si = (sy * w + sx) * 4, o = (y * W + x) * 4;
    const bg = x % (fw * Z) === 0 ? 120 : ((sx + sy) % 2 ? 38 : 30);
    const a = buf[si + 3] / 255;
    for (let k = 0; k < 3; k++) out[o + k] = Math.round(buf[si + k] * a + bg * (1 - a));
    out[o + 3] = 255;
  }
  mkdirSync(PREVIEW_DIR, { recursive: true });
  writeFileSync(join(PREVIEW_DIR, `${name}.png`), encodePng(W, H, out));
}

function hex(c, a = 255) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

/** One sheet = `frames` frames of `fw`×`fh`, laid out left to right. */
function sheet(fw, fh, frames) {
  const w = fw * frames;
  const buf = Buffer.alloc(w * fh * 4);
  const frame = i => {
    const px = (x, y, col) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= fw || y >= fh || !col) return;
      const o = (y * w + i * fw + x) * 4;
      buf[o] = col[0]; buf[o + 1] = col[1]; buf[o + 2] = col[2]; buf[o + 3] = col[3];
    };
    const line = (x0, y0, x1, y1, col) => {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        px(x0, y0, col);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    };
    const disc = (cx, cy, r, col) => {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r + r * 0.8) px(cx + x, cy + y, col);
      }
    };
    /** Ring outline; `dither` skips every other pixel for a fading look. */
    const ring = (cx, cy, rx, ry, col, dither = false) => {
      const steps = Math.max(12, Math.ceil(2 * Math.PI * Math.max(rx, ry) * 1.5));
      const seen = new Set();
      for (let s = 0; s < steps; s++) {
        const a = (s / steps) * Math.PI * 2;
        const x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry);
        const k = `${x},${y}`;
        if (seen.has(k)) continue;
        seen.add(k);
        if (dither && (x + y) % 2) continue;
        px(x, y, col);
      }
    };
    const poly = (pts, col) => {
      for (let i = 0; i < pts.length; i++) {
        const [a, b] = [pts[i], pts[(i + 1) % pts.length]];
        line(a[0], a[1], b[0], b[1], col);
      }
    };
    const fillPoly = (pts, colFn) => {
      for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) px(x, y, colFn(x, y));
      }
    };
    return { px, line, disc, ring, poly, fillPoly };
  };
  return { frame, save: name => {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(join(OUT_DIR, `${name}.png`), encodePng(w, fh, buf));
    if (PREVIEW_DIR) writePreview(name, w, fh, fw, buf);
    console.log(`  ${name}.png  ${w}x${fh}  (${frames} × ${fw}x${fh})`);
  } };
}

/** Deterministic PRNG so re-running the script produces identical sheets. */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** 4×4 ordered-dither thresholds — gives the classic even pixel-art fade instead of streaks. */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function hexPoints(cx, cy, rx, ry) {
  return [0, 1, 2, 3, 4, 5].map(i => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
}

// ── Effects ─────────────────────────────────────────────────────────────────

/** Impact star: bright core → 8 rays → expanding ring → scattered sparks. 5f @ 32px. */
function hitSpark(name, pal) {
  const S = sheet(32, 32, 5);
  const [core, hot, mid, dark] = pal.map(c => hex(c));
  const c = 16;
  const dirs = [0, 1, 2, 3, 4, 5, 6, 7].map(i => (Math.PI / 4) * i);
  const rays = (g, r0, r1, colInner, colTip, diagScale) => dirs.forEach((a, i) => {
    const s = i % 2 ? diagScale : 1;
    const x0 = c + Math.cos(a) * r0 * s, y0 = c + Math.sin(a) * r0 * s;
    const x1 = c + Math.cos(a) * r1 * s, y1 = c + Math.sin(a) * r1 * s;
    g.line(x0, y0, x1, y1, colInner);
    g.px(x1, y1, colTip);
  });
  let g = S.frame(0);
  g.disc(c, c, 2, core);
  rays(g, 3, 6, hot, mid, 0.6);
  g = S.frame(1);
  g.disc(c, c, 3, hot); g.disc(c, c, 2, core);
  rays(g, 4, 12, hot, mid, 0.65);
  rays(g, 4, 8, core, hot, 0.65);
  g = S.frame(2);
  g.ring(c, c, 8, 8, hot);
  g.disc(c, c, 1, core);
  rays(g, 10, 14, mid, dark, 0.7);
  g = S.frame(3);
  g.ring(c, c, 11, 11, mid, true);
  rays(g, 13, 14, dark, dark, 0.75);
  g = S.frame(4);
  const r = rng(7);
  for (let i = 0; i < 10; i++) {
    const a = r() * Math.PI * 2, d = 12 + r() * 3;
    g.px(c + Math.cos(a) * d, c + Math.sin(a) * d, i % 2 ? mid : dark);
  }
  S.save(name);
}

/** Toxic puff with bubbles rising and popping. 8f @ 32px. */
function poison() {
  const S = sheet(32, 32, 8);
  const dark = hex('#14532d'), mid = hex('#16a34a'), light = hex('#4ade80'), hi = hex('#d9f99d');
  const puffDark = hex('#14532d', 210), puffMid = hex('#15803d', 200);
  const r = rng(42);
  const blobs = Array.from({ length: 6 }, () => ({ dx: (r() - 0.5) * 12, dy: (r() - 0.5) * 5, s: 0.6 + r() * 0.5 }));
  const bubbles = [
    { x: 11, start: 0, r: 2, life: 6 }, { x: 19, start: 1, r: 1, life: 5 },
    { x: 15, start: 2, r: 2, life: 5 }, { x: 22, start: 0, r: 1, life: 4 },
    { x: 8, start: 3, r: 1, life: 4 }, { x: 17, start: 4, r: 2, life: 4 },
  ];
  for (let f = 0; f < 8; f++) {
    const g = S.frame(f);
    // Puff grows over frames 0-3, then breaks up (dithered) on 4-7.
    const grow = Math.min(1, (f + 1) / 4);
    const fade = f >= 4 ? (f - 3) / 5 : 0;
    blobs.forEach((b, i) => {
      const rad = Math.round((2 + 4 * grow) * b.s);
      for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
        if (x * x + y * y > rad * rad) continue;
        const X = 16 + b.dx + x, Y = 24 + b.dy - f * 0.6 + y;
        if (fade && BAYER4[(Math.round(Y) & 3) * 4 + (Math.round(X) & 3)] / 16 < fade) continue;
        g.px(X, Y, y < -rad / 3 ? puffMid : puffDark);
      }
    });
    bubbles.forEach(b => {
      const t = f - b.start;
      if (t < 0 || t > b.life) return;
      const y = 24 - t * 3.2, x = b.x + Math.sin(t * 1.3 + b.x) * 1.2;
      if (t === b.life) { // pop
        [[-2, 0], [2, 0], [0, -2], [0, 2]].forEach(([ox, oy]) => g.px(x + ox, y + oy, light));
        return;
      }
      if (b.r === 1) { g.disc(x, y, 1, mid); g.px(x - 1, y - 1, hi); }
      else { g.ring(x, y, 2, 2, light); g.px(x - 1, y - 1, hi); g.px(x, y, mid); }
    });
    // Outline dark pixels at the puff's bottom edge for readability over bright portraits.
    if (f < 6) g.line(16 - 5 * grow, 29, 16 + 5 * grow, 29, dark);
  }
  S.save('poison');
}

/** Flame burst with flicker and embers. 7f @ 32px. */
function burn() {
  const S = sheet(32, 32, 7);
  const bands = [hex('#7c2d12'), hex('#c2410c'), hex('#f97316'), hex('#fbbf24'), hex('#fef3c7')];
  const ember = [hex('#fbbf24'), hex('#f97316'), hex('#fde68a')];
  const env = [0.45, 0.8, 1, 1, 0.9, 0.6, 0.3]; // flame height envelope per frame
  const hash = (x, y) => { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); };
  const r = rng(99);
  const embers = Array.from({ length: 9 }, () => ({ x: 8 + r() * 16, start: Math.floor(r() * 4), drift: (r() - 0.5) * 2.5, c: Math.floor(r() * 3) }));
  for (let f = 0; f < 7; f++) {
    const g = S.frame(f);
    const H = 22 * env[f];
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const up = 29 - y; // height above base
      if (up < 0) continue;
      const hNorm = up / H;
      if (hNorm >= 1) continue;
      const width = 9 * (1 - hNorm * 0.85) + 1;
      const noise = hash(Math.floor(x / 2), Math.floor((y + f * 3) / 2)) * 0.45;
      const I = 1 - Math.abs(x - 16 + Math.sin(up * 0.35 + f) * 1.5) / width - hNorm * 0.9 - noise;
      if (I <= 0) continue;
      const band = Math.min(4, Math.floor(I * 6));
      g.px(x, y, bands[band]);
    }
    embers.forEach(e => {
      const t = f - e.start;
      if (t < 0) return;
      const y = 22 - t * 4, x = e.x + e.drift * t;
      g.px(x, y, ember[e.c]);
      if (t < 2) g.px(x, y + 1, bands[1]);
    });
  }
  S.save('burn');
}

/** Rising plus-crosses with a ground ring. 10f @ 32px. */
function heal() {
  const S = sheet(32, 32, 10);
  const dark = hex('#166534'), mid = hex('#22c55e'), light = hex('#86efac'), white = hex('#f0fdf4');
  const crosses = [
    { x: 16, start: 0, big: true, life: 8 }, { x: 9, start: 1, big: false, life: 6 },
    { x: 23, start: 2, big: false, life: 6 }, { x: 12, start: 4, big: true, life: 5 },
    { x: 21, start: 5, big: false, life: 4 },
  ];
  const r = rng(5);
  const twinkles = Array.from({ length: 8 }, () => ({ x: 4 + r() * 24, y: 4 + r() * 22, f: Math.floor(r() * 10) }));
  for (let f = 0; f < 10; f++) {
    const g = S.frame(f);
    if (f < 7) {
      const rx = 4 + f * 1.6;
      g.ring(16, 27, rx, rx / 3.2, f < 3 ? light : mid, f >= 4);
    }
    crosses.forEach(c => {
      const t = f - c.start;
      if (t < 0 || t > c.life) return;
      const y = 26 - t * 2.6;
      const shrinking = t >= c.life - 1;
      if (c.big && !shrinking) {
        // 5×5 plus with dark outline, bright core
        for (let i = -2; i <= 2; i++) { g.px(c.x + i, y, mid); g.px(c.x, y + i, mid); }
        [[-3, 0], [3, 0], [0, -3], [0, 3], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([ox, oy]) => g.px(c.x + ox, y + oy, dark));
        g.px(c.x, y, white); g.px(c.x - 1, y, light); g.px(c.x, y - 1, light);
      } else {
        g.px(c.x, y, shrinking ? light : white);
        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([ox, oy]) => g.px(c.x + ox, y + oy, shrinking ? mid : light));
      }
    });
    twinkles.forEach(tw => {
      if (tw.f === f) g.px(tw.x, tw.y, white);
      if (tw.f === f - 1) { g.px(tw.x, tw.y, light); g.px(tw.x - 1, tw.y, mid); g.px(tw.x + 1, tw.y, mid); }
    });
  }
  S.save('heal');
}

/** Three stars orbiting above the head. 8f loop @ 32×16. */
function stunLoop() {
  const S = sheet(32, 16, 8);
  const white = hex('#fffbeb'), yellow = hex('#facc15'), orange = hex('#ca8a04'), path = hex('#fef08a', 90);
  for (let f = 0; f < 8; f++) {
    const g = S.frame(f);
    g.ring(16, 8, 12, 4, path, true);
    for (let k = 0; k < 3; k++) {
      const a = (f / 8) * Math.PI * 2 + (k * Math.PI * 2) / 3;
      const x = 16 + Math.cos(a) * 12, y = 8 + Math.sin(a) * 4;
      const front = Math.sin(a) > -0.2;
      if (front) {
        // 5×5 star: plus + diagonals, white core
        for (let i = -2; i <= 2; i++) { g.px(x + i, y, yellow); g.px(x, y + i, yellow); }
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([ox, oy]) => g.px(x + ox, y + oy, orange));
        g.px(x, y, white);
      } else {
        [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([ox, oy]) => g.px(x + ox, y + oy, orange));
      }
    }
  }
  S.save('stun_loop');
}

/** Hex bubble with a shimmer band sweeping across. 6f loop @ 32×40. */
function shieldLoop() {
  const S = sheet(32, 40, 6);
  const edge = hex('#f59e0b', 230), edgeHi = hex('#fde68a', 255), inner = hex('#fcd34d', 110);
  const pts = hexPoints(16, 20, 15, 19);
  const innerPts = hexPoints(16, 20, 13, 17);
  for (let f = 0; f < 6; f++) {
    const g = S.frame(f);
    const band = -20 + f * 13; // diagonal band position
    g.fillPoly(pts, (x, y) => {
      const d = x + y * 0.6 - 16 - band;
      if (Math.abs(d) < 2) return hex('#fef3c7', 120);
      if (Math.abs(d) < 4 && (x + y) % 2 === 0) return hex('#fde68a', 70);
      return hex('#f59e0b', (x + y + f) % 4 === 0 ? 34 : 20);
    });
    g.poly(innerPts, inner);
    g.poly(pts, edge);
    // Two bright vertices chase around the outline.
    [f, f + 3].forEach(i => { const [x, y] = pts[i % 6]; g.disc(x, y, 1, edgeHi); });
  }
  S.save('shield_loop');
}

/** Deflect flash: white hex → expanding outline → sparks. 5f @ 32px. */
function shieldPing() {
  const S = sheet(32, 32, 5);
  const white = hex('#ffffff'), light = hex('#fde68a'), amber = hex('#f59e0b'), dark = hex('#b45309');
  let g = S.frame(0);
  g.fillPoly(hexPoints(16, 16, 6, 6), () => white);
  g.poly(hexPoints(16, 16, 7, 7), light);
  g = S.frame(1);
  g.poly(hexPoints(16, 16, 9, 9), white);
  g.poly(hexPoints(16, 16, 10, 10), light);
  [[16, 3], [16, 29], [4, 10], [28, 10], [4, 22], [28, 22]].forEach(([x, y]) => g.px(x, y, light));
  g = S.frame(2);
  g.poly(hexPoints(16, 16, 12, 12), light);
  g.poly(hexPoints(16, 16, 13, 13), amber);
  g = S.frame(3);
  const p3 = hexPoints(16, 16, 14, 14);
  p3.forEach(([x, y], i) => { const [x2, y2] = p3[(i + 1) % 6]; g.line(x, y, (x * 2 + x2) / 3, (y * 2 + y2) / 3, amber); });
  g = S.frame(4);
  hexPoints(16, 16, 15, 15).forEach(([x, y]) => g.px(x, y, dark));
  S.save('shield_ping');
}

/** Horizontal speed lines sweeping left → right (flip with scaleX for the other side). 5f @ 32px. */
function dodgeStreak() {
  const S = sheet(32, 32, 5);
  const head = hex('#eff6ff'), body = hex('#93c5fd'), tail = hex('#3b82f6', 170);
  const lines = [{ y: 8, off: 2, len: 12 }, { y: 12, off: 0, len: 18 }, { y: 16, off: 4, len: 14 }, { y: 20, off: 1, len: 20 }, { y: 24, off: 5, len: 10 }];
  for (let f = 0; f < 5; f++) {
    const g = S.frame(f);
    lines.forEach(l => {
      const hx = 6 + f * 6 + l.off;
      const len = Math.round(l.len * (f < 3 ? 1 : f === 3 ? 0.6 : 0.3));
      for (let i = 0; i < len; i++) {
        const x = hx - i;
        g.px(x, l.y, i === 0 ? head : i < len / 2 ? body : (x % 2 ? tail : null));
      }
    });
  }
  S.save('dodge_streak');
}

/** Gold coins popping out of a point and falling with gravity, with a sparkle. 7f @ 32px. */
function coinBurst() {
  const S = sheet(32, 32, 7);
  const edge = hex('#92400e'), body = hex('#facc15'), hi = hex('#fef9c3'), shade = hex('#ca8a04'), spark = hex('#ffffff');
  const r = rng(314);
  const coins = Array.from({ length: 7 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 6 - 0.5) * Math.PI * 1.1 + (r() - 0.5) * 0.3;
    const v = 2.3 + r() * 1.1;
    return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, spin: Math.floor(r() * 3) };
  });
  for (let f = 0; f < 7; f++) {
    const g = S.frame(f);
    if (f === 0) { g.disc(16, 20, 3, hi); g.disc(16, 20, 1, spark); }
    if (f === 1) [[0, -5], [0, 5], [-5, 0], [5, 0]].forEach(([x, y]) => g.px(16 + x, 20 + y, hi));
    coins.forEach(c => {
      if (f === 0) return;
      const t = f;
      const x = 16 + c.vx * t, y = 20 + c.vy * t + 0.42 * t * t;
      const phase = (f + c.spin) % 3; // 0 = face, 1 = three-quarter, 2 = edge-on
      if (phase === 0) {
        g.disc(x, y, 2, body); g.ring(x, y, 2, 2, edge); g.px(x - 1, y - 1, hi); g.px(x + 1, y + 1, shade);
      } else if (phase === 1) {
        for (let dy = -2; dy <= 2; dy++) { g.px(x - 1, y + dy, edge); g.px(x, y + dy, body); g.px(x + 1, y + dy, edge); }
        g.px(x, y - 1, hi);
      } else {
        for (let dy = -2; dy <= 2; dy++) g.px(x, y + dy, dy === -2 ? hi : shade);
      }
    });
  }
  S.save('coin_burst');
}

/** Level-up: a column of light shoots up, chevrons rise through it, sparkles scatter. 8f @ 32×48. */
function levelUp() {
  const S = sheet(32, 48, 8);
  const core = hex('#fffbeb'), beam = hex('#fde68a', 200), beamEdge = hex('#f59e0b', 150), chev = hex('#fef3c7'), chevEdge = hex('#d97706'), spark = hex('#ffffff');
  const r = rng(77);
  const sparks = Array.from({ length: 14 }, () => ({ x: 6 + r() * 20, y: 8 + r() * 36, f: Math.floor(r() * 8) }));
  const beamTop = [40, 22, 6, 0, 0, 0, 0, 0];
  const beamW = [2, 4, 5, 5, 4, 3, 2, 1];
  for (let f = 0; f < 8; f++) {
    const g = S.frame(f);
    // Beam grows up from the ground, then thins out.
    const w = beamW[f], top = beamTop[f];
    for (let y = top; y < 46; y++) {
      for (let dx = -w; dx <= w; dx++) {
        const edge = Math.abs(dx) === w;
        if (f >= 5 && (y + dx + f) % 2) continue; // dither out while fading
        g.px(16 + dx, y, edge ? beamEdge : Math.abs(dx) <= 1 ? core : beam);
      }
    }
    // Ground ring on the first frames.
    if (f < 4) g.ring(16, 45, 5 + f * 3, 1 + f * 0.6, f < 2 ? core : beamEdge, f >= 2);
    // Two chevrons rising through the beam.
    [0, 10].forEach(off => {
      const y = 40 - f * 5 - off;
      if (y < 2 || y > 44) return;
      for (let i = 0; i <= 4; i++) { g.px(16 - i, y + i, chev); g.px(16 + i, y + i, chev); g.px(16 - i, y + i + 1, chevEdge); g.px(16 + i, y + i + 1, chevEdge); }
    });
    sparks.forEach(sp => {
      if (sp.f === f) { g.px(sp.x, sp.y, spark); }
      if (sp.f === f - 1) [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([x, y]) => g.px(sp.x + x, sp.y + y, chev));
    });
  }
  S.save('level_up');
}

console.log(`Writing sprites to ${OUT_DIR}`);
hitSpark('hit_spark', ['#ffffff', '#fef08a', '#f97316', '#b91c1c']);
hitSpark('hit_spark_gold', ['#ffffff', '#fde68a', '#f59e0b', '#92400e']);
poison();
burn();
heal();
stunLoop();
shieldLoop();
shieldPing();
dodgeStreak();
coinBurst();
levelUp();
