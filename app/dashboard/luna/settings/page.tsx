'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isLoggedIn, getToken } from '@/lib/auth';
import { connectShopify, getIntegrationStatus, getUserInfo, updateBrandDescription, disconnectIntegration, getProducts } from '@/lib/api';
import LunaSidebar from '@/components/LunaSidebar';
import LunaTopBarActions from '@/components/LunaTopBarActions';

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
// --- META / INSTAGRAM (OAuth) ---
// GET /auth/instagram?brand_id=<id>&token=<jwt>
//   Redirects user to Instagram OAuth flow
//   On success: redirects back to /dashboard/luna/settings?instagram=connected
//   On failure: redirects back to /dashboard/luna/settings?error=instagram_failed
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
  name: 'shopify' | 'bosta' | null;
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Luna config state
  const [brandTone, setBrandTone] = useState<Tone>('Professional');
  const [escalation, setEscalation] = useState<EscalationOption>('3 messages without resolution');
  const [channels, setChannels] = useState({ instagram: true, whatsapp: true });
  const [brandDescription, setBrandDescription] = useState('');
  const [savedBrandDescription, setSavedBrandDescription] = useState('');
  const [descSaving, setDescSaving] = useState(false);

  // Integration states
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyStoreDomain, setShopifyStoreDomain] = useState('');
  const [shopifyShopName, setShopifyShopName] = useState('');
  const [shopifyProductCount, setShopifyProductCount] = useState<number | null>(null);
  const [metaConnected, setMetaConnected] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState('');
  const [bostaConnected, setBostaConnected] = useState(false);

  // Modal + form state
  const [modal, setModal] = useState<ConnectModal>({ name: null });
  const [shopDomain, setShopDomain] = useState('');
  const [shopifyKey, setShopifyKey] = useState('');  // unused in OAuth flow, kept for UI
  const [bostaKey, setBostaKey] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    checkIntegrationStatus();
    getUserInfo().then(res => {
      if (res.user?.brand_description) {
        setBrandDescription(res.user.brand_description);
        setSavedBrandDescription(res.user.brand_description);
      }
    }).catch(() => {});
  }, [router]);

  // Handle Shopify OAuth redirect back
  useEffect(() => {
    if (searchParams.get('shopify') === 'connected') {
      showToast('Shopify connected successfully', 'success');
      router.replace('/dashboard/luna/settings', { scroll: false });
      checkIntegrationStatus();
    }
  }, [searchParams, router]);

  // Handle Instagram OAuth redirect back
  useEffect(() => {
    if (searchParams.get('instagram') === 'connected') {
      showToast('Instagram connected successfully', 'success');
      router.replace('/dashboard/luna/settings', { scroll: false });
      checkIntegrationStatus();
    }
    if (searchParams.get('error') === 'instagram_failed') {
      showToast('Failed to connect Instagram. Please try again.', 'error');
      router.replace('/dashboard/luna/settings', { scroll: false });
    }
    if (searchParams.get('error') === 'instagram_already_connected') {
      showToast('This Instagram account is already connected to another brand.', 'error');
      router.replace('/dashboard/luna/settings', { scroll: false });
    }
  }, [searchParams, router]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch integration statuses from DB
  const checkIntegrationStatus = async () => {
    try {
      const status = await getIntegrationStatus();
      const linked = !!status.shopify?.linked;
      setShopifyConnected(linked);
      setShopifyStoreDomain(status.shopify?.shop_domain || '');
      setShopifyShopName(status.shopify?.shop_name || '');
      setMetaConnected(!!status.meta?.linked);
      setInstagramUsername(status.meta?.instagram_username || '');
      if (linked) {
        try {
          const products = await getProducts();
          const list = Array.isArray(products) ? products : (products?.products ?? []);
          setShopifyProductCount(list.length);
        } catch {
          setShopifyProductCount(null);
        }
      } else {
        setShopifyProductCount(null);
      }
    } catch {
      setShopifyConnected(false);
      setShopifyStoreDomain('');
      setShopifyShopName('');
      setShopifyProductCount(null);
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

  // Instagram OAuth — redirect to backend
  const handleInstagramConnect = async () => {
    setFormLoading(true);
    try {
      const token = getToken();
      const userInfo = await getUserInfo();
      const brandId = userInfo.user?.brand_id || userInfo.brand_id;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://krew-ai-backend-production.up.railway.app';
      window.location.href = `${apiUrl}/auth/instagram?brand_id=${brandId}&token=${token}`;
    } catch (err: any) {
      showToast(err.message || 'Failed to start Instagram connection', 'error');
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
    setBostaKey('');
  };

  // PUT /api/luna/settings
  const handleSaveConfig = async () => {
    setDescSaving(true);
    try {
      // Save brand description if changed
      if (brandDescription !== savedBrandDescription) {
        await updateBrandDescription(brandDescription);
        setSavedBrandDescription(brandDescription);
      }
      // TODO: call PUT /api/luna/settings with { brand_tone: brandTone, escalation_threshold: escalation, active_channels: channels }
      showToast('Settings saved');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setDescSaving(false);
    }
  };

  const toggleChannel = (ch: 'instagram' | 'whatsapp') => {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const handleDisconnect = async (platform: 'shopify' | 'instagram' | 'all') => {
    try {
      await disconnectIntegration(platform);
      if (platform === 'shopify' || platform === 'all') {
        setShopifyConnected(false);
        setShopifyStoreDomain('');
        setShopifyShopName('');
        setShopifyProductCount(null);
      }
      if (platform === 'instagram' || platform === 'all') {
        setMetaConnected(false);
        setInstagramUsername('');
      }
      if (platform === 'all') {
        setBostaConnected(false);
      }
      showToast(platform === 'all' ? 'All integrations disconnected' : `${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`);
    } catch (err: any) {
      showToast(err.message || 'Failed to disconnect', 'error');
    }
  };

  const integrations = [
    {
      id: 'shopify' as const,
      name: 'Shopify',
      desc: shopifyConnected
        ? [shopifyShopName || shopifyStoreDomain, shopifyProductCount !== null ? `${shopifyProductCount} products synced` : null].filter(Boolean).join(' · ')
        : 'Sync your product catalog, inventory, and orders.',
      connected: shopifyConnected,
      onDisconnect: () => handleDisconnect('shopify'),
      logo: (
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: '#96bf48' }}>
          <svg width="18" height="20" viewBox="0 0 24 28" fill="none">
            <path d="M1.7 1.3c-.1 0-.2 0-.3.1-.1 0-1.5.5-1.5.5S12.7.4 12.5.2c-.2-.2-.6-.2-.7-.2h-.1C11.1 0 10.5.9 10.2 1.6L8.5 2.1c-.3-.9-.8-1.7-1.5-1.7h-.1C6 .4 5.2 1 4.6 2 3.7 3.5 3 6.2 3 6.2L1.2 6.8c-.4.1-.4.1-.5.5C.7 7.6 0 27 0 27l17.4 3 7.6-1.7S16 1.5 15.9 1.4c0-.1-.1-.1-.2-.1zM11.2 3l-1.8.6c.3-1.2.9-2.4 1.8-2.9V3zm-2.5.8L5.6 4.9c.5-2 1.5-3 2.5-3.3l.6 2.2zM8 .8c.1 0 .3.1.4.2-.1 0-.3.1-.4.1.1-.1.1-.2 0-.3zm4.1 5.5l-.8 2.5s-.9-.4-1.9-.4c-1.5 0-1.6.9-1.6 1.2 0 1.3 3.4 1.8 3.4 4.8 0 2.4-1.5 3.9-3.6 3.9-2.5 0-3.7-1.5-3.7-1.5l.7-2.2s1.3 1.1 2.4 1.1c.7 0 1-.6 1-1 0-1.7-2.8-1.8-2.8-4.5 0-2.3 1.7-4.6 5.1-4.6 1.3 0 1.8.4 1.8.4z" fill="white"/>
          </svg>
        </div>
      )
    },
    {
      id: 'meta' as const,
      name: 'Instagram',
      desc: metaConnected ? (instagramUsername ? `@${instagramUsername}` : 'Connected') : 'Connect your Instagram account. Luna reads and replies to DMs in real time.',
      connected: metaConnected,
      onDisconnect: () => handleDisconnect('instagram'),
      logo: (
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', border: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
          </svg>
        </div>
      )
    },
    {
      id: 'bosta' as const,
      name: 'Bosta',
      desc: 'Plug in your Bosta account so Luna can track shipments and give live delivery updates.',
      connected: bostaConnected,
      onDisconnect: () => handleDisconnect('all'),
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
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 gap-3 p-3 max-md:pt-[60px]">
        <LunaSidebar />

        <main className="flex-1 rounded-2xl border border-border overflow-y-auto bg-background2">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 max-md:px-4 pt-[1.6rem] pb-0 flex-wrap gap-3">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">settings</h2>
              <p className="text-[0.72rem] text-text-secondary">configure Luna for your brand</p>
            </div>
            <div className="max-md:hidden"><LunaTopBarActions /></div>
          </div>

          <div className="px-8 py-6 pb-12 flex flex-col gap-6">

            {/* ── INTEGRATIONS ──
                API: see Shopify/Meta/Bosta above */}
            <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
              <div className="flex items-center justify-between mb-[0.3rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary">Integrations</div>
                {(shopifyConnected || metaConnected || bostaConnected) && (
                  <button
                    onClick={() => handleDisconnect('all')}
                    className="text-[0.68rem] text-red-400/70 border border-red-400/30 rounded-[7px] px-3 py-[5px] hover:text-red-400 hover:border-red-400/60 transition-all duration-[180ms]"
                  >
                    Disconnect all
                  </button>
                )}
              </div>
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
                      {intg.connected ? (
                        <span className="rounded-[8px] px-4 py-[7px] text-[0.72rem] font-medium text-text-tertiary border border-border whitespace-nowrap cursor-default select-none">
                          Connected
                        </span>
                      ) : (
                        <button
                          onClick={() => intg.id === 'meta' ? handleInstagramConnect() : setModal({ name: intg.id as 'shopify' | 'bosta' })}
                          disabled={intg.id === 'meta' && formLoading}
                          className="rounded-[8px] px-4 py-[7px] text-[0.72rem] font-medium bg-btn-bg text-btn-text hover:opacity-85 transition-all duration-[180ms] whitespace-nowrap disabled:opacity-50"
                        >
                          {intg.id === 'meta' && formLoading ? 'Connecting...' : 'Connect'}
                        </button>
                      )}
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

                {/* Brand description */}
                <div>
                  <div className="text-[0.72rem] text-text-secondary mb-[0.4rem]">Brand description</div>
                  <textarea
                    value={brandDescription}
                    onChange={(e) => setBrandDescription(e.target.value)}
                    placeholder="e.g. YOUR BRAND is a streetwear brand built for youth with a grungy, rebellious edge. We keep it raw, affordable, and unapologetic."
                    rows={3}
                    className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.75rem] text-text-primary placeholder:text-text-tertiary outline-none focus:border-border-md transition-colors duration-200 resize-none leading-[1.7]"
                  />
                  <p className="text-[0.6rem] text-text-tertiary mt-[0.25rem]">
                    Luna uses this to match your brand&#39;s tone in every reply.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={descSaving}
                className="w-full mt-6 bg-btn-bg text-btn-text px-4 py-2 rounded-[8px] text-[0.75rem] font-medium hover:opacity-85 transition-opacity duration-200 disabled:opacity-50"
              >
                {descSaving ? 'Saving…' : 'Save settings'}
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
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#96bf48' }}>
                    <svg width="14" height="16" viewBox="0 0 24 28" fill="none">
                      <path d="M15.7 1.3c-.1 0-.2 0-.3.1-.1 0-1.5.5-1.5.5S12.7.4 12.5.2c-.2-.2-.6-.2-.7-.2h-.1C11.1 0 10.5.9 10.2 1.6L8.5 2.1c-.3-.9-.8-1.7-1.5-1.7h-.1C6 .4 5.2 1 4.6 2 3.7 3.5 3 6.2 3 6.2L1.2 6.8c-.4.1-.4.1-.5.5C.7 7.6 0 27 0 27l17.4 3 7.6-1.7S16 1.5 15.9 1.4c0-.1-.1-.1-.2-.1zM11.2 3l-1.8.6c.3-1.2.9-2.4 1.8-2.9V3zm-2.5.8L5.6 4.9c.5-2 1.5-3 2.5-3.3l.6 2.2zM8 .8c.1 0 .3.1.4.2-.1 0-.3.1-.4.1.1-.1.1-.2 0-.3zm4.1 5.5l-.8 2.5s-.9-.4-1.9-.4c-1.5 0-1.6.9-1.6 1.2 0 1.3 3.4 1.8 3.4 4.8 0 2.4-1.5 3.9-3.6 3.9-2.5 0-3.7-1.5-3.7-1.5l.7-2.2s1.3 1.1 2.4 1.1c.7 0 1-.6 1-1 0-1.7-2.8-1.8-2.8-4.5 0-2.3 1.7-4.6 5.1-4.6 1.3 0 1.8.4 1.8.4z" fill="white"/>
                    </svg>
                  </div>
                  <div className="text-[1rem] font-[400] tracking-[-0.02em]">Connect Shopify</div>
                </div>
                <p className="text-[0.7rem] text-text-tertiary mb-4 leading-[1.6]">
                  Paste your Shopify store URL below. Luna will install and sync your products automatically.
                </p>
                <div className="mb-4 bg-input-bg border border-border rounded-[10px] px-3 py-3 flex items-start gap-2">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" className="mt-[2px] shrink-0 text-text-tertiary" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="10" cy="10" r="8"/><line x1="10" y1="9" x2="10" y2="14"/><circle cx="10" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                  </svg>
                  <span className="text-[0.68rem] text-text-tertiary leading-[1.6]">
                    Go to{' '}
                    <a
                      href="https://admin.shopify.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
                    >
                      admin.shopify.com
                    </a>
                    , select your store, then copy the <span className="text-text-primary">.myshopify.com</span> URL from your browser's address bar and paste it below.
                  </span>
                </div>
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
                  {formLoading ? 'Redirecting to Shopify…' : 'Connect Shopify'}
                </button>
                <p className="text-[0.65rem] text-text-tertiary text-center mt-3">You'll be redirected to Shopify to approve the connection, then brought back automatically.</p>
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

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
