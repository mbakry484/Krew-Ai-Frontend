'use client';

import { ReactNode, useEffect, useRef } from 'react';

/**
 * Accessible modal shell: backdrop blur, Esc to close, focus trapped inside,
 * focus restored to the trigger on close. `variant` controls layout (centered
 * dialog vs. right slide-over). Animations are gated behind motion-safe.
 *
 * Shared across agent dashboards (Luna reports drill-down/export, Ivy
 * add-expense drawer/add-pool modal). Promoted from
 * app/dashboard/luna/reports/components/Modal.tsx — that path re-exports this.
 */
export default function DashboardModal({
  onClose,
  labelledBy,
  variant = 'center',
  children,
}: {
  onClose: () => void;
  labelledBy: string;
  variant?: 'center' | 'side';
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    prevFocus.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    panel?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && panel) {
        const focusables = panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      prevFocus.current?.focus?.();
    };
  }, [onClose]);

  const wrapCls =
    variant === 'center'
      ? 'flex items-center justify-center p-4'
      : 'flex items-stretch justify-end';

  const panelCls =
    variant === 'center'
      ? 'w-full max-w-[520px] max-h-[88vh] rounded-[16px] motion-safe:animate-[reportModalIn_0.22s_cubic-bezier(0.22,1,0.36,1)]'
      : 'w-full max-w-[440px] h-full rounded-l-[16px] motion-safe:animate-[reportSlideIn_0.26s_cubic-bezier(0.22,1,0.36,1)]';

  return (
    <div
      className={`fixed inset-0 z-[400] bg-black/40 backdrop-blur-[3px] ${wrapCls}`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`bg-background border border-border-md shadow-[0_20px_70px_rgba(0,0,0,0.35)] flex flex-col focus:outline-none ${panelCls}`}
      >
        {children}
      </div>
    </div>
  );
}
