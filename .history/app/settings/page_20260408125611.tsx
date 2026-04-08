'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { getUserInfo, updateBrandDescription } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'account' | 'brand' | 'integrations' | 'notifications' | 'billing' | 'danger';
type ToastType = 'success' | 'error' | 'info';

// ─── Shared: Field input ──────────────────────────────────────────────────────
function Field({
  label, value, onChange, type = 'text', disabled = false,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[0.7rem] uppercase tracking-[0.07em] text-text-tertiary mb-[6px]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
        className="w-full bg-background border border-border rounded-[8px] px-3 py-[0.58rem] text-[0.82rem] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  );
}

// ─── Shared: Toggle switch ────────────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={enabled}
      className={`relative inline-flex w-[38px] h-[22px] rounded-full transition-colors duration-200 shrink-0 focus:outline-none ${
        enabled ? 'bg-[#3dbb77]' : 'bg-background4'
      }`}
    >
      <span
        className={`absolute top-[3px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-[19px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

// ─── Shared: Toast ────────────────────────────────────────────────────────────
function Toast({
  msg, type, onDismiss,
}: {
  msg: string; type: ToastType; onDismiss: () => void;
}) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [msg, onDismiss]);

  if (!msg) return null;

  const styles: Record<ToastType, string> = {
    success: 'bg-[#3dbb77]/12 border-[#3dbb77]/30 text-[#3dbb77]',
    error:   'bg-red-500/10 border-red-500/30 text-red-400',
    info:    'bg-background3 border-border text-text-secondary',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-[10px] rounded-[10px] border text-[0.8rem] shadow-lg ${styles[type]}`}>
      {type === 'success' && (
        <svg className="w-[14px] h-[14px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      )}
      {msg}
    </div>
  );
}

// ─── Shared: Confirm modal ────────────────────────────────────────────────────
function ConfirmModal({
  open, title, body, onCancel, onConfirm,
}: {
  open: boolean; title: string; body: string;
  onCancel: () => void; onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-overlay-bg backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-background border border-border-md rounded-[14px] p-7 max-w-[400px] w-full mx-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <h3 className="text-[0.95rem] font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-[0.8rem] text-text-secondary leading-[1.7] mb-6">{body}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-[0.55rem] text-[0.8rem] text-text-secondary border border-border rounded-[8px] hover:border-border-hover hover:text-text-primary transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-[0.55rem] text-[0.8rem] text-white bg-red-500 hover:bg-red-600 rounded-[8px] font-medium transition-colors duration-150"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Account ─────────────────────────────────────────────────────────
function AccountSection({
  userInfo, showToast,
}: {
  userInfo: { first_name: string; last_name: string; email: string };
  showToast: (msg: string, type?: ToastType) => void;
}) {
  const orig = useRef(userInfo);
  const [firstName, setFirstName]   = useState(userInfo.first_name);
  const [lastName,  setLastName]    = useState(userInfo.last_name);
  const [email,     setEmail]       = useState(userInfo.email);
  const [showPw,    setShowPw]      = useState(false);
  const [curPw,     setCurPw]       = useState('');
  const [newPw,     setNewPw]       = useState('');
  const [confirmPw, setConfirmPw]   = useState('');

  useEffect(() => {
    orig.current = userInfo;
    setFirstName(userInfo.first_name);
    setLastName(userInfo.last_name);
    setEmail(userInfo.email);
  }, [userInfo]);

  const isDirty =
    firstName !== orig.current.first_name ||
    lastName  !== orig.current.last_name  ||
    email     !== orig.current.email      ||
    curPw !== '' || newPw !== '' || confirmPw !== '';

  const handleSave = () => {
    if (showPw) {
      if (!curPw) { showToast('Enter your current password', 'error'); return; }
      if (newPw.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
      if (newPw !== confirmPw) { showToast('New passwords do not match', 'error'); return; }
    }
    // API: PATCH /api/auth/me  { first_name, last_name, email }
    // API: POST  /api/auth/change-password  { current_password, new_password }
    orig.current = { first_name: firstName, last_name: lastName, email };
    setCurPw(''); setNewPw(''); setConfirmPw(''); setShowPw(false);
    showToast('Changes saved', 'success');
  };

  return (
    <div className="bg-background border border-border rounded-[12px] p-6 flex flex-col gap-5">
      <h3 className="text-[0.82rem] font-medium text-text-primary lowercase tracking-[-0.01em]">account details</h3>

      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" value={firstName} onChange={setFirstName} />
        <Field label="Last name"  value={lastName}  onChange={setLastName} />
      </div>
      <Field label="Email address" value={email} onChange={setEmail} type="email" />

      {/* Change password */}
      <div>
        <button
          onClick={() => setShowPw(!showPw)}
          className="text-[0.78rem] text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          {showPw ? '↑ Cancel password change' : 'Change password →'}
        </button>
        {showPw && (
          <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-border">
            <Field label="Current password"   value={curPw}     onChange={setCurPw}     type="password" />
            <Field label="New password"       value={newPw}     onChange={setNewPw}     type="password" />
            <Field label="Confirm new password" value={confirmPw} onChange={setConfirmPw} type="password" />
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border">
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="px-5 py-[0.58rem] text-[0.8rem] bg-btn-bg text-btn-text rounded-[8px] font-medium hover:opacity-85 transition-opacity duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}

// ─── Section: Brand ──────────────────────────────────────────────────────────
function BrandSection({
  brandDescription: initialDesc, showToast,
}: {
  brandDescription: string;
  showToast: (msg: string, type?: ToastType) => void;
}) {
  const [description, setDescription] = useState(initialDesc);
  const [saving, setSaving] = useState(false);
  const origRef = useRef(initialDesc);

  useEffect(() => {
    setDescription(initialDesc);
    origRef.current = initialDesc;
  }, [initialDesc]);

  const isDirty = description !== origRef.current;

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      await updateBrandDescription(description);
      origRef.current = description;
      showToast('Brand description saved', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-[12px] p-6 flex flex-col gap-5">
      <div>
        <h3 className="text-[0.82rem] font-medium text-text-primary lowercase tracking-[-0.01em]">brand description</h3>
        <p className="text-[0.68rem] text-text-tertiary mt-[3px] leading-[1.6]">
          Luna uses this to match your brand&#39;s tone in every customer reply. You can update it anytime.
        </p>
      </div>

      <div>
        <label className="block text-[0.7rem] uppercase tracking-[0.07em] text-text-tertiary mb-[6px]">
          Describe your brand
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. YOUR  is a streetwear brand built for youth with a grungy, rebellious edge. We keep it raw, affordable, and unapologetic."
          rows={4}
          className="w-full bg-background border border-border rounded-[8px] px-3 py-[0.58rem] text-[0.82rem] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-hover transition-colors duration-150 resize-none leading-[1.7]"
        />
        <p className="text-[0.63rem] text-text-tertiary mt-[0.35rem] leading-[1.6]">
          Two sentences is all Luna needs to match your voice.
        </p>
      </div>

      <div className="pt-2 border-t border-border">
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="px-5 py-[0.58rem] text-[0.8rem] bg-btn-bg text-btn-text rounded-[8px] font-medium hover:opacity-85 transition-opacity duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Section: Integrations ────────────────────────────────────────────────────
const INTEGRATIONS = [
  {
    id: 'instagram', name: 'Instagram', connected: true, handle: '@lunatestuser',
    icon: (
      <svg className="w-[22px] h-[22px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: 'facebook', name: 'Facebook Page', connected: false, handle: null,
    icon: (
      <svg className="w-[22px] h-[22px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
  },
  {
    id: 'shopify', name: 'Shopify', connected: false, handle: null,
    icon: (
      <svg className="w-[22px] h-[22px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <path d="M3 6h18M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
];

function IntegrationsSection({ showToast }: { showToast: (msg: string, type?: ToastType) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {INTEGRATIONS.map(integ => (
        <div key={integ.id} className="bg-background border border-border rounded-[12px] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-text-secondary">{integ.icon}</span>
            <div>
              <p className="text-[0.85rem] font-medium text-text-primary">{integ.name}</p>
              {integ.handle && (
                <p className="text-[0.72rem] text-text-tertiary mt-[1px]">{integ.handle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-[0.65rem] px-[9px] py-[3px] rounded-full font-medium ${
              integ.connected
                ? 'bg-[#3dbb77]/10 text-[#3dbb77] border border-[#3dbb77]/20'
                : 'bg-background3 text-text-tertiary border border-border'
            }`}>
              {integ.connected ? 'Connected' : 'Not connected'}
            </span>
            {integ.connected ? (
              <button
                onClick={() => showToast('Coming soon', 'info')}
                className="text-[0.75rem] px-3 py-[5px] border border-border text-text-tertiary hover:border-red-400/40 hover:text-red-400/70 rounded-[7px] transition-all duration-150"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => showToast('Coming soon', 'info')}
                className="text-[0.75rem] px-3 py-[5px] border border-border text-text-secondary hover:border-border-hover hover:text-text-primary rounded-[7px] transition-all duration-150"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section: Notifications ───────────────────────────────────────────────────
const NOTIF_ITEMS = [
  { id: 'escalations', label: 'Escalation alerts',               desc: 'Get notified when Luna escalates a conversation to you' },
  { id: 'exchanges',   label: 'New exchange or refund requests',  desc: 'Get notified when a new request is submitted' },
  { id: 'weekly',      label: 'Weekly summary',                  desc: "Receive a weekly email summary of Luna's activity and performance" },
];

function NotificationsSection({ showToast }: { showToast: (msg: string, type?: ToastType) => void }) {
  const [prefs, setPrefs] = useState({ escalations: true, exchanges: true, weekly: false });

  const toggle = (id: string) => {
    setPrefs(p => ({ ...p, [id]: !p[id as keyof typeof p] }));
    // API: PATCH /api/user/notification-preferences
    showToast('Saved', 'success');
  };

  return (
    <div className="bg-background border border-border rounded-[12px] overflow-hidden">
      {NOTIF_ITEMS.map((item, i) => (
        <div
          key={item.id}
          className={`flex items-center justify-between px-5 py-4 gap-6 ${
            i < NOTIF_ITEMS.length - 1 ? 'border-b border-border' : ''
          }`}
        >
          <div>
            <p className="text-[0.85rem] font-medium text-text-primary">{item.label}</p>
            <p className="text-[0.72rem] text-text-secondary mt-[2px] leading-[1.5]">{item.desc}</p>
          </div>
          <Toggle
            enabled={prefs[item.id as keyof typeof prefs]}
            onChange={() => toggle(item.id)}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Section: Billing & Usage ─────────────────────────────────────────────────
const USAGE = { conversations: 142, conversationsLimit: 500, dmsReplied: 287, escalations: 8 };
const BILLING_ROWS = [
  { date: 'Mar 1, 2025', desc: 'Monthly plan — March 2025',   amount: '$29.00', status: 'Paid' },
  { date: 'Feb 1, 2025', desc: 'Monthly plan — February 2025', amount: '$29.00', status: 'Paid' },
  { date: 'Jan 1, 2025', desc: 'Monthly plan — January 2025',  amount: '$29.00', status: 'Paid' },
  { date: 'Dec 1, 2024', desc: 'Monthly plan — December 2024', amount: '$29.00', status: 'Paid' },
];

function BillingSection({ showToast }: { showToast: (msg: string, type?: ToastType) => void }) {
  const pct = (USAGE.conversations / USAGE.conversationsLimit) * 100;
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-[#3dbb77]';

  return (
    <div className="flex flex-col gap-5">
      {/* Current plan */}
      <div className="bg-background border border-border rounded-[12px] p-5 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-[4px]">
            <span className="text-[0.85rem] font-medium text-text-primary">Current plan</span>
            <span className="text-[0.63rem] px-[8px] py-[2px] rounded-full bg-background3 border border-border text-text-secondary font-medium">
              Early Access
            </span>
          </div>
          <p className="text-[0.72rem] text-text-secondary">Monthly · renews Apr 1, 2025</p>
        </div>
        <button
          onClick={() => showToast('Coming soon', 'info')}
          className="text-[0.78rem] px-4 py-[6px] border border-border text-text-secondary rounded-[8px] hover:border-border-hover hover:text-text-primary transition-all duration-150 shrink-0"
        >
          Upgrade plan
        </button>
      </div>

      {/* Usage metrics */}
      <div>
        <p className="text-[0.68rem] uppercase tracking-[0.09em] text-text-tertiary mb-3">Usage this month</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background2 rounded-[8px] p-4">
            <p className="text-[0.68rem] text-text-tertiary mb-[6px]">Conversations handled</p>
            <p className="text-[1.1rem] font-medium text-text-primary leading-none">
              {USAGE.conversations}
              <span className="text-[0.72rem] text-text-tertiary font-normal ml-1">/ {USAGE.conversationsLimit}</span>
            </p>
            <div className="h-[3px] bg-background4 rounded-full mt-3 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
          <div className="bg-background2 rounded-[8px] p-4">
            <p className="text-[0.68rem] text-text-tertiary mb-[6px]">DMs replied</p>
            <p className="text-[1.1rem] font-medium text-text-primary leading-none">{USAGE.dmsReplied}</p>
          </div>
          <div className="bg-background2 rounded-[8px] p-4">
            <p className="text-[0.68rem] text-text-tertiary mb-[6px]">Escalations</p>
            <p className="text-[1.1rem] font-medium text-text-primary leading-none">{USAGE.escalations}</p>
          </div>
        </div>
      </div>

      {/* Billing history */}
      <div>
        <p className="text-[0.68rem] uppercase tracking-[0.09em] text-text-tertiary mb-3">Billing history</p>
        <div className="bg-background border border-border rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Date', 'Description', 'Amount', 'Status', 'Invoice'].map(h => (
                  <th key={h} className="text-left px-4 py-[0.65rem] text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BILLING_ROWS.map((row, i) => (
                <tr key={i} className={i < BILLING_ROWS.length - 1 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-[0.7rem] text-[0.78rem] text-text-secondary whitespace-nowrap">{row.date}</td>
                  <td className="px-4 py-[0.7rem] text-[0.78rem] text-text-primary">{row.desc}</td>
                  <td className="px-4 py-[0.7rem] text-[0.78rem] text-text-primary whitespace-nowrap">{row.amount}</td>
                  <td className="px-4 py-[0.7rem]">
                    <span className="text-[0.63rem] px-[8px] py-[2px] rounded-full bg-[#3dbb77]/10 text-[#3dbb77] border border-[#3dbb77]/20 font-medium">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-[0.7rem]">
                    <button
                      onClick={() => showToast('Coming soon', 'info')}
                      className="text-[0.75rem] text-text-secondary hover:text-text-primary transition-colors duration-150"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Danger Zone ─────────────────────────────────────────────────────
function DangerSection({ showToast }: { showToast: (msg: string, type?: ToastType) => void }) {
  const [modal, setModal] = useState<'disconnect' | 'delete' | null>(null);

  const ROWS = [
    {
      id: 'disconnect' as const,
      label: 'Disconnect brand',
      desc: "Remove all integrations and reset Luna's configuration. This cannot be undone.",
      btn: 'Disconnect',
      body: "This will remove all integrations and reset Luna's configuration. This cannot be undone.",
      toast: 'Brand disconnected',
    },
    {
      id: 'delete' as const,
      label: 'Delete account',
      desc: 'Permanently delete your Krew account and all associated data. This cannot be undone.',
      btn: 'Delete account',
      body: 'Your Krew account and all associated data will be permanently deleted. This cannot be undone.',
      toast: 'Account deleted',
    },
  ];

  const active = ROWS.find(r => r.id === modal);

  return (
    <div className="flex flex-col gap-3">
      {ROWS.map(row => (
        <div key={row.id} className="bg-background border border-border rounded-[12px] p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.88rem] font-medium text-text-primary">{row.label}</p>
            <p className="text-[0.75rem] text-text-secondary mt-[3px] max-w-[460px] leading-[1.6]">{row.desc}</p>
          </div>
          <button
            onClick={() => setModal(row.id)}
            className="text-[0.78rem] px-4 py-[6px] border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-[8px] transition-all duration-150 shrink-0"
          >
            {row.btn}
          </button>
        </div>
      ))}

      <ConfirmModal
        open={modal !== null}
        title="Are you sure?"
        body={active?.body ?? ''}
        onCancel={() => setModal(null)}
        onConfirm={() => {
          showToast(active?.toast ?? 'Done', 'error');
          setModal(null);
        }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: 'account',       label: 'Account' },
  { id: 'brand',         label: 'Brand' },
  { id: 'integrations',  label: 'Integrations' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'billing',       label: 'Billing & Usage' },
  { id: 'danger',        label: 'Danger zone' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [userInfo, setUserInfo] = useState({ first_name: '', last_name: '', email: '' });
  const [brandDescription, setBrandDescription] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    // Load cached info immediately
    const stored = localStorage.getItem('user_info');
    if (stored) setUserInfo(JSON.parse(stored));
    // Fetch fresh data from API (includes brand_description)
    getUserInfo().then(res => {
      if (res.user) {
        setUserInfo({
          first_name: res.user.first_name || '',
          last_name: res.user.last_name || '',
          email: res.user.email || '',
        });
        setBrandDescription(res.user.brand_description || '');
      }
    }).catch(() => {});
  }, [router]);

  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    setToast({ msg, type });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Full-bleed layout below fixed navbar (h-12 = 3rem) */}
      <div className="flex pt-12 min-h-screen">

        {/* Left settings panel — flush to viewport left edge, mirrors Luna sidebar */}
        <aside className="w-[200px] shrink-0 border-r border-border bg-background flex flex-col py-6 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto">
          {/* Title + subtitle */}
          <div className="px-[1.2rem] pb-[1.5rem] border-b border-border mb-4">
            <h1 className="text-[0.85rem] font-medium tracking-[-0.01em] text-text-primary lowercase">settings</h1>
            <p className="text-[0.62rem] text-text-tertiary mt-[3px] leading-[1.5]">manage your account and preferences</p>
          </div>

          {/* Section tabs */}
          <nav className="flex flex-col gap-[2px] px-[0.6rem]">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-[0.8rem] py-[0.65rem] text-[0.75rem] rounded-[8px] transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'bg-background3 text-text-primary font-medium'
                    : tab.id === 'danger'
                      ? 'text-red-400/60 hover:bg-background3 hover:text-red-400/90'
                      : 'text-text-tertiary hover:bg-background3 hover:text-text-secondary'
                } ${tab.id === 'danger' ? 'mt-3' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content area */}
        <main className="flex-1 bg-background2 overflow-y-auto">
          <div className="px-8 py-10 pb-16">
            {activeTab === 'account'       && <AccountSection       userInfo={userInfo} showToast={showToast} />}
            {activeTab === 'brand'         && <BrandSection         brandDescription={brandDescription} showToast={showToast} />}
            {activeTab === 'integrations'  && <IntegrationsSection  showToast={showToast} />}
            {activeTab === 'notifications' && <NotificationsSection showToast={showToast} />}
            {activeTab === 'billing'       && <BillingSection       showToast={showToast} />}
            {activeTab === 'danger'        && <DangerSection        showToast={showToast} />}
          </div>
        </main>
      </div>

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
