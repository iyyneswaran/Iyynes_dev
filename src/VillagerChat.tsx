import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { MessageCircle, X } from "lucide-react";
import { getDialogue, villagerById } from "./villagers";
import type { Conversation, DialogueChoice } from "./villagers";
import { seasonDetails } from "./seasons";

export function VillagerChat({
  conversation,
  onClose,
  onChoose,
}: {
  conversation: Conversation;
  onClose: () => void;
  onChoose: (choice: DialogueChoice) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    npc = villagerById(conversation.id),
    node = getDialogue(
      conversation.id,
      conversation.topic,
      conversation.context,
    );
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  useEffect(() => {
    dialog.current
      ?.querySelector<HTMLButtonElement>("[data-reply]")
      ?.focus({ preventScroll: true });
  }, [conversation.topic]);
  return (
    <dialog
      ref={dialog}
      className="pixel-dialog villager-dialog"
      style={{ "--villager-color": npc.color } as CSSProperties}
      aria-label={`Conversation with ${npc.name}`}
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
          <MessageCircle size={13} /> A LITTLE VILLAGE CONVERSATION
        </span>
        <button onClick={onClose} aria-label="Close conversation">
          <X size={20} />
        </button>
      </div>
      <div className="villager-chat-body">
        <header className="villager-introduction">
          <div className="villager-portrait">
            <img
              src={conversation.portrait}
              alt={`${npc.name}'s pixel portrait`}
              width={64}
              height={64}
            />
          </div>
          <div>
            <span className="section-kicker">{npc.role.toUpperCase()}</span>
            <h2>
              {npc.name}
              <span>.</span>
            </h2>
          </div>
          <span className="chat-weather">
            {seasonDetails[conversation.context.season].symbol}{" "}
            {seasonDetails[conversation.context.season].label}
            <small>{conversation.context.phase} in Greenleaf</small>
          </span>
        </header>
        <div className="villager-speech" aria-live="polite" aria-atomic="true">
          <span className="speech-mark" aria-hidden="true">
            “
          </span>
          <p key={conversation.topic}>{node.text}</p>
          <span className="speech-caret" aria-hidden="true">
            ▼
          </span>
        </div>
        <div className="reply-heading">
          <span>YOUR REPLY</span>
          <i />
        </div>
        <div className="villager-replies">
          {node.choices.map((choice, i) => (
            <button key={choice.id} data-reply onClick={() => onChoose(choice)}>
              <span className="reply-number">0{i + 1}</span>
              <span>{choice.label}</span>
              <span className="reply-arrow" aria-hidden="true">
                {choice.close ? "↗" : "→"}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="dialog-footer">
        <span>TAKE YOUR TIME. EVERYONE HAS A STORY.</span>
        <button onClick={onClose}>
          Back to wandering <kbd>ESC</kbd>
        </button>
      </div>
    </dialog>
  );
}
