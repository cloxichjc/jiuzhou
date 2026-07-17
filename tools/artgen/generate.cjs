'use strict';

/**
 * 水墨国风美术资源生成器。
 * 用法: node tools/artgen/generate.js
 * 输出: public/art/*.png（15 张，Phaser 经 assets.ts preload）
 *
 * 美学约束：留白为主、墨色为骨、一色点睛。
 * 底色宣纸 #f2ecdf，墨 #2b2b2f；点缀色：朱砂 #a83a2a / 青黛 #3d4f5f / 鎏金 #b8963e。
 * 背景按 2x（780x1688）生成，游戏里以 390x844 显示，保证 retina 清晰。
 */

const fs = require('fs');
const path = require('path');
const { encodePNG } = require('./png.cjs');
const {
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
} = require('./brush.cjs');

const PAPER = [242, 236, 223];
const INK = [43, 43, 47];
const INK_DEEP = [30, 30, 34];
const ZHU = [168, 58, 42]; // 朱砂
const QING = [61, 79, 95]; // 青黛

const OUT_DIR = path.join(__dirname, '..', '..', 'public', 'art');

// 背景画布 780x1688（逻辑 390x844 的 2x）；以 720x1280 构图坐标等比换算
const BG_W = 780;
const BG_H = 1688;
const SX = BG_W / 720;
const SY = BG_H / 1280;
const X = (v) => Math.round(v * SX);
const Y = (v) => Math.round(v * SY);

function save(cv, name) {
  const png = encodePNG(cv.w, cv.h, cv.toRGBA8());
  fs.writeFileSync(path.join(OUT_DIR, name), png);
  console.log(`  ${name}  ${cv.w}x${cv.h}  ${(png.length / 1024).toFixed(1)}KB`);
}

/** 宣纸底 + 纸纹颗粒 */
function paperBase(w, h, seed) {
  const cv = new Canvas(w, h, PAPER);
  grain(cv, seed, 0.045, 0.32);
  return cv;
}

// ================================================================ 背景

/** bg_title 780x1688：标题页背景——大片留白 + 极淡远山，给题字留呼吸位 */
function genBgTitle() {
  const cv = paperBase(BG_W, BG_H, 1501);

  // 四角极淡墨晕
  const corners = [
    [X(40), Y(60), Y(300), 11],
    [X(690), Y(90), Y(260), 12],
    [X(60), Y(1210), Y(280), 13],
    [X(680), Y(1200), Y(240), 14],
  ];
  for (const [x, y, R, seed] of corners) {
    inkBloom(cv, x, y, R, {
      color: INK, density: 0.05, seed, noiseScale: 0.01, rough: 0.5,
      coreRatio: 0.35, texture: 0.5,
    });
  }

  // 只在底部压两层很淡的山，上部全留白
  mountainLayer(cv, {
    yBase: Y(1080), amp: Y(150), scale: 0.0032, alpha: 0.08, fade: Y(190),
    seed: 41, ridgeWidth: 1.8,
  });
  fogBand(cv, Y(1030), Y(1140), PAPER, 0.45, 43);
  mountainLayer(cv, {
    yBase: Y(1210), amp: Y(220), scale: 0.0046, alpha: 0.16, fade: Y(280),
    seed: 44, ridgeWidth: 2.4, yBottom: BG_H,
  });

  // 飞鸟两笔（点景，落在留白区下缘）
  for (const [bx, by, s, sd] of [[X(500), Y(760), 15, 31], [X(552), Y(732), 10, 33]]) {
    strokePath(cv, quadBezier([bx - s, by], [bx - s * 0.4, by - s * 0.7], [bx, by + s * 0.2], 8), {
      width: 2, color: INK, alpha: 0.4, seed: sd, flyWhite: 0.05, soft: 0.5,
    });
    strokePath(cv, quadBezier([bx, by + s * 0.2], [bx + s * 0.4, by - s * 0.7], [bx + s, by], 8), {
      width: 2, color: INK, alpha: 0.4, seed: sd + 1, flyWhite: 0.05, soft: 0.5,
    });
  }

  grain(cv, 1502, 0.02, 0.08);
  save(cv, 'bg_title.png');
}

/** bg_battle 780x1688：战斗背景——宣纸底 + 下半部层叠远山 + 留白雾气，不透明 */
function genBgBattle() {
  const cv = paperBase(BG_W, BG_H, 2001);

  // 极远一抹山影
  mountainLayer(cv, {
    yBase: Y(700), amp: Y(90), scale: 0.003, alpha: 0.05, fade: Y(150),
    seed: 21, ridge: false,
  });

  // 飞鸟两笔（人字点景）
  for (const [bx, by, s, sd] of [[X(500), Y(330), 13, 31], [X(548), Y(306), 9, 32]]) {
    strokePath(cv, quadBezier([bx - s, by], [bx - s * 0.4, by - s * 0.7], [bx, by + s * 0.2], 8), {
      width: 2, color: INK, alpha: 0.4, seed: sd, flyWhite: 0.05, soft: 0.5,
    });
    strokePath(cv, quadBezier([bx, by + s * 0.2], [bx + s * 0.4, by - s * 0.7], [bx + s, by], 8), {
      width: 2, color: INK, alpha: 0.4, seed: sd + 1, flyWhite: 0.05, soft: 0.5,
    });
  }

  // 远山（最淡）
  mountainLayer(cv, {
    yBase: Y(850), amp: Y(150), scale: 0.0032, alpha: 0.1, fade: Y(190),
    seed: 22, ridgeWidth: 1.8,
  });
  fogBand(cv, Y(800), Y(920), PAPER, 0.45, 23);

  // 中山
  mountainLayer(cv, {
    yBase: Y(1000), amp: Y(190), scale: 0.0042, alpha: 0.18, fade: Y(230),
    seed: 24, ridgeWidth: 2.2,
  });
  fogBand(cv, Y(950), Y(1060), PAPER, 0.5, 25);

  // 近山（最浓，压在底部）
  mountainLayer(cv, {
    yBase: Y(1180), amp: Y(260), scale: 0.005, alpha: 0.34, fade: Y(320),
    seed: 26, ridgeWidth: 3, yBottom: BG_H,
  });

  // 山脚淡墨 grounding
  vwash(cv, Y(1150), BG_H, INK, 0.0, 0.06);
  grain(cv, 2002, 0.015, 0.1);
  save(cv, 'bg_battle.png');
}

// ================================================================ 人物立绘

/**
 * 共用：头部墨团 + 简单颈肩。
 */
function headAndNeck(cv, hx, hy, r, seed, alpha = 0.9) {
  inkBloom(cv, hx, hy, r, {
    color: INK, density: alpha, seed, noiseScale: 0.03, rough: 0.22,
    coreRatio: 0.55, texture: 0.3,
  });
  strokePath(cv, [[hx, hy + r * 0.8], [hx - 2, hy + r * 1.6]], {
    width: r * 0.45, color: INK, alpha: alpha * 0.9, seed: seed + 1,
    jitter: 0.15, flyWhite: 0.08,
  });
}

/** portrait_asu 512x512：阿苏勒——厚重沉稳，狼首意象，青黛点缀 */
function genPortraitAsu() {
  const cv = new Canvas(512, 512, null);
  const S = 3000;

  // 草原底座：两笔厚重的横向枯笔
  strokePath(cv, quadBezier([96, 428], [250, 408], [420, 430], 20), {
    width: 22, color: INK, alpha: 0.8, seed: S + 1, jitter: 0.3,
    flyWhite: 0.3, widthFn: (t) => Math.sin(Math.PI * Math.min(1, t * 1.08)),
    splatter: 0.04,
  });
  strokePath(cv, quadBezier([130, 452], [260, 440], [400, 456], 16), {
    width: 10, color: INK, alpha: 0.55, seed: S + 2, jitter: 0.35, flyWhite: 0.4,
  });

  // 袍服身躯：宽肩厚背的大块墨
  fillPoly(cv, [
    [176, 218], [228, 196], [292, 196], [344, 220],
    [366, 300], [358, 420], [168, 420], [156, 300],
  ], INK, { alpha: 0.88, soft: 4, edgeNoise: 10, texture: 0.35, seed: S + 3 });
  // 袍服下摆枯笔扫边
  strokePath(cv, [[168, 418], [250, 428], [358, 416]], {
    width: 9, color: INK, alpha: 0.7, seed: S + 4, jitter: 0.4, flyWhite: 0.45,
  });

  // 毛皮领：肩部一圈短促笔触（北陆风霜感）
  const rng = mulberry32(S + 5);
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const x = 176 + (344 - 176) * t + (rng() * 2 - 1) * 8;
    const y = 214 - Math.sin(Math.PI * t) * 14 + (rng() * 2 - 1) * 6;
    const a = Math.PI / 2 + (rng() * 2 - 1) * 0.9;
    const len = 14 + rng() * 16;
    strokePath(cv, [[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]], {
      width: 4.5, color: INK, alpha: 0.75, seed: S + 6 + i, jitter: 0.2, flyWhite: 0.25,
    });
  }

  // 头
  headAndNeck(cv, 258, 158, 36, S + 40, 0.92);

  // 青黛束发带（点缀色）
  strokePath(cv, [[222, 146], [258, 138], [294, 146]], {
    width: 7, color: QING, alpha: 0.95, seed: S + 41, jitter: 0.1, flyWhite: 0.06,
  });
  // 发带飘梢
  strokePath(cv, quadBezier([292, 148], [320, 168], [312, 205], 10), {
    width: 4, color: QING, alpha: 0.85, seed: S + 42, jitter: 0.2, flyWhite: 0.15,
    widthFn: (t) => 1 - t * 0.7,
  });

  // 狼首意象（右肩旁，淡一档的墨，吻部朝右外挑）
  const wx = 388, wy = 318;
  inkBloom(cv, wx, wy, 44, {
    color: INK, density: 0.7, seed: S + 50, noiseScale: 0.035, rough: 0.25,
    coreRatio: 0.5, texture: 0.35, aspect: [1.15, 0.95], angle: -0.3,
  });
  // 狼耳两笔窄长三角（更挺更尖）
  fillPoly(cv, [[wx - 32, wy - 26], [wx - 24, wy - 72], [wx - 10, wy - 30]], INK, {
    alpha: 0.78, soft: 2, edgeNoise: 3, texture: 0.2, seed: S + 51,
  });
  fillPoly(cv, [[wx + 2, wy - 30], [wx + 18, wy - 70], [wx + 28, wy - 24]], INK, {
    alpha: 0.78, soft: 2, edgeNoise: 3, texture: 0.2, seed: S + 52,
  });
  // 狼吻：朝右的尖三角 + 吻端一点重墨
  fillPoly(cv, [[wx + 26, wy - 6], [wx + 66, wy + 10], [wx + 28, wy + 18]], INK, {
    alpha: 0.75, soft: 2, edgeNoise: 3, texture: 0.2, seed: S + 53,
  });
  cv.disc(wx + 62, wy + 10, 3.2, INK_DEEP, 0.85, 0.4);
  // 狼眼下一点留白后的重墨
  cv.disc(wx + 6, wy - 6, 3.4, INK_DEEP, 0.9, 0.4);

  speckles(cv, 256, 430, 150, 210, 8, INK, { seed: S + 60, alpha: 0.3, size: 2 });
  save(cv, 'portrait_asu.png');
}

/** portrait_xiyan 512x512：息衍——不世名将，重墨稳构 + 斜持长剑 + 青黛雷纹 */
function genPortraitXiyan() {
  const cv = new Canvas(512, 512, null);
  const S = 6000;

  // 基座：一笔沉实的横扫（比姬野更稳）
  strokePath(cv, quadBezier([110, 440], [256, 424], [402, 442], 18), {
    width: 18, color: INK, alpha: 0.75, seed: S + 1, jitter: 0.25, flyWhite: 0.3,
    widthFn: (t) => Math.sin(Math.PI * Math.min(1, t * 1.05)), splatter: 0.03,
  });

  // 身躯：端方厚重的甲衣墨块（比阿苏勒略窄、更挺拔）
  fillPoly(cv, [
    [200, 210], [240, 190], [280, 190], [322, 212],
    [340, 300], [332, 428], [188, 428], [180, 300],
  ], INK, { alpha: 0.9, soft: 4, edgeNoise: 8, texture: 0.3, seed: S + 3 });

  // 甲缘一道枯笔压边
  strokePath(cv, [[188, 426], [260, 434], [332, 424]], {
    width: 8, color: INK, alpha: 0.65, seed: S + 4, jitter: 0.35, flyWhite: 0.4,
  });

  // 头：端正略沉
  headAndNeck(cv, 260, 150, 34, S + 5, 0.92);
  // 束发小髻
  strokePath(cv, [[246, 122], [260, 108], [274, 122]], {
    width: 8, color: INK, alpha: 0.85, seed: S + 6, jitter: 0.15, flyWhite: 0.1,
  });

  // 长剑：斜持于身侧（比姬野的枪短、更沉），剑尖朝下
  strokePath(cv, [[332, 210], [366, 330], [392, 428]], {
    width: 10, color: INK_DEEP, alpha: 0.92, seed: S + 7, jitter: 0.1, flyWhite: 0.12,
    widthFn: (t) => 1 - t * 0.55,
  });
  // 剑格横笔
  strokePath(cv, [[318, 216], [348, 206]], {
    width: 7, color: INK_DEEP, alpha: 0.9, seed: S + 8, jitter: 0.1, flyWhite: 0.1,
  });

  // 雷纹：肩头三段折笔（青黛点缀，「雷动九天」的名将意象）
  const bolt = (ox, oy, scale, seed) => {
    strokePath(cv, [
      [ox, oy],
      [ox + 12 * scale, oy + 10 * scale],
      [ox + 4 * scale, oy + 16 * scale],
      [ox + 16 * scale, oy + 28 * scale],
    ], {
      width: 4, color: QING, alpha: 0.9, seed, jitter: 0.1, flyWhite: 0.08,
    });
  };
  bolt(206, 224, 1, S + 9);
  bolt(226, 218, 0.8, S + 10);
  bolt(292, 222, 0.9, S + 11);

  speckles(cv, 256, 430, 150, 210, 8, INK, { seed: S + 60, alpha: 0.28, size: 2 });
  save(cv, 'portrait_xiyan.png');
}

/** portrait_jiye 512x512：姬野——锋利，长枪斜线，朱砂点缀 */
function genPortraitJiye() {
  const cv = new Canvas(512, 512, null);
  const S = 4000;

  // 起势：脚下两笔短促斜扫（烈性）
  strokePath(cv, [[120, 452], [240, 428]], {
    width: 10, color: INK, alpha: 0.6, seed: S + 1, jitter: 0.4, flyWhite: 0.5,
    widthFn: (t) => 1 - t * 0.6,
  });
  strokePath(cv, [[300, 440], [420, 462]], {
    width: 8, color: INK, alpha: 0.5, seed: S + 2, jitter: 0.4, flyWhite: 0.5,
    widthFn: (t) => 1 - t * 0.7,
  });

  // 身躯：拧转的窄长墨块（向前倾）
  fillPoly(cv, [
    [226, 205], [272, 192], [308, 232], [296, 330],
    [318, 428], [282, 434], [252, 336], [212, 300],
  ], INK, { alpha: 0.85, soft: 3.5, edgeNoise: 8, texture: 0.3, seed: S + 3 });

  // 蹬出的腿：两笔折角（弓步），宽厚墨块避免细杆感
  strokePath(cv, [[252, 340], [205, 395], [172, 452]], {
    width: 26, color: INK, alpha: 0.85, seed: S + 4, jitter: 0.2, flyWhite: 0.25,
    widthFn: (t) => 1 - t * 0.4,
  });
  strokePath(cv, [[284, 345], [330, 398], [372, 440]], {
    width: 24, color: INK, alpha: 0.8, seed: S + 5, jitter: 0.2, flyWhite: 0.3,
    widthFn: (t) => 1 - t * 0.45,
  });

  // 头：略仰
  headAndNeck(cv, 258, 150, 36, S + 6, 0.9);

  // 持枪臂：伸向枪杆的一笔
  strokePath(cv, [[286, 235], [330, 250], [352, 258]], {
    width: 11, color: INK, alpha: 0.85, seed: S + 7, jitter: 0.2, flyWhite: 0.25,
  });

  // 长枪：贯穿画面的斜线（从右下向左上送出）
  strokePath(cv, [[438, 470], [352, 258], [98, 92]], {
    width: 7.5, color: INK_DEEP, alpha: 0.95, seed: S + 8, jitter: 0.08, flyWhite: 0.1,
    soft: 0.45, widthFn: (t) => 0.75 + 0.25 * Math.sin(Math.PI * t),
  });
  // 枪锋：小三角
  fillPoly(cv, [[98, 92], [62, 58], [84, 102], [58, 84]], INK_DEEP, {
    alpha: 0.95, soft: 1.5, edgeNoise: 2.5, texture: 0.15, seed: S + 9,
  });
  // 枪缨：朱砂数笔（点缀色，在枪锋下方）
  const rng = mulberry32(S + 10);
  for (let i = 0; i < 7; i++) {
    const a = 2.2 + rng() * 1.2;
    const len = 16 + rng() * 18;
    strokePath(cv, [
      [104, 102],
      [104 + Math.cos(a) * len, 102 + Math.sin(a) * len],
    ], {
      width: 3.2, color: ZHU, alpha: 0.9, seed: S + 11 + i, jitter: 0.3, flyWhite: 0.2,
      widthFn: (t) => 1 - t * 0.7,
    });
  }
  inkBloom(cv, 104, 102, 9, {
    color: ZHU, density: 0.85, seed: S + 20, noiseScale: 0.06, rough: 0.3,
    coreRatio: 0.5, texture: 0.3,
  });

  // 风势：两道凌厉短墨（斜向呼应枪线）
  strokePath(cv, [[350, 140], [428, 108]], {
    width: 5, color: INK, alpha: 0.4, seed: S + 21, jitter: 0.3, flyWhite: 0.45,
    widthFn: (t) => Math.sin(Math.PI * t),
  });
  strokePath(cv, [[80, 320], [150, 288]], {
    width: 4, color: INK, alpha: 0.35, seed: S + 22, jitter: 0.3, flyWhite: 0.45,
    widthFn: (t) => Math.sin(Math.PI * t),
  });

  save(cv, 'portrait_jiye.png');
}

/** portrait_yuran 512x512：羽然——轻灵，弧线与羽毛，黛蓝点缀 */
function genPortraitYuran() {
  const cv = new Canvas(512, 512, null);
  const S = 5000;
  const LIGHT = [58, 58, 64]; // 比纯墨淡一档

  // 裙摆：两片大弧（主体用墨，保持轻盈感靠弧线而非减淡）
  strokePath(cv, quadBezier([256, 300], [150, 380], [168, 470], 24), {
    width: 18, color: INK, alpha: 0.78, seed: S + 1, jitter: 0.35, flyWhite: 0.3,
    widthFn: (t) => Math.sin(Math.PI * (0.3 + t * 0.7)),
  });
  strokePath(cv, quadBezier([262, 302], [372, 376], [352, 468], 24), {
    width: 18, color: INK, alpha: 0.78, seed: S + 2, jitter: 0.35, flyWhite: 0.3,
    widthFn: (t) => Math.sin(Math.PI * (0.3 + t * 0.7)),
  });
  // 裙底淡墨团
  inkBloom(cv, 258, 452, 62, {
    color: LIGHT, density: 0.45, seed: S + 3, noiseScale: 0.03, rough: 0.4,
    coreRatio: 0.4, texture: 0.5, aspect: [1.6, 0.6],
  });

  // 上身：一抹窄弧
  strokePath(cv, quadBezier([252, 208], [238, 260], [256, 312], 16), {
    width: 24, color: INK, alpha: 0.82, seed: S + 4, jitter: 0.25, flyWhite: 0.2,
    widthFn: (t) => Math.sin(Math.PI * (0.2 + t * 0.8)),
  });

  // 广袖：向两侧飘起的长弧
  strokePath(cv, quadBezier([244, 238], [160, 230], [108, 292], 20), {
    width: 14, color: INK, alpha: 0.75, seed: S + 5, jitter: 0.3, flyWhite: 0.25,
    widthFn: (t) => 1 - t * 0.55, splatter: 0.03,
  });
  strokePath(cv, quadBezier([268, 236], [352, 218], [408, 272], 20), {
    width: 14, color: INK, alpha: 0.75, seed: S + 6, jitter: 0.3, flyWhite: 0.25,
    widthFn: (t) => 1 - t * 0.55, splatter: 0.03,
  });

  // 飘带：两条长弧线（灵动的主要来源）
  strokePath(cv, quadBezier([262, 250], [360, 300], [330, 430], 28), {
    width: 6, color: LIGHT, alpha: 0.5, seed: S + 7, jitter: 0.3, flyWhite: 0.35,
    widthFn: (t) => Math.sin(Math.PI * t) * (1 - t * 0.3),
  });
  strokePath(cv, quadBezier([246, 256], [150, 310], [186, 442], 28), {
    width: 5, color: LIGHT, alpha: 0.45, seed: S + 8, jitter: 0.3, flyWhite: 0.35,
    widthFn: (t) => Math.sin(Math.PI * t) * (1 - t * 0.3),
  });

  // 头与发髻（头部加重，成为视觉锚点）
  inkBloom(cv, 256, 168, 32, {
    color: INK, density: 0.88, seed: S + 9, noiseScale: 0.035, rough: 0.2,
    coreRatio: 0.55, texture: 0.3,
  });
  strokePath(cv, quadBezier([244, 146], [232, 112], [252, 96], 10), {
    width: 7, color: INK, alpha: 0.8, seed: S + 10, jitter: 0.25, flyWhite: 0.15,
    widthFn: (t) => 1 - t * 0.5,
  });

  // 羽毛三片（羽族意象，淡墨保持轻灵）
  feather(cv, 352, 148, 74, -0.5, LIGHT, { seed: S + 20, alpha: 0.75, curve: 18 });
  feather(cv, 392, 208, 60, 0.25, LIGHT, { seed: S + 21, alpha: 0.7, curve: 14 });
  feather(cv, 128, 176, 64, Math.PI + 0.45, LIGHT, { seed: S + 22, alpha: 0.7, curve: 16 });

  // 黛蓝点缀：腰间一抹
  strokePath(cv, quadBezier([232, 296], [258, 304], [284, 294], 10), {
    width: 8, color: QING, alpha: 0.9, seed: S + 30, jitter: 0.15, flyWhite: 0.1,
  });
  // 羽尖一点黛蓝
  cv.disc(384, 132, 4, QING, 0.85, 0.5);

  save(cv, 'portrait_yuran.png');
}

// ================================================================ 敌人意象（256x256）

/** enemy_melee：山贼刀手——刀 + 粗砺墨块 */
function genEnemyMelee() {
  const cv = new Canvas(256, 256, null);
  const S = 6000;

  // 粗砺身躯
  inkBloom(cv, 122, 158, 58, {
    color: INK, density: 0.82, seed: S + 1, noiseScale: 0.04, rough: 0.42,
    coreRatio: 0.55, texture: 0.5, aspect: [1.05, 1.1],
  });
  // 头
  inkBloom(cv, 118, 84, 26, {
    color: INK, density: 0.85, seed: S + 2, noiseScale: 0.05, rough: 0.3,
    coreRatio: 0.5, texture: 0.4,
  });
  // 乱发几笔
  const rng = mulberry32(S + 3);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (rng() * 2 - 1) * 0.9;
    strokePath(cv, [[118 + (rng() * 2 - 1) * 14, 66], [118 + Math.cos(a) * 22, 66 + Math.sin(a) * 22]], {
      width: 3.5, color: INK, alpha: 0.7, seed: S + 4 + i, jitter: 0.3, flyWhite: 0.3,
    });
  }
  // 环首刀：从右肩挑出的宽刃
  fillPoly(cv, [
    [150, 128], [196, 66], [222, 40], [232, 50], [206, 84], [168, 140],
  ], INK, { alpha: 0.9, soft: 2, edgeNoise: 5, texture: 0.25, seed: S + 10 });
  // 刀背飞白一笔
  strokePath(cv, [[162, 124], [214, 54]], {
    width: 3, color: PAPER, alpha: 0.55, seed: S + 11, jitter: 0.2, flyWhite: 0.4,
  });
  // 底部扫笔
  strokePath(cv, [[66, 214], [128, 224], [190, 212]], {
    width: 8, color: INK, alpha: 0.55, seed: S + 12, jitter: 0.4, flyWhite: 0.5,
  });
  speckles(cv, 128, 150, 70, 105, 7, INK, { seed: S + 13, alpha: 0.4, size: 2.2 });
  save(cv, 'enemy_melee.png');
}

/** enemy_ranged：山贼弓手——弓/箭意象 */
function genEnemyRanged() {
  const cv = new Canvas(256, 256, null);
  const S = 7000;

  // 小身影（淡，退后）
  inkBloom(cv, 96, 168, 34, {
    color: INK, density: 0.5, seed: S + 1, noiseScale: 0.045, rough: 0.4,
    coreRatio: 0.45, texture: 0.5,
  });
  inkBloom(cv, 94, 118, 17, {
    color: INK, density: 0.6, seed: S + 2, noiseScale: 0.05, rough: 0.3,
    coreRatio: 0.5, texture: 0.4,
  });

  // 弓：一张大弧（主体）
  const bowPts = arcPoints(120, 136, 84, -Math.PI * 0.42, Math.PI * 0.42, 40, 3, S + 3);
  strokePath(cv, bowPts, {
    width: 7, color: INK, alpha: 0.88, seed: S + 4, jitter: 0.15, flyWhite: 0.18,
    widthFn: (t) => 0.7 + 0.5 * Math.sin(Math.PI * t),
  });
  // 弦
  strokePath(cv, [
    [120 + Math.cos(-Math.PI * 0.42) * 84, 136 + Math.sin(-Math.PI * 0.42) * 84],
    [120 + Math.cos(Math.PI * 0.42) * 84, 136 + Math.sin(Math.PI * 0.42) * 84],
  ], {
    width: 1.8, color: INK, alpha: 0.65, seed: S + 5, jitter: 0.05, flyWhite: 0.05, soft: 0.4,
  });
  // 箭：搭在弦上，穿透弓心
  strokePath(cv, [[56, 136], [222, 136]], {
    width: 3.2, color: INK_DEEP, alpha: 0.9, seed: S + 6, jitter: 0.06, flyWhite: 0.08, soft: 0.4,
  });
  // 箭镞
  fillPoly(cv, [[222, 136], [204, 128], [208, 136], [204, 144]], INK_DEEP, {
    alpha: 0.95, soft: 1, edgeNoise: 1.5, texture: 0.1, seed: S + 7,
  });
  // 箭羽两撇
  strokePath(cv, [[62, 136], [48, 126]], { width: 2.5, color: INK, alpha: 0.7, seed: S + 8, flyWhite: 0.2 });
  strokePath(cv, [[62, 136], [48, 146]], { width: 2.5, color: INK, alpha: 0.7, seed: S + 9, flyWhite: 0.2 });
  save(cv, 'enemy_ranged.png');
}

/** enemy_shield：山贼盾卫——厚重盾形墨块 */
function genEnemyShield() {
  const cv = new Canvas(256, 256, null);
  const S = 8000;

  // 盾面：上宽下收的大墨块
  fillPoly(cv, [
    [58, 62], [128, 46], [198, 62], [206, 130],
    [186, 196], [128, 224], [70, 196], [50, 130],
  ], INK, { alpha: 0.9, soft: 4, edgeNoise: 9, texture: 0.4, seed: S + 1 });
  // 盾缘一周重笔
  const rim = [
    [58, 62], [128, 46], [198, 62], [206, 130],
    [186, 196], [128, 224], [70, 196], [50, 130], [58, 62],
  ];
  strokePath(cv, rim, {
    width: 6, color: INK_DEEP, alpha: 0.85, seed: S + 2, jitter: 0.25, flyWhite: 0.22,
  });
  // 中脊与盾鼻
  strokePath(cv, [[128, 58], [128, 210]], {
    width: 5, color: INK_DEEP, alpha: 0.55, seed: S + 3, jitter: 0.2, flyWhite: 0.3,
  });
  inkBloom(cv, 128, 132, 17, {
    color: INK_DEEP, density: 0.8, seed: S + 4, noiseScale: 0.06, rough: 0.25,
    coreRatio: 0.55, texture: 0.3,
  });
  // 顶部露出半张脸（盾后的人）
  inkBloom(cv, 128, 38, 15, {
    color: INK, density: 0.65, seed: S + 5, noiseScale: 0.06, rough: 0.3,
    coreRatio: 0.5, texture: 0.4,
  });
  // 盾面旧痕两笔飞白
  strokePath(cv, [[84, 100], [112, 92]], { width: 3, color: PAPER, alpha: 0.5, seed: S + 6, flyWhite: 0.4 });
  strokePath(cv, [[150, 168], [178, 158]], { width: 3, color: PAPER, alpha: 0.5, seed: S + 7, flyWhite: 0.4 });
  save(cv, 'enemy_shield.png');
}

/** enemy_elite：精锐护卫——甲胄/剑，墨色更整 */
function genEnemyElite() {
  const cv = new Canvas(256, 256, null);
  const S = 9000;

  // 甲身：端正的梯形
  fillPoly(cv, [
    [86, 108], [128, 92], [170, 108], [178, 200], [150, 224], [106, 224], [78, 200],
  ], INK, { alpha: 0.88, soft: 2.5, edgeNoise: 4, texture: 0.2, seed: S + 1 });
  // 甲片横线三笔（整齐）
  for (let i = 0; i < 3; i++) {
    const y = 136 + i * 26;
    strokePath(cv, [[88, y], [128, y + 4], [168, y]], {
      width: 3, color: PAPER, alpha: 0.4, seed: S + 2 + i, jitter: 0.1, flyWhite: 0.35, soft: 0.4,
    });
  }
  // 肩吞：两团整墨
  inkBloom(cv, 82, 106, 20, { color: INK_DEEP, density: 0.85, seed: S + 5, noiseScale: 0.05, rough: 0.2, coreRatio: 0.55, texture: 0.25 });
  inkBloom(cv, 174, 106, 20, { color: INK_DEEP, density: 0.85, seed: S + 6, noiseScale: 0.05, rough: 0.2, coreRatio: 0.55, texture: 0.25 });
  // 盔
  inkBloom(cv, 128, 64, 24, { color: INK_DEEP, density: 0.9, seed: S + 7, noiseScale: 0.04, rough: 0.15, coreRatio: 0.6, texture: 0.2 });
  // 盔缨一笔竖直
  strokePath(cv, [[128, 44], [128, 18]], {
    width: 5, color: INK_DEEP, alpha: 0.85, seed: S + 8, jitter: 0.1, flyWhite: 0.15,
    widthFn: (t) => 1 - t * 0.4,
  });
  // 长剑：右侧一竖，端正
  strokePath(cv, [[204, 66], [204, 208]], {
    width: 6, color: INK_DEEP, alpha: 0.92, seed: S + 9, jitter: 0.04, flyWhite: 0.06, soft: 0.4,
  });
  fillPoly(cv, [[204, 66], [197, 48], [204, 40], [211, 48]], INK_DEEP, {
    alpha: 0.95, soft: 1, edgeNoise: 1.5, texture: 0.1, seed: S + 10,
  });
  // 剑格一小横
  strokePath(cv, [[192, 78], [216, 78]], { width: 4, color: INK_DEEP, alpha: 0.9, seed: S + 11, flyWhite: 0.05 });
  // 立正底座一笔
  strokePath(cv, [[92, 232], [164, 232]], {
    width: 7, color: INK, alpha: 0.6, seed: S + 12, jitter: 0.2, flyWhite: 0.3,
  });
  save(cv, 'enemy_elite.png');
}

/** enemy_captain：首领——更大更重 + 朱砂点缀 */
function genEnemyCaptain() {
  const cv = new Canvas(256, 256, null);
  const S = 10000;

  // 魁伟身躯：大墨块
  inkBloom(cv, 128, 158, 74, {
    color: INK_DEEP, density: 0.9, seed: S + 1, noiseScale: 0.035, rough: 0.35,
    coreRatio: 0.6, texture: 0.4, aspect: [1.15, 1],
  });
  // 宽肩一笔横扫
  strokePath(cv, [[52, 102], [128, 88], [204, 102]], {
    width: 20, color: INK_DEEP, alpha: 0.9, seed: S + 2, jitter: 0.2, flyWhite: 0.15,
    widthFn: (t) => 0.7 + 0.5 * Math.sin(Math.PI * t),
  });
  // 头
  inkBloom(cv, 128, 58, 27, {
    color: INK_DEEP, density: 0.92, seed: S + 3, noiseScale: 0.04, rough: 0.2,
    coreRatio: 0.55, texture: 0.3,
  });
  // 雉鸡尾/鬓发两笔上扬
  strokePath(cv, quadBezier([112, 40], [96, 14], [76, 8], 10), {
    width: 5, color: INK_DEEP, alpha: 0.85, seed: S + 4, jitter: 0.2, flyWhite: 0.2,
    widthFn: (t) => 1 - t * 0.6,
  });
  strokePath(cv, quadBezier([144, 40], [160, 14], [180, 8], 10), {
    width: 5, color: INK_DEEP, alpha: 0.85, seed: S + 5, jitter: 0.2, flyWhite: 0.2,
    widthFn: (t) => 1 - t * 0.6,
  });

  // 大刀：斜扛的重器
  strokePath(cv, [[34, 216], [222, 62]], {
    width: 10, color: INK_DEEP, alpha: 0.92, seed: S + 6, jitter: 0.1, flyWhite: 0.12, soft: 0.45,
  });
  fillPoly(cv, [[222, 62], [200, 30], [236, 18], [244, 44], [230, 66]], INK_DEEP, {
    alpha: 0.92, soft: 1.5, edgeNoise: 3, texture: 0.2, seed: S + 7,
  });

  // 朱砂抹额（点缀色）
  strokePath(cv, [[104, 52], [128, 46], [152, 52]], {
    width: 7, color: ZHU, alpha: 0.95, seed: S + 8, jitter: 0.1, flyWhite: 0.08,
  });
  cv.disc(128, 48, 4.5, ZHU, 0.95, 0.4);
  // 刀环朱缨
  strokePath(cv, quadBezier([216, 70], [206, 92], [212, 112], 8), {
    width: 4, color: ZHU, alpha: 0.9, seed: S + 9, jitter: 0.25, flyWhite: 0.2,
    widthFn: (t) => 1 - t * 0.6,
  });

  // 底座重笔
  strokePath(cv, [[56, 230], [128, 238], [200, 228]], {
    width: 11, color: INK_DEEP, alpha: 0.75, seed: S + 10, jitter: 0.3, flyWhite: 0.35,
  });
  speckles(cv, 128, 150, 85, 115, 8, INK_DEEP, { seed: S + 11, alpha: 0.45, size: 2.4 });
  save(cv, 'enemy_captain.png');
}

// ================================================================ 框与特效

/** frame_ally 256x256：完整墨色圆环（手绘粗细变化），透明底 */
function genFrameAlly() {
  const cv = new Canvas(256, 256, null);
  const S = 11000;
  const nz = makeNoise(S);

  // 圆环路径（半径带细微噪声起伏）
  const pts = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r = 96 + (nz.fbm(Math.cos(a) * 1.5 + 5, Math.sin(a) * 1.5 + 5, 3) - 0.5) * 7;
    pts.push([128 + Math.cos(a) * r, 128 + Math.sin(a) * r]);
  }
  // 粗细变化：widthFn 沿环慢变
  strokePath(cv, pts, {
    width: 13, color: INK, alpha: 0.82, seed: S + 1, jitter: 0.3, flyWhite: 0.16,
    widthFn: (t) => 0.62 + 0.55 * nz.fbm(t * 3.1, 8.8, 2),
    splatter: 0.02, soft: 0.55,
  });
  // 起笔处叠一小段重墨（毛笔回锋感）
  const overlap = pts.slice(40, 62);
  strokePath(cv, overlap, {
    width: 15, color: INK, alpha: 0.35, seed: S + 2, jitter: 0.25, flyWhite: 0.2,
    soft: 0.6,
  });
  speckles(cv, 128, 128, 104, 118, 6, INK, { seed: S + 3, alpha: 0.35, size: 1.8 });
  save(cv, 'frame_ally.png');
}

/** frame_enemy 256x256：有缺口的裂角方框，透明底 */
function genFrameEnemy() {
  const cv = new Canvas(256, 256, null);
  const S = 12000;
  const rng = mulberry32(S);

  // 抖动的方框路径（四角略带圆）
  const corner = 26, half = 88;
  const pts = [];
  const corners = [
    [128 - half, 128 - half], [128 + half, 128 - half],
    [128 + half, 128 + half], [128 - half, 128 + half],
  ];
  for (let c = 0; c < 4; c++) {
    const [ax, ay] = corners[c];
    const [bx, by] = corners[(c + 1) % 4];
    const segs = 16;
    for (let i = c === 0 ? 0 : 1; i <= segs; i++) {
      const t = i / segs;
      // 角部内凹成圆弧
      let x = ax + (bx - ax) * t;
      let y = ay + (by - ay) * t;
      x += (rng() * 2 - 1) * 3;
      y += (rng() * 2 - 1) * 3;
      pts.push([x, y]);
    }
  }
  pts.push(pts[0].slice());

  // 缺口设在右上边（t 约 0.22..0.34 处断开），两端收成尖
  const gapA = 0.22, gapB = 0.34;
  strokePath(cv, pts, {
    width: 11, color: INK, alpha: 0.85, seed: S + 1, jitter: 0.3, flyWhite: 0.2,
    widthFn: (t) => {
      if (t > gapA && t < gapB) return 0;
      const dGap = Math.min(Math.abs(t - gapA), Math.abs(t - gapB));
      const pinch = Math.min(1, dGap / 0.05);
      return (0.65 + 0.5 * rng()) * (0.3 + 0.7 * pinch);
    },
    flyFn: (t) => (t > 0.6 && t < 0.72 ? 2.2 : 1), // 左下角也斑驳一些
    splatter: 0.03, soft: 0.5,
  });

  // 裂缝：从缺口两角向外爬的碎笔
  strokePath(cv, [[196, 42], [212, 30], [224, 14]], {
    width: 4, color: INK, alpha: 0.7, seed: S + 2, jitter: 0.5, flyWhite: 0.35,
    widthFn: (t) => 1 - t * 0.8,
  });
  strokePath(cv, [[206, 58], [226, 52]], {
    width: 3, color: INK, alpha: 0.6, seed: S + 3, jitter: 0.5, flyWhite: 0.4,
    widthFn: (t) => 1 - t * 0.8,
  });
  // 缺口的崩口碎点
  speckles(cv, 204, 44, 8, 30, 7, INK, { seed: S + 4, alpha: 0.55, size: 2 });
  // 对角一处崩缺
  strokePath(cv, [[48, 206], [34, 222]], {
    width: 4, color: INK, alpha: 0.55, seed: S + 5, jitter: 0.5, flyWhite: 0.4,
    widthFn: (t) => 1 - t * 0.7,
  });
  save(cv, 'frame_enemy.png');
}

/** ink_slash 512x256：一道横向凌厉墨痕，透明底，飞白感 */
function genInkSlash() {
  const cv = new Canvas(512, 256, null);
  const S = 13000;

  // 主痕：略带上扬弧度的横劈
  strokePath(cv, quadBezier([22, 158], [250, 58], [490, 104], 40), {
    width: 30, color: INK_DEEP, alpha: 0.92, seed: S + 1, jitter: 0.22, flyWhite: 0.3,
    widthFn: (t) => {
      const rise = Math.min(1, t / 0.22);
      const fall = 1 - Math.pow(Math.max(0, (t - 0.5) / 0.5), 1.6) * 0.94;
      return Math.min(rise, fall);
    },
    flyFn: (t) => 0.6 + t * 1.6, // 越到梢越飞白
    splatter: 0.06, soft: 0.5,
  });
  // 主痕下方一条平行的淡痕（拖笔）
  strokePath(cv, quadBezier([90, 196], [280, 128], [430, 158], 32), {
    width: 9, color: INK, alpha: 0.5, seed: S + 2, jitter: 0.3, flyWhite: 0.45,
    widthFn: (t) => Math.sin(Math.PI * t) * (1 - t * 0.4),
    splatter: 0.04,
  });
  // 梢头飞沫
  speckles(cv, 480, 102, 12, 46, 9, INK_DEEP, { seed: S + 3, alpha: 0.6, size: 2.6 });
  speckles(cv, 60, 170, 8, 30, 5, INK, { seed: S + 4, alpha: 0.4, size: 2 });
  save(cv, 'ink_slash.png');
}

/** ink_bloom 512x512：圆形晕染墨团，透明底，边缘自然晕开 */
function genInkBloom() {
  const cv = new Canvas(512, 512, null);
  const S = 14000;

  // 外层淡晕（洇开的水痕）
  inkBloom(cv, 256, 256, 196, {
    color: INK, density: 0.16, seed: S + 1, noiseScale: 0.011, rough: 0.5,
    coreRatio: 0.35, texture: 0.55,
  });
  // 中层
  inkBloom(cv, 256, 256, 148, {
    color: INK, density: 0.42, seed: S + 2, noiseScale: 0.016, rough: 0.42,
    coreRatio: 0.45, texture: 0.5,
  });
  // 核心浓墨（略偏心，像笔锋落纸处）
  inkBloom(cv, 244, 250, 84, {
    color: INK_DEEP, density: 0.85, seed: S + 3, noiseScale: 0.025, rough: 0.3,
    coreRatio: 0.5, texture: 0.4,
  });
  // 卫星小团与飞沫
  inkBloom(cv, 392, 160, 22, { color: INK, density: 0.5, seed: S + 4, noiseScale: 0.04, rough: 0.4, coreRatio: 0.45, texture: 0.4 });
  inkBloom(cv, 120, 356, 15, { color: INK, density: 0.45, seed: S + 5, noiseScale: 0.04, rough: 0.4, coreRatio: 0.45, texture: 0.4 });
  inkBloom(cv, 356, 392, 10, { color: INK, density: 0.4, seed: S + 6, noiseScale: 0.05, rough: 0.4, coreRatio: 0.45, texture: 0.4 });
  speckles(cv, 256, 256, 170, 236, 14, INK, { seed: S + 7, alpha: 0.4, size: 2.6 });
  save(cv, 'ink_bloom.png');
}

// ================================================================ main

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`artgen -> ${OUT_DIR}`);
  const jobs = [
    genBgTitle,
    genBgBattle,
    genPortraitAsu,
    genPortraitJiye,
    genPortraitYuran,
    genPortraitXiyan,
    genEnemyMelee,
    genEnemyRanged,
    genEnemyShield,
    genEnemyElite,
    genEnemyCaptain,
    genFrameAlly,
    genFrameEnemy,
    genInkSlash,
    genInkBloom,
  ];
  const t0 = Date.now();
  for (const job of jobs) job();
  console.log(`done: ${jobs.length} images in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main();
