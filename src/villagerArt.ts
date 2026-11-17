import type Phaser from "phaser";
import { makeCanvas } from "./art";
import { villagers } from "./villagers";
import type { VillagerDefinition, VillagerId } from "./villagers";
const pixel = (
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};
function sprite(npc: VillagerDefinition, direction: number, frame: number) {
  const { c, ctx } = makeCanvas(24, 34);
  const p = (color: string, x: number, y: number, w: number, h: number) =>
    pixel(ctx, color, x, y, w, h);
  const step = frame === 1 ? -1 : frame === 2 ? 1 : 0,
    bob = frame ? 1 : 0;
  p("#3c4d50", 7, 25 + bob, 4, 5 + step);
  p("#3c4d50", 14, 25 + bob, 4, 5 - step);
  p("#594c3b", 6, 30 + step, 6, 3);
  p("#594c3b", 14, 30 - step, 6, 3);
  p(npc.coat, 6, 17 + bob, 13, 10);
  p(npc.color, 8, 18 + bob, 10, 8);
  p(npc.skin, 4, 19 + bob + step, 3, 6);
  p(npc.skin, 19, 19 + bob - step, 3, 6);
  p(npc.hair, 6, 5 + bob, 14, 13);
  p(npc.skin, 8, 8 + bob, 11, 9);
  p("#efcba1", 10, 9 + bob, 3, 5);
  p(npc.hair, 6, 4 + bob, 13, 5);
  p(npc.hair, 6, 8 + bob, 3, 6);
  if (direction === 0) {
    p("#354544", 10, 11 + bob, 2, 2);
    p("#354544", 16, 11 + bob, 2, 2);
    p("#af7c62", 13, 15 + bob, 3, 1);
  } else if (direction === 3) {
    p(npc.hair, 7, 7 + bob, 12, 10);
    p(npc.coat, 7, 17 + bob, 11, 9);
  } else {
    p("#354544", direction === 1 ? 8 : 17, 11 + bob, 2, 2);
    p(npc.skin, direction === 1 ? 6 : 19, 13 + bob, 2, 3);
  }
  if (npc.style === "ranger") {
    p("#7d7650", 4, 6 + bob, 18, 3);
    p("#c4b083", 7, 1 + bob, 12, 6);
    p("#ead5a2", 8, 1 + bob, 9, 2);
    p("#667d53", 7, 5 + bob, 12, 2);
    p("#d5bf83", 8, 17 + bob, 10, 3);
    p("#bda569", 16, 20 + bob, 3, 5);
    p("#496b4d", 11, 21 + bob, 2, 2);
  } else if (npc.style === "gardener") {
    p(npc.hair, 3, 10 + bob, 4, 11);
    p("#ab687b", 3, 10 + bob, 4, 2);
    if (direction !== 3) {
      p("#e2d4b1", 9, 19 + bob, 8, 8);
      p("#f5e7c4", 9, 19 + bob, 2, 6);
      p("#a5ad78", 11, 23 + bob, 4, 3);
    }
    p("#e8c391", 16, 6 + bob, 4, 3);
    p("#b88872", 17, 7 + bob, 2, 1);
  } else if (npc.style === "tinkerer") {
    p("#a7b6ad", 7, 6 + bob, 13, 3);
    p("#7394a2", 9, 6 + bob, 4, 3);
    p("#7394a2", 16, 6 + bob, 3, 3);
    p("#d2b677", 10, 18 + bob, 3, 8);
    p("#485f70", 6, 20 + bob, 3, 7);
    p("#bec5aa", 16, 23 + bob, 3, 2);
  } else {
    p("#b6a778", 8, 5 + bob, 12, 3);
    p("#d5bd8a", 9, 3 + bob, 10, 3);
    p("#795a3f", 7, 19 + bob, 2, 9);
    p("#be9666", 15, 22 + bob, 7, 7);
    p("#e2bd81", 16, 23 + bob, 5, 2);
    p("#e6d1a2", 17, 25 + bob, 3, 2);
    if (direction === 0) {
      p("#6a6856", 9, 10 + bob, 5, 4);
      p("#6a6856", 15, 10 + bob, 5, 4);
      p("#c3d2c1", 10, 11 + bob, 3, 2);
      p("#c3d2c1", 16, 11 + bob, 3, 2);
    }
  }
  return c;
}
export function registerVillagerArt(
  scene: Phaser.Scene,
): Record<VillagerId, string> {
  const portraits = {} as Record<VillagerId, string>;
  for (const npc of villagers) {
    for (let d = 0; d < 4; d++)
      for (let f = 0; f < 3; f++)
        scene.textures.addCanvas(`npc-${npc.id}-${d}-${f}`, sprite(npc, d, f));
    const { c, ctx } = makeCanvas(48, 48);
    const front = scene.textures
      .get(`npc-${npc.id}-0-0`)
      .getSourceImage() as HTMLCanvasElement;
    ctx.drawImage(front, 2, 0, 21, 23, 3, 1, 42, 46);
    portraits[npc.id] = c.toDataURL();
  }
  return portraits;
}
