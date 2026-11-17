import { afterEach, describe, expect, it, vi } from "vitest";
import { HuntController } from "../src/HuntController";
import { createGrid } from "../src/pathfinding";
import { keepsakes } from "../src/missions";
import type { MissionState, PreviousHunt } from "../src/missions";

vi.mock("../src/art", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/art")>()),
  makeCanvas: () => ({ c: {}, ctx: { fillStyle: "", fillRect: vi.fn() } }),
}));
vi.mock("../src/audio", () => ({ audio: { play: vi.fn() } }));
afterEach(() => vi.unstubAllGlobals());

describe("live hunt collection", () => {
  it("emits completion exactly once on the fifth pickup, with no pickups while paused", () => {
    let saved: PreviousHunt = {};
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: (_key: string, value: string) => {
        saved = JSON.parse(value);
      },
    });
    vi.stubGlobal("window", { history: { state: {}, replaceState: vi.fn() } });
    const images = keepsakes.map(() => ({
      setOrigin() {
        return this;
      },
      setDepth() {
        return this;
      },
      destroy: vi.fn(),
    }));
    let imageIndex = 0;
    const scene = {
      textures: { addCanvas: vi.fn() },
      add: {
        image: () => images[imageIndex++],
        rectangle: () => ({
          setDepth() {
            return this;
          },
          destroy: vi.fn(),
        }),
      },
      tweens: { add: vi.fn() },
    };
    const snapshots: MissionState[] = [],
      onMission = (state: MissionState) => snapshots.push(state);
    const grid = createGrid();
    const controller = new HuntController(
      scene as unknown as ConstructorParameters<typeof HuntController>[0],
      grid,
      { x: 504, y: 393 },
      [],
      onMission,
      vi.fn(),
    );
    const points = Object.values(saved);
    expect(points).toHaveLength(5);
    controller.update(points[0]!, grid, false);
    expect(snapshots).toHaveLength(1);
    for (let index = 0; index < 5; index++) {
      controller.update(points[index]!, grid, true);
      expect(snapshots.at(-1)).toMatchObject({
        foundCount: index + 1,
        complete: index === 4,
      });
    }
    for (const point of points) controller.update(point!, grid, true);
    expect(snapshots.filter((snapshot) => snapshot.complete)).toHaveLength(1);
    expect(
      images
        .slice(0, 5)
        .every((image) => image.destroy.mock.calls.length === 1),
    ).toBe(true);
    expect(controller.hit(points[4]!)).toBeNull();
  });
});
