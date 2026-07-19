export type Cell = '#' | '.' | 'S' | 'C' | 'E';

// Minimal teaching corridor, one leg per mechanic: a straight run to learn
// tap/echo and forward movement (ending in a guaranteed wall bump at the
// corner), a right turn, the checkpoint right after it, then a left turn into
// a short final leg. Played before level 1, driven by src/tutorial.ts. Not
// part of LEVELS — it precedes the progression instead of counting toward it.
export const TUTORIAL_LEVEL = [
  '########',
  '#S...###',
  '####.###',
  '####C.E#',
  '########',
];

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
  '####......#',
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

export interface Vec2 {
  x: number;
  y: number;
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Deterministically generates a single-width winding corridor for a given
 * seed and turn count. Legs alternate horizontal/vertical starting
 * horizontal (so the player's fixed East starting facing always matches the
 * corridor); vertical legs always move south and are at least 2 cells long.
 * Those two rules alone guarantee the walk can never touch itself: every
 * horizontal leg ends up on a row no other leg will ever use again, so no
 * collision search or retry logic is needed the way a general self-avoiding
 * random walk would require.
 */
function generateLevel(seed: number, turnCount: number): string[] {
  const rng = mulberry32(seed);
  const legCount = turnCount + 1;
  const path: Vec2[] = [{ x: 0, y: 0 }];

  let x = 0;
  let y = 0;
  for (let leg = 0; leg < legCount; leg++) {
    if (leg % 2 === 0) {
      const length = randInt(rng, 2, 6);
      const sign = leg === 0 ? 1 : rng() < 0.5 ? 1 : -1;
      for (let i = 0; i < length; i++) {
        x += sign;
        path.push({ x, y });
      }
    } else {
      const length = randInt(rng, 2, 5); // >= 2, so consecutive horizontal legs never land on adjacent rows
      for (let i = 0; i < length; i++) {
        y += 1; // always south: rows only ever increase, so no leg can revisit or touch an earlier row
        path.push({ x, y });
      }
    }
  }

  const xs = path.map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = path[path.length - 1].y;
  const offsetX = 1 - minX; // leave a 1-cell wall border on the left
  const width = maxX - minX + 3; // + left/right border
  const height = maxY + 3; // + top/bottom border

  const grid: string[][] = Array.from({ length: height }, () => Array(width).fill('#'));
  for (const p of path) {
    grid[p.y + 1][p.x + offsetX] = '.';
  }

  const start = path[0];
  const end = path[path.length - 1];
  const checkpoint = path[Math.max(1, Math.min(path.length - 2, Math.floor(path.length / 2)))];
  grid[start.y + 1][start.x + offsetX] = 'S';
  grid[end.y + 1][end.x + offsetX] = 'E';
  grid[checkpoint.y + 1][checkpoint.x + offsetX] = 'C';

  return grid.map((row) => row.join(''));
}

// 57 procedurally generated levels, ramping from 5 turns up to 22 across the
// set, so the full progression (3 hand-built + 57 generated) reaches 60
// levels without hand-authoring each one.
const GENERATED_LEVELS: string[][] = Array.from({ length: 57 }, (_, g) => {
  const turnCount = Math.min(22, 5 + Math.floor(g / 3));
  return generateLevel(4000 + g, turnCount);
});

/** In play order: three hand-built levels, then 57 generated ones of rising difficulty — 60 total. */
export const LEVELS: string[][] = [SHORT_LEVEL, MID_LEVEL, LONG_LEVEL, ...GENERATED_LEVELS];

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
