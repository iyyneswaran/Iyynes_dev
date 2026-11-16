export const CELL = 8,
  WORLD_W = 1024,
  WORLD_H = 768;
export interface Point {
  x: number;
  y: number;
}
export type Grid = Uint8Array[];
export const createGrid = (w = WORLD_W, h = WORLD_H): Grid =>
  Array.from(
    { length: Math.ceil(h / CELL) },
    () => new Uint8Array(Math.ceil(w / CELL)),
  );
export function blockRect(g: Grid, x: number, y: number, w: number, h: number) {
  for (
    let row = Math.max(0, Math.floor(y / CELL));
    row < Math.min(g.length, Math.ceil((y + h) / CELL));
    row++
  )
    for (
      let col = Math.max(0, Math.floor(x / CELL));
      col < Math.min(g[0].length, Math.ceil((x + w) / CELL));
      col++
    )
      g[row][col] = 1;
}
export function findPath(g: Grid, from: Point, to: Point): Point[] {
  const cols = g[0].length,
    rows = g.length,
    s = [Math.floor(from.x / CELL), Math.floor(from.y / CELL)],
    e = [Math.floor(to.x / CELL), Math.floor(to.y / CELL)];
  const valid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < cols && y < rows && !g[y][x],
    key = (x: number, y: number) => y * cols + x;
  if (!valid(...(s as [number, number])) || !valid(...(e as [number, number])))
    return [];
  const initial = key(s[0], s[1]),
    target = key(e[0], e[1]),
    queue = [initial],
    parents = new Map([[initial, -1]]);
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (cur === target) break;
    const x = cur % cols,
      y = Math.floor(cur / cols);
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = key(nx, ny);
      if (valid(nx, ny) && !parents.has(k)) {
        parents.set(k, cur);
        queue.push(k);
      }
    }
  }
  if (!parents.has(target)) return [];
  const result: Point[] = [];
  let step = target;
  while (step !== initial) {
    result.push({
      x: (step % cols) * CELL + 4,
      y: Math.floor(step / cols) * CELL + 4,
    });
    step = parents.get(step)!;
  }
  return result.reverse();
}
