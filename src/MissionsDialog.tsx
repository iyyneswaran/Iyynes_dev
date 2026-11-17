import { useEffect, useRef, useState } from "react";
import { Flag, Check, X, Trophy, ChevronDown } from "lucide-react";
import { keepsakes } from "./missions";
import type { KeepsakeId, MissionState } from "./missions";
import { KeepsakeIcon } from "./collectibleArt";
export function MissionsDialog({
  mission,
  onClose,
}: {
  mission: MissionState;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [hints, setHints] = useState<Set<KeepsakeId>>(new Set());
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="pixel-dialog missions-dialog"
      aria-label="Missions"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-chrome">
        <span>
          <Flag size={13} /> THE MISSION JOURNAL
        </span>
        <button onClick={onClose} aria-label="Close missions">
          <X size={20} />
        </button>
      </div>
      <div className="mission-body">
        <div className="mission-heading">
          <div>
            <span className="section-kicker">
              SIDE QUEST · A LITTLE CURIOSITY
            </span>
            <h2>
              {mission.complete ? "A village explorer." : "The lost keepsakes."}
            </h2>
          </div>
          <div
            className={`mission-medallion ${mission.complete ? "earned" : ""}`}
          >
            <Trophy size={29} />
            <span>{mission.foundCount} / 5</span>
          </div>
        </div>
        <p className="mission-intro">
          Five little treasures are tucked around Greenleaf. Find them all, and
          earn your Village Explorer badge.
        </p>
        <div
          className="hunt-progress"
          aria-label={`${mission.foundCount} of 5 keepsakes collected`}
        >
          <div>
            {mission.items.map((k, i) => (
              <i
                key={k.id}
                className={i < mission.foundCount ? "filled" : ""}
              />
            ))}
          </div>
          <span>
            {mission.complete
              ? "MISSION COMPLETE"
              : `${mission.foundCount} OF 5 COLLECTED`}
          </span>
        </div>
        {mission.complete && (
          <div className="mission-complete" role="status">
            <Trophy size={21} />
            <div>
              <b>Village Explorer · Badge earned</b>
              <span>Every corner had a story. You found all five.</span>
            </div>
          </div>
        )}
        <div className="keepsake-list">
          {mission.items.map((item) => {
            const k = keepsakes.find((k) => k.id === item.id)!;
            return (
              <article
                key={k.id}
                className={`keepsake-card ${item.found ? "collected" : ""}`}
              >
                <div className="keepsake-main">
                  <div className="keepsake-icon">
                    <KeepsakeIcon id={k.id} size={36} />
                  </div>
                  <div className="keepsake-copy">
                    <h3>{k.name}</h3>
                    <p>
                      {item.found ? "Safely in your satchel." : k.description}
                    </p>
                  </div>
                  {item.found ? (
                    <span className="keepsake-found">
                      <Check size={13} />
                      <span>FOUND</span>
                    </span>
                  ) : (
                    <button
                      className="hint-button"
                      aria-expanded={hints.has(k.id)}
                      aria-controls={`hint-${k.id}`}
                      aria-label={`${hints.has(k.id) ? "Hide" : "Show"} hint for ${k.name}`}
                      onClick={() =>
                        setHints((old) => {
                          const next = new Set(old);
                          if (next.has(k.id)) next.delete(k.id);
                          else next.add(k.id);
                          return next;
                        })
                      }
                    >
                      {hints.has(k.id) ? "Hide hint" : "Hint"}
                      <ChevronDown size={12} />
                    </button>
                  )}
                </div>
                {!item.found && hints.has(k.id) && (
                  <p id={`hint-${k.id}`} className="keepsake-hint">
                    ✧ {item.hint}
                  </p>
                )}
              </article>
            );
          })}
        </div>
        <div className="mission-instructions">
          <span>HOW TO COLLECT</span>
          <p>
            Walk right up to a keepsake, or click it and follow the path. It
            will pop into your satchel when you reach it.
          </p>
          <small>
            Five random objects from a collection of ten, with new hiding places
            on every reload. See the full collection in Inventory. Changing
            seasons keeps this hunt intact.
          </small>
        </div>
      </div>
      <div className="dialog-footer">
        <span>FIVE KEEPSAKES. A WHOLE VILLAGE TO SEARCH.</span>
        <button onClick={onClose}>
          Back to exploring <kbd>ESC</kbd>
        </button>
      </div>
    </dialog>
  );
}
