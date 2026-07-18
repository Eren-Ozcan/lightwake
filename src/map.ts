export type Cell = '#' | '.' | 'S' | 'C' | 'E';

// A single winding corridor, one cell wide. Six turns to stress-test whether
// a player can still tell where they are facing after a run of blind turns.
export const LONG_LEVEL = [
  '###########',
  '#S........#',
  '#########.#',
  '#.........#',
  '#.#########',
  '#C........#',
  '#########.#',
  '#.........#',
  '####E######',
];

// Same shape, compressed to two turns (right, right) so a full run is a
// couple dozen taps instead of a hundred — fast enough to repeat several
// times in a row while iterating on the core feel.
export const SHORT_LEVEL = [
  '#######',
  '#S....#',
  '#####C#',
  '#####.#',
  '#E....#',
];

// Four turns in a right-right-left-left pattern: back-to-back turns in the
// same direction, then a reversal, so orientation has to survive both.
export const MID_LEVEL = [
  '#########',
  '#S......#',
  '#######.#',
  '#......C#',
  '#.#######',
  '#.#######',
  '#.....E##',
];

/** In play order: a short warm-up, a medium mixed-turn run, the full corridor. */
export const LEVELS = [SHORT_LEVEL, MID_LEVEL, LONG_LEVEL];

export interface Vec2 {
  x: number;
  y: number;
}

export class LevelMap {
  readonly width: number;
  readonly height: number;
  readonly start: Vec2;
  readonly checkpoint: Vec2;
  readonly end: Vec2;
  private readonly rows: Cell[][];

  constructor(rows: string[] = LONG_LEVEL) {
    this.rows = rows.map((row) => row.split('') as Cell[]);
    this.height = this.rows.length;
    this.width = this.rows[0].length;

    let start: Vec2 | undefined;
    let checkpoint: Vec2 | undefined;
    let end: Vec2 | undefined;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.rows[y][x];
        if (cell === 'S') start = { x, y };
        if (cell === 'C') checkpoint = { x, y };
        if (cell === 'E') end = { x, y };
      }
    }
    if (!start || !checkpoint || !end) {
      throw new Error('Level is missing S, C, or E marker');
    }
    this.start = start;
    this.checkpoint = checkpoint;
    this.end = end;
  }

  isWall(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return true;
    return this.rows[Math.floor(y)][Math.floor(x)] === '#';
  }

  cellAt(x: number, y: number): Cell {
    return this.rows[y][x];
  }
}

/** Cardinal facing, clockwise from east, matching screen coords (y grows down). */
export const FACINGS = [
  { name: 'E', angle: 0, dx: 1, dy: 0 },
  { name: 'S', angle: 90, dx: 0, dy: 1 },
  { name: 'W', angle: 180, dx: -1, dy: 0 },
  { name: 'N', angle: 270, dx: 0, dy: -1 },
] as const;

export interface RayHit {
  /** Angle relative to the player's facing, in degrees. Negative = left. */
  relativeAngle: number;
  /** Distance to the nearest wall, in grid cells. */
  distance: number;
  /** True if the ray ran out of range without hitting anything. */
  openEnded: boolean;
}

const RAY_ANGLES = [-60, -30, 0, 30, 60];
const MAX_RANGE = 8;
const STEP = 0.08;

/**
 * Casts a fan of rays across the player's front hemisphere only. Rays are
 * deliberately not cast behind the player: stereo panning alone can't
 * disambiguate front from back, so back-facing echoes would just read as
 * noise rather than information.
 */
export function castEchoRays(map: LevelMap, player: Vec2, facingAngle: number): RayHit[] {
  return RAY_ANGLES.map((relativeAngle) => {
    const rad = ((facingAngle + relativeAngle) * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const originX = player.x + 0.5;
    const originY = player.y + 0.5;

    let distance = 0;
    while (distance < MAX_RANGE) {
      const px = originX + dx * distance;
      const py = originY + dy * distance;
      if (map.isWall(px, py)) {
        return { relativeAngle, distance, openEnded: false };
      }
      distance += STEP;
    }
    return { relativeAngle, distance: MAX_RANGE, openEnded: true };
  });
}
