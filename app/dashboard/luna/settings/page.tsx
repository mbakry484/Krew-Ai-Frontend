'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { connectShopify, getShopifyStatus } from '@/lib/api';
import LunaSidebar from '@/components/LunaSidebar';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// GET /api/luna/settings
//   Returns:
//   {
//     brand_tone: 'Friendly'|'Professional'|'Casual'|'Luxury',
//     escalation_threshold: '3_messages'|'5_messages'|'any_complaint'|'never',
//     active_channels: { instagram: boolean, whatsapp: boolean },
//   }
//
// PUT /api/luna/settings
//   Body: same shape as GET response
//   Returns: { success: boolean }
//
// --- SHOPIFY ---
// GET /api/integrations/shopify/status
//   Returns: { linked: boolean, shop_domain?: string }
//
// POST /api/integrations/shopify/connect
//   Body: { shop_domain: string }   // e.g. "my-store.myshopify.com"
//   Returns: { oauth_url: string }  // redirect user to this URL for OAuth
//
// DELETE /api/integrations/shopify/disconnect
//   Returns: { success: boolean }
//
// --- META ---
// POST /api/integrations/meta/connect
//   Body: { business_account_id: string, access_token: string }
//   Returns: { success: boolean }
//
// DELETE /api/integrations/meta/disconnect
//   Returns: { success: boolean }
//
// --- BOSTA ---
// POST /api/integrations/bosta/connect
//   Body: { api_key: string }
//   Returns: { success: boolean }
//
// DELETE /api/integrations/bosta/disconnect
//   Returns: { success: boolean }
// =============================================================================

type Tone = 'Friendly' | 'Professional' | 'Casual' | 'Luxury';
type EscalationOption = '3 messages without resolution' | '5 messages without resolution' | 'Any complaint' | 'Never (manual only)';

interface ConnectModal {
  name: 'shopify' | 'meta' | 'bosta' | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Luna config state
  const [brandTone, setBrandTone] = useState<Tone>('Professional');
  const [escalation, setEscalation] = useState<EscalationOption>('3 messages without resolution');
  const [channels, setChannels] = useState({ instagram: true, whatsapp: true });

  // Integration states
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyStoreDomain, setShopifyStoreDomain] = useState('');
  const [metaConnected, setMetaConnected] = useState(false);
  const [bostaConnected, setBostaConnected] = useState(false);

  // Modal + form state
  const [modal, setModal] = useState<ConnectModal>({ name: null });
  const [shopDomain, setShopDomain] = useState('');
  const [shopifyKey, setShopifyKey] = useState('');  // unused in OAuth flow, kept for UI
  const [metaId, setMetaId] = useState('');
  const [metaToken, setMetaToken] = useState('');
  const [bostaKey, setBostaKey] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    checkShopifyStatus();
  }, [router]);

  // Handle Shopify OAuth redirect back
  useEffect(() => {
    if (searchParams.get('shopify') === 'connected') {
      showToast('Shopify connected successfully', 'success');
      router.replace('/dashboard/luna/settings', { scroll: false });
      checkShopifyStatus();
    }
  }, [searchParams, router]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // GET /api/integrations/shopify/status
  const checkShopifyStatus = async () => {
    try {
      const res = await getShopifyStatus();
      if (res.linked === true) {
        setShopifyConnected(true);
        setShopifyStoreDomain(res.shop_domain || '');
      } else {
        setShopifyConnected(false);
        setShopifyStoreDomain('');
      }
    } catch {
      setShopifyConnected(false);
      setShopifyStoreDomain('');
    }
  };

  const cleanShopDomain = (input: string): string => {
    let s = input.trim();
    const adminMatch = s.match(/admin\.shopify\.com\/store\/([^/]+)/);
    if (adminMatch) return `${adminMatch[1]}.myshopify.com`;
    s = s.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return s.endsWith('.myshopify.com') ? s : `${s}.myshopify.com`;
  };

  // POST /api/integrations/shopify/connect → redirect to OAuth
  const handleShopifyConnect = async () => {
    if (!shopDomain.trim()) { setFormError('Please enter a store domain'); return; }
    setFormLoading(true); setFormError('');
    try {
      const res = await connectShopify(cleanShopDomain(shopDomain));
      if (res.oauth_url) { window.location.href = res.oauth_url; }
      else throw new Error('No OAuth URL returned');
    } catch (err: any) {
      setFormError(err.message || 'Failed to connect Shopify');
      setFormLoading(false);
    }
  };

  // POST /api/integrations/meta/connect  (TODO: implement in lib/api.ts)
  const handleMetaConnect = async () => {
    if (!metaId.trim() || !metaToken.trim()) { setFormError('Please fill in all fields'); return; }
    setFormLoading(true); setFormError('');
    try {
      // await connectMeta({ business_account_id: metaId, access_token: metaToken });
      setMetaConnected(true);
      closeModal();
      showToast('Meta Business connected successfully');
    } catch (err: any) {
      setFormError(err.message || 'Failed to connect Meta');
    } finally {
      setFormLoading(false);
    }
  };

  // POST /api/integrations/bosta/connect  (TODO: implement in lib/api.ts)
  const handleBostaConnect = async () => {
    if (!bostaKey.trim()) { setFormError('Please enter your API key'); return; }
    setFormLoading(true); setFormError('');
    try {
      // await connectBosta({ api_key: bostaKey });
      setBostaConnected(true);
      closeModal();
      showToast('Bosta connected successfully');
    } catch (err: any) {
      setFormError(err.message || 'Failed to connect Bosta');
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ name: null });
    setFormError('');
    setShopDomain(''); setShopifyKey('');
    setMetaId(''); setMetaToken('');
    setBostaKey('');
  };

  // PUT /api/luna/settings
  const handleSaveConfig = () => {
    // TODO: call PUT /api/luna/settings with { brand_tone: brandTone, escalation_threshold: escalation, active_channels: channels }
    showToast('Settings saved');
  };

  const toggleChannel = (ch: 'instagram' | 'whatsapp') => {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const integrations = [
    {
      id: 'shopify' as const,
      name: 'Shopify',
      desc: shopifyConnected ? shopifyStoreDomain : 'Sync your product catalog, inventory, and orders.',
      connected: shopifyConnected,
      onDisconnect: () => { setShopifyConnected(false); setShopifyStoreDomain(''); showToast('Shopify disconnected'); },
      logo: (
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#96bf48]" style={{ background: '#1a1a1a', border: '1px solid rgba(150,191,72,0.2)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M15.5 4.5s-.3-1.5-1.8-1.5c0 0-1.2.1-2.2 1.2" strokeLinecap="round"/>
            <path d="M8 7.5l1 12 7.5 1.5 2.5-13.5-3-.5s-.4-2-2-2.5c0 0-1.8-.3-3 1L8 7.5z" strokeLinejoin="round"/>
            <path d="M10.5 7l.5 11M14 7.5l-1 10.5" strokeLinecap="round" strokeWidth="1.4"/>
          </svg>
        </div>
      )
    },
    {
      id: 'meta' as const,
      name: 'Meta Business',
      desc: 'Connect Instagram DMs and WhatsApp Business. Luna reads and replies in real time.',
      connected: metaConnected,
      onDisconnect: () => { setMetaConnected(false); showToast('Meta disconnected'); },
      logo: (
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#1877f2]" style={{ background: '#1a1a1a', border: '1px solid rgba(24,119,242,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
        </div>
      )
    },
    {
      id: 'bosta' as const,
      name: 'Bosta',
      desc: 'Plug in your Bosta account so Luna can track shipments and give live delivery updates.',
      connected: bostaConnected,
      onDisconnect: () => { setBostaConnected(false); showToast('Bosta disconnected'); },
      logo: (
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#ff6b35]" style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,53,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 8h14M5 8a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v0a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M10 12h4"/>
          </svg>
        </div>
      )
    },
  ];

  const TONE_OPTIONS: Tone[] = ['Friendly', 'Professional', 'Casual', 'Luxury'];
  const ESCALATION_OPTIONS: EscalationOption[] = [
    '3 messages without resolution',
    '5 messages without resolution',
    'Any complaint',
    'Never (manual only)',
  ];

  return (
    <div className="min-h-screen pt-12 flex flex-col">
      <div className="flex flex-1">
        <LunaSidebar />

        <main className="flex-1 overflow-y-auto bg-background2">
          {/* Top Bar */}
          <div className="px-8 pt-[1.6rem] pb-0">
            <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.2rem] lowercase">settings</h2>
            <p className="text-[0.72rem] text-text-secondary">configure Luna for your brand</p>
          </div>

          <div className="px-8 py-6 pb-12 flex flex-col gap-6 max-w-2xl">

            {/* ── INTEGRATIONS ──
                API: see Shopify/Meta/Bosta above */}
            <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Integrations</div>
              <p className="text-[0.68rem] text-text-secondary mb-4">
                Connect your tools so Luna can access your store, channels, and shipping data.
              </p>

              <div className="flex flex-col gap-3">
                {integrations.map((intg) => (
                  <div
                    key={intg.id}
                    className={`flex items-center gap-4 bg-background2 border rounded-[12px] px-[1.3rem] py-[1.1rem] transition-colors duration-[180ms] ${
                      intg.connected ? 'border-green-400/30' : 'border-border hover:border-border-md'
                    }`}
                  >
                    {intg.logo}
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.82rem] font-medium text-text-primary mb-[0.15rem]">{intg.name}</div>
                      <div className="text-[0.68rem] text-text-tertiary truncate">{intg.desc}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {intg.connected && (
                        <div className="w-[6px] h-[6px] rounded-full bg-green-400 shadow-[0_0_6px_rgba(92,207,143,0.5)]" />
                      )}
                      <button
                        onClick={() => intg.connected ? intg.onDisconnect() : setModal({ name: intg.id })}
                        className={`rounded-[8px] px-4 py-[7px] text-[0.72rem] font-medium transition-all duration-[180ms] whitespace-nowrap ${
                          intg.connected
                            ? 'text-text-tertiary border border-border hover:border-red-400/50 hover:text-red-400/80'
                            : 'bg-btn-bg text-btn-text hover:opacity-85'
                        }`}
                      >
                        {intg.connected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── LUNA CONFIGURATION ──
                API: GET/PUT /api/luna/settings */}
            <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Luna Configuration</div>
              <p className="text-[0.68rem] text-text-secondary mb-5">Customize how Luna behaves for your brand</p>

              <div className="flex flex-col gap-5">
                {/* Brand tone — POST /api/luna/settings → brand_tone */}
                <div>
                  <div className="text-[0.72rem] text-text-secondary mb-[0.4rem]">Brand tone</div>
                  <div className="flex gap-2 flex-wrap">
                    {TONE_OPTIONS.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setBrandTone(tone)}
                        className={`border rounded-[8px] px-[14px] py-[6px] text-[0.7rem] transition-all duration-150 ${
                          brandTone === tone
                            ? 'border-border-hover text-text-primary'
                            : 'border-border text-text-secondary hover:border-border-md hover:text-text-primary'
                        }`}
                      >
                        {tone}{brandTone === tone ? ' ✓' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-escalate — POST /api/luna/settings → escalation_threshold */}
                <div>
                  <div className="text-[0.72rem] text-text-secondary mb-[0.4rem]">Auto-escalate after</div>
                  <select
                    value={escalation}
                    onChange={(e) => setEscalation(e.target.value as EscalationOption)}
                    className="w-full bg-input-bg border border-border rounded-[8px] pl-3 pr-10 py-2 text-[0.75rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200 cursor-pointer appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px',
                    }}
                  >
                    {ESCALATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {/* Active channels — POST /api/luna/settings → active_channels */}
                <div>
                  <div className="text-[0.72rem] text-text-secondary mb-[0.4rem]">Active channels</div>
                  <div className="flex gap-2">
                    {(['instagram', 'whatsapp'] as const).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        className={`border rounded-[8px] px-[14px] py-[6px] text-[0.7rem] capitalize transition-all duration-150 ${
                          channels[ch]
                            ? 'border-border-hover text-text-primary'
                            : 'border-border text-text-secondary hover:border-border-md'
                        }`}
                      >
                        {ch === 'instagram' ? 'Instagram' : 'WhatsApp'}{channels[ch] ? ' ✓' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveConfig}
                className="w-full mt-6 bg-btn-bg text-btn-text px-4 py-2 rounded-[8px] text-[0.75rem] font-medium hover:opacity-85 transition-opacity duration-200"
              >
                Save settings
              </button>
            </div>

          </div>
        </main>
      </div>

      {/* ── INTEGRATION MODALS ── */}
      {modal.name && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center"
          style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-background2 border border-border-md rounded-[14px] p-8 w-full max-w-[360px] mx-4 relative">
            <button onClick={closeModal} className="absolute top-3 right-[14px] text-text-tertiary hover:text-text-primary text-[1.1rem] leading-none bg-none border-none cursor-pointer">×</button>

            {/* Shopify modal */}
            {modal.name === 'shopify' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[#96bf48]" style={{ background: '#1a1a1a', border: '1px solid rgba(150,191,72,0.2)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M15.5 4.5s-.3-1.5-1.8-1.5c0 0-1.2.1-2.2 1.2" strokeLinecap="round"/>
                      <path d="M8 7.5l1 12 7.5 1.5 2.5-13.5-3-.5s-.4-2-2-2.5c0 0-1.8-.3-3 1L8 7.5z" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-[1rem] font-[400] tracking-[-0.02em]">Connect Shopify</div>
                </div>
                <p className="text-[0.7rem] text-text-tertiary mb-5 leading-[1.6]">
                  Enter your Shopify store URL. Luna will sync your products, inventory, and orders automatically.
                </p>
                <div className="mb-3">
                  <div className="text-[0.62rem] uppercase tracking-[0.07em] text-text-tertiary mb-[0.3rem]">Store URL</div>
                  <input
                    type="text"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    placeholder="yourstore.myshopify.com"
                    onKeyDown={(e) => e.key === 'Enter' && handleShopifyConnect()}
                    className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.78rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200"
                  />
                </div>
                {formError && <div className="mb-3 text-[0.7rem] text-red-400">{formError}</div>}
                <button
                  onClick={handleShopifyConnect}
                  disabled={formLoading}
                  className="w-full bg-btn-bg text-btn-text rounded-[8px] py-[10px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity duration-200 disabled:opacity-50 mt-1"
                >
                  {formLoading ? 'Connecting…' : 'Connect Shopify'}
                </button>
                <p className="text-[0.65rem] text-text-tertiary text-center mt-3">Need help? View setup guide →</p>
              </>
            )}

            {/* Meta modal */}
            {modal.name === 'meta' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[#1877f2]" style={{ background: '#1a1a1a', border: '1px solid rgba(24,119,242,0.2)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                  </div>
                  <div className="text-[1rem] font-[400] tracking-[-0.02em]">Connect Meta Business</div>
                </div>
                <p className="text-[0.7rem] text-text-tertiary mb-5 leading-[1.6]">
                  Link your Meta Business account to activate Luna on Instagram DMs and WhatsApp Business.
                </p>
                <div className="mb-3">
                  <div className="text-[0.62rem] uppercase tracking-[0.07em] text-text-tertiary mb-[0.3rem]">Business Account ID</div>
                  <input type="text" value={metaId} onChange={(e) => setMetaId(e.target.value)} placeholder="123456789012345"
                    className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.78rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200" />
                </div>
                <div className="mb-3">
                  <div className="text-[0.62rem] uppercase tracking-[0.07em] text-text-tertiary mb-[0.3rem]">Access Token</div>
                  <input type="password" value={metaToken} onChange={(e) => setMetaToken(e.target.value)} placeholder="EAAB…"
                    className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.78rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200" />
                </div>
                {formError && <div className="mb-3 text-[0.7rem] text-red-400">{formError}</div>}
                <button onClick={handleMetaConnect} disabled={formLoading}
                  className="w-full bg-btn-bg text-btn-text rounded-[8px] py-[10px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity duration-200 disabled:opacity-50 mt-1">
                  {formLoading ? 'Connecting…' : 'Connect Meta'}
                </button>
                <p className="text-[0.65rem] text-text-tertiary text-center mt-3">Need help? View setup guide →</p>
              </>
            )}

            {/* Bosta modal */}
            {modal.name === 'bosta' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[#ff6b35]" style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,53,0.2)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5 8h14M5 8a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v0a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M10 12h4"/>
                    </svg>
                  </div>
                  <div className="text-[1rem] font-[400] tracking-[-0.02em]">Connect Bosta</div>
                </div>
                <p className="text-[0.7rem] text-text-tertiary mb-5 leading-[1.6]">
                  Connect your Bosta account so Luna can track shipments and give customers live delivery updates.
                </p>
                <div className="mb-3">
                  <div className="text-[0.62rem] uppercase tracking-[0.07em] text-text-tertiary mb-[0.3rem]">API Key</div>
                  <input type="password" value={bostaKey} onChange={(e) => setBostaKey(e.target.value)} placeholder="bosta_live_••••••••••••"
                    className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.78rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200" />
                </div>
                {formError && <div className="mb-3 text-[0.7rem] text-red-400">{formError}</div>}
                <button onClick={handleBostaConnect} disabled={formLoading}
                  className="w-full bg-btn-bg text-btn-text rounded-[8px] py-[10px] text-[0.78rem] font-medium hover:opacity-85 transition-opacity duration-200 disabled:opacity-50 mt-1">
                  {formLoading ? 'Connecting…' : 'Connect Bosta'}
                </button>
                <p className="text-[0.65rem] text-text-tertiary text-center mt-3">Find your key in Bosta Dashboard → Settings → API</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500]">
          <div className={`flex items-center gap-3 rounded-[10px] px-5 py-[0.9rem] text-[0.75rem] shadow-lg border whitespace-nowrap ${
            toast.type === 'success'
              ? 'bg-background2 border-border-md text-text-secondary'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <span className={`w-[6px] h-[6px] rounded-full animate-pulse ${toast.type === 'success' ? 'bg-text-secondary' : 'bg-red-400'}`} />
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
