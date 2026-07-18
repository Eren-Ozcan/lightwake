import { LEVELS, LevelMap, FACINGS } from '../src/map';

let failures = 0;

LEVELS.forEach((rows, i) => {
  const label = `Level ${i + 1}`;

  const width = rows[0].length;
  if (!rows.every((r) => r.length === width)) {
    console.error(`${label}: ragged row widths`);
    failures++;
    return;
  }

  let map: LevelMap;
  try {
    map = new LevelMap(rows);
  } catch (e) {
    console.error(`${label}: failed to construct — ${(e as Error).message}`);
    failures++;
    return;
  }

  // Walk every floor cell and confirm it's part of a single simple path:
  // no cell may have more than 2 open neighbors (that would mean branching,
  // or two parallel corridor arms touching without a wall between them).
  const floorCells: { x: number; y: number }[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < width; x++) {
      if (!map.isWall(x, y)) floorCells.push({ x, y });
    }
  }

  for (const c of floorCells) {
    const openNeighbors = [
      [c.x + 1, c.y],
      [c.x - 1, c.y],
      [c.x, c.y + 1],
      [c.x, c.y - 1],
    ].filter(([nx, ny]) => !map.isWall(nx, ny)).length;
    if (openNeighbors > 2) {
      console.error(`${label}: branching/touching corridor at (${c.x},${c.y}) — ${openNeighbors} open neighbors`);
      failures++;
    }
  }

  // BFS from start over floor cells only, confirming end/checkpoint are
  // reachable and that there are no disconnected floor cells left over.
  const key = (p: { x: number; y: number }) => `${p.x},${p.y}`;
  const visited = new Set([key(map.start)]);
  const queue = [map.start];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (map.isWall(nx, ny)) continue;
      const k = `${nx},${ny}`;
      if (visited.has(k)) continue;
      visited.add(k);
      queue.push({ x: nx, y: ny });
    }
  }
  if (!visited.has(key(map.end))) {
    console.error(`${label}: end is NOT reachable from start`);
    failures++;
  }
  if (!visited.has(key(map.checkpoint))) {
    console.error(`${label}: checkpoint is NOT reachable from start`);
    failures++;
  }
  if (visited.size !== floorCells.length) {
    console.error(`${label}: disconnected floor cells present (${floorCells.length - visited.size} unreachable)`);
    failures++;
  }

  // The player always starts facing East (FACINGS[0]); the start cell must
  // not be a dead end in that direction.
  const east = FACINGS[0];
  if (map.isWall(map.start.x + east.dx, map.start.y + east.dy)) {
    console.error(`${label}: start cell is a dead end facing East (the player's fixed initial facing)`);
    failures++;
  }
});

console.log(failures === 0 ? `All ${LEVELS.length} levels valid.` : `${failures} problem(s) found across ${LEVELS.length} levels.`);
process.exit(failures === 0 ? 0 : 1);
