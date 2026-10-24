import Phaser from 'phaser';
import { bus, type GameCommand, type GamePhase, type HudState, type PowerKind } from './bus';
import { createTextures } from './textures';
import { loadCharacterId } from '../characters';

/*
 * Pseudo-3D endless runner. The world is a 3-lane track measured in "lane
 * units" (one lane = 1.0 wide). Every object lives at (x, y, z) where z is
 * the distance in front of the camera; we project to the screen with a simple
 * pinhole camera and scale sprites by f / z.
 */

const FAR = 70;
const ZP = 3.6; // player's distance from the camera
const PLAYER_H = 1.1;
const START_SPEED = 13;
const MAX_SPEED = 30;
const ACCEL = 0.22;
const GRAVITY = 30;
const JUMP_V = 9;
const SLIDE_TIME = 0.65;
const STUMBLE_GRACE = 1.0; // invulnerable time right after a stumble
const CHASE_TIME = 8; // how long the dinosaur chases after a stumble
const DINO_Z = 2.1; // the dinosaur runs between the camera and the player
const DINO_H = 1.6;
const POWER_TIME: Record<PowerKind, number> = { magnet: 10, shield: 15, double: 10 };

type ObstacleKind = 'barrier' | 'beam' | 'crate' | 'train' | 'gap';

const OBSTACLES: Record<ObstacleKind, { h: number; depth: number; len?: number }> = {
  barrier: { h: 0.72, depth: 0.3 }, // jump over
  beam: { h: 1.45, depth: 0.3 }, // slide under
  crate: { h: 0.9, depth: 0.9 }, // dodge or high jump
  train: { h: 1.5, depth: 0.5, len: 8 }, // dodge
  gap: { h: 0, depth: 1.6 }, // hole in the bridge: jump over it
};

interface Entity {
  type: 'obstacle' | 'coin' | 'power' | 'decor';
  kind: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  depth: number;
  len: number;
  vz: number;
  sprite: Phaser.GameObjects.Image;
  slices?: Phaser.GameObjects.Image[];
  hit?: boolean;
  pulled?: boolean;
  phase?: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

export class RunnerScene extends Phaser.Scene {
  // camera / projection
  private W = 0;
  private H = 0;
  private cx = 0;
  private horizon = 0;
  private f = 1;
  private camH = 1.5;

  private ground!: Phaser.GameObjects.Graphics;
  private sky!: Phaser.GameObjects.Image;
  private haze!: Phaser.GameObjects.Image;
  private player!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Image;
  private shieldFx!: Phaser.GameObjects.Image;
  private dino!: Phaser.GameObjects.Image;
  private roar!: Phaser.GameObjects.Text;

  private entities: Entity[] = [];
  private phase: GamePhase = 'ready';
  private charId = loadCharacterId();

  // run state
  private dist = 0;
  private elapsed = 0;
  private speed = START_SPEED;
  private score = 0;
  private coins = 0;
  private chaseT = 0;
  private dinoShow = 0;
  private dinoX = 0;
  private caughtT = -1; // >= 0 while the catch animation plays
  private lane = 0;
  private px = 0;
  private py = 0;
  private vy = 0;
  private airborne = false;
  private slideT = 0;
  private pendingSlide = false;
  private invulnT = 0;
  private powers: Record<PowerKind, number> = { magnet: 0, shield: 0, double: 0 };
  private spawnCursor = 0;
  private decorCursor = 0;
  private decorFlip = false;
  private animT = 0;
  private hudT = 0;
  private swipeStart: { x: number; y: number; done: boolean } | null = null;

  constructor() {
    super('runner');
  }

  create() {
    createTextures(this);
    this.resetState();

    this.cameras.main.setBackgroundColor('#cfe6ff');
    this.sky = this.add.image(0, 0, 'sky').setOrigin(0.5, 1).setDepth(-10);
    this.ground = this.add.graphics().setDepth(0);
    this.haze = this.add.image(0, 0, 'haze').setOrigin(0, 0).setDepth(1).setAlpha(0.9);
    this.shadow = this.add.image(0, 0, 'shadow');
    this.player = this.add.image(0, 0, `${this.charId}-run1`).setOrigin(0.5, 0.985);
    this.shieldFx = this.add.image(0, 0, 'shieldFx').setVisible(false);
    this.dino = this.add.image(0, 0, 'dino').setOrigin(0.5, 1).setVisible(false);
    this.roar = this.add
      .text(0, 0, 'RAWR!', {
        fontFamily: '"Baloo 2", Arial, sans-serif',
        fontSize: '42px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3f8f2a',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(300000)
      .setAlpha(0);

    this.layout();
    this.scale.on('resize', this.layout, this);

    // dress the track so the ready screen isn't empty
    for (let z = 4; z < FAR; z += 3.2) this.spawnDecor(z);

    this.setupInput();
    const onCmd = (cmd: GameCommand) => this.command(cmd);
    const onCharacter = (id: string) => (this.charId = id);
    bus.on('cmd', onCmd);
    bus.on('character', onCharacter);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off('cmd', onCmd);
      bus.off('character', onCharacter);
      this.scale.off('resize', this.layout, this);
    });

    this.setPhase('ready');
    this.emitHud();
  }

  private resetState() {
    this.entities = [];
    this.dist = 0;
    this.elapsed = 0;
    this.speed = START_SPEED;
    this.score = 0;
    this.coins = 0;
    this.chaseT = 0;
    this.dinoShow = 0;
    this.dinoX = 0;
    this.caughtT = -1;
    this.lane = 0;
    this.px = 0;
    this.py = 0;
    this.vy = 0;
    this.airborne = false;
    this.slideT = 0;
    this.pendingSlide = false;
    this.invulnT = 0;
    this.powers = { magnet: 0, shield: 0, double: 0 };
    this.spawnCursor = 18;
    this.decorCursor = 0;
    this.animT = 0;
    this.hudT = 0;
  }

  // ---------------------------------------------------------------- layout

  private layout() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.cx = this.W / 2;
    const portrait = this.H > this.W;
    this.horizon = this.H * (portrait ? 0.3 : 0.36);
    const roadPx = Math.min(this.W * 0.92, this.H * 0.95);
    this.f = (roadPx * ZP) / 3;
    this.camH = ((this.H * 0.86 - this.horizon) * ZP) / this.f;

    const skyScale = Math.max(this.W / 1024, (this.horizon + 8) / 640);
    this.sky.setPosition(this.cx, this.horizon + 8).setScale(skyScale);
    this.haze.setPosition(0, this.horizon - 4).setDisplaySize(this.W, this.H * 0.1);
  }

  private proj(x: number, y: number, z: number) {
    const s = this.f / z;
    return { x: this.cx + x * s, y: this.horizon + (this.camH - y) * s, s };
  }

  private depthFor(z: number) {
    return 100000 - z * 1000;
  }

  // ---------------------------------------------------------------- input

  private setupInput() {
    const kb = this.input.keyboard;
    kb?.on('keydown', (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.action('left');
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.action('right');
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          this.action('jump');
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.action('slide');
          break;
        case 'Escape':
        case 'KeyP':
          this.command(this.phase === 'paused' ? 'resume' : 'pause');
          break;
      }
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.swipeStart = { x: p.x, y: p.y, done: false };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const s = this.swipeStart;
      if (!s || s.done || !p.isDown) return;
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      const min = Math.max(24, Math.min(this.W, this.H) * 0.04);
      if (Math.abs(dx) < min && Math.abs(dy) < min) return;
      s.done = true;
      if (Math.abs(dx) > Math.abs(dy)) this.action(dx < 0 ? 'left' : 'right');
      else this.action(dy < 0 ? 'jump' : 'slide');
    });
    this.input.on('pointerup', () => {
      const s = this.swipeStart;
      this.swipeStart = null;
      if (s && !s.done && this.phase === 'ready') this.command('start');
    });
  }

  private action(a: 'left' | 'right' | 'jump' | 'slide') {
    if (this.phase === 'ready') {
      this.command('start');
      return;
    }
    if (this.phase !== 'running') return;
    if (a === 'left') this.lane = Math.max(-1, this.lane - 1);
    if (a === 'right') this.lane = Math.min(1, this.lane + 1);
    if (a === 'jump' && !this.airborne) {
      this.airborne = true;
      this.vy = JUMP_V;
      this.slideT = 0;
    }
    if (a === 'slide') {
      if (this.airborne) {
        this.vy = -22;
        this.pendingSlide = true;
      } else {
        this.slideT = SLIDE_TIME;
      }
    }
  }

  private command(cmd: GameCommand) {
    if (cmd === 'start' && this.phase === 'ready') this.setPhase('running');
    else if (cmd === 'pause' && this.phase === 'running') this.setPhase('paused');
    else if (cmd === 'resume' && this.phase === 'paused') this.setPhase('running');
    else if (cmd === 'restart') this.scene.restart();
  }

  private setPhase(p: GamePhase) {
    this.phase = p;
    bus.emit('phase', p);
  }

  // ---------------------------------------------------------------- spawning

  private addEntity(e: Omit<Entity, 'sprite'> & { tex: string }): Entity {
    const sprite = this.add.image(0, 0, e.tex).setOrigin(0.5, 1);
    const ent: Entity = { ...e, sprite };
    if (e.kind === 'train') {
      const n = Math.floor(e.len / 0.8);
      ent.slices = Array.from({ length: n }, () => this.add.image(0, 0, 'trainBody').setOrigin(0.5, 1));
    }
    this.entities.push(ent);
    return ent;
  }

  private spawnObstacle(kind: ObstacleKind, lane: number, z: number, vz = 0) {
    const def = OBSTACLES[kind];
    const tex = this.textures.get(kind).getSourceImage();
    const w = (def.h * tex.width) / tex.height;
    this.addEntity({ type: 'obstacle', kind, tex: kind, x: lane, y: 0, z, w, h: def.h, depth: def.depth, len: def.len ?? 0, vz });
  }

  private spawnCoin(lane: number, z: number, y = 0.12) {
    this.addEntity({ type: 'coin', kind: 'coin', tex: 'coin', x: lane, y, z, w: 0.42, h: 0.42, depth: 0.3, len: 0, vz: 0, phase: z });
  }

  private spawnPower(kind: PowerKind, lane: number, z: number) {
    this.addEntity({ type: 'power', kind, tex: kind, x: lane, y: 0.25, z, w: 0.62, h: 0.62, depth: 0.4, len: 0, vz: 0, phase: 0 });
  }

  private spawnDecor(z: number) {
    this.decorFlip = !this.decorFlip;
    for (const side of [-1, 1]) {
      if (this.decorFlip) {
        this.addEntity({ type: 'decor', kind: 'lamp', tex: 'lamp', x: side * 1.85, y: 0, z, w: 0.53, h: 2.2, depth: 0, len: 0, vz: 0 });
      }
      if (Math.random() < 0.75) {
        const h = rand(2.4, 3.2);
        this.addEntity({ type: 'decor', kind: 'tree', tex: 'tree', x: side * rand(2.6, 5.5), y: 0, z: z + rand(0, 1.5), w: h * 0.73, h, depth: 0, len: 0, vz: 0 });
      }
    }
  }

  private pickKind(): ObstacleKind {
    const pool: ObstacleKind[] = ['barrier', 'barrier', 'beam', 'beam', 'crate', 'crate'];
    if (this.dist > 40) pool.push('gap', 'gap');
    if (this.dist > 100) pool.push('train', 'train', 'train');
    return pick(pool);
  }

  private spawnRow(z: number) {
    const lanes = Phaser.Utils.Array.Shuffle([-1, 0, 1]);
    const r = Math.random();
    let count = r < 0.45 ? 1 : r < 0.88 ? 2 : 3;
    if (this.dist < 60) count = 1;
    const blocked = lanes.slice(0, count);
    const free = lanes.slice(count);
    const kinds = blocked.map(() => this.pickKind());
    if (count === 3 && !kinds.some((k) => k === 'barrier' || k === 'beam' || k === 'gap')) {
      kinds[0] = Math.random() < 0.5 ? 'barrier' : 'beam';
    }

    blocked.forEach((lane, i) => {
      const moving = kinds[i] === 'train' && this.dist > 250 && Math.random() < 0.35;
      this.spawnObstacle(kinds[i], lane, z, moving ? 6 : 0);
    });

    // coins: a trail in a free lane, or an arc over a barrier / hole
    if (Math.random() < 0.8) {
      const barrierLane = blocked.find((_, i) => kinds[i] === 'barrier' || kinds[i] === 'gap');
      if (barrierLane !== undefined && (free.length === 0 || Math.random() < 0.35)) {
        for (let i = -3; i <= 3; i++) {
          const t = i / 3;
          this.spawnCoin(barrierLane, z + i * 0.9, 0.2 + 1.15 * (1 - t * t));
        }
      } else if (free.length) {
        const lane = pick(free);
        const n = Math.floor(rand(5, 9));
        for (let i = 0; i < n; i++) this.spawnCoin(lane, z - 7 + i * 1.5);
      }
    }

    if (this.dist > 80 && free.length && Math.random() < 0.09) {
      this.spawnPower(pick(['magnet', 'shield', 'double'] as const), pick(free), z + 5);
    }
  }

  // ---------------------------------------------------------------- loop

  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.animT += dt;

    if (this.phase === 'running') this.step(dt);
    this.updateDino(dt);
    this.render();
  }

  private step(dt: number) {
    this.elapsed += dt;
    this.speed = Math.min(MAX_SPEED, START_SPEED + this.elapsed * ACCEL);
    const move = this.speed * dt;
    this.dist += move;
    const mult = this.powers.double > 0 ? 2 : 1;
    this.score += move * mult;

    // player physics
    this.px += (this.lane - this.px) * Math.min(1, dt * 16);
    if (this.airborne) {
      this.vy -= GRAVITY * dt;
      this.py += this.vy * dt;
      if (this.py <= 0) {
        this.py = 0;
        this.vy = 0;
        this.airborne = false;
        if (this.pendingSlide) this.slideT = SLIDE_TIME;
        this.pendingSlide = false;
      }
    }
    this.slideT = Math.max(0, this.slideT - dt);
    this.invulnT = Math.max(0, this.invulnT - dt);
    this.chaseT = Math.max(0, this.chaseT - dt);
    for (const k of Object.keys(this.powers) as PowerKind[]) this.powers[k] = Math.max(0, this.powers[k] - dt);

    // spawning
    this.spawnCursor -= move;
    if (this.spawnCursor <= 0) {
      this.spawnRow(FAR + this.spawnCursor);
      this.spawnCursor += rand(10, 14) + this.speed * 0.22;
    }
    this.decorCursor -= move;
    if (this.decorCursor <= 0) {
      this.spawnDecor(FAR + this.decorCursor);
      this.decorCursor += 3.2;
    }

    // world motion + interactions
    for (const e of this.entities) {
      e.z -= move + e.vz * dt;
      if (e.type === 'coin') this.updateCoin(e, dt);
      else if (e.type === 'power') this.checkPower(e);
      else if (e.type === 'obstacle') this.checkObstacle(e);
    }

    this.entities = this.entities.filter((e) => {
      const collected = e.hit && (e.type === 'coin' || e.type === 'power');
      if (collected || e.z + e.len < 0.6) {
        e.sprite.destroy();
        e.slices?.forEach((s) => s.destroy());
        return false;
      }
      return true;
    });

    this.hudT -= dt;
    if (this.hudT <= 0) {
      this.hudT = 0.1;
      this.emitHud();
    }
  }

  private playerHeight() {
    return this.slideT > 0 ? 0.55 : PLAYER_H;
  }

  private updateCoin(e: Entity, dt: number) {
    if (this.powers.magnet > 0 && !e.pulled && e.z < ZP + 14 && e.z > ZP - 0.5) e.pulled = true;
    if (e.pulled) {
      const k = Math.min(1, dt * 10);
      e.x += (this.px - e.x) * k;
      e.y += (this.py + 0.5 - e.y) * k;
      e.z += (ZP - e.z) * k;
    }
    const near = e.pulled ? 0.6 : 0.5;
    if (
      Math.abs(e.x - this.px) < near &&
      Math.abs(e.z - ZP) < 0.6 &&
      e.y + e.h > this.py - 0.1 &&
      e.y < this.py + this.playerHeight()
    ) {
      e.hit = true;
      this.coins += 1;
      this.score += 10 * (this.powers.double > 0 ? 2 : 1);
      this.sparkle(e);
    }
  }

  private checkPower(e: Entity) {
    if (Math.abs(e.x - this.px) < 0.55 && Math.abs(e.z - ZP) < 0.6 && e.y < this.py + this.playerHeight()) {
      e.hit = true;
      const kind = e.kind as PowerKind;
      this.powers[kind] = POWER_TIME[kind];
      this.sparkle(e, 2);
    }
  }

  private checkObstacle(e: Entity) {
    if (e.hit || this.invulnT > 0) return;
    if (Math.abs(e.x - this.px) > 0.6) return;
    const front = e.z - e.depth / 2;
    const back = e.z + e.depth / 2 + e.len;
    if (front > ZP + 0.25 || back < ZP - 0.25) return;

    const kind = e.kind as ObstacleKind;
    if (kind === 'gap') {
      // only fall when properly over the hole and on the ground
      if (Math.abs(e.x - this.px) > 0.35 || this.airborne) return;
      if (Math.abs(e.z - ZP) > e.depth / 2 - 0.15) return;
    }
    if (kind === 'barrier' && this.py > 0.55) return;
    if (kind === 'beam' && this.slideT > 0) return;
    if (kind === 'crate' && this.py > 0.85) return;

    e.hit = true;
    if (this.powers.shield > 0) {
      this.powers.shield = 0;
      this.invulnT = 0.6;
      this.cameras.main.flash(150, 160, 210, 255);
      return;
    }
    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(120, 255, 120, 160);
    bus.emit('hit');
    if (this.chaseT > 0) {
      this.caught();
      return;
    }
    // first stumble: the dinosaur shows up and chases for a while
    this.chaseT = CHASE_TIME;
    this.invulnT = STUMBLE_GRACE;
    this.dinoX = this.px;
    this.showRoar();
  }

  private showRoar() {
    this.tweens.killTweensOf(this.roar);
    this.roar.setAlpha(1).setScale(0.4);
    this.tweens.add({ targets: this.roar, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.roar, alpha: 0, delay: 900, duration: 300 });
  }

  private caught() {
    this.caughtT = 0;
    this.showRoar();
    this.emitHud();
    this.setPhase('over');
    this.time.delayedCall(900, () =>
      bus.emit('gameover', { score: Math.floor(this.score), coins: this.coins, distance: Math.floor(this.dist) }),
    );
  }

  private updateDino(dt: number) {
    const target = this.chaseT > 0 || this.caughtT >= 0 ? 1 : 0;
    this.dinoShow += (target - this.dinoShow) * Math.min(1, dt * (target ? 5 : 2));
    this.dinoX += (this.px - this.dinoX) * Math.min(1, dt * 4);
    if (this.caughtT >= 0) this.caughtT = Math.min(1, this.caughtT + dt * 2.5);
  }

  private sparkle(e: Entity, scale = 1) {
    const p = this.proj(e.x, e.y + e.h / 2, Math.max(e.z, 1));
    const img = this.add.image(p.x, p.y, 'sparkle').setDepth(200000).setScale(scale);
    this.tweens.add({
      targets: img,
      y: p.y - 40 * scale,
      scale: 2 * scale,
      alpha: 0,
      angle: 90,
      duration: 380,
      ease: 'Cubic.easeOut',
      onComplete: () => img.destroy(),
    });
  }

  private emitHud() {
    const hud: HudState = {
      score: Math.floor(this.score),
      coins: this.coins,
      chase: this.chaseT / CHASE_TIME,
      mult: this.powers.double > 0 ? 2 : 1,
      powers: (Object.keys(this.powers) as PowerKind[])
        .filter((k) => this.powers[k] > 0)
        .map((k) => ({ kind: k, left: this.powers[k], total: POWER_TIME[k] })),
    };
    bus.emit('hud', hud);
  }

  // ---------------------------------------------------------------- render

  private render() {
    this.drawGround();

    for (const e of this.entities) {
      if (e.slices) {
        e.slices.forEach((s, i) => this.place(s, e.x, e.y, e.z + (i + 1) * 0.8, e.w, e.h));
      }
      let w = e.w;
      let y = e.y;
      if (e.type === 'coin') w *= Math.max(0.2, Math.abs(Math.cos(this.animT * 5 + (e.phase ?? 0))));
      if (e.type === 'power') y += Math.sin(this.animT * 4) * 0.08;
      this.place(e.sprite, e.x, y, e.z, w, e.h);
      // scenery right next to the camera would fill the screen: fade it out
      if (e.type === 'decor') e.sprite.setAlpha(e.sprite.alpha * Phaser.Math.Clamp((e.z - 1.2) / 1.8, 0, 1));
      if (e.kind === 'gap') e.sprite.setVisible(false); // drawn as part of the ground
    }

    // player
    const running = this.phase === 'running';
    let pose = 'run1';
    if (this.airborne) pose = 'jump';
    else if (this.slideT > 0) pose = 'slide';
    else if (running || this.phase === 'ready') {
      const period = running ? 0.13 * (START_SPEED / this.speed) + 0.05 : 0.35;
      pose = Math.floor(this.animT / period) % 2 ? 'run2' : 'run1';
    }
    this.player.setTexture(`${this.charId}-${pose}`);
    const bob = !this.airborne && this.slideT <= 0 && running ? Math.abs(Math.sin(this.animT * 18)) * 0.04 : 0;
    const p = this.proj(this.px, this.py + bob, ZP);
    const hPx = PLAYER_H * p.s;
    this.player
      .setPosition(p.x, p.y)
      .setDisplaySize(hPx * 0.8, hPx)
      .setDepth(this.depthFor(ZP) + 5)
      .setAngle((this.lane - this.px) * 14)
      .setAlpha(this.invulnT > 0 && this.powers.shield <= 0 ? (Math.floor(this.animT * 14) % 2 ? 0.35 : 1) : 1);
    if (this.phase === 'over') this.player.setTint(0xb9a3c9);
    else this.player.clearTint();

    const g = this.proj(this.px, 0, ZP);
    const shrink = 1 / (1 + this.py * 0.8);
    this.shadow
      .setPosition(g.x, g.y)
      .setDisplaySize(0.8 * g.s * shrink, 0.25 * g.s * shrink)
      .setDepth(this.depthFor(ZP) + 1);

    const shielded = this.powers.shield > 0;
    this.shieldFx.setVisible(shielded);
    if (shielded) {
      const c = this.proj(this.px, this.py + PLAYER_H * 0.5, ZP);
      const size = PLAYER_H * 1.25 * c.s * (1 + Math.sin(this.animT * 6) * 0.03);
      this.shieldFx.setPosition(c.x, c.y).setDisplaySize(size, size).setDepth(this.depthFor(ZP) + 6);
    }

    this.renderDino(p.x, p.y, hPx);
  }

  /** Placed in screen space relative to the player so it works on any aspect ratio. */
  private renderDino(playerX: number, feetY: number, playerPx: number) {
    if (this.dinoShow < 0.01) {
      this.dino.setVisible(false);
      return;
    }
    const s = this.f / DINO_Z;
    const hPx = DINO_H * s;
    const c = Phaser.Math.Easing.Cubic.Out(Math.max(0, this.caughtT));
    // peek from the bottom of the screen, a bit to the side of the runner;
    // when caught, lunge up and over the runner
    const offset = 0.4 * (1 - c);
    const x = Phaser.Math.Linear(this.proj(this.dinoX + offset, 0, DINO_Z).x, playerX, c);
    const hidden = this.H + 10;
    const chasing = feetY - playerPx * 0.45;
    const lunge = feetY - playerPx * 1.1;
    const top = Phaser.Math.Linear(hidden, Phaser.Math.Linear(chasing, lunge, c), this.dinoShow);
    const bob = this.phase === 'running' ? Math.abs(Math.sin(this.animT * 10)) * hPx * 0.03 : 0;
    this.dino
      .setVisible(true)
      .setPosition(x, top + hPx - bob)
      .setDisplaySize(hPx * (200 / 220), hPx)
      .setAngle(Math.sin(this.animT * 10) * 3)
      .setDepth(this.depthFor(DINO_Z));
    this.roar.setPosition(x, top - 20).setFontSize(Math.max(28, Math.round(playerPx * 0.18)));
  }

  private place(img: Phaser.GameObjects.Image, x: number, y: number, z: number, w: number, h: number) {
    if (z < 0.9 || z > FAR) {
      img.setVisible(false);
      return;
    }
    const p = this.proj(x, y, z);
    img
      .setVisible(true)
      .setPosition(p.x, p.y)
      .setDisplaySize(w * p.s, h * p.s)
      .setDepth(this.depthFor(z))
      .setAlpha(Phaser.Math.Clamp((FAR - z) / 12, 0, 1));
  }

  private quad(color: number, x0: number, x1: number, y0: number, y1: number, za: number, zb: number) {
    const a = this.proj(x0, y0, za);
    const b = this.proj(x1, y0, za);
    const c = this.proj(x1, y1, zb);
    const d = this.proj(x0, y1, zb);
    this.ground.fillStyle(color, 1);
    this.ground.fillPoints([a, b, c, d], true);
  }

  private drawGround() {
    const gr = this.ground;
    gr.clear();
    const zNear = Math.max(0.3, (this.camH * this.f) / (this.H - this.horizon + 2));
    const SEG = 2;
    const first = Math.floor((this.dist + zNear) / SEG);
    const segs: [number, number, number][] = [];
    for (let n = first; ; n++) {
      const z0 = Math.max(n * SEG - this.dist, zNear);
      const z1 = Math.min((n + 1) * SEG - this.dist, FAR);
      if (z0 >= FAR) break;
      segs.push([n, z0, z1]);
    }
    segs.reverse(); // far to near

    // floating-island cliffs
    for (const [, z0, z1] of segs) {
      for (const side of [-1, 1]) {
        const a = this.proj(side * 8, 0, z0);
        const b = this.proj(side * 8, 0, z1);
        const c = this.proj(side * 8, -2.2, z1);
        const d = this.proj(side * 8, -2.2, z0);
        gr.fillStyle(0xa77a5a, 1);
        gr.fillPoints([a, b, c, d], true);
      }
    }

    for (const [n, z0, z1] of segs) {
      const even = n % 2 === 0;
      this.quad(even ? 0x86d873 : 0x7bcd68, -8, 8, 0, 0, z0, z1);
      this.quad(even ? 0xe9d7c3 : 0xdcc6b0, -1.5, 1.5, 0, 0, z0, z1);
      this.quad(0xfff3e4, -1.66, -1.5, 0, 0, z0, z1);
      this.quad(0xfff3e4, 1.5, 1.66, 0, 0, z0, z1);
      if (even) {
        this.quad(0xf7b7d2, -0.53, -0.47, 0, 0, z0, z1);
        this.quad(0xf7b7d2, 0.47, 0.53, 0, 0, z0, z1);
      }
    }

    // holes in the bridge: sky below, plus the far wall of the hole
    const gaps = this.entities.filter((e) => e.kind === 'gap').sort((a, b) => b.z - a.z);
    for (const e of gaps) {
      const za = Math.max(e.z - e.depth / 2, zNear);
      const zb = Math.min(e.z + e.depth / 2, FAR);
      if (zb <= za) continue;
      const x0 = e.x - 0.5;
      const x1 = e.x + 0.5;
      this.quad(0xbfe2ff, x0, x1, 0, 0, za, zb);
      this.quad(0x8a5f45, x0, x1, 0, -0.5, zb, zb);
      this.quad(0x6d4a36, x0, x1, 0, 0, za, za + 0.06);
    }
  }
}
