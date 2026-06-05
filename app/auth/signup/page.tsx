'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  signup,
  checkEmail,
  saveOnboarding,
  connectShopify,
  getShopifyStatus,
  getUserInfo,
} from '@/lib/api';
import { getToken, isLoggedIn } from '@/lib/auth';
import './onboarding.css';

// =============================================================================
// BACKEND API USAGE — unchanged
// =============================================================================
// POST /auth/signup              — create Krew account (email, password, names, business_name)
// POST /auth/onboarding          — saves business context (brand_description)
// POST /integrations/shopify/connect → { oauth_url } — Shopify OAuth
// GET  /integrations/shopify/status
// GET  /auth/instagram?brand_id=<id>&token=<jwt> — Meta OAuth redirect
// GET  /auth/me                  — current user + brand_id + instagram_connected
// =============================================================================

// -----------------------------------------------------------------------------
// Icons (ported from handoff — Krew style: 24 viewBox, stroke 1.5, currentColor)
// -----------------------------------------------------------------------------
type IcoProps = { size?: number; sw?: number; children?: ReactNode };
const Ico = ({ children, size = 16, sw = 1.5 }: IcoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    style={{ flexShrink: 0 }}
  >
    {children}
  </svg>
);
const IconCheck = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M4 12.5l5 5L20 6" />
  </Ico>
);
const IconArrowRight = (p: IcoProps) => (
  <Ico {...p} sw={p.sw || 1.6}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Ico>
);
const IconArrowLeft = (p: IcoProps) => (
  <Ico {...p} sw={p.sw || 1.6}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Ico>
);
const IconInstagram = (p: IcoProps) => (
  <Ico {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
  </Ico>
);
const IconShopify = (p: IcoProps) => (
  <Ico {...p}>
    <path d="M14.5 5.5c-.3-.4-.9-.5-1.3-.4 -.1-.3-.2-.6-.4-.8 -.5-.5-1.2-.3-1.5-.2 -.8.2-1.5.9-1.9 2 -.7.2-1.2.4-1.3.4 -.4.1-.4.1-.5.5 -.1.3-1.6 11.5-1.6 11.5l7.3 1.4 3.2-.8s-2-13.3-2-13.4c0-.1-.1-.2-.2-.2zm-2.6-.5c-.1 0-.2.1-.3.1 0-.4-.1-.8-.2-1.1 .5.1.8.6.5 1z" />
  </Ico>
);
const IconLock = (p: IcoProps) => (
  <Ico {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Ico>
);

const LunaMark = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path
      d="M15.5 3.5a9 9 0 1 0 5 5 7 7 0 0 1-5-5z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);

type LunaState = 'idle' | 'typing' | 'alive' | 'thinking';
function LunaChip({ line, state = 'idle' }: { line: string; state?: LunaState }) {
  return (
    <div className={`luna-line-wrap luna-${state}`}>
      <span className="luna-mark"><LunaMark size={13} /></span>
      <span className="luna-line" key={line}>
        {line}
        {state === 'typing' && (
          <span className="luna-typing"><span /><span /><span /></span>
        )}
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Demo catalog — shown in Shopify scan animation (cosmetic only)
// -----------------------------------------------------------------------------
const DEMO_CATALOG = [
  'Ceramic Kohl Liner — matte black',
  'Linen Kaftan — desert sand',
  'Brass Hamsa Pendant',
  'Argan Hair Oil 50ml',
  'Hand-loomed Cotton Throw',
  'Olive Wood Serving Board',
  'Saffron Eau de Parfum 30ml',
  'Sadu Cushion Cover — ivory',
  'Damascene Silver Ring',
  'Rose Water Mist 100ml',
  'Copper Turkish Coffee Set',
  'Linen Abaya — charcoal',
  'Oud Solid Perfume',
  'Tassel Earrings — gold',
  'Hand-poured Fig Candle',
  'Woven Palm Basket — large',
  'Henna Aftercare Balm',
  'Ceramic Mezze Plate — olive',
  'Silk Hair Scarf — terracotta',
  'Musk Body Lotion 200ml',
  'Amber Prayer Beads',
  'Cardamom Kombucha',
  'Kilim Runner — 80x200',
  'Pistachio Maamoul Tin',
  'Peach Blossom Lip Tint',
  'Shea Butter Soap Bar',
  'Kohl Mini Travel Set',
  'Embroidered Tote — indigo',
  'Zaatar Blend 120g',
  'Frankincense Resin Jar',
  'Mother-of-Pearl Comb',
  'Argan Body Scrub',
  'Linen Sleep Set — dune',
  'Handpainted Tile Coaster',
  'Oud Oil Roll-on 10ml',
  'Woven Leather Sandals',
  'Kunafa Butter 250g',
  'Turquoise Evil Eye Ring',
  'Silk Tassel Bookmark',
  'Cedarwood Room Spray',
  'Brass Incense Holder',
  'Hibiscus Rose Tea 80g',
  'Linen Table Runner',
  'Jasmine Attar 5ml',
  'Camel Leather Wallet',
  'Orange Blossom Honey',
  'Zellige Tile Trivet',
];

const COUNTRY_CODES = [
  { c: '+971', f: '🇦🇪', n: 'UAE' },
  { c: '+966', f: '🇸🇦', n: 'KSA' },
  { c: '+20', f: '🇪🇬', n: 'Egypt' },
  { c: '+965', f: '🇰🇼', n: 'Kuwait' },
  { c: '+974', f: '🇶🇦', n: 'Qatar' },
  { c: '+973', f: '🇧🇭', n: 'Bahrain' },
  { c: '+968', f: '🇴🇲', n: 'Oman' },
  { c: '+962', f: '🇯🇴', n: 'Jordan' },
  { c: '+961', f: '🇱🇧', n: 'Lebanon' },
  { c: '+212', f: '🇲🇦', n: 'Morocco' },
];

const VOICE_OPTIONS = [
  {
    key: 'warm',
    head: 'Friendly & warm',
    sub: "hey! so glad you asked — we ship to Kuwait flat-rate, 2-4 days ✨",
    brandDescription: 'Friendly & warm tone — conversational, empathetic, uses light emoji.',
  },
  {
    key: 'pro',
    head: 'Professional & clear',
    sub: 'Yes — we ship to Kuwait. Flat rate 35 AED, 2–4 business days.',
    brandDescription: 'Professional & clear tone — short sentences, precise, no filler.',
  },
  {
    key: 'casual',
    head: 'Casual & local',
    sub: 'أيوه بنشحن للكويت — 35 درهم، 2-4 أيام. أجهزلك السلة؟',
    brandDescription: 'Casual & local tone — Arabic/English mix, warm, close-to-home feel.',
  },
];

// -----------------------------------------------------------------------------
// Hook chat — animated welcome stream (mirrors design)
// -----------------------------------------------------------------------------
const HOOK_MESSAGES = [
  { id: 1, text: "Hey, I'm Luna." },
  { id: 2, text: "I'll be handling your DMs from here on." },
  { id: 3, text: 'Customers get answers in seconds — even while you sleep.' },
  { id: 4, text: "Let's get you set up. Won't take long." },
];

function HookChat({ onNext }: { onNext: () => void }) {
  const [visible, setVisible] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>(res => {
      const t = setTimeout(() => res(), ms);
      timers.push(t);
    });
    (async () => {
      for (let i = 0; i < HOOK_MESSAGES.length; i++) {
        if (cancelled) return;
        setTyping(true);
        await wait(i === 0 ? 800 : 700);
        if (cancelled) return;
        setTyping(false);
        await wait(160);
        if (cancelled) return;
        setVisible(v => [...v, HOOK_MESSAGES[i].id]);
        await wait(900);
      }
      if (cancelled) return;
      await wait(200);
      setShowCta(true);
    })();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visible, typing, showCta]);

  return (
    <div className="hook-chat">
      <div className="hook-grid" aria-hidden="true" />
      <div className="hook-chat-stream" ref={scrollRef}>
        <div className="hook-chat-inner">
          {HOOK_MESSAGES.filter(m => visible.includes(m.id)).map(m => (
            <div key={m.id} className="hook-bubble hook-bubble-in">{m.text}</div>
          ))}
          {typing && (
            <div className="hook-bubble hook-typing" aria-label="Luna is typing">
              <span /><span /><span />
            </div>
          )}
          {showCta && (
            <button className="hook-cta-bubble" onClick={onNext}>
              Let&apos;s go <span className="hook-cta-arrow">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const cleanShopDomain = (input: string): string => {
  let s = (input || '').trim();
  if (!s) return '';
  const adminMatch = s.match(/admin\.shopify\.com\/store\/([^/]+)/);
  if (adminMatch) return `${adminMatch[1]}.myshopify.com`;
  s = s.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return s.endsWith('.myshopify.com') ? s : `${s}.myshopify.com`;
};

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------
type OBState = {
  email: string;
  password: string;
  confirmPassword: string;
  ssoProvider: null | 'google' | 'shopify';
  fullName: string;
  phone: string;
  phoneCode: string;
  brand: string;
  url: string;
  connected: boolean;
  scanning: boolean;
  catalogCount: number;
  igConnected: boolean;
  voice: '' | 'warm' | 'pro' | 'casual';
  aliveProgress: number;
  accountCreated: boolean;
};

const INITIAL_STATE: OBState = {
  email: '',
  password: '',
  confirmPassword: '',
  ssoProvider: null,
  fullName: '',
  phone: '',
  phoneCode: '+971',
  brand: '',
  url: '',
  connected: false,
  scanning: false,
  catalogCount: 0,
  igConnected: false,
  voice: '',
  aliveProgress: 0,
  accountCreated: false,
};

const STATE_KEY = 'krew_ob_state';
const IDX_KEY = 'krew_ob_idx';

// -----------------------------------------------------------------------------
// Step shape
// -----------------------------------------------------------------------------
type StepCtx = {
  state: OBState;
  set: (patch: Partial<OBState>) => void;
  onNext: () => void;
  signupError: string;
  signupLoading: boolean;
  connecting: boolean;
  connectError: string;
  handleConnectShopify: () => void;
  handleConnectInstagram: () => void;
};

type StepDef = {
  id: string;
  label: string;
  phase: 'account' | 'luna';
  progressVisible: boolean;
  luna: (s: OBState) => { state: LunaState; line: string };
  valid: (s: OBState) => boolean;
  hasFooter: boolean;
  render: (ctx: StepCtx) => ReactNode;
};

// Step 0 — Signup (email/password + SSO)
const StepSignup: StepDef = {
  id: 'signup',
  label: 'Sign up',
  phase: 'account',
  progressVisible: false,
  luna: () => ({ state: 'idle', line: 'Before we meet — one account.' }),
  valid: ({ email, password, confirmPassword, ssoProvider }) =>
    !!ssoProvider || (
      /\S+@\S+\.\S+/.test(email || '') &&
      (password || '').length >= 8 &&
      password === confirmPassword
    ),
  hasFooter: true,
  render: (ctx) => <StepSignupForm {...ctx} />,
};

function StepSignupForm({ state, set, signupError }: StepCtx) {
  const passwordMismatch =
    (state.confirmPassword || '').length > 0 && state.password !== state.confirmPassword;

  return (
    <div className="form-screen signup-screen">
      <div className="form-head">
        <h2 className="form-title ds-h1-mixed">
          <span className="emph">Create</span>{' '}
          <span className="rest">your Krew account.</span>
        </h2>
        <p className="ds-body form-sub">Takes 20 seconds. One login for Luna and every Krew agent.</p>
      </div>
      <div className="sso-row">
        <button
          type="button"
          className={`sso-btn ${state.ssoProvider === 'google' ? 'selected' : ''}`}
          onClick={() => set({ ssoProvider: state.ssoProvider === 'google' ? null : 'google' })}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="sso-icon">
            <path d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.3-.9 2.3-2 3v2.5h3.2c1.9-1.7 3.1-4.3 3.1-7.3z" fill="currentColor" opacity="0.9" />
            <path d="M12 22c2.7 0 5-.9 6.7-2.5l-3.2-2.5c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.6C4.6 19.7 8 22 12 22z" fill="currentColor" opacity="0.7" />
            <path d="M6.2 13.7c-.2-.6-.3-1.2-.3-1.7s.1-1.1.3-1.7V7.7H2.9C2.3 9 2 10.4 2 12s.3 3 .9 4.3l3.3-2.6z" fill="currentColor" opacity="0.5" />
            <path d="M12 5.8c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 2.9 14.7 2 12 2 8 2 4.6 4.3 2.9 7.7L6.2 10.3c.8-2.5 3.1-4.5 5.8-4.5z" fill="currentColor" opacity="0.85" />
          </svg>
          <span>Continue with Google</span>
          {state.ssoProvider === 'google' && <IconCheck size={12} sw={2.2} />}
        </button>
      </div>
      <div className="or-divider">or</div>
      <div className="form-fields signup-fields">
        <label className="field">
          <span className="field-lbl">Work email</span>
          <input
            type="email"
            className="field-input"
            placeholder="you@brand.com"
            value={state.email}
            onChange={(e) => set({ email: e.target.value, ssoProvider: null })}
          />
        </label>
        <label className="field">
          <span className="field-lbl">Password</span>
          <input
            type="password"
            className="field-input"
            placeholder="8+ characters"
            value={state.password}
            onChange={(e) => set({ password: e.target.value, ssoProvider: null })}
          />
        </label>
        <label className="field">
          <span className="field-lbl">Confirm password</span>
          <input
            type="password"
            className={`field-input${passwordMismatch ? ' field-input-error' : ''}`}
            placeholder="Repeat your password"
            value={state.confirmPassword}
            onChange={(e) => set({ confirmPassword: e.target.value, ssoProvider: null })}
          />
          {passwordMismatch && (
            <span className="field-error">Passwords don&apos;t match</span>
          )}
        </label>
      </div>
      {signupError && <div className="signup-error">{signupError}</div>}
      <div className="signup-foot">
        <span className="ds-caption">
          By continuing you agree to the{' '}
          <Link href="/terms" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px' }}>terms</Link>
          {' '}&amp;{' '}
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px' }}>privacy policy</Link>.
        </span>
      </div>
      <div className="signup-switch">
        Already have an account?{' '}
        <Link href="/auth/login">Log in</Link>
      </div>
    </div>
  );
}

// Step 1 — Name + Phone
const StepNamePhone: StepDef = {
  id: 'name',
  label: 'About you',
  phase: 'account',
  progressVisible: false,
  luna: ({ fullName }) => {
    const first = (fullName || '').trim().split(/\s+/)[0];
    return first
      ? { state: 'idle', line: `Good to meet you, ${first}.` }
      : { state: 'idle', line: 'A couple of basics before we go.' };
  },
  valid: ({ fullName, phone }) =>
    (fullName || '').trim().length >= 2 && (phone || '').replace(/\D/g, '').length >= 7,
  hasFooter: true,
  render: ({ state, set }) => {
    const code = state.phoneCode || '+971';
    return (
      <div className="form-screen">
        <div className="form-head">
          <div className="ds-eyebrow">Account · 02 of 02</div>
          <h2 className="form-title ds-h1-mixed">
            <span className="emph">A little</span>{' '}
            <span className="rest">about you.</span>
          </h2>
          <p className="ds-body form-sub">So we can welcome you properly — and keep your account safe.</p>
        </div>
        <div className="form-fields">
          <label className="field">
            <span className="field-lbl">Full name</span>
            <input
              className="field-input"
              placeholder="Layla Haddad"
              value={state.fullName}
              onChange={(e) => set({ fullName: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-lbl">Phone · for account security</span>
            <div className="field-compound phone-compound">
              <select
                className="phone-code"
                value={code}
                onChange={(e) => set({ phoneCode: e.target.value })}
              >
                {COUNTRY_CODES.map((cc) => (
                  <option key={cc.c} value={cc.c}>{cc.f} {cc.c}</option>
                ))}
              </select>
              <input
                type="tel"
                className="field-input"
                placeholder="50 123 4567"
                value={state.phone}
                onChange={(e) => set({ phone: e.target.value })}
              />
            </div>
          </label>
        </div>
        <div className="signup-foot">
          <span className="ds-caption">
            Your number stays private — it&apos;s only used for sign-in security, never shown to customers.
          </span>
        </div>
      </div>
    );
  },
};

// Step 2 — Hook (intro chat)
const StepHook: StepDef = {
  id: 'hook',
  label: 'Welcome',
  phase: 'luna',
  progressVisible: false,
  luna: () => ({ state: 'idle', line: '' }),
  valid: () => true,
  hasFooter: false,
  render: ({ onNext }) => <HookChat onNext={onNext} />,
};

// Step 3 — Brand (name + Shopify URL)
const StepBrand: StepDef = {
  id: 'brand',
  label: 'Your brand',
  phase: 'luna',
  progressVisible: true,
  luna: ({ brand }) =>
    brand
      ? { state: 'idle', line: `Nice to meet you, ${brand}.` }
      : { state: 'idle', line: 'What should I call your store?' },
  valid: ({ brand }) =>
    (brand || '').trim().length >= 2,
  hasFooter: true,
  render: ({ state, set, signupError }) => (
    <div className="form-screen">
      <div className="form-head">
        <div className="ds-eyebrow">Step 01 — Your brand</div>
        <h2 className="form-title ds-h1-mixed">
          <span className="emph">First,</span> <span className="rest">who are you?</span>
        </h2>
        <p className="ds-body form-sub">Two fields. Same ones Shopify already knows.</p>
      </div>
      <div className="form-fields">
        <label className="field">
          <span className="field-lbl">Store name</span>
          <input
            className="field-input"
            placeholder="Noor Atelier"
            value={state.brand}
            onChange={(e) => set({ brand: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-lbl">Shopify URL <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span></span>
          <div className="field-compound">
            <input
              className="field-input"
              placeholder="noor-atelier"
              value={(state.url || '').replace(/\.myshopify\.com$/, '')}
              onChange={(e) => {
                const val = e.target.value.replace(/\.myshopify\.com$/, '');
                set({ url: val ? val + '.myshopify.com' : '' });
              }}
            />
            <span className="field-suffix">.myshopify.com</span>
          </div>
        </label>
      </div>
      {signupError && <div className="signup-error">{signupError}</div>}
    </div>
  ),
};

// Step 4 — Connect Shopify (real OAuth)
const StepConnect: StepDef = {
  id: 'connect',
  label: 'Your store',
  phase: 'luna',
  progressVisible: true,
  luna: ({ connected, scanning }) => {
    if (scanning) return { state: 'typing', line: 'Reading your catalog…' };
    if (connected) return { state: 'idle', line: `I know ${DEMO_CATALOG.length} of your products now.` };
    return { state: 'idle', line: "One click. I'll learn everything from there." };
  },
  valid: ({ connected }) => connected,
  hasFooter: true,
  render: ({ state, connecting, connectError, handleConnectShopify }) => {
    return (
      <div className="form-screen">
        <div className="form-head">
          <div className="ds-eyebrow">Step 02 — Connect your store</div>
          <h2 className="form-title ds-h1-mixed">
            <span className="emph">Connect</span>{' '}
            <span className="rest">your store.</span>
          </h2>
          <p className="ds-body form-sub">
            Read-only OAuth. Products, prices, stock. No write access until you grant it.
          </p>
        </div>
        <div className="shopify-card">
          <div className="shop-head">
            <div className="shop-logo"><IconShopify size={22} sw={1.8} /></div>
            <div>
              <div className="shop-name">{state.brand || 'Your store'}</div>
              <div className="shop-url">{state.url || 'your-store.myshopify.com'}</div>
            </div>
            {state.connected && (
              <div className="shop-status">
                <span className="dot" /> Connected
              </div>
            )}
          </div>
          {!state.connected && !state.scanning && (
            <>
              <button
                type="button"
                className="ob-btn-primary shop-cta"
                onClick={handleConnectShopify}
                disabled={connecting}
              >
                <IconShopify size={14} sw={1.8} />
                {connecting ? 'Opening Shopify…' : 'Connect with Shopify'}
              </button>
              {connectError && <div className="shop-error">{connectError}</div>}
            </>
          )}
          {(state.scanning || state.connected) && (
            <ScanTerminal done={state.connected} />
          )}
        </div>
      </div>
    );
  },
};

// Scanning terminal animation (cosmetic; triggered after real OAuth succeeds)
function ScanTerminal({ done }: { done: boolean }) {
  const [lines, setLines] = useState<string[]>([]);
  const [count, setCount] = useState(done ? DEMO_CATALOG.length : 0);

  useEffect(() => {
    if (done) {
      setCount(DEMO_CATALOG.length);
      setLines(DEMO_CATALOG.slice(-10));
      return;
    }
    let i = 0;
    const iv = setInterval(() => {
      if (i >= DEMO_CATALOG.length) {
        clearInterval(iv);
        return;
      }
      setLines((L) => [...L.slice(-10), DEMO_CATALOG[i]]);
      setCount(i + 1);
      i++;
    }, 110);
    return () => clearInterval(iv);
  }, [done]);

  return (
    <div className="terminal">
      <div className="term-head">
        <span className="term-dots"><i /><i /><i /></span>
        <span className="term-title">luna · catalog.sync</span>
        <span className="term-count">
          {count.toString().padStart(3, '0')} / {DEMO_CATALOG.length}
        </span>
      </div>
      <div className="term-body">
        <div className="term-line muted"><span className="term-arrow">→</span> connected · reading /products</div>
        {lines.map((l, i) => (
          <div key={i + l} className="term-line fade-in">
            <span className="term-arrow">+</span> {l}
          </div>
        ))}
        {done && (
          <div className="term-line ok">
            <span className="term-arrow">✓</span> sync complete · {DEMO_CATALOG.length} products indexed
          </div>
        )}
      </div>
    </div>
  );
}

// Step 5 — Instagram (real Meta OAuth)
const StepChannels: StepDef = {
  id: 'channels',
  label: 'Instagram',
  phase: 'luna',
  progressVisible: true,
  luna: ({ igConnected }) =>
    igConnected
      ? { state: 'idle', line: "Connected. I'll watch your DMs from here." }
      : { state: 'idle', line: 'Your Instagram inbox — let me in.' },
  valid: () => true,
  hasFooter: true,
  render: ({ state, connecting, connectError, handleConnectInstagram }) => {
    return (
      <div className="form-screen">
        <div className="form-head">
          <div className="ds-eyebrow">Step 03 — Instagram</div>
          <h2 className="form-title ds-h1-mixed">
            <span className="emph">Connect</span>{' '}
            <span className="rest">your Instagram inbox.</span>
          </h2>
          <p className="ds-body form-sub">
            DMs, story replies, comments. One Meta login — you can add WhatsApp later.
          </p>
        </div>
        <div className="ig-card">
          <div className="ig-head">
            <div className="chan-icon ig ig-always"><IconInstagram size={20} sw={1.6} /></div>
            <div>
              <div className="chan-name">
                {state.brand ? `@${state.brand.toLowerCase().replace(/\s+/g, '')}` : '@your-handle'}
              </div>
              <div className="chan-sub">Instagram Business · DMs + comments</div>
            </div>
            {state.igConnected && (
              <div className="shop-status">
                <span className="dot" /> Connected
              </div>
            )}
          </div>
          {!state.igConnected && (
            <>
              <button
                type="button"
                className="ob-btn-primary shop-cta"
                onClick={handleConnectInstagram}
                disabled={connecting}
              >
                <IconInstagram size={14} sw={1.8} />
                {connecting ? 'Opening Meta…' : 'Connect with Meta'}
              </button>
              {connectError && <div className="shop-error">{connectError}</div>}
            </>
          )}
        </div>
        {state.igConnected && (
          <div className="chan-preview">
            <div className="chan-preview-head">
              <div className="ds-eyebrow">Preview · how I&apos;ll reply</div>
            </div>
            <div className="dm-preview">
              <div className="dm-head">
                <div className="dm-av ig-ring">
                  <div className="dm-av-inner">{(state.brand || 'N')[0].toUpperCase()}</div>
                </div>
                <div className="dm-head-text">
                  <div className="dm-name">{state.brand || 'Your store'}</div>
                  <div className="dm-sub">Instagram · active now</div>
                </div>
              </div>
              <div className="dm-body">
                <div className="bubble b-in">hey! do you ship to Kuwait?</div>
                <div className="bubble b-out">
                  yes — flat 35 AED to Kuwait, 2-4 business days 📦 want me to hold a cart for you?
                </div>
                <div className="bubble b-in">yes please, the kohl liner</div>
                <div className="bubble b-out">done. cart link coming to your inbox ✨</div>
                <div className="dm-meta">replied in ~0s · by Luna</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
};

// Step 6 — Voice
const StepVoice: StepDef = {
  id: 'voice',
  label: 'Voice',
  phase: 'luna',
  progressVisible: true,
  luna: ({ voice }) => {
    if (!voice) return { state: 'idle', line: 'How should I sound with your customers?' };
    return {
      state: 'idle',
      line: {
        warm: "Warm it is. I'll lead with care.",
        pro: 'Professional. Short sentences, no filler.',
        casual: "عامية · I'll keep it close to home.",
      }[voice],
    };
  },
  valid: ({ voice }) => !!voice,
  hasFooter: true,
  render: ({ state, set }) => (
    <div className="form-screen">
      <div className="form-head">
        <div className="ds-eyebrow">Step 04 — Voice</div>
        <h2 className="form-title ds-h1-mixed">
          <span className="emph">Brief me.</span>{' '}
          <span className="rest">How should I sound?</span>
        </h2>
        <p className="ds-body form-sub">You&apos;re not configuring a tool — you&apos;re briefing a teammate.</p>
      </div>
      <div className="voice-list">
        {VOICE_OPTIONS.map((o) => (
          <button
            type="button"
            key={o.key}
            className={`voice-row ${state.voice === o.key ? 'selected' : ''}`}
            onClick={() => set({ voice: o.key as OBState['voice'] })}
          >
            <div className="voice-radio"><span /></div>
            <div className="voice-text">
              <div className="voice-head">{o.head}</div>
              <div className="voice-sample" dir={o.key === 'casual' ? 'rtl' : 'ltr'}>
                &quot;{o.sub}&quot;
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  ),
};

// Step 7 — Alive (final)
const StepAlive: StepDef = {
  id: 'alive',
  label: 'Ready',
  phase: 'luna',
  progressVisible: true,
  luna: ({ aliveProgress }) => {
    if (aliveProgress < 1) return { state: 'thinking', line: 'Almost there…' };
    return { state: 'alive', line: "I'm ready." };
  },
  valid: ({ aliveProgress }) => aliveProgress >= 1,
  hasFooter: true,
  render: ({ state, set }) => {
    return <AliveScreen state={state} set={set} />;
  },
};

function AliveScreen({ state, set }: { state: OBState; set: (patch: Partial<OBState>) => void }) {
  const [prog, setProg] = useState(state.aliveProgress || 0);
  const [stepIdx, setStepIdx] = useState(0);
  const sequence = [
    { t: 'reading catalog', detail: `${DEMO_CATALOG.length} products` },
    { t: 'connecting channels', detail: state.igConnected ? 'Instagram' : 'ready' },
    {
      t: 'tuning voice',
      detail:
        state.voice === 'warm' ? 'friendly & warm' :
        state.voice === 'pro' ? 'professional' :
        state.voice === 'casual' ? 'casual · عامية' : 'ready',
    },
    { t: 'warming up', detail: 'ready to reply' },
  ];

  useEffect(() => {
    if (prog >= 1) return;
    const start = performance.now();
    const duration = 3200;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setProg(p);
      setStepIdx(Math.min(sequence.length - 1, Math.floor(p * sequence.length)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else set({ aliveProgress: 1 });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="alive-screen">
      <div className={`alive-orb ${prog >= 1 ? 'alive' : ''}`}>
        <div className="alive-ring r1" />
        <div className="alive-ring r2" />
        <div className="alive-ring r3" />
        <div className="alive-core">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M15.5 3.5a9 9 0 1 0 5 5 7 7 0 0 1-5-5z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div className="alive-title ds-h1-mixed">
        {prog >= 1 ? (
          <>
            <span className="emph">I&apos;m ready.</span><br />
            <span className="rest">Let&apos;s get to work.</span>
          </>
        ) : (
          <span className="rest">Bringing Luna online…</span>
        )}
      </div>
      <div className="alive-progress">
        <div className="alive-bar">
          <div className="alive-bar-fill" style={{ width: `${prog * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

const ALL_STEPS: StepDef[] = [
  StepSignup,
  StepNamePhone,
  StepHook,
  StepBrand,
  StepChannels,
  StepVoice,
  StepAlive,
];

// -----------------------------------------------------------------------------
// Page component
// -----------------------------------------------------------------------------
export default function SignupPage() {
  return (
    <Suspense fallback={<div className="luna-onboard-root"><div className="luna-onboard-bg" /></div>}>
      <SignupFlow />
    </Suspense>
  );
}

function SignupFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [idx, setIdx] = useState(0);
  const [state, setState] = useState<OBState>(INITIAL_STATE);

  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const signupInFlight = useRef(false);

  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  const [finalLoading, setFinalLoading] = useState(false);

  // Restore persisted state on mount; auto-skip account steps if already signed in
  useEffect(() => {
    let restoredState = INITIAL_STATE;
    let restoredIdx = 0;
    try {
      const rawState = localStorage.getItem(STATE_KEY);
      const rawIdx = localStorage.getItem(IDX_KEY);
      if (rawState) restoredState = { ...INITIAL_STATE, ...JSON.parse(rawState) };
      if (rawIdx) {
        const n = parseInt(rawIdx, 10);
        if (Number.isFinite(n) && n >= 0 && n < ALL_STEPS.length) restoredIdx = n;
      }
    } catch { /* ignore */ }

    // If a token is already present, the Krew account exists — skip account steps.
    if (isLoggedIn()) {
      restoredState = { ...restoredState, accountCreated: true };
      // Hydrate brand/email from user_info if missing
      try {
        const ui = localStorage.getItem('user_info');
        if (ui) {
          const parsed = JSON.parse(ui);
          if (!restoredState.brand && parsed.business_name) restoredState.brand = parsed.business_name;
          if (!restoredState.email && parsed.email) restoredState.email = parsed.email;
          if (!restoredState.fullName && (parsed.first_name || parsed.last_name)) {
            restoredState.fullName = `${parsed.first_name || ''} ${parsed.last_name || ''}`.trim();
          }
        }
      } catch { /* ignore */ }
      // Jump past Signup, NamePhone, Hook to Brand at minimum
      const brandIdx = ALL_STEPS.findIndex(s => s.id === 'brand');
      if (restoredIdx < brandIdx) restoredIdx = brandIdx;
    }

    setState(restoredState);
    setIdx(restoredIdx);
  }, []);

  // Persist on change
  useEffect(() => {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  useEffect(() => {
    try { localStorage.setItem(IDX_KEY, String(idx)); } catch { /* ignore */ }
  }, [idx]);

  // Handle OAuth callbacks (in case backend redirects back with ?shopify=connected etc.)
  useEffect(() => {
    const shopifyParam = searchParams.get('shopify');
    const instagramParam = searchParams.get('instagram');
    if (shopifyParam === 'connected') {
      setState(s => ({ ...s, connected: true, scanning: false, catalogCount: DEMO_CATALOG.length }));
      router.replace(window.location.pathname, { scroll: false });
    }
    if (instagramParam === 'connected') {
      setState(s => ({ ...s, igConnected: true }));
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [searchParams, router]);

  const set = (patch: Partial<OBState>) => setState(s => ({ ...s, ...patch }));

  const step = ALL_STEPS[idx];
  const luna = step.luna(state);
  const visibleSteps = ALL_STEPS.filter(s => s.progressVisible);
  const progressIdx = visibleSteps.findIndex(s => s.id === step.id);
  const progressTotal = visibleSteps.length;

  // Split name into first/last for backend
  const splitName = (fullName: string) => {
    const parts = (fullName || '').trim().split(/\s+/);
    return {
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' ') || parts[0] || '',
    };
  };

  // Signup API — called after Brand step
  const submitSignup = async (): Promise<boolean> => {
    if (state.accountCreated || signupInFlight.current) return true;
    signupInFlight.current = true;
    setSignupError('');
    setSignupLoading(true);
    try {
      const { first_name, last_name } = splitName(state.fullName);
      try {
        await signup({
          email: state.email,
          password: state.password,
          first_name,
          last_name,
          business_name: state.brand,
        });
      } catch (err: any) {
        // If the account was already created (e.g. stale localStorage from a prior session),
        // treat it as success and continue rather than blocking the user.
        const msg: string = err?.message || '';
        if (!msg.toLowerCase().includes('already exists')) {
          setSignupError(msg || 'Unable to create account. Please try again.');
          return false;
        }
      }
      const { first_name: fn, last_name: ln } = splitName(state.fullName);
      const updatedState = { ...state, accountCreated: true };
      localStorage.setItem('user_info', JSON.stringify({
        first_name: fn,
        last_name: ln,
        business_name: state.brand,
        phone_number: `${state.phoneCode} ${state.phone}`.trim(),
        email: state.email,
      }));
      // Persist accountCreated immediately so remounts don't re-trigger signup
      try { localStorage.setItem(STATE_KEY, JSON.stringify(updatedState)); } catch { /* ignore */ }
      setState(updatedState);
      return true;
    } catch (err: any) {
      setSignupError(err?.message || 'Unable to create account. Please try again.');
      return false;
    } finally {
      setSignupLoading(false);
      signupInFlight.current = false;
    }
  };

  // Save onboarding at end (brand_description derived from voice)
  const submitOnboarding = async (): Promise<void> => {
    const selected = VOICE_OPTIONS.find(v => v.key === state.voice);
    const brandDescription = selected
      ? `${state.brand ? state.brand + ' — ' : ''}${selected.brandDescription}`
      : state.brand || '';
    try {
      await saveOnboarding({ brandDescription });
    } catch {
      /* best-effort */
    }
  };

  // Shopify OAuth — popup + poll for connection
  const handleConnectShopify = async () => {
    setConnectError('');
    const domain = cleanShopDomain(state.url);
    if (!domain) { setConnectError('Please enter your Shopify store URL first.'); return; }
    setConnecting(true);
    try {
      const res = await connectShopify(domain);
      if (!res?.oauth_url) throw new Error('Shopify OAuth URL missing from server response.');
      const w = 620, h = 740;
      const y = window.top ? (window.top.outerHeight / 2 + (window.top.screenY ?? 0) - h / 2) : 100;
      const x = window.top ? (window.top.outerWidth / 2 + (window.top.screenX ?? 0) - w / 2) : 100;
      const popup = window.open(
        res.oauth_url,
        'shopify-oauth',
        `width=${w},height=${h},left=${x},top=${y}`
      );
      if (!popup) {
        // Fallback: full redirect if popup was blocked
        window.location.href = res.oauth_url;
        return;
      }
      // Start cosmetic scan as soon as popup is open (user sees immediate feedback on return)
      // Poll both: popup close + shopify status
      let resolved = false;
      const stop = () => { resolved = true; clearInterval(statusIv); clearInterval(closeIv); setConnecting(false); };
      const statusIv = setInterval(async () => {
        if (resolved) return;
        try {
          const st = await getShopifyStatus();
          if (st?.linked) {
            try { popup.close(); } catch { /* ignore */ }
            setState(s => ({ ...s, connected: false, scanning: true }));
            setTimeout(() => {
              setState(s => ({ ...s, connected: true, scanning: false, catalogCount: DEMO_CATALOG.length }));
            }, DEMO_CATALOG.length * 110 + 200);
            stop();
          }
        } catch { /* ignore */ }
      }, 1800);
      const closeIv = setInterval(async () => {
        if (resolved) return;
        if (popup.closed) {
          // One last status check after close
          try {
            const st = await getShopifyStatus();
            if (st?.linked) {
              setState(s => ({ ...s, connected: false, scanning: true }));
              setTimeout(() => {
                setState(s => ({ ...s, connected: true, scanning: false, catalogCount: DEMO_CATALOG.length }));
              }, DEMO_CATALOG.length * 110 + 200);
            } else {
              setConnectError('Shopify connection was not completed. Please try again.');
            }
          } catch {
            setConnectError('Could not verify Shopify connection. Please try again.');
          }
          stop();
        }
      }, 500);
    } catch (err: any) {
      setConnectError(err?.message || 'Failed to start Shopify connection.');
      setConnecting(false);
    }
  };

  // Meta OAuth — popup + poll for connection
  const handleConnectInstagram = async () => {
    setConnectError('');
    setConnecting(true);
    try {
      const token = getToken();
      if (!token) throw new Error('You need to finish signing up first.');
      const userInfo = await getUserInfo();
      const brandId = userInfo?.user?.brand_id || userInfo?.brand_id;
      if (!brandId) throw new Error('Brand account missing. Please restart onboarding.');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://krew-ai-backend-production.up.railway.app';
      const authUrl = `${apiUrl}/auth/instagram?brand_id=${brandId}&token=${token}`;
      const w = 620, h = 740;
      const y = window.top ? (window.top.outerHeight / 2 + (window.top.screenY ?? 0) - h / 2) : 100;
      const x = window.top ? (window.top.outerWidth / 2 + (window.top.screenX ?? 0) - w / 2) : 100;
      const popup = window.open(authUrl, 'ig-oauth', `width=${w},height=${h},left=${x},top=${y}`);
      if (!popup) {
        window.location.href = authUrl;
        return;
      }
      let resolved = false;
      const stop = () => { resolved = true; clearInterval(statusIv); clearInterval(closeIv); setConnecting(false); };
      const statusIv = setInterval(async () => {
        if (resolved) return;
        try {
          const ui = await getUserInfo();
          if (ui?.user?.instagram_connected) {
            try { popup.close(); } catch { /* ignore */ }
            setState(s => ({ ...s, igConnected: true }));
            stop();
          }
        } catch { /* ignore */ }
      }, 1800);
      const closeIv = setInterval(async () => {
        if (resolved) return;
        if (popup.closed) {
          try {
            const ui = await getUserInfo();
            if (ui?.user?.instagram_connected) {
              setState(s => ({ ...s, igConnected: true }));
            } else {
              setConnectError('Instagram connection was not completed. Please try again.');
            }
          } catch {
            setConnectError('Could not verify Instagram connection. Please try again.');
          }
          stop();
        }
      }, 500);
    } catch (err: any) {
      setConnectError(err?.message || 'Failed to start Instagram connection.');
      setConnecting(false);
    }
  };

  // Navigation
  const goNext = async () => {
    setConnectError('');
    setSignupError('');
    const current = ALL_STEPS[idx];
    if (!current.valid(state)) return;

    // At the signup step — check email availability before proceeding
    if (current.id === 'signup' && !state.ssoProvider) {
      setSignupLoading(true);
      try {
        const { exists } = await checkEmail(state.email);
        if (exists) {
          setSignupError('An account with this email already exists. Please log in.');
          return;
        }
      } catch {
        // If the check fails, allow continuing — signup itself will catch duplicates
      } finally {
        setSignupLoading(false);
      }
    }

    // After Brand step — create the Krew account
    if (current.id === 'brand' && !state.accountCreated) {
      const ok = await submitSignup();
      if (!ok) return;
    }

    if (idx < ALL_STEPS.length - 1) {
      setIdx(i => i + 1);
      return;
    }
    // Final step — save onboarding + go to dashboard
    setFinalLoading(true);
    await submitOnboarding();
    // Clear the onboarding scratch state
    try {
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem(IDX_KEY);
    } catch { /* ignore */ }
    setTimeout(() => router.push('/dashboard'), 700);
  };

  const goBack = () => {
    setConnectError('');
    if (idx === 0) return;
    setIdx(i => Math.max(0, i - 1));
  };

  const ctx: StepCtx = {
    state,
    set,
    onNext: goNext,
    signupError,
    signupLoading,
    connecting,
    connectError,
    handleConnectShopify,
    handleConnectInstagram,
  };

  if (finalLoading) {
    return (
      <div className="ob-loading-overlay">
        <div className="ob-loading-spin" />
        <div>
          <div className="ob-loading-title">Building your Krew…</div>
          <div className="ob-loading-sub">Optimizing Luna for your business</div>
        </div>
      </div>
    );
  }

  const continueDisabled = !step.valid(state) || signupLoading || connecting;
  const isLastStep = idx === ALL_STEPS.length - 1;

  return (
    <div className="luna-onboard-root">
      <div className="luna-onboard-bg">
        <div className="luna-onboard-glow glow-1" />
        <div className="luna-onboard-glow glow-2" />
      </div>

      <div className="luna-onboard-stage-outer">
        <div className="luna-onboard-card">
          <div className="ob-shell" data-phase={step.phase}>
            {step.progressVisible && (
              <div className="ob-progress-bar">
                <div className="ob-progress-track">
                  <div
                    className="ob-progress-fill"
                    style={{ width: `${((progressIdx + 1) / progressTotal) * 100}%` }}
                  />
                </div>
                <div className="ob-progress-meta">
                  <span className="ob-brand">
                    <span className="ob-brand-mark">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M15.5 3.5a9 9 0 1 0 5 5 7 7 0 0 1-5-5z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
                      </svg>
                    </span>
                    Luna setup
                  </span>
                  <span className="ob-counter">
                    {String(progressIdx + 1).padStart(2, '0')} <span className="sep">/</span>{' '}
                    {String(progressTotal).padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            <div className={`ob-stage ${step.id === 'hook' ? 'ob-stage-hook' : ''}`} key={step.id}>
              <div className="ob-stage-inner">
                {step.id !== 'hook' && <LunaChip line={luna.line} state={luna.state} />}
                {step.render(ctx)}
              </div>
            </div>

            {step.hasFooter && (
              <div className="ob-footer">
                <div className="ob-foot-nav">
                  <button
                    type="button"
                    className="ob-btn-ghost"
                    onClick={goBack}
                    disabled={idx === 0}
                  >
                    <IconArrowLeft size={12} sw={1.8} /> Back
                  </button>
                  <button
                    type="button"
                    className="ob-btn-primary"
                    onClick={goNext}
                    disabled={continueDisabled}
                  >
                    {signupLoading && step.id === 'signup' ? (
                      <>Checking…</>
                    ) : signupLoading && step.id === 'brand' ? (
                      <>Creating account…</>
                    ) : isLastStep ? (
                      <>Enter dashboard <IconArrowRight size={12} sw={1.8} /></>
                    ) : (
                      <>Continue <IconArrowRight size={12} sw={1.8} /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
