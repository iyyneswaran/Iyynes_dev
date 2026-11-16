import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  Expand,
  Flag,
  House,
  Leaf,
  MapPin,
  Minus,
  Sun,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { destinations, PortfolioContent } from "./content";
import type { DestinationId } from "./content";
import type { VillageScene, WorldState } from "./GameWorld";
import { audio } from "./audio";

const initial: WorldState = {
  x: 504,
  y: 393,
  nearby: null,
  distance: 0,
  moving: false,
};
export default function App() {
  const host = useRef<HTMLDivElement>(null),
    scene = useRef<VillageScene | null>(null),
    mini = useRef<HTMLCanvasElement>(null),
    mapImage = useRef<HTMLCanvasElement | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    help = useRef<HTMLDialogElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [state, setState] = useState(initial),
    [ready, setReady] = useState(false),
    [loadError, setLoadError] = useState(""),
    [welcome, setWelcome] = useState(true),
    [guide, setGuide] = useState(true),
    [sound, setSound] = useState(false),
    [mapExpanded, setMapExpanded] = useState(false),
    [tracked, setTracked] = useState<DestinationId | null>(null),
    [selected, setSelected] = useState<DestinationId | null>(null),
    [helpOpen, setHelpOpen] = useState(false),
    [toast, setToast] = useState("");
  const [visited, setVisited] = useState<DestinationId[]>(() => {
    try {
      const value = JSON.parse(localStorage.getItem("iyynes-visited") ?? "[]");
      return Array.isArray(value)
        ? value.filter((v) => destinations.some((d) => d.id === v))
        : [];
    } catch {
      return [];
    }
  });
  const notify = useCallback((text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4200);
  }, []);
  const enter = useCallback((id: DestinationId) => {
    setSelected(id);
    setVisited((old) => {
      if (old.includes(id)) {
        audio.play("open");
        return old;
      }
      audio.play("discover");
      return [...old, id];
    });
  }, []);
  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    void (async () => {
      try {
        await document.fonts.ready;
        const { createGame } = await import("./GameWorld");
        if (cancelled || !host.current) return;
        const created = createGame(host.current, {
          onState: setState,
          onEnter: enter,
          onTrack: setTracked,
          onToast: notify,
          onReady: (map) => {
            mapImage.current = map;
            setReady(true);
          },
        });
        scene.current = created.scene;
        destroy = () => created.game.destroy(true);
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Unable to start the world.",
        );
      }
    })();
    return () => {
      cancelled = true;
      destroy?.();
      scene.current = null;
      clearTimeout(toastTimer.current);
    };
  }, [enter, notify]);
  useEffect(() => {
    try {
      localStorage.setItem("iyynes-visited", JSON.stringify(visited));
    } catch {
      /* Exploration still works without storage. */
    }
  }, [visited]);
  useEffect(() => {
    scene.current?.setPaused(!!selected || helpOpen);
    if (selected && !dialog.current?.open) dialog.current?.showModal();
    if (!selected && dialog.current?.open) dialog.current.close();
    if (helpOpen && !help.current?.open) help.current?.showModal();
    if (!helpOpen && help.current?.open) help.current.close();
  }, [selected, helpOpen]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "m" && !selected && !helpOpen) {
        setMapExpanded((v) => !v);
      }
      if (event.key === "Escape") {
        setMapExpanded(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, helpOpen]);
  useEffect(() => {
    const ctx = mini.current?.getContext("2d");
    if (!ctx || !mini.current || !mapImage.current) return;
    const { width, height } = mini.current;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mapImage.current, 0, 0, width, height);
    const sx = width / 1024,
      sy = height / 768;
    destinations.forEach((d) => {
      ctx.fillStyle = visited.includes(d.id) ? "#f5e7ae" : "#fff5d7";
      ctx.fillRect(d.x * sx - 2, d.y * sy - 2, 4, 4);
      if (tracked === d.id) {
        ctx.strokeStyle = "#fff4b5";
        ctx.strokeRect(d.x * sx - 4, d.y * sy - 4, 8, 8);
      }
    });
    ctx.fillStyle = "#fff7dc";
    ctx.fillRect(state.x * sx - 3, state.y * sy - 3, 6, 6);
    ctx.fillStyle = "#b76047";
    ctx.fillRect(state.x * sx - 1, state.y * sy - 1, 2, 2);
  }, [state, ready, visited, tracked, mapExpanded]);
  const closePanel = () => {
    setSelected(null);
    audio.play("close");
    host.current?.focus({ preventScroll: true });
  };
  const closeHelp = () => {
    setHelpOpen(false);
    host.current?.focus({ preventScroll: true });
  };
  const track = (id: DestinationId) => {
    if (!ready) return;
    const next = tracked === id ? null : id;
    setTracked(next);
    scene.current?.track(next);
    if (next) {
      setGuide(false);
      notify(
        `Tracking ${destinations.find((d) => d.id === id)!.place.toLowerCase()}. Walk to the gold marker.`,
      );
    }
    host.current?.focus({ preventScroll: true });
  };
  const nearby = destinations.find((d) => d.id === state.nearby),
    target = destinations.find((d) => d.id === tracked),
    place = destinations.find((d) => d.id === selected);
  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Iyynes' World home">
          <span className="brand-icon">
            <Leaf size={28} strokeWidth={2} />
            <span>✦</span>
          </span>
          <span>
            <strong>
              IYYNES' WORLD<span className="brand-dot">.</span>
            </strong>
            <small>AN INTERACTIVE PORTFOLIO</small>
          </span>
        </a>
        <nav className="header-nav" aria-label="Main navigation">
          <span className="nav-active">
            <i />
            Explore the world
          </span>
          <button onClick={() => setHelpOpen(true)} className="text-button">
            How to play <ArrowUpRight size={14} />
          </button>
          <a href="/Iyyneswaran-Resume.pdf" download className="resume-button">
            <ArrowDownToLine size={15} />
            <span>My resume</span>
          </a>
        </nav>
      </header>
      <main>
        <div className="world-heading">
          <span>
            <i className="live-dot" />A SMALL WORLD, BUILT WITH BIG IDEAS
          </span>
          <span className="heading-right">
            FULL STACK DEVELOPER <b>✦</b> AI / ML EXPLORER
          </span>
        </div>
        <section
          className="world-frame"
          aria-label="Interactive pixel-art portfolio world"
        >
          <div
            id="game"
            ref={host}
            role="application"
            aria-label="Portfolio game. Move with WASD or arrows. Press E near a building. Click open ground to walk."
            tabIndex={0}
          />
          {!ready && (
            <div className="loading-world">
              <Leaf size={34} />
              <h2>
                {loadError ? "A small detour" : "Planting the last few trees"}
                <span>...</span>
              </h2>
              <p>{loadError || "Your little adventure is loading."}</p>
              {loadError && (
                <button onClick={() => window.location.reload()}>
                  Try again
                </button>
              )}
            </div>
          )}
          {welcome && (
            <div className="world-overlay welcome-card">
              <div className="eyebrow">
                HELLO, WANDERER <span>✦</span>
              </div>
              <h1>
                A little world.
                <br />A lot to explore<span>.</span>
              </h1>
              <p>
                I'm <b>Iyyneswaran</b>, a developer
                <br />
                turning curious ideas into real things.
              </p>
              <div className="welcome-bottom">
                <span className="tiny-character" />
                <span>Make yourself at home.</span>
                <button
                  onClick={() => setWelcome(false)}
                  aria-label="Minimize welcome"
                >
                  <Minus size={14} />
                </button>
              </div>
            </div>
          )}
          <div className="world-overlay location-card">
            <Sun className="sun-icon" size={27} />
            <div>
              <b>GREENLEAF VILLAGE</b>
              <span>A good day to explore.</span>
            </div>
            <i className="weather-dot" />
          </div>
          {guide && (
            <div className="world-overlay guide-card">
              <span className="guide-spark">✧</span>
              <p>
                <b>Your next little adventure</b>
                <span>Walk to a building to discover what's inside.</span>
              </p>
              <button onClick={() => setGuide(false)} aria-label="Dismiss tip">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="world-overlay controls-hint">
            <span className="wasd">
              <kbd>W</kbd>
              <span>
                <kbd>A</kbd>
                <kbd>S</kbd>
                <kbd>D</kbd>
              </span>
            </span>
            <div>
              Move around<span>or click a path</span>
            </div>
            <i />
            <kbd>E</kbd>
            <div>
              Interact<span>when you're nearby</span>
            </div>
          </div>
          <div
            className={`world-overlay map-card ${mapExpanded ? "expanded" : ""}`}
          >
            <div className="map-title">
              <b>
                <Compass size={13} /> VILLAGE MAP
              </b>
              <button
                onClick={() => setMapExpanded((v) => !v)}
                aria-label={
                  mapExpanded ? "Collapse village map" : "Expand village map"
                }
                title="Expand map (M)"
              >
                <Expand size={13} />
              </button>
            </div>
            <canvas
              ref={mini}
              width={256}
              height={176}
              aria-label="Village map with your current location"
            />
            <div className="map-caption">
              <span>
                <i />
                You are here
              </span>
              <span>
                {state.x}, {state.y}
              </span>
            </div>
            {mapExpanded && (
              <div className="map-legend">
                {destinations.map((d) => (
                  <button onClick={() => track(d.id)} key={d.id}>
                    <i style={{ background: d.color }} />
                    {d.title}
                    {visited.includes(d.id) && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="world-tools">
            <button
              className={`square-button ${sound ? "sound-on" : ""}`}
              onClick={() => {
                const v = !sound;
                audio.setEnabled(v);
                setSound(v);
                notify(
                  v
                    ? "Village sounds on. A little birdsong for your journey."
                    : "Village sounds off.",
                );
              }}
              aria-label={sound ? "Mute sounds" : "Enable sounds"}
              title={sound ? "Mute sounds" : "Enable sounds"}
            >
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              className="square-button"
              onClick={() => {
                if (ready) {
                  scene.current?.resetPlayer();
                  setTracked(null);
                  host.current?.focus({ preventScroll: true });
                }
              }}
              aria-label="Return to village square"
              title="Return to village square"
            >
              <House size={18} />
            </button>
          </div>
          {target && !nearby && (
            <div className="tracking-chip">
              <Flag size={13} />
              <span>{target.title}</span>
              <small>{state.distance} px away</small>
              <button
                onClick={() => {
                  scene.current?.track(null);
                  setTracked(null);
                }}
                aria-label="Stop tracking"
              >
                <X size={12} />
              </button>
            </div>
          )}
          {nearby && (
            <div className="interaction-prompt">
              <span>{nearby.place}</span>
              <button onClick={() => scene.current?.interact()}>
                <kbd>E</kbd>Step inside <span>↵</span>
              </button>
            </div>
          )}
          <div
            className={`toast ${toast ? "visible" : ""}`}
            role="status"
            aria-live="polite"
          >
            {toast && (
              <>
                <MapPin size={14} />
                {toast}
              </>
            )}
          </div>
          <div className="touch-controls" aria-label="Movement controls">
            {["up", "left", "down", "right"].map((d, i) => (
              <button
                key={d}
                className={d}
                aria-label={`Move ${d}`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  scene.current?.setTouch(d, true);
                }}
                onPointerUp={() => scene.current?.setTouch(d, false)}
                onPointerCancel={() => scene.current?.setTouch(d, false)}
              >
                {["▲", "◀", "▼", "▶"][i]}
              </button>
            ))}
          </div>
          {["tl", "tr", "bl", "br"].map((c) => (
            <i key={c} className={`frame-corner ${c}`} />
          ))}
        </section>
        <section
          className="destination-bar"
          aria-label="Portfolio destinations"
        >
          <div className="destination-heading">
            <span>WHERE TO?</span>
            <small>Every place has a story.</small>
          </div>
          <div className="destination-list">
            {destinations.map((d) => (
              <button
                key={d.id}
                onClick={() => track(d.id)}
                className={`destination ${tracked === d.id ? "tracked" : ""} ${visited.includes(d.id) ? "visited" : ""}`}
                aria-label={`Track ${d.title}`}
                aria-pressed={tracked === d.id}
              >
                <span
                  className="destination-icon"
                  style={{ color: d.color, background: `${d.color}15` }}
                >
                  {d.icon}
                </span>
                <span>{d.title}</span>
                {visited.includes(d.id) ? (
                  <Check size={11} />
                ) : (
                  <small>{d.number}</small>
                )}
              </button>
            ))}
          </div>
          <div className="explore-progress">
            <span>
              {visited.length} <i>/ 6</i>
            </span>
            <small>PLACES DISCOVERED</small>
            <div>
              <i style={{ width: `${(visited.length / 6) * 100}%` }} />
            </div>
          </div>
        </section>
      </main>
      <footer>
        <span>
          MADE OF PIXELS, COFFEE & CURIOSITY <b>✦</b>
        </span>
        <span>Take your time. Good things are worth exploring.</span>
        <a
          href="https://github.com/iyyneswaran"
          target="_blank"
          rel="noreferrer"
        >
          VIEW GITHUB <ArrowUpRight size={12} />
        </a>
      </footer>
      <dialog
        ref={dialog}
        className="pixel-dialog"
        onCancel={(e) => {
          e.preventDefault();
          closePanel();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closePanel();
        }}
        aria-label={place?.title ?? "Portfolio"}
      >
        <div className="dialog-chrome">
          <span>
            {place?.icon} &nbsp; {place?.place.toUpperCase()}
          </span>
          <button onClick={closePanel} aria-label="Close panel">
            <X size={20} />
          </button>
        </div>
        <div className="dialog-body">
          {selected && <PortfolioContent id={selected} />}
        </div>
        <div className="dialog-footer">
          <span>GREENLEAF VILLAGE · IYYNES' WORLD</span>
          <button onClick={closePanel}>
            Back to exploring <kbd>ESC</kbd>
          </button>
        </div>
      </dialog>
      <dialog
        ref={help}
        className="pixel-dialog help-dialog"
        onCancel={(e) => {
          e.preventDefault();
          closeHelp();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeHelp();
        }}
        aria-label="How to play"
      >
        <div className="dialog-chrome">
          <span>
            <BookOpen size={14} /> THE WANDERER'S GUIDE
          </span>
          <button onClick={closeHelp} aria-label="Close instructions">
            <X size={20} />
          </button>
        </div>
        <div className="dialog-body">
          <span className="section-kicker">YOUR ADVENTURE STARTS HERE</span>
          <h2>
            A portfolio you can wander<span>.</span>
          </h2>
          <p>
            You're the little traveler in the middle of Greenleaf. Each building
            holds a part of my story.
          </p>
          <div className="help-steps">
            <p>
              <kbd>W A S D</kbd> or <kbd>↑ ← ↓ →</kbd>
              <span>Walk around. Hold Shift to run.</span>
            </p>
            <p>
              <kbd>CLICK / TAP</kbd>
              <span>Choose an open spot and I'll find the way.</span>
            </p>
            <p>
              <kbd>E</kbd> or <kbd>ENTER</kbd>
              <span>
                Stand by a building's door, then enter. You can also click the
                nearby building.
              </span>
            </p>
            <p>
              <kbd>M</kbd> <kbd>ESC</kbd>
              <span>Expand the map. Close a panel.</span>
            </p>
          </div>
          <p className="muted">
            Choose a destination below the world to track it. Trees, fences,
            houses and water are solid; bridges are your friends. On mobile, use
            the direction buttons or tap a path.
          </p>
          <button
            className="reset-discoveries"
            onClick={() => {
              setVisited([]);
              notify("A fresh journey. All discoveries reset.");
              closeHelp();
            }}
          >
            Reset discoveries
          </button>
          <button className="primary-button" onClick={closeHelp}>
            Let's explore! <ArrowUpRight size={16} />
          </button>
        </div>
      </dialog>
    </>
  );
}
