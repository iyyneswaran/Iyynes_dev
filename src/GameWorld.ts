import Phaser from "phaser";
import { registerArt, createWorldArt } from "./art";
import { ClimateController } from "./ClimateController";
import type { Scenery } from "./ClimateController";
import type { ClimateState, Season } from "./seasons";
import { WATER_AREAS, navigationForSeason } from "./worldGeometry";
import { destinations } from "./content";
import type { DestinationId, Destination } from "./content";
import {
  createGrid,
  blockRect,
  findPath,
  WORLD_W,
  WORLD_H,
  CELL,
  nearestWalkable,
} from "./pathfinding";
import type { Point } from "./pathfinding";
import { audio } from "./audio";
import { isWithinReach } from "./interactions";
import { VillagerController } from "./VillagerController";
import type { VillagerPosition } from "./VillagerController";
import type { Conversation, VillagerId } from "./villagers";
import { HuntController } from "./HuntController";
import type { MissionState } from "./missions";
export interface WorldState {
  x: number;
  y: number;
  nearby: DestinationId | null;
  nearbyNpc: VillagerId | null;
  villagers: VillagerPosition[];
  distance: number;
  moving: boolean;
}
export interface WorldCallbacks {
  onState: (state: WorldState) => void;
  onEnter: (id: DestinationId) => void;
  onTrack: (id: DestinationId | null) => void;
  onToast: (text: string) => void;
  onReady: (map: HTMLCanvasElement) => void;
  onClimate: (state: ClimateState) => void;
  onTalk: (conversation: Conversation) => void;
  onMission: (mission: MissionState) => void;
}
export class VillageScene extends Phaser.Scene {
  private callbacks: WorldCallbacks;
  private player!: Phaser.Physics.Arcade.Sprite;
  private shadow!: Phaser.GameObjects.Image;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private grid = createGrid();
  private path: Point[] = [];
  private pathProgressAt = 0;
  private pathProgress: Point = { x: 504, y: 393 };
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
  private climate!: ClimateController;
  private villagers!: VillagerController;
  private hunt!: HuntController;
  private scenery: Scenery[] = [];
  private solidAreas: { x: number; y: number; w: number; h: number }[] = [];
  private waterObstacles: Phaser.GameObjects.Zone[] = [];
  constructor(callbacks: WorldCallbacks) {
    super("Village");
    this.callbacks = callbacks;
  }
  create() {
    registerArt(this);
    const art = createWorldArt(this);
    this.scenery.push({
      key: "ground",
      image: this.add.image(0, 0, "ground").setOrigin(0).setDepth(-10),
    });
    this.physics.world.setBounds(67, 112, WORLD_W - 134, WORLD_H - 128);
    this.obstacles = this.physics.add.staticGroup();
    const solid = (x: number, y: number, w: number, h: number) => {
      const box = this.add.zone(x + w / 2, y + h / 2, w, h);
      this.obstacles.add(box);
      this.solidAreas.push({ x, y, w, h });
      blockRect(this.grid, x - 6, y - 4, w + 12, h + 10);
    };
    solid(0, 0, WORLD_W, 116);
    solid(0, 0, 67, WORLD_H);
    solid(957, 0, 67, WORLD_H);
    solid(0, 752, WORLD_W, 16);
    for (const area of WATER_AREAS) {
      const box = this.add.zone(
        area.x + area.w / 2,
        area.y + area.h / 2,
        area.w,
        area.h,
      );
      this.obstacles.add(box);
      this.waterObstacles.push(box);
      blockRect(this.grid, area.x - 6, area.y - 4, area.w + 12, area.h + 10);
    }
    for (const d of art.decorations) {
      this.scenery.push({
        key: d.key,
        image: this.add.image(d.x, d.y, d.key).setOrigin(0.5, 1).setDepth(d.y),
      });
      if (d.solid) solid(d.solid.x, d.solid.y, d.solid.w, d.solid.h);
    }
    art.fences.forEach((f) => solid(f.x, f.y, f.w, f.h));
    for (const d of destinations) {
      const house = this.add
        .image(d.x, d.y - 8, `house-${d.roof}`)
        .setOrigin(0.5, 1)
        .setDepth(d.y - 8);
      this.scenery.push({ key: `house-${d.roof}`, image: house });
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
    this.scenery.push({
      key: "fountain",
      image: this.add
        .image(504, 363, "fountain")
        .setOrigin(0.5, 1)
        .setDepth(363),
    });
    solid(481, 334, 46, 26);
    this.ripples = this.add.graphics().setDepth(10);
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
    this.climate = new ClimateController(
      this,
      this.game.canvas.parentElement!,
      this.scenery,
      this.player,
      this.callbacks.onReady,
      this.callbacks.onClimate,
    );
    this.villagers = new VillagerController(this, this.player, this.obstacles, {
      dryGrid: navigationForSeason(this.solidAreas, "summer"),
      playerGrid: () => this.grid,
      climate: () => this.climate.state,
      onTalk: (conversation) => {
        this.path = [];
        this.player.setVelocity(0);
        this.callbacks.onTalk(conversation);
      },
      onToast: this.callbacks.onToast,
    });
    const hidingExclusions = this.scenery
      .filter((item) => item.key !== "ground")
      .map(({ image }) => ({
        x: image.x - image.displayOriginX,
        y: image.y - image.displayOriginY,
        w: image.width,
        h: image.height,
      }));
    this.hunt = new HuntController(
      this,
      navigationForSeason(this.solidAreas, "summer"),
      this.player,
      hidingExclusions,
      this.callbacks.onMission,
      this.callbacks.onToast,
    );
  }
  setSeason(season: Season) {
    if (!this.climate) return;
    this.path = [];
    this.grid = navigationForSeason(this.solidAreas, season);
    for (let i = 0; i < WATER_AREAS.length; i++) {
      (this.waterObstacles[i].body as Phaser.Physics.Arcade.StaticBody).enable =
        season !== "winter";
    }
    const safe = nearestWalkable(this.grid, this.player);
    if (
      safe &&
      this.grid[Math.floor(this.player.y / CELL)]?.[
        Math.floor(this.player.x / CELL)
      ] !== 0
    ) {
      this.player.setPosition(safe.x, safe.y);
      this.player.setVelocity(0);
      this.callbacks.onToast(
        "The ice has thawed. You are safely back on the bank.",
      );
    }
    this.climate.setSeason(season);
    this.villagers.navigationChanged(
      navigationForSeason(this.solidAreas, "summer"),
    );
  }
  private resize() {
    const { width, height } = this.scale;
    const zoom =
      width < 700 ? 1.65 : Math.max(width / 1024, Math.min(1.45, height / 490));
    this.cameras.main.setZoom(zoom);
  }
  private clickWorld(pointer: Phaser.Input.Pointer) {
    if (this.pausedInput || pointer.event?.target !== this.game.canvas) return;
    const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const npc = this.villagers.hit(p);
    if (npc) {
      this.approachVillager(npc);
      return;
    }
    this.villagers.cancelApproach();
    const keepsake = this.hunt.hit(p);
    if (keepsake) {
      this.path = findPath(
        this.villagers.navigationGrid(this.player),
        this.player,
        keepsake,
      );
      if (!this.path.length)
        this.callbacks.onToast("Walk a little closer to that keepsake.");
      return;
    }
    const building = destinations.find(
      (d) => Math.abs(p.x - d.x) < 62 && p.y > d.y - 127 && p.y < d.y + 6,
    );
    if (building) {
      if (isWithinReach(this.player, building)) this.enterBuilding(building);
      else {
        this.track(building.id);
        this.callbacks.onToast(
          `Walk to ${building.place.toLowerCase()} to enter. Follow the gold marker!`,
        );
      }
      return;
    }
    this.path = findPath(
      this.villagers.navigationGrid(this.player),
      { x: this.player.x, y: this.player.y },
      p,
    );
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
    this.villagers?.cancelApproach();
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
    if (value) this.villagers?.cancelApproach();
    this.touch.clear();
    if (this.player) this.player.setVelocity(0);
    if (this.keys) Object.values(this.keys).forEach((k) => k.reset());
  }
  setTouch(direction: string, value: boolean) {
    if (value) this.touch.add(direction);
    else this.touch.delete(direction);
  }
  resetPlayer() {
    this.villagers.cancelApproach();
    this.path = [];
    this.player.setPosition(504, 393);
    this.player.setVelocity(0);
    this.track(null);
    this.callbacks.onToast("Home sweet village square.");
  }
  private enterBuilding(destination: Destination) {
    if (!this.pausedInput && isWithinReach(this.player, destination)) {
      this.path = [];
      this.villagers.cancelApproach();
      this.player.setVelocity(0);
      this.callbacks.onEnter(destination.id);
    }
  }
  endConversation() {
    this.villagers.endConversation();
  }
  approachVillager(id: VillagerId) {
    if (this.pausedInput) return;
    this.path = [];
    this.track(null);
    if (!this.villagers.talk(id, this.player))
      this.path = this.villagers.approach(id, this.player);
  }
  interact() {
    if (this.pausedInput) return;
    const building = destinations.find((d) => isWithinReach(this.player, d));
    const npc = this.villagers.closest(this.player);
    const buildingDistance = building
      ? Math.hypot(building.x - this.player.x, building.y + 10 - this.player.y)
      : Infinity;
    if (npc && npc.distance < buildingDistance) {
      this.path = [];
      this.player.setVelocity(0);
      this.villagers.talk(npc.id, this.player);
    } else if (building) this.enterBuilding(building);
    else
      this.callbacks.onToast(
        "Walk closer to a villager or a building’s front door.",
      );
  }
  update(time: number, delta: number) {
    if (!this.player) return;
    if (!this.path.length || this.pausedInput) {
      this.pathProgressAt = time;
      this.pathProgress = { x: this.player.x, y: this.player.y };
    } else if (time - this.pathProgressAt > 750) {
      if (
        Math.hypot(
          this.player.x - this.pathProgress.x,
          this.player.y - this.pathProgress.y,
        ) < 3
      ) {
        this.path = this.villagers.reroutePlayer(
          this.player,
          this.path[this.path.length - 1],
        );
        if (!this.path.length) {
          this.villagers.cancelApproach();
          this.callbacks.onToast(
            "The path is busy. Try another spot or wait for the villagers to pass.",
          );
        }
      }
      this.pathProgressAt = time;
      this.pathProgress = { x: this.player.x, y: this.player.y };
    }
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
      if (vx || vy) {
        this.path = [];
        this.villagers.cancelApproach();
      } else if (this.path.length) {
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
    if (this.climate.season !== "winter") {
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
    }
    this.climate.update(this.direction);
    this.villagers.update(time, delta, this.player, !this.pausedInput);
    this.hunt.update(this.player, this.grid, !this.pausedInput);
    if (time > this.stateAt) {
      const target = destinations.find((d) => d.id === this.activeTarget);
      const npc = this.villagers.closest(this.player);
      const buildingDistance = this.nearby
        ? Math.hypot(
            this.nearby.x - this.player.x,
            this.nearby.y + 10 - this.player.y,
          )
        : Infinity;
      const npcFirst = !!npc && npc.distance < buildingDistance;
      this.callbacks.onState({
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        nearby: npcFirst ? null : (this.nearby?.id ?? null),
        nearbyNpc: npcFirst ? npc!.id : null,
        villagers: this.villagers.positions(),
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
    input: { windowEvents: false },
    scene,
    render: { powerPreference: "high-performance" },
    audio: { noAudio: true },
  });
  return { game, scene };
}
