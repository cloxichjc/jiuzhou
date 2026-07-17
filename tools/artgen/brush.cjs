'use strict';

/**
 * 水墨画笔基元库：种子随机、值噪声、画布混色、墨团晕染、
 * 枯笔描边（抖动 + 飞白）、层叠远山、有机多边形填充、竖向渐变 wash。
 * 全部基于 Float32 画布，导出时量化为 RGBA8。
 */

// ---------------------------------------------------------------- 随机与噪声

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 值噪声 + 分形叠加（fbm），返回值均在 0..1 */
function makeNoise(seed) {
  const rng = mulberry32(seed);
  const SIZE = 256;
  const MASK = SIZE - 1;
  const vals = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < vals.length; i++) vals[i] = rng();

  const smooth = (t) => t * t * (3 - 2 * t);
  const lattice = (ix, iy) => vals[(iy & MASK) * SIZE + (ix & MASK)];

  function noise2(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const v00 = lattice(ix, iy);
    const v10 = lattice(ix + 1, iy);
    const v01 = lattice(ix, iy + 1);
    const v11 = lattice(ix + 1, iy + 1);
    const sx = smooth(fx);
    const sy = smooth(fy);
    return (
      v00 +
      (v10 - v00) * sx +
      (v01 - v00) * sy +
      (v00 - v10 - v01 + v11) * sx * sy
    );
  }

  function fbm(x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * noise2(x * freq, y * freq);
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm;
  }

  return { noise2, fbm };
}

// ---------------------------------------------------------------- 画布

class Canvas {
  /** @param bg [r,g,b] 或 null（透明） */
  constructor(width, height, bg = null) {
    this.w = width;
    this.h = height;
    // r,g,b 存 0..255，a 存 0..1
    this.data = new Float32Array(width * height * 4);
    if (bg) {
      for (let i = 0; i < width * height; i++) {
        const o = i * 4;
        this.data[o] = bg[0];
        this.data[o + 1] = bg[1];
        this.data[o + 2] = bg[2];
        this.data[o + 3] = 1;
      }
    }
  }

  /** source-over 混合。color=[r,g,b]，sa=0..1 */
  blend(x, y, color, sa) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || sa <= 0) return;
    const o = (y * this.w + x) * 4;
    const d = this.data;
    const da = d[o + 3];
    const oa = sa + da * (1 - sa);
    if (oa <= 0) return;
    d[o] = (color[0] * sa + d[o] * da * (1 - sa)) / oa;
    d[o + 1] = (color[1] * sa + d[o + 1] * da * (1 - sa)) / oa;
    d[o + 2] = (color[2] * sa + d[o + 2] * da * (1 - sa)) / oa;
    d[o + 3] = oa;
  }

  /** 软边圆点 stamp。soft=0 硬边，1 全软 */
  disc(cx, cy, radius, color, alpha, soft = 0.5) {
    const r0 = radius * (1 - soft);
    const x0 = Math.max(0, Math.floor(cx - radius - 1));
    const x1 = Math.min(this.w - 1, Math.ceil(cx + radius + 1));
    const y0 = Math.max(0, Math.floor(cy - radius - 1));
    const y1 = Math.min(this.h - 1, Math.ceil(cy + radius + 1));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d >= radius) continue;
        const t = d <= r0 ? 1 : 1 - (d - r0) / (radius - r0);
        this.blend(x, y, color, alpha * t);
      }
    }
  }

  toRGBA8() {
    const out = new Uint8ClampedArray(this.w * this.h * 4);
    for (let i = 0; i < this.w * this.h; i++) {
      const o = i * 4;
      out[o] = Math.round(this.data[o]);
      out[o + 1] = Math.round(this.data[o + 1]);
      out[o + 2] = Math.round(this.data[o + 2]);
      out[o + 3] = Math.round(this.data[o + 3] * 255);
    }
    return out;
  }
}

// ---------------------------------------------------------------- 基础图元

/** 竖向渐变 wash：y0 处 alpha=aTop，y1 处 alpha=aBottom */
function vwash(cv, y0, y1, color, aTop, aBottom) {
  const yy0 = Math.max(0, Math.floor(y0));
  const yy1 = Math.min(cv.h - 1, Math.ceil(y1));
  for (let y = yy0; y <= yy1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0);
    const a = aTop + (aBottom - aTop) * Math.min(1, Math.max(0, t));
    for (let x = 0; x < cv.w; x++) cv.blend(x, y, color, a);
  }
}

/** 纸纹颗粒：按 fbm 微调已有着色像素的亮度 */
function grain(cv, seed, amount = 0.05, scale = 0.35) {
  const nz = makeNoise(seed);
  for (let y = 0; y < cv.h; y++) {
    for (let x = 0; x < cv.w; x++) {
      const o = (y * cv.w + x) * 4;
      if (cv.data[o + 3] <= 0) continue;
      const n = nz.fbm(x * scale, y * scale, 3) - 0.5;
      const f = 1 + n * amount * 2;
      cv.data[o] *= f;
      cv.data[o + 1] *= f;
      cv.data[o + 2] *= f;
    }
  }
}

// ---------------------------------------------------------------- 墨团晕染

/**
 * 径向衰减墨团：边缘用噪声扭曲出自然洇开感，内部有墨色浓淡纹理。
 * opts: color, density(0..1), seed, noiseScale, rough(边缘起伏幅度),
 *       coreRatio(浓墨核心占比), texture(内部纹理强度), aspect(椭圆拉伸 [sx,sy]), angle
 */
function inkBloom(cv, cx, cy, R, opts = {}) {
  const color = opts.color || [43, 43, 47];
  const density = opts.density ?? 0.85;
  const noiseScale = opts.noiseScale ?? 0.012;
  const rough = opts.rough ?? 0.35;
  const coreRatio = opts.coreRatio ?? 0.5;
  const texture = opts.texture ?? 0.45;
  const aspect = opts.aspect || [1, 1];
  const ang = opts.angle || 0;
  const cosA = Math.cos(ang);
  const sinA = Math.sin(ang);
  const nz = makeNoise(opts.seed ?? 1);
  const nz2 = makeNoise((opts.seed ?? 1) + 101);

  const reach = R * 1.3 * Math.max(aspect[0], aspect[1]);
  const x0 = Math.max(0, Math.floor(cx - reach));
  const x1 = Math.min(cv.w - 1, Math.ceil(cx + reach));
  const y0 = Math.max(0, Math.floor(cy - reach));
  const y1 = Math.min(cv.h - 1, Math.ceil(cy + reach));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let dx = x - cx;
      let dy = y - cy;
      const rx = (dx * cosA + dy * sinA) / aspect[0];
      const ry = (-dx * sinA + dy * cosA) / aspect[1];
      const d = Math.hypot(rx, ry);
      const n = nz.fbm(x * noiseScale, y * noiseScale, 4);
      const edge = R * (1 + rough * (n - 0.5) * 2);
      const t = d / Math.max(1e-6, edge);
      if (t > 1.15) continue;
      let a;
      if (t < coreRatio) {
        a = density;
      } else {
        a = density * Math.pow(Math.max(0, 1 - (t - coreRatio) / (1.15 - coreRatio)), 1.7);
      }
      if (texture > 0) {
        a *= 1 - texture + texture * nz2.fbm(x * noiseScale * 3.1, y * noiseScale * 3.1, 3);
      }
      if (a > 0.003) cv.blend(x, y, color, Math.min(1, a));
    }
  }
}

// ---------------------------------------------------------------- 枯笔描边

function pathLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return L;
}

/**
 * 沿路径的变宽度枯笔描边。
 * pts: [[x,y],...]
 * opts: width, color, alpha, seed, jitter(垂直抖动/宽度比), flyWhite(飞白断续概率),
 *       widthFn(t)->0..1 宽度包络, flyFn(t)->概率倍率, splatter(飞沫概率), soft
 */
function strokePath(cv, pts, opts = {}) {
  if (pts.length < 2) return;
  const width = opts.width ?? 8;
  const color = opts.color || [43, 43, 47];
  const alpha = opts.alpha ?? 0.85;
  const jitter = opts.jitter ?? 0.3;
  const flyWhite = opts.flyWhite ?? 0.2;
  const soft = opts.soft ?? 0.6;
  const rng = mulberry32(opts.seed ?? 1);
  const nz = makeNoise((opts.seed ?? 1) + 31);

  const total = pathLength(pts);
  const step = Math.max(0.7, width * 0.16);
  let dist = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const segLen = Math.hypot(bx - ax, by - ay);
    if (segLen <= 0) continue;
    const dx = (bx - ax) / segLen;
    const dy = (by - ay) / segLen;
    for (let s = 0; s < segLen; s += step) {
      const t = (dist + s) / total;
      let w = width * (opts.widthFn ? opts.widthFn(t) : 1);
      if (w < 0.4) continue;
      const fw = flyWhite * (opts.flyFn ? opts.flyFn(t) : 1);
      if (rng() < fw) continue; // 飞白：断续
      const j = (rng() * 2 - 1) * w * jitter;
      const px = ax + dx * s - dy * j;
      const py = ay + dy * s + dx * j;
      const na = 0.5 + 0.5 * nz.noise2(px * 0.06, py * 0.06);
      cv.disc(px, py, w / 2, color, Math.min(1, alpha * (0.55 + 0.45 * na)), soft);
      if (opts.splatter && rng() < opts.splatter) {
        const sa = 3 + rng() * w * 1.6;
        cv.disc(
          px - dy * (rng() * 2 - 1) * sa,
          py + dx * (rng() * 2 - 1) * sa,
          0.6 + rng() * 1.6,
          color,
          alpha * 0.8,
          0.5
        );
      }
    }
    dist += segLen;
  }
}

/** 二次贝塞尔采样为折线 */
function quadBezier(p0, p1, p2, segments = 24) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    pts.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]);
  }
  return pts;
}

/** 圆弧采样为折线。角度弧度制 */
function arcPoints(cx, cy, r, a0, a1, segments = 32, rJitter = 0, seed = 1) {
  const rng = mulberry32(seed);
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = a0 + (a1 - a0) * (i / segments);
    const rr = r + (rJitter ? (rng() * 2 - 1) * rJitter : 0);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
}

// ---------------------------------------------------------------- 多边形填充

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const L2 = dx * dx + dy * dy;
  let t = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function distToPoly(x, y, poly) {
  let m = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    m = Math.min(m, distToSegment(x, y, poly[j][0], poly[j][1], poly[i][0], poly[i][1]));
  }
  return m;
}

/**
 * 有机边缘多边形填充：边界被噪声推移，内部有墨色浓淡。
 * opts: soft(边缘软化 px), edgeNoise(边界噪声幅度 px), texture, seed, alpha
 */
function fillPoly(cv, poly, color, opts = {}) {
  const alpha = opts.alpha ?? 0.85;
  const soft = opts.soft ?? 2.5;
  const edgeNoise = opts.edgeNoise ?? 6;
  const texture = opts.texture ?? 0.3;
  const nz = makeNoise(opts.seed ?? 1);
  const nz2 = makeNoise((opts.seed ?? 1) + 53);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of poly) {
    minX = Math.min(minX, px); maxX = Math.max(maxX, px);
    minY = Math.min(minY, py); maxY = Math.max(maxY, py);
  }
  const pad = soft + edgeNoise + 2;
  const x0 = Math.max(0, Math.floor(minX - pad));
  const x1 = Math.min(cv.w - 1, Math.ceil(maxX + pad));
  const y0 = Math.max(0, Math.floor(minY - pad));
  const y1 = Math.min(cv.h - 1, Math.ceil(maxY + pad));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dEdge = distToPoly(x, y, poly);
      const inside = pointInPoly(x, y, poly);
      if (!inside && dEdge > pad) continue;
      const push = (nz.fbm(x * 0.05, y * 0.05, 3) - 0.5) * 2 * edgeNoise;
      // signedDist > 0 表示在形内
      const signedDist = (inside ? dEdge : -dEdge) + push;
      const cover = Math.max(0, Math.min(1, signedDist / (soft * 2) + 0.5));
      if (cover <= 0) continue;
      let a = alpha * cover;
      if (texture > 0) {
        a *= 1 - texture + texture * nz2.fbm(x * 0.045, y * 0.045, 3);
      }
      if (a > 0.003) cv.blend(x, y, color, Math.min(1, a));
    }
  }
}

// ---------------------------------------------------------------- 远山

/**
 * 一层山脊：ridgeY = yBase - fbm*amp，自脊线向下渐变填色（上浓下淡入雾）。
 * opts: color, alpha, amp, scale, seed, fade(向下淡化距离), ridge(脊线加深),
 *       x0, x1, yBottom
 */
function mountainLayer(cv, opts = {}) {
  const yBase = opts.yBase ?? cv.h * 0.7;
  const amp = opts.amp ?? 140;
  const scale = opts.scale ?? 0.004;
  const color = opts.color || [43, 43, 47];
  const alpha = opts.alpha ?? 0.2;
  const fade = opts.fade ?? 240;
  const seed = opts.seed ?? 1;
  const x0 = opts.x0 ?? 0;
  const x1 = opts.x1 ?? cv.w;
  const yBottom = opts.yBottom ?? cv.h;
  const nz = makeNoise(seed);
  const nzTex = makeNoise(seed + 77);

  const ridgePts = [];
  for (let x = x0; x <= x1; x += 2) {
    const n = nz.fbm(x * scale, seed * 0.37, 4);
    const n2 = nz.fbm(x * scale * 3.1, seed * 0.91, 2);
    const ridgeY = yBase - n * amp - (n2 - 0.5) * amp * 0.18;
    ridgePts.push([x, ridgeY]);
    const yy0 = Math.max(0, Math.floor(ridgeY));
    const yy1 = Math.min(yBottom, ridgeY + fade);
    for (let y = yy0; y <= yy1; y++) {
      const t = (y - ridgeY) / fade;
      let a = alpha * Math.pow(1 - t, 1.5);
      a *= 0.7 + 0.6 * nzTex.fbm(x * 0.02, y * 0.02, 3);
      if (a > 0.003) cv.blend(x, y, color, Math.min(1, a));
    }
  }
  // 脊线皴笔：一条飞白较少的细枯笔
  if (opts.ridge !== false) {
    strokePath(cv, ridgePts, {
      width: opts.ridgeWidth ?? 2.2,
      color,
      alpha: Math.min(1, alpha * 2.6),
      seed: seed + 5,
      jitter: 0.25,
      flyWhite: 0.12,
      soft: 0.55,
    });
  }
}

/** 雾带：宣纸色横向罩染，把远山“拦腰断开” */
function fogBand(cv, y0, y1, paperColor, alpha = 0.5, seed = 1) {
  const nz = makeNoise(seed);
  for (let y = Math.max(0, y0); y <= Math.min(cv.h - 1, y1); y++) {
    const t = (y - y0) / Math.max(1, y1 - y0);
    const band = Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
    for (let x = 0; x < cv.w; x++) {
      const n = nz.fbm(x * 0.008, y * 0.03, 3);
      const a = alpha * band * (0.5 + 0.5 * n);
      if (a > 0.003) cv.blend(x, y, paperColor, Math.min(1, a));
    }
  }
}

// ---------------------------------------------------------------- 羽毛

/**
 * 羽毛：弧形羽轴 + 两侧羽枝（向后掠的细枯笔）。
 */
function feather(cv, bx, by, len, angle, color, opts = {}) {
  const alpha = opts.alpha ?? 0.6;
  const seed = opts.seed ?? 1;
  const rng = mulberry32(seed);
  const curve = opts.curve ?? len * 0.25;
  const dir = [Math.cos(angle), Math.sin(angle)];
  const perp = [-dir[1], dir[0]];
  const p0 = [bx, by];
  const p2 = [bx + dir[0] * len, by + dir[1] * len];
  const p1 = [
    bx + dir[0] * len * 0.5 + perp[0] * curve,
    by + dir[1] * len * 0.5 + perp[1] * curve,
  ];
  const shaft = quadBezier(p0, p1, p2, 26);

  // 羽枝
  for (let i = 3; i < shaft.length - 2; i++) {
    const t = i / (shaft.length - 1);
    const [sx, sy] = shaft[i];
    const [nx, ny] = shaft[i + 1];
    const sdir = [nx - sx, ny - sy];
    const sLen = Math.hypot(sdir[0], sdir[1]) || 1;
    sdir[0] /= sLen;
    sdir[1] /= sLen;
    const barbLen = Math.sin(Math.PI * Math.min(1, t * 1.05)) * len * 0.17;
    for (const side of [1, -1]) {
      if (rng() < 0.15) continue;
      // 羽枝方向：垂直于轴并略向根部倾斜
      const ba = Math.atan2(sdir[1], sdir[0]) + side * (Math.PI / 2 + 0.5);
      const bx2 = sx + Math.cos(ba) * barbLen * (0.7 + rng() * 0.5);
      const by2 = sy + Math.sin(ba) * barbLen * (0.7 + rng() * 0.5);
      strokePath(cv, [[sx, sy], [bx2, by2]], {
        width: 1.6,
        color,
        alpha: alpha * 0.55,
        seed: seed * 1000 + i * 7 + (side + 1),
        jitter: 0.15,
        flyWhite: 0.3,
        soft: 0.5,
      });
    }
  }
  // 羽轴（后画，压得住羽枝）
  strokePath(cv, shaft, {
    width: opts.shaftWidth ?? 2.4,
    color,
    alpha,
    seed: seed + 9,
    jitter: 0.1,
    flyWhite: 0.08,
    widthFn: (t) => 1 - t * 0.6,
  });
}

/** 墨点飞溅环（墨团边缘的装饰飞沫） */
function speckles(cv, cx, cy, rMin, rMax, count, color, opts = {}) {
  const rng = mulberry32(opts.seed ?? 1);
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const r = rMin + rng() * (rMax - rMin);
    const size = (opts.size ?? 2.5) * (0.3 + rng());
    cv.disc(
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r,
      size,
      color,
      (opts.alpha ?? 0.5) * (0.4 + rng() * 0.6),
      0.55
    );
  }
}

module.exports = {
  mulberry32,
  makeNoise,
  Canvas,
  vwash,
  grain,
  inkBloom,
  strokePath,
  quadBezier,
  arcPoints,
  fillPoly,
  mountainLayer,
  fogBand,
  feather,
  speckles,
};
