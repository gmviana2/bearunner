import Phaser from 'phaser';

/**
 * All game art is drawn procedurally with Canvas 2D so the prototype has
 * zero external asset dependencies. Swap these for real sprites later.
 */

type Ctx = CanvasRenderingContext2D;

const C = {
  hair: '#6b3a26',
  hairDark: '#4f2a1b',
  hairLight: '#9a5a3a',
  pink: '#ff4f9a',
  pinkDark: '#d42f78',
  hood: '#ec4a86',
  hoodDark: '#bf2f63',
  short: '#2b2238',
  skin: '#ffd9c2',
  skinDark: '#f0b597',
  bag: '#3a3352',
  bagDark: '#28223d',
  star: '#ffcf3a',
  white: '#ffffff',
};

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: Ctx) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  draw(tex.getContext());
  tex.refresh();
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function circle(ctx: Ctx, x: number, y: number, r: number, fill: string | CanvasGradient) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function star(ctx: Ctx, cx: number, cy: number, R: number, r: number, fill: string, stroke?: string) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export type LiviaPose = 'run1' | 'run2' | 'jump' | 'slide';

/** Lívia seen from behind, chibi proportions. Canvas 128x160, feet at y≈158. */
function drawLivia(ctx: Ctx, pose: LiviaPose) {
  const slide = pose === 'slide';
  const jump = pose === 'jump';
  const r1 = pose === 'run1';

  const leg = (cx: number, off: number) => {
    rr(ctx, cx - 6, 112, 12, 34 + off, 5, C.skin);
    rr(ctx, cx - 6, 136 + off, 12, 7, 3, C.white);
    rr(ctx, cx - 11, 141 + off, 22, 16, 7, C.white);
    rr(ctx, cx - 11, 151 + off, 22, 7, 3, '#ff4f8b');
    if (off < 0) ellipse(ctx, cx, 150 + off, 8, 5, '#ff7aa8');
  };

  if (!slide) {
    const lOff = jump ? -16 : r1 ? -11 : 0;
    const rOff = jump ? -12 : r1 ? 0 : -11;
    leg(52, lOff);
    leg(76, rOff);
  }

  ctx.save();
  if (slide) {
    ctx.translate(0, 44);
    // legs stretched forward: only the soles peek out on each side
    rr(ctx, 14, 98, 24, 14, 6, C.white);
    rr(ctx, 90, 98, 24, 14, 6, C.white);
    rr(ctx, 14, 106, 24, 6, 3, '#ff4f8b');
    rr(ctx, 90, 106, 24, 6, 3, '#ff4f8b');
  }

  if (!slide) rr(ctx, 44, 100, 40, 20, 7, C.short);

  // arms
  if (jump) {
    rr(ctx, 20, 46, 15, 36, 8, C.hood);
    rr(ctx, 93, 46, 15, 36, 8, C.hood);
    circle(ctx, 27, 44, 7, C.skin);
    circle(ctx, 101, 44, 7, C.skin);
  } else if (slide) {
    rr(ctx, 16, 78, 30, 15, 8, C.hood);
    rr(ctx, 82, 78, 30, 15, 8, C.hood);
    circle(ctx, 14, 86, 7, C.skin);
    circle(ctx, 114, 86, 7, C.skin);
  } else {
    const ly = r1 ? 64 : 74;
    const ry = r1 ? 74 : 64;
    rr(ctx, 25, ly, 15, 32, 8, C.hood);
    rr(ctx, 88, ry, 15, 32, 8, C.hood);
    circle(ctx, 32, ly + 33, 7, C.skin);
    circle(ctx, 96, ry + 33, 7, C.skin);
  }

  // hoodie body
  const bodyGrad = ctx.createLinearGradient(36, 64, 92, 108);
  bodyGrad.addColorStop(0, '#f45c94');
  bodyGrad.addColorStop(1, C.hoodDark);
  rr(ctx, 36, 62, 56, 46, 16, bodyGrad);
  rr(ctx, 38, 100, 52, 9, 4, C.hoodDark);
  ellipse(ctx, 64, 66, 22, 8, C.hoodDark);

  // backpack
  rr(ctx, 47, 64, 6, 12, 2, C.bagDark);
  rr(ctx, 75, 64, 6, 12, 2, C.bagDark);
  rr(ctx, 45, 72, 38, 34, 11, C.bag);
  ctx.beginPath();
  ctx.roundRect(45, 72, 38, 13, [11, 11, 4, 4]);
  ctx.fillStyle = C.bagDark;
  ctx.fill();
  star(ctx, 64, 94, 9, 4, C.star);
  circle(ctx, 84, 101, 4, C.pink);

  // ears (half hidden behind the hair)
  circle(ctx, 31, 50, 6, C.skin);
  circle(ctx, 97, 50, 6, C.skin);

  // hair: big round head + jagged tips
  const hairGrad = ctx.createRadialGradient(54, 26, 6, 64, 44, 40);
  hairGrad.addColorStop(0, C.hairLight);
  hairGrad.addColorStop(0.55, C.hair);
  hairGrad.addColorStop(1, C.hairDark);
  ctx.beginPath();
  ctx.arc(64, 42, 34, Math.PI, 0);
  ctx.lineTo(98, 52);
  const tips = [92, 84, 76, 68, 60, 52, 44, 36];
  tips.forEach((x, i) => {
    ctx.lineTo(x + 4, 66 + (i % 2) * 5);
    ctx.lineTo(x - 2, 56);
  });
  ctx.lineTo(30, 52);
  ctx.closePath();
  ctx.fillStyle = hairGrad;
  ctx.fill();

  // pink streak
  ctx.globalAlpha = 0.85;
  ellipse(ctx, 40, 46, 5, 18, C.pink, -0.25);
  ctx.globalAlpha = 1;

  // strands
  ctx.strokeStyle = C.hairDark;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const [x2, y2] of [[42, 62], [54, 66], [74, 66], [86, 62]]) {
    ctx.beginPath();
    ctx.moveTo(64, 16);
    ctx.quadraticCurveTo((64 + x2) / 2 + (x2 < 64 ? -8 : 8), 34, x2, y2);
    ctx.stroke();
  }
  ellipse(ctx, 50, 24, 12, 4, 'rgba(255,220,190,0.45)', -0.4);

  // ponytail hanging down the back
  const sway = jump ? 0 : r1 ? 6 : pose === 'run2' ? -6 : 0;
  const tipY = jump ? 74 : slide ? 78 : 94;
  const tailGrad = ctx.createLinearGradient(64, 26, 64, tipY);
  tailGrad.addColorStop(0, C.hair);
  tailGrad.addColorStop(1, C.hairDark);
  ctx.beginPath();
  ctx.moveTo(55, 28);
  ctx.quadraticCurveTo(42 + sway, 62, 64 + sway * 2, tipY);
  ctx.quadraticCurveTo(86 + sway, 62, 73, 28);
  ctx.closePath();
  ctx.fillStyle = tailGrad;
  ctx.fill();
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(60, 34);
  ctx.quadraticCurveTo(54 + sway, 60, 62 + sway * 2, tipY - 10);
  ctx.quadraticCurveTo(60 + sway, 58, 64, 34);
  ctx.fillStyle = C.pink;
  ctx.fill();
  ctx.globalAlpha = 1;

  // scrunchie
  circle(ctx, 64, 28, 9, C.pinkDark);
  circle(ctx, 64, 27, 7, C.pink);
  circle(ctx, 61, 24, 2.5, 'rgba(255,255,255,0.7)');

  ctx.restore();
}

function drawCoin(ctx: Ctx) {
  circle(ctx, 32, 32, 30, '#c98a0b');
  const g = ctx.createRadialGradient(24, 22, 4, 32, 32, 28);
  g.addColorStop(0, '#fff2a6');
  g.addColorStop(0.5, '#ffd23a');
  g.addColorStop(1, '#f2a80c');
  circle(ctx, 32, 32, 27, g);
  circle(ctx, 32, 32, 20, '#ffcc29');
  star(ctx, 32, 33, 13, 5.5, '#f7a90a', '#e59200');
  ellipse(ctx, 22, 18, 7, 3.5, 'rgba(255,255,255,0.7)', -0.6);
}

function drawBarrier(ctx: Ctx) {
  rr(ctx, 16, 30, 14, 82, 4, '#8a5a3c');
  rr(ctx, 130, 30, 14, 82, 4, '#8a5a3c');
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(4, 22, 152, 46, 12);
  ctx.clip();
  for (let i = -2; i < 10; i++) {
    ctx.beginPath();
    const x = i * 24;
    ctx.moveTo(x, 70);
    ctx.lineTo(x + 12, 70);
    ctx.lineTo(x + 36, 20);
    ctx.lineTo(x + 24, 20);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#ffffff' : '#ee3b55';
    ctx.fill();
  }
  ctx.restore();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#8c1f35';
  ctx.beginPath();
  ctx.roundRect(4, 22, 152, 46, 12);
  ctx.stroke();
  circle(ctx, 30, 14, 10, '#ffcf3a');
  circle(ctx, 130, 14, 10, '#ffcf3a');
  circle(ctx, 27, 11, 3, '#fff');
  circle(ctx, 127, 11, 3, '#fff');
}

function drawBeam(ctx: Ctx) {
  // 160x220: two posts and a heavy beam on top (slide under it)
  rr(ctx, 6, 0, 18, 220, 6, '#8d5c38');
  rr(ctx, 136, 0, 18, 220, 6, '#8d5c38');
  rr(ctx, 9, 0, 6, 220, 3, '#a8734b');
  rr(ctx, 139, 0, 6, 220, 3, '#a8734b');
  const g = ctx.createLinearGradient(0, 8, 0, 92);
  g.addColorStop(0, '#d29a62');
  g.addColorStop(1, '#9b6337');
  rr(ctx, 0, 8, 160, 84, 12, g);
  ctx.strokeStyle = '#7a4a28';
  ctx.lineWidth = 3;
  for (const y of [36, 64]) {
    ctx.beginPath();
    ctx.moveTo(8, y);
    ctx.lineTo(152, y);
    ctx.stroke();
  }
  // warning sign hanging from the beam
  rr(ctx, 56, 70, 48, 40, 10, '#ff5fa2');
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(80, 78);
  ctx.lineTo(80, 100);
  ctx.moveTo(70, 92);
  ctx.lineTo(80, 102);
  ctx.lineTo(90, 92);
  ctx.stroke();
}

function drawCrate(ctx: Ctx) {
  rr(ctx, 4, 4, 152, 152, 12, '#c4823f');
  ctx.strokeStyle = '#8f5428';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(12, 12, 136, 136, 8);
  ctx.stroke();
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#a3622f';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(26, 26);
  ctx.lineTo(134, 134);
  ctx.moveTo(134, 26);
  ctx.lineTo(26, 134);
  ctx.stroke();
  ctx.fillStyle = '#6d3d1b';
  for (const [x, y] of [[18, 18], [142, 18], [18, 142], [142, 142]]) circle(ctx, x, y, 4, '#6d3d1b');
  rr(ctx, 10, 6, 80, 8, 4, 'rgba(255,255,255,0.25)');
}

function drawTrainFront(ctx: Ctx) {
  const body = ctx.createLinearGradient(0, 0, 0, 220);
  body.addColorStop(0, '#6b9cff');
  body.addColorStop(1, '#2f5bc4');
  rr(ctx, 4, 6, 152, 210, 26, body);
  rr(ctx, 18, 30, 124, 70, 16, '#1f3d86');
  const glass = ctx.createLinearGradient(20, 32, 140, 98);
  glass.addColorStop(0, '#d9f4ff');
  glass.addColorStop(1, '#7fc7f2');
  rr(ctx, 24, 36, 112, 58, 12, glass);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(40, 86);
  ctx.lineTo(62, 44);
  ctx.moveTo(58, 88);
  ctx.lineTo(72, 60);
  ctx.stroke();
  rr(ctx, 4, 116, 152, 14, 4, '#ffcf3a');
  circle(ctx, 36, 156, 14, '#fff6b8');
  circle(ctx, 124, 156, 14, '#fff6b8');
  circle(ctx, 36, 156, 8, '#ffffff');
  circle(ctx, 124, 156, 8, '#ffffff');
  rr(ctx, 60, 146, 40, 20, 6, '#ffffff');
  star(ctx, 80, 156, 8, 3.5, '#ff4f9a');
  rr(ctx, 10, 186, 140, 26, 8, '#243f87');
  rr(ctx, 50, 0, 60, 12, 6, '#2f5bc4');
}

function drawTrainBody(ctx: Ctx) {
  rr(ctx, 4, 6, 152, 210, 26, '#3a66cf');
  rr(ctx, 4, 116, 152, 14, 4, '#e5b42c');
  rr(ctx, 10, 186, 140, 26, 8, '#1e3573');
}

function drawPower(ctx: Ctx, kind: 'magnet' | 'shield' | 'double') {
  const ring = { magnet: '#ff4f6d', shield: '#3d8bff', double: '#9b5cff' }[kind];
  const glow = ctx.createRadialGradient(36, 36, 10, 36, 36, 36);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.75, 'rgba(255,255,255,0.9)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  circle(ctx, 36, 36, 36, glow);
  ctx.lineWidth = 5;
  ctx.strokeStyle = ring;
  ctx.beginPath();
  ctx.arc(36, 36, 28, 0, Math.PI * 2);
  ctx.stroke();

  if (kind === 'magnet') {
    ctx.lineWidth = 11;
    ctx.strokeStyle = '#ee3b55';
    ctx.beginPath();
    ctx.arc(36, 36, 12, 0, Math.PI);
    ctx.moveTo(24, 36);
    ctx.lineTo(24, 24);
    ctx.moveTo(48, 36);
    ctx.lineTo(48, 24);
    ctx.stroke();
    rr(ctx, 18, 16, 12, 9, 2, '#d9dde8');
    rr(ctx, 42, 16, 12, 9, 2, '#d9dde8');
  } else if (kind === 'shield') {
    ctx.beginPath();
    ctx.moveTo(36, 14);
    ctx.lineTo(54, 21);
    ctx.quadraticCurveTo(54, 46, 36, 58);
    ctx.quadraticCurveTo(18, 46, 18, 21);
    ctx.closePath();
    ctx.fillStyle = '#3d8bff';
    ctx.fill();
    star(ctx, 36, 36, 9, 4, '#ffffff');
  } else {
    circle(ctx, 36, 36, 22, '#ffcf3a');
    ctx.fillStyle = '#7b3fe4';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('x2', 36, 38);
  }
}

function drawTree(ctx: Ctx) {
  // 160x220 pink blossom tree
  ctx.beginPath();
  ctx.moveTo(70, 220);
  ctx.quadraticCurveTo(74, 160, 62, 120);
  ctx.lineTo(80, 118);
  ctx.quadraticCurveTo(88, 160, 92, 220);
  ctx.closePath();
  ctx.fillStyle = '#8a5a3c';
  ctx.fill();
  const blobs: [number, number, number, string][] = [
    [80, 70, 48, '#f77fb8'],
    [44, 96, 36, '#f77fb8'],
    [116, 96, 36, '#f77fb8'],
    [72, 60, 40, '#ff9dcb'],
    [104, 76, 32, '#ff9dcb'],
    [46, 82, 28, '#ff9dcb'],
    [80, 44, 28, '#ffc4e1'],
    [56, 58, 18, '#ffc4e1'],
    [108, 60, 16, '#ffd8eb'],
  ];
  for (const [x, y, r, c] of blobs) circle(ctx, x, y, r, c);
  for (let i = 0; i < 14; i++) {
    circle(ctx, 30 + ((i * 53) % 100), 30 + ((i * 37) % 90), 3, 'rgba(255,255,255,0.7)');
  }
}

function drawLamp(ctx: Ctx) {
  // 48x200
  rr(ctx, 19, 40, 10, 160, 4, '#4b3a5e');
  rr(ctx, 12, 188, 24, 12, 4, '#4b3a5e');
  const glow = ctx.createRadialGradient(24, 26, 2, 24, 26, 24);
  glow.addColorStop(0, 'rgba(255,240,170,1)');
  glow.addColorStop(1, 'rgba(255,220,120,0)');
  circle(ctx, 24, 26, 24, glow);
  rr(ctx, 12, 12, 24, 30, 6, '#ffe58a');
  ctx.strokeStyle = '#4b3a5e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(12, 12, 24, 30, 6);
  ctx.stroke();
  rr(ctx, 8, 6, 32, 8, 4, '#4b3a5e');
}

function drawCloud(ctx: Ctx, x: number, y: number, s: number, alpha = 0.95) {
  ctx.globalAlpha = alpha;
  for (const [dx, dy, r] of [[0, 0, 26], [28, -12, 30], [58, 0, 24], [30, 8, 26], [-22, 8, 18], [80, 8, 16]]) {
    circle(ctx, x + dx * s, y + dy * s, r * s, '#ffffff');
  }
  ctx.globalAlpha = 1;
}

function drawIsland(ctx: Ctx, x: number, y: number, w: number) {
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.quadraticCurveTo(x - w * 0.3, y + w * 0.55, x, y + w * 0.75);
  ctx.quadraticCurveTo(x + w * 0.3, y + w * 0.55, x + w / 2, y);
  ctx.closePath();
  ctx.fillStyle = '#a77a5a';
  ctx.fill();
  ellipse(ctx, x, y, w / 2 + 4, w * 0.1, '#7fd16e');
  ctx.globalAlpha = 0.7;
  rr(ctx, x + w * 0.18, y + 2, w * 0.06, w * 0.9, 3, '#d8f3ff');
  ctx.globalAlpha = 1;
  circle(ctx, x - w * 0.2, y - w * 0.08, w * 0.09, '#ff9dcb');
  circle(ctx, x - w * 0.08, y - w * 0.12, w * 0.07, '#f77fb8');
}

function drawSky(ctx: Ctx) {
  const W = 1024;
  const H = 640;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#5fb8ff');
  g.addColorStop(0.55, '#a8dcff');
  g.addColorStop(1, '#ffe0f2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const sun = ctx.createRadialGradient(800, 130, 10, 800, 130, 220);
  sun.addColorStop(0, 'rgba(255,250,220,0.9)');
  sun.addColorStop(1, 'rgba(255,250,220,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);

  drawCloud(ctx, 90, 110, 1.3);
  drawCloud(ctx, 640, 70, 1.0, 0.85);
  drawCloud(ctx, 880, 260, 1.2, 0.9);
  drawIsland(ctx, 150, 380, 170);
  drawIsland(ctx, 880, 420, 140);
  drawIsland(ctx, 330, 270, 80);
  drawIsland(ctx, 720, 300, 90);

  // castle at the vanishing point
  const cx = 512;
  const base = H - 30;
  const wall = '#efe6ff';
  const shade = '#d7c8f7';
  const roofA = '#9b6cff';
  const roofB = '#ff7eb6';
  const tower = (x: number, w: number, h: number, roof: string) => {
    rr(ctx, x - w / 2, base - h, w, h, 4, wall);
    rr(ctx, x - w / 2, base - h, w * 0.35, h, 4, shade);
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 6, base - h + 2);
    ctx.lineTo(x, base - h - w * 1.4);
    ctx.lineTo(x + w / 2 + 6, base - h + 2);
    ctx.closePath();
    ctx.fillStyle = roof;
    ctx.fill();
    rr(ctx, x - 5, base - h + 20, 10, 16, 5, '#7b5bd6');
    rr(ctx, x - 1, base - h - w * 1.4 - 14, 2, 14, 1, '#7b5bd6');
    ctx.beginPath();
    ctx.moveTo(x + 1, base - h - w * 1.4 - 14);
    ctx.lineTo(x + 14, base - h - w * 1.4 - 9);
    ctx.lineTo(x + 1, base - h - w * 1.4 - 4);
    ctx.fillStyle = roofB;
    ctx.fill();
  };
  tower(cx - 120, 34, 120, roofA);
  tower(cx + 120, 34, 120, roofA);
  rr(ctx, cx - 120, base - 90, 240, 90, 6, wall);
  tower(cx - 60, 40, 170, roofB);
  tower(cx + 60, 40, 170, roofB);
  tower(cx, 56, 230, roofA);
  rr(ctx, cx - 22, base - 50, 44, 50, 22, '#7b5bd6');

  for (let i = 0; i < 9; i++) drawCloud(ctx, i * 128 - 20, H - 10 - (i % 2) * 14, 1.1, 1);
}

export function createTextures(scene: Phaser.Scene) {
  (['run1', 'run2', 'jump', 'slide'] as LiviaPose[]).forEach((pose) =>
    make(scene, `livia-${pose}`, 128, 160, (ctx) => drawLivia(ctx, pose)),
  );
  make(scene, 'coin', 64, 64, drawCoin);
  make(scene, 'barrier', 160, 112, drawBarrier);
  make(scene, 'beam', 160, 220, drawBeam);
  make(scene, 'crate', 160, 160, drawCrate);
  make(scene, 'train', 160, 220, drawTrainFront);
  make(scene, 'trainBody', 160, 220, drawTrainBody);
  make(scene, 'magnet', 72, 72, (ctx) => drawPower(ctx, 'magnet'));
  make(scene, 'shield', 72, 72, (ctx) => drawPower(ctx, 'shield'));
  make(scene, 'double', 72, 72, (ctx) => drawPower(ctx, 'double'));
  make(scene, 'tree', 160, 220, drawTree);
  make(scene, 'lamp', 48, 200, drawLamp);
  make(scene, 'sky', 1024, 640, drawSky);
  make(scene, 'shadow', 64, 24, (ctx) => ellipse(ctx, 32, 12, 30, 10, 'rgba(60,30,80,0.3)'));
  make(scene, 'sparkle', 32, 32, (ctx) => {
    star(ctx, 16, 16, 15, 4, '#fff7b0');
    circle(ctx, 16, 16, 4, '#ffffff');
  });
  make(scene, 'shieldFx', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 30, 64, 64, 62);
    g.addColorStop(0, 'rgba(120,190,255,0.05)');
    g.addColorStop(0.8, 'rgba(120,190,255,0.35)');
    g.addColorStop(1, 'rgba(200,235,255,0.9)');
    circle(ctx, 64, 64, 62, g);
  });
  make(scene, 'haze', 4, 64, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,230,245,1)');
    g.addColorStop(1, 'rgba(255,230,245,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 64);
  });
}
