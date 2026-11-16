import type Phaser from "phaser";
import { makeCanvas, rng } from "./art";
import { seasonColor } from "./seasons";
import type { Season } from "./seasons";
type Context = CanvasRenderingContext2D;
const pixel = (
  ctx: Context,
  color: string,
  x: number,
  y: number,
  w = 1,
  h = 1,
) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};
export function seasonalTexture(
  scene: Phaser.Scene,
  key: string,
  season: Season,
): string {
  if (season === "summer") return key;
  const name = `${key}@${season}`;
  if (scene.textures.exists(name)) return name;
  const source = scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
  const { c, ctx } = makeCanvas(source.width, source.height);
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < image.data.length; i += 4) {
    if (!image.data[i + 3]) continue;
    const col = seasonColor(
      key,
      season,
      image.data[i],
      image.data[i + 1],
      image.data[i + 2],
    );
    image.data[i] = col[0];
    image.data[i + 1] = col[1];
    image.data[i + 2] = col[2];
  }
  ctx.putImageData(image, 0, 0);
  if (season === "winter") {
    if (key.startsWith("house-")) {
      pixel(ctx, "#a8c4ce", 24, 19, 80, 5);
      pixel(ctx, "#f6f8ed", 24, 18, 78, 4);
      pixel(ctx, "#e4eeea", 20, 25, 88, 3);
      for (let i = 0; i < 8; i++) {
        const x = 13 + i * 13;
        pixel(ctx, "#c2d9dd", x, 54, 11, 7);
        pixel(ctx, "#f6f7ed", x, 53, 11, 4);
        pixel(ctx, "#eff5ed", x + 3, 57, 3, (i % 3) + 3);
      }
      pixel(ctx, "#f5f7ed", 90, 15, 14, 4);
      pixel(ctx, "#d3e4e4", 12, 105, 40, 3);
      pixel(ctx, "#f7f8ed", 29, 75, 23, 3);
      pixel(ctx, "#f7f8ed", 79, 75, 23, 3);
    }
    if (key === "bench") {
      pixel(ctx, "#f8f8ee", 1, 0, 36, 3);
      pixel(ctx, "#e4eeee", 2, 11, 34, 3);
    }
    if (key === "sign") {
      pixel(ctx, "#f5f8f1", 0, 0, 30, 3);
      pixel(ctx, "#d9e8e6", 2, 3, 4, 2);
    }
    if (key === "rock") {
      pixel(ctx, "#eff6ef", 8, 4, 11, 4);
      pixel(ctx, "#e2eeeb", 6, 8, 14, 3);
    }
    if (key === "fountain") {
      pixel(ctx, "#e5f2ed", 22, 9, 20, 6);
      pixel(ctx, "#d5e7eb", 12, 35, 40, 5);
      pixel(ctx, "#f3f9f2", 21, 38, 16, 1);
    }
  }
  if (key === "ground") dressGround(ctx, season);
  scene.textures.addCanvas(name, c);
  return name;
}
function dressGround(ctx: Context, season: Season) {
  const r = rng(517);
  const inPath = (x: number, y: number) =>
    (y > 315 && y < 380) ||
    (x > 206 && x < 257 && y > 260 && y < 566) ||
    (x > 476 && x < 535 && y > 240 && y < 750) ||
    (x > 763 && x < 819 && y > 260 && y < 566) ||
    (y > 525 && y < 566 && x > 210 && x < 820);
  if (season === "winter") {
    for (const [x, y, w, h] of [
      [302, 188, 61, 71],
      [654, 440, 58, 73],
      [291, 443, 60, 57],
      [152, 266, 34, 41],
      [837, 262, 35, 39],
      [417, 438, 27, 52],
      [550, 438, 28, 52],
      [698, 226, 28, 48],
      [271, 675, 80, 31],
      [654, 678, 91, 32],
    ]) {
      pixel(ctx, "#d9e7e4", x, y, w, h);
      for (let i = 0; i < 18; i++) {
        pixel(ctx, "#f4f7ee", x + r() * w, y + r() * h, 4, 2);
        if (i % 3 === 0) pixel(ctx, "#8eaaa1", x + r() * w, y + r() * h, 1, 4);
      }
    }
    // Long, irregular hairline cracks distinguish ice from ordinary water.
    ctx.strokeStyle = "#f0f8f2";
    ctx.lineWidth = 1;
    for (const [x, y, w, h] of [
      [70, 427, 60, 87],
      [915, 315, 59, 195],
      [30, 611, 430, 35],
      [552, 613, 405, 35],
      [835, 655, 122, 58],
    ])
      for (let i = 0; i < 4; i++) {
        const xx = x + r() * w,
          yy = y + r() * h;
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx + 5, yy + 5);
        ctx.lineTo(xx + 16, yy + 7);
        ctx.lineTo(xx + 20, yy + 13);
        ctx.stroke();
        pixel(ctx, "#f8fcf5", xx + 23, yy - 4, 5, 1);
      }
    for (const [x, y, w] of [
      [291, 172, 76],
      [646, 423, 76],
      [291, 425, 64],
      [147, 550, 124],
      [692, 549, 160],
      [265, 709, 100],
      [650, 712, 100],
    ])
      pixel(ctx, "#f8faf1", x, y, w, 2);
  }
  if (season === "spring") {
    const flower = (x: number, y: number, tulip: boolean) => {
      pixel(ctx, "#578945", x, y, 1, 7);
      pixel(ctx, "#76a454", x - 2, y + 3, 5, 2);
      if (tulip) {
        pixel(ctx, "#e2a1ad", x - 2, y - 3, 5, 4);
        pixel(ctx, "#f7c4c6", x - 2, y - 4, 1, 2);
        pixel(ctx, "#f7c4c6", x + 2, y - 4, 1, 2);
      } else {
        pixel(ctx, "#f5e29b", x - 3, y - 1, 7, 2);
        pixel(ctx, "#f8edb2", x - 1, y - 3, 3, 6);
        pixel(ctx, "#d1a14c", x, y - 1, 1, 2);
      }
    };
    for (const [x, y, w, h] of [
      [150, 265, 41, 45],
      [831, 262, 48, 42],
      [400, 438, 35, 55],
      [550, 438, 34, 55],
      [272, 673, 80, 33],
    ])
      for (let yy = y; yy < y + h; yy += 12)
        for (let xx = x; xx < x + w; xx += 10)
          flower(xx, yy, (xx + yy) % 3 === 0);
    for (let i = 0; i < 110; i++) {
      const x = 90 + r() * 830,
        y = 165 + r() * 410;
      if (!inPath(x, y) && !(x > 895 || (x < 145 && y > 410))) {
        pixel(ctx, i % 2 ? "#f4d4d4" : "#f9e7b3", x, y, 2, 2);
      }
    }
  }
  if (season === "rainy") {
    for (const [x, y, w, h] of [
      [273, 340, 23, 5],
      [514, 289, 16, 4],
      [735, 346, 29, 6],
      [222, 383, 17, 5],
      [492, 554, 25, 5],
      [779, 522, 22, 6],
      [160, 348, 19, 4],
      [332, 539, 23, 4],
    ]) {
      pixel(ctx, "#638f85", x, y, w, h);
      pixel(ctx, "#8bb6ac", x + 2, y + 1, w - 4, h - 2);
      pixel(ctx, "#b0ccc0", x + 4, y + 1, w / 2, 1);
    }
    for (const [x, y] of [
      [145, 401],
      [859, 398],
      [346, 458],
      [608, 563],
    ]) {
      pixel(ctx, "#e1c9a0", x, y, 3, 6);
      pixel(ctx, "#bc8c6c", x - 3, y - 2, 9, 4);
      pixel(ctx, "#e0c5a1", x - 1, y - 1, 2, 1);
    }
  }
  if (season === "autumn") {
    for (let i = 0; i < 530; i++) {
      const x = 80 + r() * 855,
        y = 150 + r() * 590;
      if (
        (y > 596 && y < 663) ||
        (x > 897 && y > 294 && y < 535) ||
        (x < 147 && y > 410 && y < 535)
      )
        continue;
      pixel(
        ctx,
        ["#ce9253", "#b87743", "#dbb368", "#9d7750"][i % 4],
        x,
        y,
        2 + (i % 3),
        1 + (i % 2),
      );
      if (i % 5 === 0) pixel(ctx, "#bd9254", x + 1, y - 1, 1, 4);
    }
    for (const [x, y] of [
      [349, 249],
      [650, 510],
      [686, 515],
      [330, 483],
    ]) {
      pixel(ctx, "#827047", x + 3, y - 3, 2, 4);
      pixel(ctx, "#b77b41", x, y, 10, 7);
      pixel(ctx, "#df9c50", x + 2, y - 1, 6, 8);
      pixel(ctx, "#f0b261", x + 3, y, 1, 5);
    }
  }
}
export function registerSeasonalCreatures(scene: Phaser.Scene) {
  const add = (
    key: string,
    w: number,
    h: number,
    draw: (ctx: Context) => void,
  ) => {
    const { c, ctx } = makeCanvas(w, h);
    draw(ctx);
    scene.textures.addCanvas(key, c);
  };
  for (const [species, fur, shade] of [
    ["hare", "#f4f4e5", "#b8ccca"],
    ["rabbit", "#bd9777", "#8b7158"],
  ] as const)
    add(species, 24, 26, (ctx) => {
      pixel(ctx, shade, 4, 13, 16, 9);
      pixel(ctx, fur, 5, 12, 13, 8);
      pixel(ctx, fur, 12, 7, 9, 9);
      pixel(ctx, fur, 12, 0, 3, 9);
      pixel(ctx, fur, 18, 1, 3, 8);
      pixel(ctx, "#dfb7ad", 13, 2, 1, 5);
      pixel(ctx, "#344b4d", 18, 10, 1, 2);
      pixel(ctx, "#eee7d3", 2, 14, 4, 4);
      pixel(ctx, fur, 8, 21, 5, 3);
      pixel(ctx, shade, 17, 20, 5, 2);
    });
  add("cardinal", 17, 17, (ctx) => {
    pixel(ctx, "#8e4c42", 3, 7, 10, 6);
    pixel(ctx, "#c16653", 5, 5, 9, 6);
    pixel(ctx, "#db8765", 7, 3, 5, 4);
    pixel(ctx, "#c5684e", 8, 1, 3, 4);
    pixel(ctx, "#303f40", 11, 6, 2, 2);
    pixel(ctx, "#edc283", 14, 8, 3, 2);
    pixel(ctx, "#a95a46", 1, 10, 5, 3);
    pixel(ctx, "#5e6260", 8, 13, 1, 3);
  });
  add("robin", 17, 16, (ctx) => {
    pixel(ctx, "#766a50", 3, 6, 10, 6);
    pixel(ctx, "#a99772", 7, 3, 7, 8);
    pixel(ctx, "#d89362", 7, 8, 7, 5);
    pixel(ctx, "#dcc78f", 14, 6, 3, 2);
    pixel(ctx, "#334443", 11, 5, 1, 1);
    pixel(ctx, "#665e4b", 0, 8, 6, 3);
    pixel(ctx, "#716651", 9, 13, 1, 3);
  });
  add("frog", 19, 15, (ctx) => {
    pixel(ctx, "#456c4e", 2, 6, 14, 7);
    pixel(ctx, "#73a05a", 4, 4, 11, 7);
    pixel(ctx, "#94b970", 4, 2, 4, 5);
    pixel(ctx, "#94b970", 11, 2, 4, 5);
    pixel(ctx, "#344c41", 5, 3, 1, 2);
    pixel(ctx, "#344c41", 12, 3, 1, 2);
    pixel(ctx, "#7ba362", 0, 10, 5, 3);
    pixel(ctx, "#7ba362", 14, 10, 5, 3);
    pixel(ctx, "#c4d293", 7, 9, 5, 2);
  });
  add("duck", 22, 21, (ctx) => {
    pixel(ctx, "#b1a781", 3, 10, 15, 8);
    pixel(ctx, "#ddd0a1", 4, 11, 13, 5);
    pixel(ctx, "#4b7960", 13, 3, 7, 10);
    pixel(ctx, "#699778", 14, 2, 5, 6);
    pixel(ctx, "#dbb25f", 18, 7, 4, 3);
    pixel(ctx, "#324e49", 17, 4, 1, 1);
    pixel(ctx, "#698f8c", 6, 11, 8, 3);
    pixel(ctx, "#c89e57", 8, 18, 2, 2);
  });
  add("squirrel", 25, 25, (ctx) => {
    pixel(ctx, "#93613f", 2, 2, 9, 15);
    pixel(ctx, "#b27d4e", 1, 3, 8, 11);
    pixel(ctx, "#cd9863", 2, 3, 4, 7);
    pixel(ctx, "#b47f4e", 7, 12, 12, 9);
    pixel(ctx, "#ce9e6e", 11, 11, 8, 7);
    pixel(ctx, "#b78250", 14, 6, 8, 8);
    pixel(ctx, "#9a663f", 15, 3, 3, 5);
    pixel(ctx, "#3f493d", 19, 8, 1, 2);
    pixel(ctx, "#dac299", 17, 11, 5, 3);
    pixel(ctx, "#a5794e", 11, 21, 8, 2);
  });
  add("hedgehog", 23, 18, (ctx) => {
    pixel(ctx, "#6e6350", 2, 6, 15, 9);
    for (let i = 0; i < 6; i++)
      pixel(ctx, "#9c8a66", 3 + i * 2, 3 + (i % 2) * 2, 2, 7);
    pixel(ctx, "#ccb18a", 14, 9, 8, 6);
    pixel(ctx, "#3e4c42", 19, 10, 1, 1);
    pixel(ctx, "#7c6a50", 21, 12, 2, 2);
    pixel(ctx, "#7c6a50", 5, 15, 3, 2);
  });
  add("owl", 24, 29, (ctx) => {
    pixel(ctx, "#7a796b", 4, 9, 17, 16);
    pixel(ctx, "#acaa90", 6, 7, 13, 15);
    pixel(ctx, "#e2ddba", 6, 8, 6, 7);
    pixel(ctx, "#e2ddba", 13, 8, 6, 7);
    pixel(ctx, "#3b4e4d", 9, 10, 2, 3);
    pixel(ctx, "#3b4e4d", 14, 10, 2, 3);
    pixel(ctx, "#c6a467", 11, 15, 3, 3);
    pixel(ctx, "#6f7367", 3, 17, 4, 9);
    pixel(ctx, "#6f7367", 18, 17, 4, 9);
    pixel(ctx, "#93886b", 8, 25, 3, 2);
    pixel(ctx, "#93886b", 15, 25, 3, 2);
  });
  add("nest", 25, 17, (ctx) => {
    for (let i = 0; i < 4; i++)
      pixel(
        ctx,
        i % 2 ? "#a98a59" : "#8a704d",
        2 + i,
        7 + i * 2,
        21 - i * 2,
        2,
      );
    pixel(ctx, "#dddec3", 7, 5, 4, 5);
    pixel(ctx, "#c4d7cb", 13, 4, 4, 6);
  });
  add("torch", 10, 20, (ctx) => {
    pixel(ctx, "#6e4e34", 4, 10, 3, 10);
    pixel(ctx, "#b28b54", 4, 12, 1, 7);
    pixel(ctx, "#c66c3b", 2, 5, 7, 7);
    pixel(ctx, "#eba94e", 3, 2, 5, 9);
    pixel(ctx, "#ffe7a2", 4, 0, 2, 8);
    pixel(ctx, "#fff4c3", 4, 4, 2, 5);
  });
  const off = makeCanvas(18, 53);
  off.ctx.drawImage(
    scene.textures.get("lamp").getSourceImage() as HTMLCanvasElement,
    0,
    0,
  );
  pixel(off.ctx, "#9caeaa", 4, 8, 10, 8);
  pixel(off.ctx, "#bbcbc2", 6, 9, 4, 5);
  scene.textures.addCanvas("lamp-off", off.c);
}
