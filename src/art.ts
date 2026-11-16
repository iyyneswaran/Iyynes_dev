import type Phaser from "phaser";
import { destinations } from "./content";
import { WORLD_W, WORLD_H } from "./pathfinding";
export interface Decoration {
  key: string;
  x: number;
  y: number;
  solid?: { x: number; y: number; w: number; h: number };
}
export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}
function rect(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
function poly(
  ctx: CanvasRenderingContext2D,
  color: string,
  points: number[][],
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}
function oval(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  rx: number,
  ry: number,
) {
  ctx.fillStyle = color;
  for (let j = -ry; j <= ry; j++) {
    const width = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry)));
    ctx.fillRect(x - width, y + j, width * 2, 1);
  }
}
export function registerArt(scene: Phaser.Scene) {
  const add = (
    key: string,
    w: number,
    h: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ) => {
    const { c, ctx } = makeCanvas(w, h);
    draw(ctx);
    scene.textures.addCanvas(key, c);
  };
  for (let variant = 0; variant < 4; variant++)
    add(`tree${variant}`, 64, 80, (ctx) => {
      const r = rng(77 + variant * 46);
      oval(ctx, "#46784266", 33, 71, 25, 7);
      rect(ctx, "#604f35", 27, 49, 10, 23);
      rect(ctx, "#8c7650", 29, 52, 4, 19);
      rect(ctx, "#aa8d5a", 30, 56, 2, 10);
      rect(ctx, "#4e5834", 25, 70, 14, 3);
      const palettes = [
        ["#285f3e", "#397c46", "#4e9550", "#67ad59", "#8abd68"],
        ["#326b43", "#4c8a46", "#6ca254", "#85b45e", "#a1c77a"],
        ["#205947", "#2f7551", "#408957", "#58a565", "#7ebc77"],
        ["#3e6945", "#507f46", "#6b984f", "#86b05b", "#a5c777"],
      ];
      const p = palettes[variant];
      if (variant === 2) {
        for (let tier = 0; tier < 4; tier++) {
          const y = 8 + tier * 12,
            w = 12 + tier * 7;
          poly(ctx, p[0], [
            [32, y - 7],
            [32 + w, y + 21],
            [32 + w - 5, y + 24],
            [32 - w + 5, y + 24],
            [32 - w, y + 21],
          ]);
          poly(ctx, p[2], [
            [31, y - 6],
            [32 + w - 4, y + 18],
            [32 - w + 2, y + 18],
          ]);
          poly(ctx, p[3], [
            [31, y - 4],
            [27, y + 14],
            [32 - w + 5, y + 16],
          ]);
          for (let n = 0; n < 9; n++)
            rect(ctx, p[1], 30 + (r() - 0.5) * w * 1.3, y + 8 + r() * 9, 3, 2);
        }
      } else {
        oval(ctx, p[0], 32, 43, 29, 22);
        oval(ctx, p[1], 30, 36, 29, 26);
        oval(ctx, p[2], 29, 30, 25, 23);
        oval(ctx, p[3], 26, 24, 20, 17);
        for (let n = 0; n < 76; n++) {
          const x = 7 + r() * 48,
            y = 9 + r() * 45;
          if (Math.pow((x - 30) / 25, 2) + Math.pow((y - 32) / 26, 2) < 0.92) {
            const col =
              p[
                Math.min(4, Math.max(1, Math.floor(r() * 4) + (y < 24 ? 1 : 0)))
              ];
            rect(
              ctx,
              col,
              x,
              y,
              3 + Math.floor(r() * 5),
              2 + Math.floor(r() * 3),
            );
          }
        }
        for (let n = 0; n < 15; n++)
          rect(ctx, p[4], 15 + r() * 25, 13 + r() * 15, 3, 2);
      }
    });
  const roofPalettes: Record<string, string[]> = {
    red: ["#754437", "#a95543", "#c87354", "#e29a6d"],
    orange: ["#76503b", "#b46c46", "#d08b55", "#edb976"],
    blue: ["#3e606a", "#527f91", "#72a5ae", "#a1c2c3"],
    purple: ["#574e69", "#7c6b8f", "#a08aa6", "#c1a9bc"],
    gold: ["#73633a", "#a68c47", "#c3a659", "#e1c87c"],
    green: ["#405f48", "#628260", "#82a06e", "#b0bc86"],
  };
  for (const [name, p] of Object.entries(roofPalettes))
    add(`house-${name}`, 128, 120, (ctx) => {
      oval(ctx, "#36654455", 66, 112, 59, 7);
      rect(ctx, "#665740", 14, 59, 100, 52);
      rect(ctx, "#e7dcad", 17, 62, 94, 44);
      rect(ctx, "#cfbf88", 18, 97, 92, 10);
      rect(ctx, "#b3a579", 13, 106, 103, 7);
      rect(ctx, "#eee3b9", 17, 106, 95, 3);
      for (let y = 71; y < 104; y += 8) {
        rect(ctx, "#cfc496", 18, y, 92, 1);
        for (let x = 20 + (y % 16 ? 0 : 8); x < 110; x += 18)
          rect(ctx, "#d9ce9f", x, y - 6, 1, 6);
      }
      rect(ctx, "#826d4c", 22, 64, 5, 43);
      rect(ctx, "#b39a69", 24, 66, 2, 39);
      rect(ctx, "#826d4c", 102, 64, 5, 43);
      for (const x of [32, 82]) {
        rect(ctx, "#806e50", x - 3, 76, 23, 22);
        rect(ctx, "#eadfac", x - 1, 77, 19, 18);
        rect(ctx, "#4f7984", x, 78, 17, 14);
        rect(ctx, "#8ec1c2", x + 2, 79, 13, 6);
        rect(ctx, "#bed6c5", x + 3, 80, 4, 3);
        rect(ctx, "#e9dcb0", x + 8, 78, 2, 16);
        rect(ctx, "#d5ca9b", x, 85, 17, 2);
        rect(ctx, "#6a6345", x - 4, 95, 25, 3);
        rect(ctx, "#5d8a50", x - 2, 93, 21, 3);
        for (let f = 0; f < 4; f++)
          rect(
            ctx,
            name === "purple" ? "#cba9c7" : "#dfb16d",
            x + f * 5,
            92,
            3,
            2,
          );
      }
      rect(ctx, "#807052", 55, 80, 20, 27);
      rect(ctx, "#506968", 58, 82, 14, 25);
      rect(ctx, "#3e5050", 60, 84, 10, 22);
      rect(ctx, "#e8d8a0", 68, 94, 2, 2);
      rect(ctx, "#aca083", 52, 108, 26, 4);
      rect(ctx, "#ded2a8", 50, 112, 30, 4);
      rect(ctx, "#695442", 91, 17, 12, 27);
      rect(ctx, "#ad9170", 93, 19, 8, 22);
      rect(ctx, "#ccaf84", 91, 16, 12, 4);
      rect(ctx, "#75604a", 93, 16, 8, 2);
      poly(ctx, p[0], [
        [8, 62],
        [8, 52],
        [23, 20],
        [102, 20],
        [120, 53],
        [120, 65],
        [64, 69],
      ]);
      poly(ctx, p[1], [
        [11, 53],
        [25, 22],
        [100, 22],
        [116, 54],
        [116, 61],
        [11, 61],
      ]);
      for (let y = 25; y < 59; y += 6) {
        const inset = Math.max(0, Math.ceil((52 - y) * 0.43));
        rect(ctx, p[2], 12 + inset, y, 104 - inset * 2, 3);
        rect(ctx, p[0], 12 + inset, y + 4, 104 - inset * 2, 1);
        for (let x = 16 + inset + (y % 12 ? 0 : 5); x < 114 - inset; x += 12)
          rect(ctx, p[1], x, y, 1, 4);
      }
      rect(ctx, p[3], 25, 20, 76, 3);
      rect(ctx, p[0], 9, 59, 110, 6);
      rect(ctx, p[2], 12, 60, 104, 2);
      rect(ctx, "#e4d3a1", 13, 66, 102, 3);
      // Small dormer and its glowing attic window.
      poly(ctx, p[0], [
        [49, 47],
        [64, 31],
        [79, 47],
      ]);
      poly(ctx, "#e5d6a6", [
        [52, 47],
        [64, 35],
        [76, 47],
        [76, 61],
        [52, 61],
      ]);
      rect(ctx, "#795e46", 58, 45, 13, 14);
      rect(ctx, "#b5c8ad", 60, 47, 9, 10);
      rect(ctx, "#e2d9ad", 64, 47, 1, 10);
      rect(ctx, "#e2d9ad", 60, 52, 9, 1);
      if (name === "orange") {
        rect(ctx, p[0], 6, 73, 15, 17);
        rect(ctx, p[3], 9, 76, 9, 8);
        rect(ctx, "#746448", 12, 89, 4, 15);
      }
    });
  add("fountain", 64, 60, (ctx) => {
    oval(ctx, "#57764644", 32, 53, 29, 6);
    oval(ctx, "#6e8279", 32, 42, 28, 13);
    oval(ctx, "#b7c2a1", 32, 39, 28, 13);
    oval(ctx, "#6398a3", 32, 38, 23, 9);
    oval(ctx, "#8dc5c1", 32, 37, 20, 6);
    rect(ctx, "#81918a", 28, 15, 8, 25);
    rect(ctx, "#c6d0b2", 29, 13, 6, 24);
    oval(ctx, "#849b93", 32, 16, 16, 5);
    oval(ctx, "#d0d7b9", 32, 13, 16, 5);
    oval(ctx, "#8ec9ca", 32, 12, 12, 3);
    rect(ctx, "#9edcda", 31, 3, 3, 10);
    rect(ctx, "#d2eee0", 32, 1, 2, 7);
    for (const x of [20, 43]) {
      rect(ctx, "#a9ddd3", x, 18, 2, 15);
      rect(ctx, "#cbe6d8", x - 1, 26, 2, 7);
    }
  });
  add("bush", 32, 24, (ctx) => {
    oval(ctx, "#486e3c", 16, 16, 16, 7);
    oval(ctx, "#5c8d45", 15, 11, 15, 9);
    for (let i = 0; i < 11; i++)
      rect(
        ctx,
        i % 2 ? "#88b358" : "#739f4c",
        5 + ((i * 2) % 21),
        5 + ((i * 7) % 12),
        4,
        3,
      );
  });
  add("rock", 26, 23, (ctx) => {
    oval(ctx, "#4b723d66", 13, 20, 13, 3);
    poly(ctx, "#6f8277", [
      [2, 17],
      [4, 8],
      [10, 3],
      [19, 4],
      [24, 14],
      [21, 20],
      [7, 22],
    ]);
    poly(ctx, "#a0ab94", [
      [5, 13],
      [8, 6],
      [17, 5],
      [21, 12],
      [17, 16],
      [8, 17],
    ]);
    rect(ctx, "#c1c6a7", 9, 6, 7, 2);
    rect(ctx, "#879683", 15, 16, 6, 3);
  });
  add("sign", 30, 33, (ctx) => {
    rect(ctx, "#6d5941", 13, 13, 4, 19);
    rect(ctx, "#97764d", 14, 13, 2, 17);
    rect(ctx, "#68563d", 0, 0, 30, 21);
    rect(ctx, "#c7a577", 2, 2, 26, 16);
    rect(ctx, "#ddbd89", 4, 3, 22, 2);
    rect(ctx, "#896e4c", 7, 8, 15, 2);
    rect(ctx, "#896e4c", 7, 12, 11, 2);
  });
  add("bench", 38, 29, (ctx) => {
    for (const x of [5, 29]) rect(ctx, "#5c5c43", x, 7, 4, 21);
    rect(ctx, "#7c6144", 0, 1, 38, 7);
    rect(ctx, "#bd945e", 1, 2, 36, 3);
    rect(ctx, "#866b47", 1, 11, 36, 9);
    rect(ctx, "#b8945f", 2, 12, 34, 3);
    rect(ctx, "#a18154", 2, 17, 34, 2);
  });
  add("lamp", 18, 53, (ctx) => {
    rect(ctx, "#586452", 7, 15, 4, 36);
    rect(ctx, "#93967a", 8, 17, 1, 31);
    rect(ctx, "#65705b", 4, 49, 10, 3);
    rect(ctx, "#4e6151", 2, 6, 14, 13);
    rect(ctx, "#f0d28a", 4, 8, 10, 8);
    rect(ctx, "#fff0b6", 6, 9, 4, 5);
    poly(ctx, "#556850", [
      [0, 6],
      [9, 0],
      [18, 6],
    ]);
  });
  add("mailbox", 20, 31, (ctx) => {
    rect(ctx, "#806546", 8, 16, 4, 15);
    rect(ctx, "#456f78", 1, 4, 18, 14);
    rect(ctx, "#749da1", 3, 2, 14, 12);
    rect(ctx, "#d7c99b", 5, 6, 9, 5);
    rect(ctx, "#a16751", 17, 1, 2, 12);
    rect(ctx, "#d98c65", 13, 1, 6, 5);
  });
  add("chicken", 16, 18, (ctx) => {
    oval(ctx, "#476f3e55", 8, 16, 7, 2);
    rect(ctx, "#b79456", 5, 13, 1, 4);
    rect(ctx, "#b79456", 10, 13, 1, 4);
    oval(ctx, "#efe7be", 8, 10, 6, 5);
    rect(ctx, "#fff4d2", 9, 4, 5, 7);
    rect(ctx, "#cb7553", 10, 2, 3, 3);
    rect(ctx, "#dc9e4c", 14, 7, 2, 2);
    rect(ctx, "#4a4d3c", 12, 5, 1, 1);
    rect(ctx, "#d0c795", 3, 8, 5, 3);
  });
  add("cat", 22, 20, (ctx) => {
    oval(ctx, "#466e3d55", 11, 18, 10, 2);
    rect(ctx, "#b67d4c", 3, 9, 14, 8);
    rect(ctx, "#dbac70", 4, 8, 12, 6);
    rect(ctx, "#e7bf87", 12, 3, 8, 9);
    poly(ctx, "#b87f50", [
      [12, 4],
      [12, 0],
      [15, 3],
      [18, 3],
      [20, 0],
      [20, 5],
    ]);
    rect(ctx, "#535240", 14, 5, 1, 2);
    rect(ctx, "#535240", 18, 5, 1, 2);
    rect(ctx, "#edd3a2", 14, 8, 5, 3);
    rect(ctx, "#a46b42", 1, 5, 3, 8);
    rect(ctx, "#e1b67b", 3, 14, 3, 4);
    rect(ctx, "#a46b42", 13, 14, 3, 4);
  });
  add("bird", 14, 12, (ctx) => {
    rect(ctx, "#596e76", 4, 4, 7, 5);
    rect(ctx, "#92b4bd", 6, 3, 5, 4);
    rect(ctx, "#e2c47b", 11, 5, 3, 2);
    rect(ctx, "#304d4b", 9, 4, 1, 1);
    rect(ctx, "#467286", 1, 5, 5, 3);
    rect(ctx, "#b8d0bf", 5, 8, 5, 2);
  });
  add("butterfly", 12, 12, (ctx) => {
    rect(ctx, "#dfba79", 0, 1, 4, 5);
    rect(ctx, "#f4d797", 7, 1, 4, 5);
    rect(ctx, "#d39569", 1, 7, 3, 3);
    rect(ctx, "#e5bc80", 7, 7, 3, 3);
    rect(ctx, "#725f47", 5, 3, 1, 7);
  });
  add("shadow", 24, 8, (ctx) => oval(ctx, "#244e434d", 12, 4, 10, 3));
  for (let dir = 0; dir < 4; dir++)
    for (let frame = 0; frame < 3; frame++)
      add(`player-${dir}-${frame}`, 24, 32, (ctx) => {
        const step = frame === 1 ? -1 : frame === 2 ? 1 : 0,
          bob = frame ? 1 : 0;
        rect(ctx, "#2e424b", 7, 23 + bob, 4, 6 + step);
        rect(ctx, "#2e424b", 14, 23 + bob, 4, 6 - step);
        rect(ctx, "#543e35", 6, 28 + step, 6, 3);
        rect(ctx, "#543e35", 14, 28 - step, 6, 3);
        rect(ctx, "#3d6157", 6, 15 + bob, 13, 11);
        rect(ctx, "#648775", 7, 15 + bob, 10, 8);
        rect(ctx, "#8ba28a", 8, 16 + bob, 2, 6);
        rect(ctx, "#dab58c", 4, 18 + bob + step, 3, 6);
        rect(ctx, "#dab58c", 19, 18 + bob - step, 3, 6);
        rect(ctx, "#764b38", 6, 5 + bob, 14, 12);
        rect(ctx, "#e5bf91", 8, 7 + bob, 11, 10);
        rect(ctx, "#f4d4a3", 9, 8 + bob, 8, 7);
        rect(ctx, "#633e32", 6, 3 + bob, 13, 6);
        rect(ctx, "#87543b", 8, 2 + bob, 9, 4);
        rect(ctx, "#a26d47", 8, 3 + bob, 5, 2);
        rect(ctx, "#704732", 6, 7 + bob, 3, 5);
        if (dir === 0) {
          rect(ctx, "#343f3e", 10, 10 + bob, 2, 2);
          rect(ctx, "#343f3e", 16, 10 + bob, 2, 2);
          rect(ctx, "#bc8769", 13, 14 + bob, 3, 1);
        } else if (dir === 3) {
          rect(ctx, "#764b38", 7, 5 + bob, 12, 11);
          rect(ctx, "#986242", 9, 6 + bob, 7, 5);
          rect(ctx, "#be9a69", 8, 17 + bob, 10, 8);
          rect(ctx, "#8d7854", 9, 19 + bob, 8, 5);
        } else {
          const eye = dir === 1 ? 8 : 17;
          rect(ctx, "#343f3e", eye, 10 + bob, 2, 2);
          rect(ctx, "#d6aa7d", dir === 1 ? 6 : 19, 12 + bob, 2, 3);
        }
        rect(ctx, "#be654c", 7, 15 + bob, 12, 3);
        rect(ctx, "#e19b69", 8, 15 + bob, 7, 1);
        if (dir !== 3) rect(ctx, "#be654c", 16, 17 + bob, 3, 6);
      });
}

export function createWorldArt(scene: Phaser.Scene) {
  const { c, ctx } = makeCanvas(WORLD_W, WORLD_H),
    r = rng(421);
  const decorations: Decoration[] = [];
  rect(ctx, "#8eba70", 0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 39000; i++) {
    const x = Math.floor(r() * WORLD_W),
      y = Math.floor(r() * WORLD_H);
    rect(
      ctx,
      ["#96c276", "#87b36a", "#a1c77c", "#81af64"][i % 4],
      x,
      y,
      r() < 0.8 ? 1 : 2,
      1,
    );
  }
  // Meandering grass meadows and soft ground variation.
  for (const [x, y, w, h] of [
    [145, 160, 200, 130],
    [678, 156, 224, 140],
    [157, 425, 182, 115],
    [682, 425, 212, 120],
    [350, 647, 315, 86],
  ]) {
    rect(ctx, "#95bf74", x, y, w, h);
    for (let i = 0; i < 180; i++)
      rect(ctx, "#9fc67c", x + r() * w, y + r() * h, 3, 1);
  }
  const paths = [
    [110, 324, 804, 45],
    [214, 252, 36, 302],
    [486, 238, 36, 506],
    [774, 253, 36, 299],
    [211, 531, 602, 30],
    [213, 280, 595, 29],
  ];
  for (const [x, y, w, h] of paths) {
    rect(ctx, "#769b5c", x - 3, y - 3, w + 6, h + 6);
    rect(ctx, "#c8bc85", x - 1, y - 1, w + 2, h + 2);
    rect(ctx, "#e5d6a0", x, y, w, h);
    for (let i = 0; i < (w * h) / 105; i++) {
      rect(
        ctx,
        i % 3 ? "#d9c993" : "#eee0b0",
        x + Math.floor(r() * w),
        y + Math.floor(r() * h),
        2,
        1,
      );
    }
    for (let a = 0; a < w; a += 8) {
      rect(ctx, "#b3b67b", x + a, y - 2, 3, 2);
      rect(ctx, "#a4ae72", x + a + 3, y + h, 2, 1);
    }
  }
  // The watercourse has stepped banks, sandy shallows and hand-drawn ripples.
  const water = (x: number, y: number, w: number, h: number) => {
    poly(ctx, "#577a53", [
      [x + 12, y - 5],
      [x + w - 15, y - 5],
      [x + w + 5, y + 12],
      [x + w + 5, y + h - 12],
      [x + w - 12, y + h + 5],
      [x + 8, y + h + 5],
      [x - 5, y + h - 10],
      [x - 5, y + 12],
    ]);
    poly(ctx, "#b9bf82", [
      [x + 12, y - 1],
      [x + w - 15, y - 1],
      [x + w + 1, y + 12],
      [x + w + 1, y + h - 12],
      [x + w - 12, y + h + 1],
      [x + 8, y + h + 1],
      [x - 1, y + h - 10],
      [x - 1, y + 12],
    ]);
    rect(ctx, "#68a7ad", x, y + 12, w, h - 24);
    rect(ctx, "#68a7ad", x + 12, y, w - 24, h);
    rect(ctx, "#7ebcbd", x + 4, y + 12, 4, h - 24);
    rect(ctx, "#acd3c2", x + 12, y + 3, w - 24, 3);
    rect(ctx, "#4d909d", x + 12, y + h - 6, w - 24, 4);
    for (let i = 0; i < (w * h) / 170; i++) {
      const xx = x + 12 + r() * (w - 28),
        yy = y + 10 + r() * (h - 22);
      rect(ctx, i % 3 ? "#83bec0" : "#b1d7cc", xx, yy, 4 + r() * 7, 1);
      if (i % 3 === 0) rect(ctx, "#9dceca", xx + 3, yy + 2, 5, 1);
    }
  };
  water(-12, 600, 1048, 60);
  water(59, 413, 84, 116);
  water(902, 299, 87, 233);
  water(818, 638, 161, 91);
  // Wooden bridge over the river, with rails and visible plank grain.
  rect(ctx, "#54674d", 479, 593, 52, 77);
  rect(ctx, "#896d48", 483, 591, 43, 78);
  for (let y = 593; y < 669; y += 7) {
    rect(ctx, "#bd9b68", 484, y, 42, 5);
    rect(ctx, "#d6b57b", 485, y, 40, 1);
    rect(ctx, "#9c7c53", 492 + (y % 3) * 5, y + 3, 12, 1);
  }
  for (const x of [479, 527]) {
    rect(ctx, "#604f3b", x, 584, 4, 89);
    rect(ctx, "#d2af76", x, 585, 3, 84);
    for (const y of [586, 615, 650, 670]) {
      rect(ctx, "#6e573e", x - 2, y, 8, 5);
      rect(ctx, "#dab784", x - 1, y, 6, 2);
    }
  }
  // Fields, a kitchen garden, and tiny flower beds.
  for (const [x, y, w, h] of [
    [302, 188, 61, 71],
    [654, 440, 58, 73],
    [291, 443, 60, 57],
  ]) {
    rect(ctx, "#759455", x - 3, y - 3, w + 6, h + 6);
    rect(ctx, "#9b8655", x, y, w, h);
    for (let yy = y + 5; yy < y + h; yy += 12) {
      rect(ctx, "#b69a63", x + 3, yy, w - 6, 2);
      for (let xx = x + 6; xx < x + w - 3; xx += 10) {
        rect(ctx, "#496e3d", xx, yy - 3, 3, 6);
        rect(ctx, "#689446", xx - 2, yy - 5, 7, 3);
        rect(ctx, "#9eb259", xx - 1, yy - 6, 3, 2);
        if (x === 654) rect(ctx, "#d4965a", xx, yy, 3, 3);
      }
    }
  }
  const flowerBed = (
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
  ) => {
    rect(ctx, "#77a660", x, y, w, h);
    for (let yy = y + 5; yy < y + h; yy += 10)
      for (let xx = x + 5; xx < x + w; xx += 9) {
        rect(ctx, "#557e44", xx, yy, 2, 6);
        rect(ctx, "#6e964d", xx - 2, yy + 3, 6, 2);
        rect(ctx, color, xx - 2, yy - 2, 5, 3);
        rect(ctx, color, xx - 1, yy - 3, 3, 5);
        rect(ctx, "#f3dda0", xx, yy - 1, 1, 1);
      }
  };
  flowerBed(152, 266, 34, 41, "#e8b3a0");
  flowerBed(837, 262, 35, 39, "#f1dc9b");
  flowerBed(417, 438, 27, 52, "#c8b2cf");
  flowerBed(550, 438, 28, 52, "#eee1a7");
  flowerBed(698, 226, 28, 48, "#dca2a5");
  flowerBed(271, 675, 80, 31, "#f0e4ae");
  flowerBed(654, 678, 91, 32, "#e9c5ac");
  for (let i = 0; i < 170; i++) {
    const x = r() * 1024,
      y = r() * 768;
    if (
      paths.some(
        ([a, b, w, h]) =>
          x > a - 8 && x < a + w + 8 && y > b - 8 && y < b + h + 8,
      ) ||
      (y > 592 && y < 666)
    )
      continue;
    rect(ctx, "#6a9c55", x, y, 1, 4);
    rect(ctx, "#76a75b", x - 2, y + 1, 2, 1);
    if (i % 5 === 0) {
      rect(ctx, "#f2dfa1", x - 1, y - 2, 3, 2);
      rect(ctx, "#f1efc8", x, y - 3, 1, 4);
    }
  }
  // Scattered paving stones around the central fountain.
  oval(ctx, "#789c62", 504, 351, 69, 40);
  oval(ctx, "#d9cea0", 504, 349, 64, 36);
  oval(ctx, "#e5d9ac", 504, 347, 58, 31);
  for (let i = 0; i < 38; i++) {
    const a = r() * Math.PI * 2,
      rr = 28 + r() * 28;
    rect(
      ctx,
      "#bdb88b",
      504 + Math.cos(a) * rr,
      347 + Math.sin(a) * rr * 0.5,
      5,
      2,
    );
  }
  const tree = (x: number, y: number, type = 0) =>
    decorations.push({
      key: `tree${type}`,
      x,
      y,
      solid: { x: x - 16, y: y - 15, w: 32, h: 19 },
    });
  for (let x = 22; x < 1040; x += 39) {
    tree(x, 68, Math.floor(r() * 4));
    tree(x + 17, 105, Math.floor(r() * 4));
    if (x < 180 || x > 870) tree(x, 143, Math.floor(r() * 4));
    tree(x + 4, 766, Math.floor(r() * 4));
  }
  for (let y = 160; y < 760; y += 39) {
    tree(20, y, 2);
    tree(53, y + 15, Math.floor(r() * 3));
    tree(1010, y, 2);
    if (y < 294 || y > 536) tree(971, y + 12, Math.floor(r() * 3));
  }
  for (const [x, y, type] of [
    [124, 210, 0],
    [386, 235, 2],
    [618, 220, 1],
    [883, 220, 2],
    [137, 328, 1],
    [365, 358, 0],
    [646, 354, 2],
    [875, 358, 0],
    [155, 480, 2],
    [373, 493, 1],
    [624, 486, 0],
    [873, 490, 1],
    [132, 574, 0],
    [371, 581, 2],
    [652, 578, 2],
    [875, 578, 0],
    [147, 706, 1],
    [207, 726, 0],
    [388, 715, 2],
    [612, 724, 0],
    [775, 726, 2],
  ])
    tree(x, y, type);
  const prop = (key: string, x: number, y: number, solid = false) =>
    decorations.push({
      key,
      x,
      y,
      solid: solid ? { x: x - 10, y: y - 7, w: 20, h: 10 } : undefined,
    });
  for (const [x, y] of [
    [174, 354],
    [315, 353],
    [689, 355],
    [852, 352],
    [429, 552],
    [569, 553],
  ])
    prop("bush", x, y, true);
  for (const [x, y] of [
    [177, 231],
    [566, 246],
    [851, 236],
    [177, 499],
    [566, 501],
    [853, 500],
    [375, 668],
  ])
    prop("rock", x, y, true);
  for (const [x, y] of [
    [403, 335],
    [590, 382],
    [429, 697],
    [702, 569],
  ])
    prop("bench", x, y, true);
  for (const [x, y] of [
    [420, 308],
    [590, 308],
    [420, 410],
    [590, 410],
    [463, 574],
    [549, 574],
  ])
    prop("lamp", x, y, true);
  destinations.forEach((d) => {
    prop("sign", d.x + 75, d.y + 6, true);
    if (d.id === "contact") prop("mailbox", d.x - 73, d.y - 5, true);
  });
  // Fence segments: individual posts and weathered horizontal rails.
  const fences: { x: number; y: number; w: number; h: number }[] = [];
  const fence = (x: number, y: number, count: number) => {
    rect(ctx, "#706a46", x, y + 4, count * 12, 3);
    rect(ctx, "#d3c692", x, y, count * 12, 3);
    for (let i = 0; i <= count; i++) {
      rect(ctx, "#797347", x + i * 12, y - 5, 4, 14);
      rect(ctx, "#e4d6a6", x + i * 12, y - 6, 3, 12);
      rect(ctx, "#f3e7bc", x + i * 12, y - 6, 3, 2);
    }
    fences.push({ x, y: y - 2, w: count * 12 + 4, h: 8 });
  };
  fence(291, 178, 6);
  fence(646, 429, 6);
  fence(291, 431, 5);
  fence(147, 556, 10);
  fence(692, 555, 13);
  fence(265, 715, 8);
  fence(650, 718, 8);
  scene.textures.addCanvas("ground", c);
  return { ground: c, decorations, fences };
}
