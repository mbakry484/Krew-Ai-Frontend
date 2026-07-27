'use client';

import DashboardModal from '@/components/DashboardModal';
import BostaKeyForm from './BostaKeyForm';

/** Settings "Connect" / "Reconnect" modal — same key-entry flow as the
    onboarding Bosta step, minus the skip link (there's nothing to skip to). */
export default function BostaConnectModal({
  reconnect,
  onClose,
}: {
  reconnect: boolean;
  onClose: () => void;
}) {
  return (
    <DashboardModal onClose={onClose} labelledBy="bosta-connect-title">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
        <div>
          <div id="bosta-connect-title" className="text-[0.82rem] font-medium text-text-primary">
            {reconnect ? 'Reconnect Bosta' : 'Connect Bosta'}
          </div>
          <div className="text-[0.64rem] text-text-tertiary mt-[2px]">
            delivered vs returned COD orders — feeds net revenue and the return rate
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 rounded"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="px-5 py-5">
        <BostaKeyForm
          submitLabel={reconnect ? 'Reconnect' : 'Connect'}
          onSuccess={onClose}
        />
      </div>
    </DashboardModal>
  );
}
