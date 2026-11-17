import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Backpack, Check, X } from "lucide-react";
import { keepsakes, inventoryStatus, HUNT_SIZE } from "./missions";
import type { MissionState } from "./missions";
import { KeepsakeIcon } from "./collectibleArt";

function CollectionDialog({
  label,
  chrome,
  className,
  onClose,
  children,
}: {
  label: string;
  chrome: ReactNode;
  className: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`pixel-dialog ${className}`}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-chrome">
        <span>{chrome}</span>
        <button onClick={onClose} aria-label={`Close ${label.toLowerCase()}`}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function InventoryDialog({
  mission,
  onClose,
}: {
  mission: MissionState;
  onClose: () => void;
}) {
  const labels = {
    found: "Found",
    hidden: "Hidden this hunt",
    inactive: "Not in this hunt",
  };
  return (
    <CollectionDialog
      label="Inventory"
      chrome={
        <>
          <Backpack size={13} /> YOUR KEEPSAKE SATCHEL
        </>
      }
      className="inventory-dialog missions-dialog"
      onClose={onClose}
    >
      <div className="mission-body">
        <div className="mission-heading">
          <div>
            <span className="section-kicker">
              TEN LITTLE STORIES TO DISCOVER
            </span>
            <h2>The collection.</h2>
          </div>
          <div className="inventory-total">
            <b>
              {mission.foundCount} / {HUNT_SIZE}
            </b>
            <span>FOUND THIS HUNT</span>
          </div>
        </div>
        <p className="mission-intro">
          All ten village treasures, at a glance. Only five are hidden in each
          hunt. Reloading picks a new five and resets your found status.
        </p>
        <div className="inventory-legend">
          <span>
            <i className="found" /> Found
          </span>
          <span>
            <i className="hidden" /> Hidden this hunt
          </span>
          <span>
            <i /> Not in this hunt
          </span>
        </div>
        <div className="inventory-grid">
          {keepsakes.map((item) => {
            const status = inventoryStatus(item.id, mission);
            return (
              <article
                key={item.id}
                className={`inventory-card ${status}`}
                aria-label={`${item.name}: ${labels[status]}`}
              >
                <div className="inventory-slot">
                  <KeepsakeIcon id={item.id} size={46} />
                  {status === "found" && <Check size={14} />}
                </div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <span className="inventory-status">{labels[status]}</span>
              </article>
            );
          })}
        </div>
        {mission.complete && (
          <div className="mission-complete inventory-earned">
            <PixelBadge />
            <div>
              <b>Village Explorer · Badge earned</b>
              <span>
                All five treasures from this hunt are in your satchel.
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="dialog-footer">
        <span>FIVE IN THE WORLD · TEN IN THE COLLECTION</span>
        <button onClick={onClose}>
          Back to exploring <kbd>ESC</kbd>
        </button>
      </div>
    </CollectionDialog>
  );
}

function PixelBadge() {
  return (
    <svg
      className="pixel-badge"
      viewBox="0 0 32 40"
      width="96"
      height="120"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path fill="#657b4f" d="M7 22h8v17l-4-3-4 2zm10 0h8v16l-4-2-4 3z" />
      <path fill="#afc18b" d="M9 23h3v11H9zm10 0h3v11h-3z" />
      <path
        fill="#8e743f"
        d="M10 1h12v3h5v5h4v14h-4v5h-5v3H10v-3H5v-5H1V9h4V4h5z"
      />
      <path
        fill="#d6b75d"
        d="M11 3h10v3h5v5h3v10h-3v5h-5v3H11v-3H6v-5H3V11h3V6h5z"
      />
      <path
        fill="#f3da8c"
        d="M11 5h10v3h4v4h2v8h-2v4h-4v3H11v-3H7v-4H5v-8h2V8h4z"
      />
      <path fill="#a08345" d="M14 9h4v5h6v4h-4v6l-4-3-4 3v-6H8v-4h6z" />
      <path fill="#c5a34f" d="M15 10h2v5h5v2h-4v4l-2-2-2 2v-4h-4v-2h5z" />
      <path fill="#fff1bc" d="M7 9h3v3H7zm16 12h2v2h-2z" />
    </svg>
  );
}

export function RewardDialog({
  mission,
  onClose,
  onInventory,
}: {
  mission: MissionState;
  onClose: () => void;
  onInventory: () => void;
}) {
  return (
    <CollectionDialog
      label="Mission reward"
      chrome={<>✦ QUEST COMPLETE</>}
      className="reward-dialog"
      onClose={onClose}
    >
      <div className="reward-body">
        <div className="reward-badge">
          <span>✧</span>
          <PixelBadge />
          <span>✧</span>
        </div>
        <span className="section-kicker">ALL FIVE KEEPSAKES FOUND</span>
        <h2>Adventure well spent.</h2>
        <p>You searched every little corner and brought the treasures home.</p>
        <div className="reward-title">
          <span>YOUR REWARD</span>
          <strong>Village Explorer</strong>
          <small>Explorer badge earned for this hunt</small>
        </div>
        <div
          className="reward-keepsakes"
          aria-label="Your five collected keepsakes"
        >
          {mission.items.map((item) => (
            <span
              key={item.id}
              title={keepsakes.find((k) => k.id === item.id)!.name}
            >
              <KeepsakeIcon id={item.id} size={36} />
            </span>
          ))}
        </div>
        <div className="reward-actions">
          <button className="reward-primary" onClick={onInventory}>
            <Backpack size={14} /> View inventory
          </button>
          <button onClick={onClose}>
            Keep exploring <kbd>ESC</kbd>
          </button>
        </div>
        <small className="reward-footnote">
          Reload anytime for five new random treasures to find.
        </small>
      </div>
    </CollectionDialog>
  );
}
