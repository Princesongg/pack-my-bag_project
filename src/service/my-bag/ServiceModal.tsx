import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './TripBriefModal.css';
export default function ServiceModal({ title, topic, children, onClose, returnFocus }: { title: string; topic?: string; children: ReactNode; onClose: () => void; returnFocus: HTMLElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [closing, setClosing] = useState(false);
  useLayoutEffect(() => {
    const opener = returnFocus;
    const modal = dialog.current;
    const scroll = { top: window.scrollY, left: window.scrollX };
    const root = document.documentElement;
    const bounds = document.body.getBoundingClientRect();
    const style = { position: document.body.style.position, top: document.body.style.top, left: document.body.style.left, width: document.body.style.width, overflow: document.body.style.overflow, boxSizing: document.body.style.boxSizing };
    const rootStyle = { overflow: root.style.overflow, scrollBehavior: root.style.scrollBehavior };
    // Preserve the actual page width, including the space occupied by its scrollbar.
    root.style.scrollBehavior = 'auto';
    root.style.overflow = 'hidden';
    Object.assign(document.body.style, { position: 'fixed', top: `-${scroll.top}px`, left: `${bounds.left}px`, width: `${bounds.width}px`, overflow: 'hidden', boxSizing: 'border-box' });
    modal?.showModal();
    return () => {
      window.clearTimeout(timer.current);
      // Native dialog focus restoration must happen while the background is still locked.
      modal?.close();
      root.style.overflow = rootStyle.overflow;
      Object.assign(document.body.style, style);
      window.scrollTo({ ...scroll, behavior: 'instant' });
      opener?.focus({ preventScroll: true });
      root.style.scrollBehavior = rootStyle.scrollBehavior;
    };
  }, []);
  function close() {
    if (closing) return;
    setClosing(true);
    timer.current = window.setTimeout(onClose, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 140);
  }
  return createPortal(<dialog ref={dialog} className={`pmb-brief-modal ${closing ? 'is-closing' : ''}`} data-topic={topic} aria-labelledby="pmb-brief-modal-title" onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary,input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(element => element.checkVisibility() && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');
    if (!controls.length) return;
    event.preventDefault();
    const index = controls.indexOf(document.activeElement as HTMLElement);
    controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
  }} onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  }}>
    <header className="pmb-brief-modal-header"><h2 id="pmb-brief-modal-title">{title}</h2><button type="button" onClick={close} aria-label="상세 정보 닫기" autoFocus><X size={20}/><span>닫기</span></button></header>
    {children}
  </dialog>, document.body);
}
