import Phaser from "phaser";
import { makeCanvas, rng } from "./art";
import { destinations } from "./content";
import { audio } from "./audio";
import { seasonalTexture, registerSeasonalCreatures } from "./seasonalArt";
import { daylightAfter } from "./seasons";
import type { ClimateState, Season } from "./seasons";
import { LAMPS } from "./worldGeometry";

export interface Scenery {
  image: Phaser.GameObjects.Image;
  key: string;
}
interface Creature {
  image: Phaser.GameObjects.Image;
  nocturnal: boolean;
  always: boolean;
}
interface Mote {
  x: number;
  y: number;
  speed: number;
  size: number;
  phase: number;
}
/** Weather and light share a low-resolution screen canvas. It never intercepts game input. */
export class ClimateController {
  season: Season = "summer";
  private scene: Phaser.Scene;
  private scenery: Scenery[];
  private onMap: (map: HTMLCanvasElement) => void;
  private onClimate: (state: ClimateState) => void;
  private overlay: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Phaser.Physics.Arcade.Sprite;
  private torch: Phaser.GameObjects.Image;
  private creatures: Creature[] = [];
  private motes: Mote[] = [];
  private fireflies: Phaser.GameObjects.Rectangle[] = [];
  private start = performance.now();
  private daylight = daylightAfter(0);
  private lastReport = 0;
  private lampsOn: boolean | null = null;
  private frameAt = 0;
  private facing = 0;
  private lastNow = performance.now();
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches;
  constructor(
    scene: Phaser.Scene,
    parent: HTMLElement,
    scenery: Scenery[],
    player: Phaser.Physics.Arcade.Sprite,
    onMap: (map: HTMLCanvasElement) => void,
    onClimate: (state: ClimateState) => void,
  ) {
    this.scene = scene;
    this.scenery = scenery;
    this.player = player;
    this.onMap = onMap;
    this.onClimate = onClimate;
    registerSeasonalCreatures(scene);
    this.overlay = document.createElement("canvas");
    this.overlay.className = "climate-canvas";
    this.overlay.setAttribute("aria-hidden", "true");
    parent.appendChild(this.overlay);
    this.ctx = this.overlay.getContext("2d")!;
    this.torch = scene.add
      .image(0, 0, "torch")
      .setOrigin(0.5, 1)
      .setVisible(false);
    const r = rng(649);
    for (let i = 0; i < 150; i++)
      this.motes.push({
        x: r(),
        y: r(),
        speed: 0.5 + r() * 0.9,
        size: 1 + Math.floor(r() * 2),
        phase: r() * Math.PI * 2,
      });
    this.setSeason("summer");
    scene.game.events.on(Phaser.Core.Events.POST_RENDER, this.render, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }
  setSeason(season: Season) {
    this.season = season;
    for (const item of this.scenery)
      item.image.setTexture(seasonalTexture(this.scene, item.key, season));
    this.lampsOn = null;
    this.updateLamps();
    this.populateWildlife();
    this.publishMap();
    this.report();
    audio.setEnvironment(season, this.daylight.lightsOn);
  }
  private publishMap() {
    const { c, ctx } = makeCanvas(1024, 768);
    for (const { image } of [...this.scenery].sort(
      (a, b) => a.image.depth - b.image.depth,
    )) {
      const source = image.texture.getSourceImage() as HTMLCanvasElement;
      ctx.drawImage(
        source,
        image.x - image.displayOriginX,
        image.y - image.displayOriginY,
      );
    }
    this.onMap(c);
  }
  private populateWildlife() {
    for (const { image } of this.creatures) {
      this.scene.tweens.killTweensOf(image);
      image.destroy();
    }
    this.creatures = [];
    for (const f of this.fireflies) {
      this.scene.tweens.killTweensOf(f);
      f.destroy();
    }
    this.fireflies = [];
    const r = rng(803);
    const spawn = (
      key: string,
      x: number,
      y: number,
      range = 15,
      nocturnal = false,
      always = false,
    ) => {
      const image = this.scene.add
        .image(x, y, key)
        .setOrigin(0.5, 1)
        .setDepth(y);
      this.creatures.push({ image, nocturnal, always });
      if (range)
        this.scene.tweens.add({
          targets: image,
          x: x + (r() > 0.5 ? range : -range),
          y: y - (key === "bird" || key === "robin" ? 6 : 3),
          duration: 1900 + r() * 1700,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: r() * 1000,
          onUpdate: () => image.setDepth(image.y),
        });
    };
    if (this.season === "summer") {
      spawn("chicken", 339, 266);
      spawn("chicken", 362, 278);
      spawn("cat", 680, 377);
      spawn("bird", 401, 402);
      spawn("bird", 409, 395);
      spawn("chicken", 676, 502);
    }
    if (this.season === "spring") {
      spawn("rabbit", 346, 286, 18);
      spawn("hedgehog", 655, 392, 12);
      spawn("robin", 402, 397, 20);
      spawn("robin", 685, 281, 25);
      spawn("bird", 840, 373, 23);
      spawn("rabbit", 345, 521, 12);
      spawn("nest", 373, 211, 0, false, true);
      spawn("nest", 866, 334, 0, false, true);
    }
    if (this.season === "rainy") {
      spawn("frog", 157, 483, 7);
      spawn("frog", 889, 446, 7);
      spawn("duck", 919, 470, 9);
      spawn("duck", 940, 422, 10);
      spawn("cat", 680, 377, 3);
    }
    if (this.season === "autumn") {
      spawn("squirrel", 353, 383, 20);
      spawn("squirrel", 686, 287, 15);
      spawn("hedgehog", 605, 561, 10);
      spawn("robin", 419, 396, 14);
      spawn("cat", 680, 377, 10);
    }
    if (this.season === "winter") {
      spawn("hare", 353, 383, 19);
      spawn("hare", 687, 535, 14);
      spawn("cardinal", 401, 402, 13);
      spawn("cardinal", 840, 373, 15);
      spawn("owl", 630, 233, 0, false, true);
    } else spawn("owl", 630, 233, 0, true);
    if (this.season === "spring" || this.season === "summer")
      for (const [x, y] of [
        [303, 361],
        [719, 305],
        [583, 541],
        [168, 687],
      ]) {
        const image = this.scene.add.image(x, y, "butterfly").setDepth(y + 100);
        this.creatures.push({ image, nocturnal: false, always: false });
        this.scene.tweens.add({
          targets: image,
          x: x + 31,
          y: y - 16,
          scaleX: 0.3,
          duration: 1700,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
        });
      }
    if (this.season !== "winter" && this.season !== "rainy")
      for (let i = 0; i < 16; i++) {
        const f = this.scene.add
          .rectangle(100 + r() * 800, 180 + r() * 390, 2, 2, 0xf5ecc0, 0)
          .setDepth(900);
        this.fireflies.push(f);
        this.scene.tweens.add({
          targets: f,
          y: f.y - 18,
          x: f.x + 10,
          duration: 2400 + r() * 2500,
          yoyo: true,
          repeat: -1,
          delay: r() * 3000,
        });
      }
    this.updateWildlife();
  }
  private updateWildlife() {
    const d = this.daylight.darkness;
    for (const { image, nocturnal, always } of this.creatures)
      image.setAlpha(
        always
          ? 1
          : nocturnal
            ? Math.max(0, (d - 0.25) / 0.75)
            : Math.max(0, 1 - d * 1.8),
      );
    for (let i = 0; i < this.fireflies.length; i++)
      this.fireflies[i].setAlpha(
        d * 0.7 * (0.55 + Math.sin(this.lastNow / 750 + i) * 0.4),
      );
  }
  private updateLamps() {
    if (this.lampsOn === this.daylight.lightsOn) return;
    this.lampsOn = this.daylight.lightsOn;
    for (const item of this.scenery)
      if (item.key === "lamp")
        item.image.setTexture(
          seasonalTexture(
            this.scene,
            this.lampsOn ? "lamp" : "lamp-off",
            this.season,
          ),
        );
  }
  private report() {
    this.onClimate({ ...this.daylight, season: this.season });
  }
  update(facing: number) {
    this.facing = facing;
    this.lastNow = performance.now();
    this.daylight = daylightAfter(this.lastNow - this.start);
    this.updateLamps();
    this.updateWildlife();
    this.torch.setVisible(this.daylight.lightsOn);
    const hand = facing === 1 ? -11 : 11;
    this.torch
      .setPosition(
        this.player.x + hand,
        this.player.y - 9 + Math.sin(this.lastNow / 95) * 0.6,
      )
      .setDepth(this.player.y + (facing === 3 ? -1 : 1));
    if (this.lastNow - this.lastReport > 500) {
      this.report();
      audio.setEnvironment(this.season, this.daylight.lightsOn);
      this.lastReport = this.lastNow;
    }
  }
  private render() {
    const now = performance.now();
    if (now - this.frameAt < 1000 / 30) return;
    const dt = Math.min(0.06, (now - this.frameAt) / 1000);
    this.frameAt = now;
    const camera = this.scene.cameras.main,
      zoom = camera.zoom;
    const width = Math.ceil(camera.width / 2),
      height = Math.ceil(camera.height / 2);
    if (this.overlay.width !== width || this.overlay.height !== height) {
      this.overlay.width = width;
      this.overlay.height = height;
    }
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    const screen = (x: number, y: number) => ({
      x:
        ((x - camera.scrollX - camera.width / 2) * zoom + camera.width / 2) / 2,
      y:
        ((y - camera.scrollY - camera.height / 2) * zoom + camera.height / 2) /
        2,
    });
    const darkness = this.daylight.darkness;
    if (this.season === "rainy") {
      ctx.fillStyle = "rgba(34,69,87,.11)";
      ctx.fillRect(0, 0, width, height);
    }
    if (this.daylight.phase === "Dawn" || this.daylight.phase === "Dusk") {
      ctx.fillStyle = `rgba(209,123,88,${Math.sin(darkness * Math.PI) * 0.16})`;
      ctx.fillRect(0, 0, width, height);
    }
    if (darkness > 0) {
      ctx.fillStyle = `rgba(9,20,48,${darkness * 0.79})`;
      ctx.fillRect(0, 0, width, height);
      if (this.daylight.lightsOn) {
        ctx.globalCompositeOperation = "destination-out";
        const hole = (
          x: number,
          y: number,
          radius: number,
          strength: number,
        ) => {
          const p = screen(x, y),
            rr = (radius * zoom) / 2;
          const grad = ctx.createRadialGradient(
            p.x,
            p.y,
            rr * 0.1,
            p.x,
            p.y,
            rr,
          );
          grad.addColorStop(0, `rgba(0,0,0,${strength})`);
          grad.addColorStop(0.38, `rgba(0,0,0,${strength * 0.88})`);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
        };
        const hand = this.facing === 1 ? -11 : 11;
        hole(this.player.x + hand, this.player.y - 24, 88, 1);
        const direction = [
          [0, 1],
          [-1, 0],
          [1, 0],
          [0, -1],
        ][this.facing];
        hole(
          this.player.x + direction[0] * 54,
          this.player.y - 16 + direction[1] * 54,
          68,
          0.7,
        );
        for (const [x, y] of LAMPS) hole(x, y - 20, 66, 0.91);
        ctx.globalCompositeOperation = "source-over";
        const glow = (x: number, y: number, radius: number, alpha: number) => {
          const p = screen(x, y),
            rr = (radius * zoom) / 2;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
          grad.addColorStop(0, `rgba(255,205,100,${alpha})`);
          grad.addColorStop(1, "rgba(255,185,83,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
        };
        for (const [x, y] of LAMPS) {
          glow(x, y - 34, 32, darkness * 0.29);
          const p = screen(x, y - 41);
          ctx.fillStyle = `rgba(255,235,156,${darkness * 0.95})`;
          ctx.fillRect(
            Math.round(p.x - 2 * zoom),
            Math.round(p.y - 3 * zoom),
            4 * zoom,
            3 * zoom,
          );
        }
        glow(
          this.player.x + hand,
          this.player.y - 25,
          42,
          darkness * (0.14 + Math.sin(now / 110) * 0.015),
        );
        for (const d of destinations) {
          glow(d.x, d.y - 43, 43, darkness * 0.13);
          ctx.fillStyle = `rgba(255,208,104,${darkness * 0.62})`;
          for (const dx of [-24, 26]) {
            const p = screen(d.x + dx, d.y - 43);
            ctx.fillRect(
              Math.round(p.x - 3.5 * zoom),
              Math.round(p.y - 3 * zoom),
              7 * zoom,
              6 * zoom,
            );
          }
        }
      }
    }
    this.drawWeather(dt, now, width, height);
  }
  private drawWeather(dt: number, now: number, w: number, h: number) {
    const ctx = this.ctx,
      season = this.season;
    const count =
      season === "rainy"
        ? 130
        : season === "winter"
          ? 85
          : season === "autumn"
            ? 28
            : season === "spring"
              ? 22
              : 10;
    const scale = this.reducedMotion ? 0.3 : 1;
    for (let i = 0; i < count; i++) {
      const m = this.motes[i];
      m.y =
        (m.y + dt * m.speed * (season === "rainy" ? 0.95 : 0.045) * scale) % 1;
      m.x =
        (m.x + dt * (season === "rainy" ? -0.2 : 0.014) * m.speed * scale + 1) %
        1;
      const x = Math.round(m.x * w + Math.sin(now / 1900 + m.phase) * 3),
        y = Math.round(m.y * h);
      if (season === "rainy") {
        ctx.strokeStyle =
          this.daylight.darkness > 0.3 ? "#b0cbd07a" : "#c1dbd1b0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y + 6 + m.size);
        ctx.stroke();
        if (i % 17 === 0) {
          const splash = (now / 420 + m.phase) % 1;
          ctx.strokeStyle = `rgba(187,216,211,${(1 - splash) * 0.5})`;
          ctx.strokeRect(x - 2 * splash, h - 12 - (i % 5) * 13, 5 * splash, 1);
        }
      } else if (season === "winter") {
        ctx.fillStyle = i % 3 ? "#fafcf1e0" : "#c9e0e0cc";
        ctx.fillRect(x, y, m.size, m.size);
        if (i % 12 === 0) {
          ctx.fillRect(x - 1, y + 1, 4, 1);
          ctx.fillRect(x + 1, y - 1, 1, 4);
        }
      } else if (season === "autumn") {
        ctx.fillStyle = ["#dca35b", "#b77843", "#e9c081"][i % 3];
        ctx.fillRect(x, y, 3, 1);
        ctx.fillRect(
          x + Math.round(Math.sin(now / 500 + m.phase)),
          y + 1,
          2,
          2,
        );
      } else if (season === "spring") {
        ctx.fillStyle = i % 2 ? "#f6d8d5bc" : "#f0c4cfb0";
        ctx.fillRect(x, y, 2, 1);
        ctx.fillRect(x + 1, y + 1, 1, 1);
      } else if (this.daylight.darkness < 0.2) {
        ctx.fillStyle = "#fff5bb4d";
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  destroy() {
    this.scene.game.events.off(
      Phaser.Core.Events.POST_RENDER,
      this.render,
      this,
    );
    this.overlay.remove();
    audio.setEnvironment("summer", false);
  }
}
