import Phaser from 'phaser';

export type PowerKind = 'magnet' | 'shield' | 'double';

export interface HudState {
  score: number;
  coins: number;
  lives: number;
  mult: number;
  powers: { kind: PowerKind; left: number; total: number }[];
}

export interface GameOverInfo {
  score: number;
  coins: number;
  distance: number;
}

export type GamePhase = 'ready' | 'running' | 'paused' | 'over';
export type GameCommand = 'start' | 'pause' | 'resume' | 'restart';

/**
 * Bridge between the Phaser scene and the React UI.
 * Scene → UI: 'hud', 'phase', 'gameover', 'hit'. UI → scene: 'cmd', 'character'.
 */
export const bus = new Phaser.Events.EventEmitter();
