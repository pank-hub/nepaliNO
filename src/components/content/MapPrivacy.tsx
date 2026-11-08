import React, {useEffect, useId, useRef, useState} from "react";

interface Props {
  language: string;
  labels: {
    privacyTitle: string;
    privacyExplanation: string;
    privacyMore: string;
    privacyClose: string;
  };
}

export default function MapPrivacy({language, labels}: Props) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    close.current?.focus();
    const keepFocus = (event: FocusEvent) => {
      if (event.target instanceof window.Node && !element.contains(event.target)) close.current?.focus();
    };
    document.addEventListener("focusin", keepFocus);
    return () => {
      document.removeEventListener("focusin", keepFocus);
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
      if (trigger.current?.isConnected) trigger.current.focus();
    };
  }, [open]);
  return <div className="map-privacy">
    <button ref={trigger} type="button" className="map-privacy__link"
      aria-haspopup="dialog" aria-controls={`${id}-dialog`} onClick={() => setOpen(true)}>
      {labels.privacyTitle}
    </button>
    <dialog ref={dialog} id={`${id}-dialog`} className="map-privacy__dialog"
      role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}
      onCancel={(event) => {event.preventDefault(); setOpen(false);}}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const first = close.current;
        const last = event.currentTarget.querySelector<HTMLAnchorElement>("a[href]");
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }}>
      <button ref={close} type="button" onClick={() => setOpen(false)}>{labels.privacyClose}</button>
      <h2 id={`${id}-title`}>{labels.privacyTitle}</h2>
      <p>{labels.privacyExplanation}</p>
      <a href={language === "nb" ? "/nb/privacy/" : "/ne/privacy/"}>{labels.privacyMore}</a>
    </dialog>
  </div>;
}
