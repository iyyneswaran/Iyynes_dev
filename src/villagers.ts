import type { DestinationId } from "./content";
import type { DayPhase, Season } from "./seasons";
import type { Point } from "./pathfinding";

export type VillagerId = "pip" | "mira" | "rowan" | "fern";
export interface VillagerDefinition {
  id: VillagerId;
  name: string;
  role: string;
  color: string;
  coat: string;
  hair: string;
  skin: string;
  style: "ranger" | "gardener" | "tinkerer" | "courier";
  start: Point;
  route: Point[];
  eveningRoute: Point[];
  destination: DestinationId;
}
const points = (values: number[][]): Point[] =>
  values.map(([x, y]) => ({ x, y }));
export const villagers: VillagerDefinition[] = [
  {
    id: "pip",
    name: "Pip",
    role: "Village guide",
    color: "#718c59",
    coat: "#749164",
    hair: "#82603e",
    skin: "#e8c39a",
    style: "ranger",
    start: { x: 548, y: 393 },
    route: points([
      [548, 393],
      [610, 345],
      [552, 310],
      [450, 310],
      [445, 390],
    ]),
    eveningRoute: points([
      [548, 393],
      [575, 340],
      [550, 313],
      [450, 313],
    ]),
    destination: "about",
  },
  {
    id: "mira",
    name: "Mira",
    role: "Garden keeper",
    color: "#af7b8c",
    coat: "#bb8393",
    hair: "#664638",
    skin: "#d5a075",
    style: "gardener",
    start: { x: 315, y: 305 },
    route: points([
      [315, 305],
      [345, 310],
      [335, 335],
      [280, 310],
      [265, 288],
    ]),
    eveningRoute: points([
      [265, 288],
      [275, 310],
      [315, 305],
    ]),
    destination: "skills",
  },
  {
    id: "rowan",
    name: "Rowan",
    role: "Resident tinkerer",
    color: "#668eab",
    coat: "#6389a4",
    hair: "#3e4c53",
    skin: "#c59169",
    style: "tinkerer",
    start: { x: 605, y: 288 },
    route: points([
      [605, 288],
      [652, 305],
      [686, 324],
      [622, 335],
      [574, 310],
    ]),
    eveningRoute: points([
      [574, 310],
      [605, 288],
      [612, 330],
    ]),
    destination: "projects",
  },
  {
    id: "fern",
    name: "Fern",
    role: "Village courier",
    color: "#b29a62",
    coat: "#a18a60",
    hair: "#72513e",
    skin: "#edc7a1",
    style: "courier",
    start: { x: 835, y: 543 },
    route: points([
      [835, 543],
      [810, 535],
      [756, 539],
      [700, 538],
      [792, 532],
    ]),
    eveningRoute: points([
      [810, 535],
      [792, 532],
      [835, 543],
    ]),
    destination: "contact",
  },
];
export const villagerById = (id: VillagerId) =>
  villagers.find((v) => v.id === id)!;
export interface ConversationContext {
  season: Season;
  phase: DayPhase;
  returning: boolean;
}
export type DialogueTopic =
  "hello" | "story" | "weather" | "advice" | "joke" | "directions";
export interface DialogueChoice {
  id: string;
  label: string;
  next?: DialogueTopic;
  destination?: DestinationId;
  close?: boolean;
}
export interface DialogueNode {
  text: string;
  choices: DialogueChoice[];
}
export interface Conversation {
  id: VillagerId;
  portrait: string;
  topic: DialogueTopic;
  context: ConversationContext;
}

const seasonalLines: Record<VillagerId, Record<Season, string>> = {
  pip: {
    summer:
      "A warm path, a cool fountain, and absolutely no hurry. Summer is excellent wandering weather.",
    spring:
      "The cherry trees have put on their pink coats. Listen closely: the returning birds are arguing about the best nesting spot.",
    rainy:
      "The village sounds different in the rain, doesn’t it? Follow the paths if you want to keep your boots reasonably dry.",
    autumn:
      "I tried counting the falling leaves. The wind kept moving them. I have decided to call it “a lot.”",
    winter:
      "The river is frozen solid! You can walk on the ice. If you change seasons out there, the village will bring you safely back to the bank.",
  },
  mira: {
    summer:
      "The flower beds are thirsty and the chickens keep inspecting my vegetables. Apparently everyone here is a garden critic.",
    spring:
      "Tulips, daffodils, cherry blossoms... my favourite season! The hedgehogs are out again, and I’ve spotted fresh eggs in the nests.",
    rainy:
      "Free watering! The frogs are delighted. I’m pretending the puddles are tiny ornamental ponds.",
    autumn:
      "Pumpkins are ready, squirrels are busy, and every leaf thinks it belongs in my garden. I leave a little pile for the hedgehogs.",
    winter:
      "The garden is resting under its snow blanket. Watch for the white hares; they blend in much better than I do.",
  },
  rowan: {
    summer:
      "Warm weather makes a good outdoor workshop. The difficult part is convincing the butterflies not to land on my drawings.",
    spring:
      "Fresh leaves, fresh ideas. I’m sketching a little rain gauge for Mira’s garden. She asked whether it can predict stubborn weeds.",
    rainy:
      "The ducks seem waterproof. My notebook is less impressive. I’m working under the eaves today.",
    autumn:
      "I built a leaf collector. The squirrels claimed it as a snack cart. Iteration one needs some work.",
    winter:
      "Ice on the river, snow on the roofs... I’m calling this the village’s cold-start test. Everything still works, thankfully.",
  },
  fern: {
    summer:
      "Sunny days are easy delivery days. Except when someone addresses a letter to “the house near the tree.” Have you seen how many trees we have?",
    spring:
      "So many postcards about the blossoms! Even the birds are moving house. At least they carry their own nesting materials.",
    rainy:
      "Letters stay in the satchel; the courier gets wet. That’s the arrangement. The ducks have yet to offer an umbrella.",
    autumn:
      "A golden leaf fell into my satchel. I delivered it as a very small, unsigned postcard.",
    winter:
      "Snowy deliveries take a little longer. Fortunately the red winter birds make excellent landmarks.",
  },
};
const stories: Record<VillagerId, string> = {
  pip: "I help new wanderers find their bearings. Every building holds a piece of Iyyneswaran’s story. The little red-roofed home is a lovely place to begin.",
  mira: "I look after the gardens and collect useful little tricks. A good toolbox is like a garden: different things grow well together. The blue-roofed workshop holds the developer’s skills.",
  rowan:
    "I’m the village tinkerer. I love seeing how ideas turn into working things. The maker’s lab showcases AgriAssist, a real full-stack agriculture project from Iyyneswaran’s portfolio.",
  fern: "I carry letters and make sure good conversations find their way home. Looking to connect with Iyyneswaran? The post office has his email, GitHub, and LinkedIn.",
};
const jokes: Record<VillagerId, string> = {
  pip: "My navigation advice? Take one step at a time. Unless you hold Shift. Then take the same steps, but with more enthusiasm.",
  mira: "I asked the seedlings for an update. They said they were working on their roots. Honestly, fair enough.",
  rowan:
    "I tried to fix a broken clock with a second clock. Now I have a distributed timing problem.",
  fern: "Why do I like handwritten letters? Excellent offline support. Very questionable delivery latency.",
};
const guideNames: Record<VillagerId, string> = {
  pip: "the little home",
  mira: "the workshop",
  rowan: "the maker’s lab",
  fern: "the post office",
};
export function getDialogue(
  id: VillagerId,
  topic: DialogueTopic,
  context: ConversationContext,
): DialogueNode {
  const npc = villagerById(id),
    where = guideNames[id];
  const back: DialogueChoice = {
    id: "more",
    label: "I had another question.",
    next: "hello",
  };
  const bye: DialogueChoice = {
    id: "bye",
    label: "See you around!",
    close: true,
  };
  const mark: DialogueChoice = {
    id: "mark",
    label: `Mark ${where} on my map.`,
    next: "directions",
    destination: npc.destination,
  };
  if (topic === "hello") {
    const greeting = context.returning
      ? `Good to see you again! `
      : `Hello, wanderer! I’m ${npc.name}, the ${npc.role.toLowerCase()}. `;
    const time =
      context.phase === "Night"
        ? "The lanterns are lovely tonight. Your torch will help you find your way. "
        : context.phase === "Dusk"
          ? "The lights are coming on. I always enjoy this quiet part of the day. "
          : context.phase === "Dawn"
            ? "You’re up with the birds! A fresh day is a good excuse for a wander. "
            : "";
    return {
      text: `${greeting}${time}What would you like to chat about?`,
      choices: [
        {
          id: "story",
          label: "Tell me a little about yourself.",
          next: "story",
        },
        {
          id: "weather",
          label: "How is the season treating you?",
          next: "weather",
        },
        { id: "advice", label: "Where should I explore next?", next: "advice" },
        {
          id: "joke",
          label: "Tell me something to make me smile.",
          next: "joke",
        },
        bye,
      ],
    };
  }
  if (topic === "story")
    return {
      text: stories[id],
      choices: [
        mark,
        {
          id: "weather",
          label: "And how is village life this season?",
          next: "weather",
        },
        back,
        bye,
      ],
    };
  if (topic === "weather")
    return {
      text:
        seasonalLines[id][context.season] +
        (context.phase === "Night"
          ? " Most of the daytime birds are resting now. Keep an eye out for the owl."
          : ""),
      choices: [
        {
          id: "advice",
          label: "Any recommendations for my walk?",
          next: "advice",
        },
        back,
        bye,
      ],
    };
  if (topic === "advice")
    return {
      text: `I’d visit ${where}. ${id === "pip" ? "You can meet the person behind this little world." : id === "mira" ? "There’s a whole collection of languages, frameworks, and AI tools to discover." : id === "rowan" ? "AgriAssist brings together AI crop advice, disease detection, and real-time farm insights." : "Good ideas often begin with a simple hello."} I can mark it for you. You’ll still need to walk to the front door.`,
      choices: [mark, back, bye],
    };
  if (topic === "joke")
    return {
      text: jokes[id],
      choices: [
        {
          id: "advice",
          label: "All right, point me toward an adventure.",
          next: "advice",
        },
        back,
        bye,
      ],
    };
  return {
    text: `There you go! I’ve marked ${where} with a gold marker. Follow it, walk up to the front door, then press E or click the building. Enjoy your visit!`,
    choices: [
      { id: "thanks", label: "Thanks! I’ll head over there.", close: true },
      back,
    ],
  };
}
