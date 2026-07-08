'use client';

import { useEffect, useState } from 'react';
import {
  BrandMember,
  createMember,
  deleteMember,
  generateMemberTelegramLink,
  getMembers,
} from '@/lib/api';

// =============================================================================
// TEAM — add media buyers who log expenses to Ivy over Telegram
// =============================================================================
// Owner adds a member (name, role, optional phone), then generates a single-use
// Telegram deep link and forwards it to that person. Tapping the link binds
// their Telegram chat to this brand + role on the backend (routes/telegram.js).
// The phone field is for the owner's reference only — it authorizes nothing.

const inputCls =
  'w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.78rem] text-text-primary placeholder:text-text-tertiary focus:border-border-hover focus:outline-none transition-colors duration-150';
const labelCls = 'text-[0.62rem] uppercase tracking-[0.08em] text-text-tertiary mb-[6px] block';

const ROLE_LABEL: Record<BrandMember['role'], string> = {
  owner: 'Owner',
  media_buyer: 'Media buyer',
};

export default function TeamSection() {
  const [members, setMembers] = useState<BrandMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add-member form
  const [name, setName] = useState('');
  const [role, setRole] = useState<BrandMember['role']>('media_buyer');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Per-member link state
  const [links, setLinks] = useState<Record<string, { link: string; expires_at: string }>>({});
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMembers();
        if (active) setMembers(data);
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load team members.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const addMember = async () => {
    if (!name.trim()) {
      setError('Enter a name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const member = await createMember({
        name: name.trim(),
        role,
        phone: phone.trim() || undefined,
      });
      setMembers((prev) => [...prev, member]);
      setName('');
      setPhone('');
      setRole('media_buyer');
    } catch (e: any) {
      setError(e.message || 'Failed to add member.');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (id: string) => {
    const prev = members;
    setMembers((m) => m.filter((x) => x.id !== id));
    setLinks((l) => {
      const next = { ...l };
      delete next[id];
      return next;
    });
    try {
      await deleteMember(id);
    } catch (e: any) {
      setError(e.message || 'Failed to remove member.');
      setMembers(prev); // roll back
    }
  };

  const makeLink = async (id: string) => {
    setLinkingId(id);
    setError('');
    try {
      const res = await generateMemberTelegramLink(id);
      setLinks((l) => ({ ...l, [id]: res }));
    } catch (e: any) {
      setError(e.message || 'Failed to generate link.');
    } finally {
      setLinkingId(null);
    }
  };

  const copyLink = async (id: string, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      /* clipboard blocked — the input is selectable as a fallback */
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="text-[0.66rem] text-red-400 bg-red-500/10 border border-red-500/20 rounded-[8px] px-3 py-2">
          {error}
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="bg-background2 border border-border rounded-[10px] h-[58px] motion-safe:animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-[0.68rem] text-text-tertiary bg-background2 border border-border rounded-[10px] px-4 py-6 text-center">
          No team members yet. Add a media buyer below to let them log expenses over Telegram.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m) => {
            const linked = links[m.id];
            return (
              <div key={m.id} className="bg-background2 border border-border rounded-[10px] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.75rem] text-text-primary truncate">{m.name}</span>
                      <span className="text-[0.58rem] uppercase tracking-[0.05em] text-text-tertiary border border-border rounded px-[6px] py-[1px] shrink-0">
                        {ROLE_LABEL[m.role]}
                      </span>
                    </div>
                    {m.phone && (
                      <div className="text-[0.64rem] text-text-tertiary mt-[2px] truncate">
                        {m.phone} <span className="text-text-tertiary/70">· reference only</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => makeLink(m.id)}
                      disabled={linkingId === m.id}
                      className="text-[0.64rem] text-ivy-accent border border-ivy-accent-border rounded-[7px] px-[10px] py-[5px] hover:bg-ivy-accent/10 transition-colors disabled:opacity-50"
                    >
                      {linkingId === m.id ? 'Generating…' : linked ? 'New link' : 'Telegram link'}
                    </button>
                    <button
                      onClick={() => removeMember(m.id)}
                      aria-label={`Remove ${m.name}`}
                      className="text-text-tertiary hover:text-red-400 transition-colors p-1"
                    >
                      <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {linked && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-[0.6rem] text-text-tertiary mb-[6px]">
                      Single-use link — expires{' '}
                      {new Date(linked.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                      Forward it to {m.name}.
                    </div>
                    <div className="flex items-center gap-2">
                      <input readOnly value={linked.link} onFocus={(e) => e.currentTarget.select()} className={inputCls} />
                      <button
                        onClick={() => copyLink(m.id, linked.link)}
                        className="text-[0.64rem] text-text-primary border border-border rounded-[7px] px-[10px] py-2 hover:border-border-hover transition-colors shrink-0"
                      >
                        {copiedId === m.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add-member form */}
      <div className="bg-background2 border border-border rounded-[10px] px-4 py-4">
        <div className="text-[0.68rem] text-text-primary mb-3">Add a team member</div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="member-name">Name</label>
              <input
                id="member-name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="e.g. Omar"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="member-role">Role</label>
              <select
                id="member-role"
                value={role}
                onChange={(e) => setRole(e.target.value as BrandMember['role'])}
                className={inputCls}
              >
                <option value="media_buyer">Media buyer (logs expenses only)</option>
                <option value="owner">Owner (full access)</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="member-phone">Phone — for your reference only</label>
            <input
              id="member-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </div>
          <button
            onClick={addMember}
            disabled={saving}
            className="self-start text-[0.68rem] text-white bg-ivy-accent rounded-[8px] px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add member'}
          </button>
        </div>
      </div>
    </div>
  );
}
