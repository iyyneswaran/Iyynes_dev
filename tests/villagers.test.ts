import { describe, it, expect } from "vitest";
import { createGrid, blockRect, CELL, findPath } from "../src/pathfinding";
import {
  approachPath,
  canTalk,
  TALK_RADIUS,
  withResidentObstacles,
} from "../src/villagerNavigation";
import { villagers, getDialogue } from "../src/villagers";
import type { DialogueTopic, ConversationContext } from "../src/villagers";
import { destinations } from "../src/content";
import { SEASONS } from "../src/seasons";

describe("approaching villagers", () => {
  it("routes around roaming residents without changing permanent collisions or trapping an adjacent player", () => {
    const grid = createGrid(200, 200),
      from = { x: 84, y: 84 },
      residents = [
        { id: "rowan", x: 96, y: 84 },
        { id: "fern", x: 164, y: 84 },
      ];
    const dynamic = withResidentObstacles(grid, from, residents, "fern");
    expect(grid[10][12]).toBe(0);
    expect(dynamic[10][12]).toBe(1);
    expect(dynamic[10][10]).toBe(0);
    expect(dynamic[10][20]).toBe(0);
    const route = findPath(dynamic, from, { x: 140, y: 84 });
    expect(route.length).toBeGreaterThan(0);
    expect(route.some((p) => Math.abs(p.y - 84) > 12)).toBe(true);
    for (const p of route)
      expect(dynamic[Math.floor(p.y / CELL)][Math.floor(p.x / CELL)]).toBe(0);
  });
  it("requires a clear nearby line of sight, including across fences", () => {
    const grid = createGrid(160, 160),
      npc = { x: 100, y: 100 };
    expect(canTalk(grid, { x: 72, y: 100 }, npc)).toBe(true);
    expect(canTalk(grid, { x: 20, y: 100 }, npc)).toBe(false);
    blockRect(grid, 80, 80, 8, 48);
    expect(canTalk(grid, { x: 72, y: 100 }, npc)).toBe(false);
  });
  it("walks around a house to a conversational distance without occupying the villager’s body", () => {
    const grid = createGrid(200, 200),
      npc = { x: 156, y: 100 };
    blockRect(grid, 72, 64, 48, 72);
    const path = approachPath(grid, { x: 20, y: 100 }, npc);
    expect(path.length).toBeGreaterThan(0);
    for (const p of path)
      expect(grid[Math.floor(p.y / CELL)][Math.floor(p.x / CELL)]).toBe(0);
    const end = path.at(-1)!;
    expect(canTalk(grid, end, npc)).toBe(true);
    expect(Math.hypot(end.x - npc.x, end.y - npc.y)).toBeGreaterThan(20);
    expect(Math.hypot(end.x - npc.x, end.y - npc.y)).toBeLessThan(TALK_RADIUS);
  });
  it("does not teleport or invent a path to a villager enclosed by obstacles", () => {
    const grid = createGrid(200, 200);
    blockRect(grid, 80, 80, 64, 8);
    blockRect(grid, 80, 136, 64, 8);
    blockRect(grid, 80, 80, 8, 64);
    blockRect(grid, 136, 80, 8, 64);
    expect(approachPath(grid, { x: 20, y: 20 }, { x: 112, y: 112 })).toEqual(
      [],
    );
  });
});
describe("branching village conversations", () => {
  const topics: DialogueTopic[] = [
    "hello",
    "story",
    "weather",
    "advice",
    "joke",
    "directions",
  ];
  const context: ConversationContext = {
    season: "summer",
    phase: "Day",
    returning: false,
  };
  it("gives every villager valid replies, a way to leave, and real portfolio destinations", () => {
    for (const npc of villagers)
      for (const season of SEASONS)
        for (const topic of topics) {
          const node = getDialogue(npc.id, topic, { ...context, season });
          expect(node.text.length).toBeGreaterThan(30);
          expect(node.choices.length).toBeGreaterThan(0);
          expect(new Set(node.choices.map((c) => c.id)).size).toBe(
            node.choices.length,
          );
          expect(node.choices.some((c) => c.close)).toBe(true);
          for (const choice of node.choices) {
            if (choice.next) expect(topics).toContain(choice.next);
            if (choice.destination) {
              expect(
                destinations.some((d) => d.id === choice.destination),
              ).toBe(true);
              expect(choice.next).toBe("directions");
            }
          }
        }
  });
  it("changes greetings at night and remembers a returning visitor", () => {
    expect(
      getDialogue("pip", "hello", { ...context, phase: "Night" }).text,
    ).toMatch(/torch|lanterns/i);
    expect(
      getDialogue("pip", "hello", { ...context, returning: true }).text,
    ).toContain("again");
  });
  it("talks about the current season instead of using the same weather line", () => {
    expect(
      getDialogue("mira", "weather", { ...context, season: "spring" }).text,
    ).toMatch(/tulips.*daffodils/i);
    expect(
      getDialogue("pip", "weather", { ...context, season: "winter" }).text,
    ).toMatch(/frozen.*ice/i);
    expect(
      new Set(
        SEASONS.map(
          (season) =>
            getDialogue("fern", "weather", { ...context, season }).text,
        ),
      ).size,
    ).toBe(5);
  });
  it("marks a destination through a conversation branch while retaining the walk-to-door instruction", () => {
    const choice = getDialogue("rowan", "advice", context).choices.find(
      (c) => c.destination,
    )!;
    expect(choice.destination).toBe("projects");
    expect(choice.close).not.toBe(true);
    expect(getDialogue("rowan", choice.next!, context).text).toMatch(
      /walk.*front door/i,
    );
  });
});
