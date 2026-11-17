import type Phaser from "phaser";
import { rng } from "./art";
import { registerVillagerArt } from "./villagerArt";
import { villagers, villagerById } from "./villagers";
import type { Conversation, VillagerDefinition, VillagerId } from "./villagers";
import type { Grid, Point } from "./pathfinding";
import { findPath, nearestWalkable } from "./pathfinding";
import type { ClimateState } from "./seasons";
import {
  canTalk,
  approachPath,
  withResidentObstacles,
} from "./villagerNavigation";

interface Resident {
  definition: VillagerDefinition;
  sprite: Phaser.Physics.Arcade.Sprite;
  shadow: Phaser.GameObjects.Image;
  badge: Phaser.GameObjects.Text;
  path: Point[];
  waypoint: number;
  waitUntil: number;
  direction: number;
  walkTime: number;
  lastCheck: number;
  lastPosition: Point;
  evening: boolean;
}
export interface VillagerPosition extends Point {
  id: VillagerId;
}
interface Options {
  dryGrid: Grid;
  playerGrid: () => Grid;
  climate: () => ClimateState;
  onTalk: (conversation: Conversation) => void;
  onToast: (message: string) => void;
}
export class VillagerController {
  private scene: Phaser.Scene;
  private options: Options;
  private residents: Resident[] = [];
  private portraits: Record<VillagerId, string>;
  private random = rng(2671);
  private visits = new Map<VillagerId, number>();
  private talking: VillagerId | null = null;
  private approaching: { id: VillagerId; expires: number } | null = null;
  readonly group: Phaser.Physics.Arcade.Group;
  constructor(
    scene: Phaser.Scene,
    player: Phaser.Physics.Arcade.Sprite,
    obstacles: Phaser.Physics.Arcade.StaticGroup,
    options: Options,
  ) {
    this.scene = scene;
    this.options = options;
    this.portraits = registerVillagerArt(scene);
    this.group = scene.physics.add.group();
    for (const [order, definition] of villagers.entries()) {
      const start =
        nearestWalkable(options.dryGrid, definition.start) ?? definition.start;
      const sprite = this.group.create(
        start.x,
        start.y,
        `npc-${definition.id}-0-0`,
      ) as Phaser.Physics.Arcade.Sprite;
      sprite
        .setOrigin(0.5, 1)
        .setDepth(start.y)
        .setCollideWorldBounds(true)
        .setPushable(false);
      sprite.body!.setSize(10, 8);
      (sprite.body as Phaser.Physics.Arcade.Body).setOffset(7, 26);
      const shadow = scene.add
        .image(start.x, start.y - 2, "shadow")
        .setDepth(start.y - 1);
      const badge = scene.add
        .text(start.x, start.y - 42, definition.name, {
          fontFamily: '"Press Start 2P"',
          fontSize: "6px",
          color: "#fff7dd",
          backgroundColor: "#455b49",
          padding: { x: 5, y: 5 },
        })
        .setOrigin(0.5)
        .setDepth(1050)
        .setVisible(false);
      this.residents.push({
        definition,
        sprite,
        shadow,
        badge,
        path: [],
        waypoint: 0,
        waitUntil: scene.time.now + 11000 + order * 1400,
        direction: 0,
        walkTime: 0,
        lastCheck: scene.time.now,
        lastPosition: { ...start },
        evening: false,
      });
    }
    scene.physics.add.collider(this.group, obstacles);
    scene.physics.add.collider(player, this.group);
    scene.physics.add.collider(this.group, this.group);
  }
  positions(): VillagerPosition[] {
    return this.residents.map(({ definition, sprite }) => ({
      id: definition.id,
      x: Math.round(sprite.x),
      y: Math.round(sprite.y),
    }));
  }
  hit(point: Point): VillagerId | null {
    return (
      [...this.residents]
        .sort((a, b) => b.sprite.depth - a.sprite.depth)
        .find(
          ({ sprite }) =>
            Math.abs(point.x - sprite.x) < 15 &&
            point.y > sprite.y - 35 &&
            point.y < sprite.y + 4,
        )?.definition.id ?? null
    );
  }
  closest(player: Point): { id: VillagerId; distance: number } | null {
    let best: { id: VillagerId; distance: number } | null = null;
    for (const actor of this.residents) {
      const distance = Math.hypot(
        actor.sprite.x - player.x,
        actor.sprite.y - player.y,
      );
      if (
        (!best || distance < best.distance) &&
        canTalk(this.options.playerGrid(), player, actor.sprite)
      )
        best = { id: actor.definition.id, distance };
    }
    return best;
  }
  private face(actor: Resident, target: Point) {
    const dx = target.x - actor.sprite.x,
      dy = target.y - actor.sprite.y;
    actor.direction =
      Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
  }
  talk(id: VillagerId, player: Point): boolean {
    const actor = this.residents.find((a) => a.definition.id === id)!;
    if (
      this.talking ||
      !canTalk(this.options.playerGrid(), player, actor.sprite)
    )
      return false;
    this.cancelApproach();
    this.talking = id;
    actor.path = [];
    actor.sprite.setVelocity(0);
    this.face(actor, player);
    const count = this.visits.get(id) ?? 0;
    this.visits.set(id, count + 1);
    const climate = this.options.climate();
    this.options.onTalk({
      id,
      portrait: this.portraits[id],
      topic: "hello",
      context: {
        season: climate.season,
        phase: climate.phase,
        returning: count > 0,
      },
    });
    return true;
  }
  approach(id: VillagerId, player: Point): Point[] {
    this.cancelApproach();
    const actor = this.residents.find((a) => a.definition.id === id)!;
    const route = approachPath(
      this.navigationGrid(player, id),
      player,
      actor.sprite,
    );
    if (!route.length) {
      this.options.onToast(
        `There isn't a clear path to ${actor.definition.name} from here. Try walking closer.`,
      );
      return [];
    }
    this.approaching = { id, expires: this.scene.time.now + 25000 };
    actor.path = [];
    actor.sprite.setVelocity(0);
    this.face(actor, player);
    this.options.onToast(
      `${actor.definition.name} is waiting. Walking over to say hello…`,
    );
    return route;
  }
  cancelApproach() {
    if (this.approaching) {
      const actor = this.residents.find(
        (a) => a.definition.id === this.approaching!.id,
      );
      if (actor) actor.waitUntil = this.scene.time.now + 1600;
    }
    this.approaching = null;
  }
  navigationGrid(player: Point, omit?: VillagerId): Grid {
    return withResidentObstacles(
      this.options.playerGrid(),
      player,
      this.positions(),
      omit,
    );
  }
  reroutePlayer(player: Point, goal: Point): Point[] {
    if (this.approaching) {
      const actor = this.residents.find(
        (a) => a.definition.id === this.approaching!.id,
      )!;
      return approachPath(
        this.navigationGrid(player, actor.definition.id),
        player,
        actor.sprite,
      );
    }
    return findPath(this.navigationGrid(player), player, goal);
  }
  endConversation() {
    if (this.talking) {
      const actor = this.residents.find(
        (a) => a.definition.id === this.talking,
      );
      if (actor) actor.waitUntil = this.scene.time.now + 3200;
    }
    this.talking = null;
  }
  navigationChanged(dryGrid: Grid) {
    this.cancelApproach();
    this.options.dryGrid = dryGrid;
    for (const actor of this.residents) {
      actor.path = [];
      actor.sprite.setVelocity(0);
      const safe = nearestWalkable(dryGrid, actor.sprite);
      if (
        safe &&
        Math.hypot(safe.x - actor.sprite.x, safe.y - actor.sprite.y) > 12
      )
        actor.sprite.setPosition(safe.x, safe.y);
      actor.waitUntil = this.scene.time.now + 1300;
    }
  }
  update(
    time: number,
    delta: number,
    player: Point,
    allowConversation: boolean,
  ) {
    const climate = this.options.climate(),
      evening = climate.lightsOn;
    if (this.approaching) {
      const pending = this.approaching;
      if (time > pending.expires) this.cancelApproach();
      else if (allowConversation) {
        const actor = this.residents.find(
          (a) => a.definition.id === pending.id,
        )!;
        if (canTalk(this.options.playerGrid(), player, actor.sprite))
          this.talk(pending.id, player);
      }
    }
    for (const actor of this.residents) {
      const { sprite, definition } = actor;
      let vx = 0,
        vy = 0;
      const held =
        this.talking === definition.id ||
        this.approaching?.id === definition.id;
      if (actor.evening !== evening) {
        actor.evening = evening;
        actor.path = [];
        actor.waypoint = 0;
        actor.waitUntil = Math.max(actor.waitUntil, time + 700);
      }
      const playerNear =
        Math.hypot(player.x - sprite.x, player.y - sprite.y) < 25;
      const residentNear = this.residents.some(
        (other) =>
          other !== actor &&
          other.definition.id < definition.id &&
          Math.hypot(other.sprite.x - sprite.x, other.sprite.y - sprite.y) < 19,
      );
      if (held) this.face(actor, player);
      else if (!playerNear && !residentNear && time >= actor.waitUntil) {
        if (!actor.path.length) {
          const route = evening ? definition.eveningRoute : definition.route;
          actor.waypoint =
            (actor.waypoint + 1 + Math.floor(this.random() * 2)) % route.length;
          const goal = nearestWalkable(
            this.options.dryGrid,
            route[actor.waypoint],
          );
          actor.path = goal ? findPath(this.options.dryGrid, sprite, goal) : [];
          if (!actor.path.length) actor.waitUntil = time + 2000;
        }
        if (actor.path.length) {
          const target = actor.path[0],
            dx = target.x - sprite.x,
            dy = target.y - sprite.y;
          if (Math.hypot(dx, dy) < 2.2) {
            actor.path.shift();
            if (!actor.path.length)
              actor.waitUntil = time + 2400 + this.random() * 3000;
          } else {
            const length = Math.hypot(dx, dy);
            vx = (dx / length) * 31;
            vy = (dy / length) * 31;
            actor.direction =
              Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 1 : 2) : vy < 0 ? 3 : 0;
          }
        }
      }
      sprite.setVelocity(vx, vy);
      if (vx || vy) {
        actor.walkTime += delta;
        const frame = Math.floor(actor.walkTime / 180) % 4;
        sprite.setTexture(
          `npc-${definition.id}-${actor.direction}-${frame === 3 ? 0 : frame}`,
        );
      } else sprite.setTexture(`npc-${definition.id}-${actor.direction}-0`);
      if (time - actor.lastCheck > 1400) {
        if (
          !held &&
          !playerNear &&
          !residentNear &&
          actor.path.length &&
          Math.hypot(
            sprite.x - actor.lastPosition.x,
            sprite.y - actor.lastPosition.y,
          ) < 2
        ) {
          actor.path = [];
          actor.waitUntil = time + 1800;
        }
        actor.lastPosition = { x: sprite.x, y: sprite.y };
        actor.lastCheck = time;
      }
      sprite.setDepth(sprite.y);
      actor.shadow.setPosition(sprite.x, sprite.y - 2).setDepth(sprite.y - 1);
      actor.badge
        .setPosition(sprite.x, sprite.y - 44)
        .setVisible(
          Math.hypot(player.x - sprite.x, player.y - sprite.y) < 105 ||
            this.approaching?.id === definition.id,
        )
        .setBackgroundColor(held ? "#aa8d54" : "#455b49");
    }
  }
  name(id: VillagerId) {
    return villagerById(id).name;
  }
}
