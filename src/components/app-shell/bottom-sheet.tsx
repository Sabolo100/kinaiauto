"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** "auto" = content height (max 88dvh), "full" = 92dvh */
  size?: "auto" | "full";
  ariaLabel?: string;
};

/**
 * Native-feeling bottom sheet: backdrop, drag handle, swipe-to-dismiss,
 * ESC to close, body scroll lock. Rendered in a portal so parent transforms
 * never break `position: fixed`.
 */
export function BottomSheet({ open, onClose, title, children, footer, size = "auto", ariaLabel }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const drag = useRef<{ y: number; active: boolean }>({ y: 0, active: false });
  const sheetRef = useRef<HTMLDivElement>(null);

  // mount → next frame → visible (for CSS transition); close → wait → unmount
  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(t);
  }, [open]);

  // body scroll lock + ESC
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted, onClose]);

  if (!mounted || typeof document === "undefined") return null;

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { y: e.clientY, active: true };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.active) return;
    const dy = Math.max(0, e.clientY - drag.current.y);
    setDragY(dy);
  }
  function onPointerUp() {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (dragY > 90) onClose();
    setDragY(0);
  }

  return createPortal(
    <div
      className={`sheet-root ${visible ? "sheet-root--open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)}
    >
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        ref={sheetRef}
        className={`sheet sheet--${size}`}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
      >
        <div
          className="sheet-grip"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="sheet-handle" />
        </div>
        {(title || true) && (
          <div className="sheet-head">
            <div className="sheet-title">{title}</div>
            <button type="button" className="sheet-close" onClick={onClose} aria-label="Bezárás">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer ? <div className="sheet-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
