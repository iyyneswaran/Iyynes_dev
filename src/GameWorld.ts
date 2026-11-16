import Phaser from "phaser";
import { registerArt, createWorldArt, rng, makeCanvas } from "./art";
import { destinations } from "./content";
import type { DestinationId, Destination } from "./content";
import {
  createGrid,
  blockRect,
  findPath,
  WORLD_W,
  WORLD_H,
} from "./pathfinding";
import type { Point } from "./pathfinding";
import { audio } from "./audio";
import { isWithinReach } from "./interactions";
export interface WorldState {
  x: number;
  y: number;
  nearby: DestinationId | null;
  distance: number;
  moving: boolean;
}
export interface WorldCallbacks {
  onState: (state: WorldState) => void;
  onEnter: (id: DestinationId) => void;
  onTrack: (id: DestinationId | null) => void;
  onToast: (text: string) => void;
  onReady: (map: HTMLCanvasElement) => void;
}
export class VillageScene extends Phaser.Scene {
  private callbacks: WorldCallbacks;
  private player!: Phaser.Physics.Arcade.Sprite;
  private shadow!: Phaser.GameObjects.Image;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private grid = createGrid();
  private path: Point[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private stepAt = 0;
  private stateAt = 0;
  private direction = 0;
  private walkingTime = 0;
  private nearby: Destination | null = null;
  private activeTarget: DestinationId | null = null;
  private marker!: Phaser.GameObjects.Text;
  private touch = new Set<string>();
  private pausedInput = false;
  private ripples!: Phaser.GameObjects.Graphics;
  private labels = new Map<DestinationId, Phaser.GameObjects.Text>();
  private fireflies: Phaser.GameObjects.Rectangle[] = [];
  constructor(callbacks: WorldCallbacks) {
    super("Village");
    this.callbacks = callbacks;
  }
  create() {
    registerArt(this);
    const art = createWorldArt(this);
    this.add.image(0, 0, "ground").setOrigin(0).setDepth(-10);
    this.physics.world.setBounds(67, 112, WORLD_W - 134, WORLD_H - 128);
    this.obstacles = this.physics.add.staticGroup();
    const solid = (x: number, y: number, w: number, h: number) => {
      const box = this.add.zone(x + w / 2, y + h / 2, w, h);
      this.obstacles.add(box);
      blockRect(this.grid, x - 6, y - 4, w + 12, h + 10);
    };
    solid(0, 0, WORLD_W, 116);
    solid(0, 0, 67, WORLD_H);
    solid(957, 0, 67, WORLD_H);
    solid(0, 752, WORLD_W, 16);
    solid(0, 600, 477, 60);
    solid(534, 600, 490, 60);
    solid(59, 413, 84, 116);
    solid(902, 299, 87, 233);
    solid(818, 638, 161, 91);
    for (const d of art.decorations) {
      this.add.image(d.x, d.y, d.key).setOrigin(0.5, 1).setDepth(d.y);
      if (d.solid) solid(d.solid.x, d.solid.y, d.solid.w, d.solid.h);
    }
    art.fences.forEach((f) => solid(f.x, f.y, f.w, f.h));
    for (const d of destinations) {
      this.add
        .image(d.x, d.y - 8, `house-${d.roof}`)
        .setOrigin(0.5, 1)
        .setDepth(d.y - 8);
      solid(d.x - 48, d.y - 67, 96, 52);
      const label = this.add
        .text(d.x, d.y > 400 ? d.y + 26 : d.y - 118, d.title.toUpperCase(), {
          fontFamily: '"Press Start 2P"',
          fontSize: "7px",
          color: "#faf3d8",
          backgroundColor: "#3d5949",
          padding: { x: 8, y: 7 },
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(1000);
      this.labels.set(d.id, label);
      this.add.rectangle(d.x, d.y + 5, 14, 5, 0xe8d8a3, 0.6).setDepth(0);
    }
    this.add.image(504, 363, "fountain").setOrigin(0.5, 1).setDepth(363);
    solid(481, 334, 46, 26);
    this.ripples = this.add.graphics().setDepth(10);
    this.spawnWildlife();
    this.shadow = this.add.image(504, 394, "shadow").setDepth(392);
    this.player = this.physics.add
      .sprite(504, 393, "player-0-0")
      .setOrigin(0.5, 1)
      .setDepth(393);
    this.player.body!.setSize(10, 8);
    (this.player.body as Phaser.Physics.Arcade.Body).setOffset(7, 24);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.obstacles);
    this.marker = this.add
      .text(0, 0, "▼", {
        fontFamily: '"Press Start 2P"',
        fontSize: "13px",
        color: "#fff4ba",
        stroke: "#6e7049",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(1100)
      .setVisible(false);
    this.tweens.add({
      targets: this.marker,
      y: "-=6",
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,E,ENTER",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE"]);
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) =>
      this.clickWorld(pointer),
    );
    this.input.keyboard!.on("keydown-E", () => {
      if (!this.pausedInput) this.interact();
    });
    this.input.keyboard!.on("keydown-ENTER", () => {
      if (!this.pausedInput) this.interact();
    });
    this.game.events.on("blur", () => {
      this.path = [];
      this.touch.clear();
      Object.values(this.keys).forEach((k) => k.reset());
    });
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_W, WORLD_H);
    camera.startFollow(this.player, true, 0.09, 0.09);
    camera.setFollowOffset(0, 55);
    camera.setRoundPixels(true);
    this.resize();
    this.scale.on("resize", () => this.resize());
    // Build a static miniature from the exact same art used in the world.
    const { c, ctx } = makeCanvas(1024, 768);
    ctx.drawImage(art.ground, 0, 0);
    const miniObjects = [
      ...art.decorations.map((o) => ({ x: o.x, y: o.y, key: o.key })),
      ...destinations.map((d) => ({
        x: d.x,
        y: d.y - 8,
        key: `house-${d.roof}`,
      })),
      { x: 504, y: 363, key: "fountain" },
    ].sort((a, b) => a.y - b.y);
    miniObjects.forEach((o) => {
      const source = this.textures
        .get(o.key)
        .getSourceImage() as HTMLCanvasElement;
      ctx.drawImage(source, o.x - source.width / 2, o.y - source.height);
    });
    this.callbacks.onReady(c);
  }
  private resize() {
    const { width, height } = this.scale;
    const zoom =
      width < 700 ? 1.65 : Math.max(width / 1024, Math.min(1.45, height / 490));
    this.cameras.main.setZoom(zoom);
  }
  private spawnWildlife() {
    const r = rng(803);
    for (const [key, x, y] of [
      ["chicken", 339, 266],
      ["chicken", 362, 278],
      ["cat", 680, 377],
      ["bird", 401, 402],
      ["bird", 409, 395],
      ["chicken", 676, 502],
    ] as [string, number, number][]) {
      const a = this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
      this.tweens.add({
        targets: a,
        x: x + (r() > 0.5 ? 15 : -15),
        y: y - 3,
        duration: 1700 + r() * 1600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
        delay: r() * 2500,
        onUpdate: () => a.setDepth(a.y),
      });
    }
    for (const [x, y] of [
      [303, 361],
      [719, 305],
      [583, 541],
      [168, 687],
    ]) {
      const b = this.add.image(x, y, "butterfly").setDepth(y + 100);
      this.tweens.add({
        targets: b,
        x: x + 31,
        y: y - 16,
        scaleX: 0.3,
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }
    for (let i = 0; i < 16; i++) {
      const f = this.add
        .rectangle(100 + r() * 800, 180 + r() * 390, 2, 2, 0xf5ecc0, 0.6)
        .setDepth(900);
      this.tweens.add({
        targets: f,
        y: f.y - 18,
        x: f.x + 10,
        alpha: 0.1,
        duration: 2400 + r() * 2500,
        yoyo: true,
        repeat: -1,
        delay: r() * 3000,
      });
      this.fireflies.push(f);
    }
  }
  private clickWorld(pointer: Phaser.Input.Pointer) {
    if (this.pausedInput) return;
    const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const building = destinations.find(
      (d) => Math.abs(p.x - d.x) < 62 && p.y > d.y - 127 && p.y < d.y + 6,
    );
    if (building) {
      if (this.nearby?.id === building.id) this.interact();
      else {
        this.track(building.id);
        this.callbacks.onToast(
          `Walk to ${building.place.toLowerCase()} to enter. Follow the gold marker!`,
        );
      }
      return;
    }
    this.path = findPath(this.grid, { x: this.player.x, y: this.player.y }, p);
    if (!this.path.length) {
      this.callbacks.onToast("Try an open patch of grass or a path.");
      return;
    }
    const dot = this.add.rectangle(p.x, p.y, 7, 7, 0xfff1be, 0.8).setDepth(8);
    this.tweens.add({
      targets: dot,
      alpha: 0,
      scale: 2,
      duration: 700,
      onComplete: () => dot.destroy(),
    });
    audio.play("click");
  }
  track(id: DestinationId | null) {
    this.activeTarget = id;
    this.callbacks.onTrack(id);
    const d = destinations.find((d) => d.id === id);
    this.marker.setVisible(!!d);
    if (d) {
      this.tweens.killTweensOf(this.marker);
      this.marker.setPosition(d.x, d.y - 158);
      this.tweens.add({
        targets: this.marker,
        y: d.y - 164,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
    }
    audio.play("click");
  }
  setPaused(value: boolean) {
    this.pausedInput = value;
    if (this.input.keyboard) this.input.keyboard.enabled = !value;
    this.path = [];
    this.touch.clear();
    if (this.player) this.player.setVelocity(0);
    if (this.keys) Object.values(this.keys).forEach((k) => k.reset());
  }
  setTouch(direction: string, value: boolean) {
    if (value) this.touch.add(direction);
    else this.touch.delete(direction);
  }
  resetPlayer() {
    this.path = [];
    this.player.setPosition(504, 393);
    this.player.setVelocity(0);
    this.track(null);
    this.callbacks.onToast("Home sweet village square.");
  }
  interact() {
    if (this.nearby && !this.pausedInput) {
      this.path = [];
      this.player.setVelocity(0);
      this.callbacks.onEnter(this.nearby.id);
    } else if (!this.pausedInput)
      this.callbacks.onToast("Get a little closer to a building’s front door.");
  }
  update(time: number, delta: number) {
    if (!this.player) return;
    let vx = 0,
      vy = 0;
    if (!this.pausedInput) {
      vx =
        (this.keys.D.isDown || this.keys.RIGHT.isDown || this.touch.has("right")
          ? 1
          : 0) -
        (this.keys.A.isDown || this.keys.LEFT.isDown || this.touch.has("left")
          ? 1
          : 0);
      vy =
        (this.keys.S.isDown || this.keys.DOWN.isDown || this.touch.has("down")
          ? 1
          : 0) -
        (this.keys.W.isDown || this.keys.UP.isDown || this.touch.has("up")
          ? 1
          : 0);
      if (vx || vy) this.path = [];
      else if (this.path.length) {
        const next = this.path[0],
          dx = next.x - this.player.x,
          dy = next.y - this.player.y;
        if (Math.hypot(dx, dy) < 2.5) this.path.shift();
        else {
          vx = dx;
          vy = dy;
        }
      }
    }
    const moving = !!(vx || vy);
    const speed = this.keys.SHIFT.isDown ? 148 : 94;
    const mag = Math.hypot(vx, vy) || 1;
    this.player.setVelocity((vx / mag) * speed, (vy / mag) * speed);
    if (moving) {
      this.direction =
        Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 1 : 2) : vy < 0 ? 3 : 0;
      this.walkingTime += delta;
      const frame = Math.floor(this.walkingTime / 140) % 4;
      this.player.setTexture(
        `player-${this.direction}-${frame === 3 ? 0 : frame}`,
      );
      if (time > this.stepAt) {
        audio.play("step");
        this.stepAt = time + 310;
      }
    } else this.player.setTexture(`player-${this.direction}-0`);
    this.player.setDepth(this.player.y);
    this.shadow
      .setPosition(this.player.x, this.player.y - 2)
      .setDepth(this.player.y - 1);
    this.nearby =
      destinations.find((d) => isWithinReach(this.player, d)) ?? null;
    for (const [id, label] of this.labels)
      label.setBackgroundColor(this.nearby?.id === id ? "#b28a42" : "#3d5949");
    this.ripples.clear();
    this.ripples.lineStyle(1, 0xc0e4d4, 0.5);
    for (let i = 0; i < 10; i++) {
      const xx = 75 + i * 82 + Math.sin(time / 1800 + i) * 5,
        yy = 618 + (i % 3) * 12;
      this.ripples.lineBetween(xx, yy, xx + 11, yy);
      this.ripples.lineBetween(xx + 5, yy + 3, xx + 17, yy + 3);
    }
    this.ripples.fillStyle(0xe4efe0, 0.7);
    const splash = Math.floor(time / 250) % 3;
    this.ripples.fillRect(482 + splash * 6, 351, 2, 2);
    this.ripples.fillRect(516 - splash * 2, 354, 2, 2);
    if (time > this.stateAt) {
      const target = destinations.find((d) => d.id === this.activeTarget);
      this.callbacks.onState({
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        nearby: this.nearby?.id ?? null,
        distance: target
          ? Math.round(
              Math.hypot(target.x - this.player.x, target.y - this.player.y),
            )
          : 0,
        moving,
      });
      this.stateAt = time + 100;
    }
  }
}
export function createGame(parent: HTMLElement, callbacks: WorldCallbacks) {
  const scene = new VillageScene(callbacks);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#8eba70",
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth,
      height: parent.clientHeight,
    },
    physics: { default: "arcade", arcade: { debug: false } },
    scene,
    render: { powerPreference: "high-performance" },
    audio: { noAudio: true },
  });
  return { game, scene };
}
