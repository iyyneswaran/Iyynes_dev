import { describe, it, expect } from "vitest";
import { createGrid, blockRect, findPath, CELL } from "../src/pathfinding";
import { isWithinReach } from "../src/interactions";
describe("village navigation", () => {
  it("routes around a solid house without cutting through it", () => {
    const g = createGrid(160, 160);
    blockRect(g, 56, 40, 48, 80);
    const path = findPath(g, { x: 20, y: 76 }, { x: 140, y: 76 });
    expect(path.length).toBeGreaterThan(15);
    for (const p of path)
      expect(g[Math.floor(p.y / CELL)][Math.floor(p.x / CELL)]).toBe(0);
    expect(path.at(-1)).toEqual({ x: 140, y: 76 });
  });
  it("crosses a river only at the bridge opening", () => {
    const g = createGrid(160, 160);
    blockRect(g, 0, 64, 64, 32);
    blockRect(g, 96, 64, 64, 32);
    const path = findPath(g, { x: 20, y: 20 }, { x: 20, y: 140 });
    expect(path.length).toBeGreaterThan(0);
    for (const p of path.filter((p) => p.y >= 64 && p.y < 96))
      expect(p.x >= 64 && p.x < 96).toBe(true);
  });
  it("rejects water destinations, out of bounds taps, and sealed areas", () => {
    const g = createGrid(80, 80);
    blockRect(g, 0, 32, 80, 8);
    expect(findPath(g, { x: 12, y: 12 }, { x: 12, y: 36 })).toEqual([]);
    expect(findPath(g, { x: 12, y: 12 }, { x: 12, y: 60 })).toEqual([]);
    expect(findPath(g, { x: 12, y: 12 }, { x: -4, y: 12 })).toEqual([]);
  });
  it("requires proximity to the door for entry", () => {
    const door = { x: 504, y: 518 };
    expect(isWithinReach({ x: 504, y: 393 }, door)).toBe(false);
    expect(isWithinReach({ x: 504, y: 534 }, door)).toBe(true);
    expect(isWithinReach({ x: 600, y: 518 }, door)).toBe(false);
    expect(isWithinReach({ x: 504, y: 574 }, door)).toBe(false);
  });
});
