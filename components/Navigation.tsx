'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { isLoggedIn, logout } from '@/lib/auth';

// ─── Shared panel animation classes ──────────────────────────────────────────
const panelVisible  = 'opacity-100 pointer-events-auto translate-y-0';
const panelHidden   = 'opacity-0 pointer-events-none -translate-y-[6px]';
const panelAnim     = 'transition-all duration-[150ms] ease-out';

export default function Navigation() {
  const router   = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dropdownOpen,    setDropdownOpen]    = useState(false);
  const [userInfo,        setUserInfo]        = useState({ first_name: '', last_name: '', email: '' });
  const [scrolled,        setScrolled]        = useState(false);
  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [hoveredMega,     setHoveredMega]     = useState<'agents' | 'about' | null>(null);

  useEffect(() => {
    setIsAuthenticated(isLoggedIn());
    const stored = localStorage.getItem('user_info');
    if (stored) setUserInfo(JSON.parse(stored));
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setDropdownOpen(false);
    router.push('/');
  };

  const isLandingPage = pathname === '/';
  const showNavLinks = isLandingPage || pathname.startsWith('/agents') || pathname.startsWith('/about') || pathname === '/faq' || pathname === '/privacy' || pathname === '/terms';

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
    setHoveredMega(null);
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[200] h-12 flex items-center justify-between px-8 border-b transition-all duration-300 ${
        scrolled || !isLandingPage
          ? 'bg-background border-border backdrop-blur-[20px]'
          : 'bg-transparent border-transparent'
      }`}>

        {/* Logo */}
        <Link href="/" className="text-text-primary cursor-pointer shrink-0 hover:opacity-75 transition-opacity duration-200">
          <svg
            viewBox="665 1125 735 145"
            className="h-[15px] w-auto"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="translate(0,2350) scale(0.1,-0.1)">
              <path d="M8005 11988 c-99 -106 -384 -399 -634 -650 l-454 -458 344 0 344 0 200 200 c110 110 207 200 216 200 9 0 23 -8 32 -18 15 -16 17 -45 17 -200 l0 -182 404 0 404 0 242 243 242 242 -183 3 c-114 1 -187 7 -196 13 -37 32 -20 53 352 424 201 201 365 367 365 370 0 3 -152 5 -338 5 l-338 0 -195 -193 c-107 -107 -201 -196 -210 -200 -22 -7 -59 19 -59 42 0 10 72 90 160 178 88 88 160 163 160 167 0 3 -156 6 -347 6 l-348 0 -180 -192z"/>
              <path d="M9882 12148 c-9 -9 -12 -161 -12 -625 0 -595 1 -613 19 -623 28 -15 104 -12 127 4 18 14 19 26 16 204 -3 164 -1 195 13 224 23 44 168 178 194 178 14 0 76 -79 235 -304 119 -167 223 -307 232 -310 24 -9 147 -7 163 3 22 14 9 37 -145 248 -265 363 -342 472 -348 491 -5 15 42 67 235 255 135 132 239 242 237 249 -3 9 -31 14 -93 16 l-88 3 -296 -296 c-163 -162 -304 -295 -313 -295 -26 0 -30 41 -27 306 2 197 0 256 -10 268 -16 19 -121 22 -139 4z"/>
              <path d="M11285 11816 c-65 -21 -97 -41 -151 -96 -29 -29 -57 -49 -63 -46 -6 4 -11 29 -11 56 0 60 -18 80 -70 80 -73 0 -70 19 -70 -464 0 -323 3 -435 12 -444 16 -16 113 -15 126 1 8 9 12 95 12 249 1 250 10 318 48 380 49 79 112 120 205 133 62 9 77 26 77 81 0 83 -25 98 -115 70z"/>
              <path d="M11730 11816 c-181 -32 -311 -171 -347 -371 -24 -140 6 -298 80 -406 81 -121 203 -174 380 -167 86 3 110 8 153 31 91 46 151 112 180 196 18 52 11 68 -35 76 -56 9 -84 -7 -119 -68 -42 -75 -105 -107 -206 -107 -39 1 -88 7 -109 14 -84 31 -149 108 -166 200 -8 41 -6 51 10 67 18 18 38 19 328 19 263 0 310 2 321 15 17 21 8 132 -19 216 -67 212 -241 322 -451 285z m176 -154 c49 -25 100 -80 125 -136 23 -50 23 -60 3 -80 -13 -14 -49 -16 -243 -16 -254 0 -259 1 -247 63 14 75 85 154 165 184 49 18 146 11 197 -15z"/>
              <path d="M12233 11803 c-28 -11 -18 -48 157 -588 32 -99 66 -206 75 -237 22 -79 34 -88 108 -88 34 0 67 4 73 8 16 10 24 40 105 362 65 263 82 311 101 292 4 -4 43 -148 87 -320 44 -172 85 -320 91 -328 19 -22 132 -19 152 4 9 9 50 125 91 257 42 132 101 319 132 415 59 187 61 200 43 218 -18 18 -93 15 -116 -5 -16 -14 -43 -98 -106 -331 -47 -172 -91 -323 -97 -334 -11 -21 -12 -21 -25 -4 -7 10 -20 48 -28 85 -13 56 -104 412 -137 533 -5 20 -16 44 -25 53 -22 22 -116 20 -142 -2 -16 -14 -37 -86 -91 -306 -39 -158 -71 -292 -71 -298 0 -5 -7 -26 -15 -46 -13 -32 -17 -35 -29 -22 -8 8 -30 75 -51 149 -20 74 -45 164 -55 200 -10 36 -33 119 -50 185 -37 139 -50 155 -119 154 -25 0 -52 -3 -58 -6z"/>
              <path d="M13656 11755 c-41 -22 -55 -44 -56 -90 0 -75 62 -124 134 -104 40 11 76 57 76 97 0 36 -27 80 -60 97 -37 19 -57 19 -94 0z"/>
              <path d="M13665 11705 c-29 -28 -31 -51 -9 -83 20 -29 79 -31 94 -2 12 23 -2 27 -20 5 -18 -21 -37 -19 -54 8 -31 46 14 98 54 62 11 -10 20 -12 24 -6 7 11 -31 41 -52 41 -7 0 -24 -11 -37 -25z"/>
            </g>
          </svg>
        </Link>

        {/* Center mega links — landing + agents/about/faq pages, desktop */}
        {showNavLinks && (
          <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">

            {/* ── Agents ── */}
            {/*
              Hover-bug fix: panels use top-full (no gap between button and panel).
              The panel is a DOM child of the trigger div, so moving the mouse from
              the button into the panel never fires onMouseLeave on the parent.
            */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredMega('agents')}
              onMouseLeave={() => setHoveredMega(null)}
            >
              <button className="flex items-center gap-1 text-[0.75rem] text-text-secondary hover:text-text-primary hover:bg-tag-bg px-[10px] py-[5px] rounded-[6px] tracking-[0.02em] transition-all duration-150">
                Agents
                <svg
                  className={`w-[10px] h-[10px] opacity-50 transition-transform duration-200 ${hoveredMega === 'agents' ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Agents panel — wide 2-column, same style as About */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 w-[500px] bg-dropdown-bg border border-border-md rounded-[16px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.26)] z-50 ${panelAnim} ${hoveredMega === 'agents' ? panelVisible : panelHidden}`}>
                <div className="grid grid-cols-2">

                  {/* Luna */}
                  <button
                    onClick={() => { router.push('/agents/luna'); setHoveredMega(null); }}
                    className="group flex flex-col p-7 text-left hover:bg-background3 transition-colors duration-150 border-r border-border"
                  >
                    <div className="w-[38px] h-[38px] rounded-[10px] bg-background3 border border-border flex items-center justify-center text-text-tertiary group-hover:border-border-md mb-5 transition-colors duration-150">
                      <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 mb-[0.35rem]">
                      <div className="text-[0.82rem] font-semibold text-text-primary tracking-[-0.01em]">Luna</div>
                      <span className="text-[0.5rem] uppercase tracking-[0.07em] px-[5px] py-[2px] rounded border border-[rgba(92,156,110,0.3)] text-[#5c9c6e]">Live</span>
                    </div>
                    <div className="text-[0.68rem] text-text-secondary font-light leading-[1.6]">
                      Customer Operations Agent
                    </div>
                  </button>

                  {/* Ivy — coming soon */}
                  <div className="flex flex-col p-7 opacity-40 cursor-default select-none">
                    <div className="w-[38px] h-[38px] rounded-[10px] bg-background3 border border-border flex items-center justify-center text-text-tertiary mb-5">
                      <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 mb-[0.35rem]">
                      <div className="text-[0.82rem] font-semibold text-text-primary tracking-[-0.01em]">Ivy</div>
                      <span className="text-[0.5rem] uppercase tracking-[0.07em] px-[5px] py-[2px] rounded border border-border text-text-tertiary">Soon</span>
                    </div>
                    <div className="text-[0.68rem] text-text-secondary font-light leading-[1.6]">
                      Financial Visibility
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ── About — Vise-style mega panel ── */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredMega('about')}
              onMouseLeave={() => setHoveredMega(null)}
            >
              <button className="flex items-center gap-1 text-[0.75rem] text-text-secondary hover:text-text-primary hover:bg-tag-bg px-[10px] py-[5px] rounded-[6px] tracking-[0.02em] transition-all duration-150">
                About
                <svg
                  className={`w-[10px] h-[10px] opacity-50 transition-transform duration-200 ${hoveredMega === 'about' ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* About mega panel — wide 2-column Vise-style */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 w-[500px] bg-dropdown-bg border border-border-md rounded-[16px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.26)] z-50 ${panelAnim} ${hoveredMega === 'about' ? panelVisible : panelHidden}`}>

                {/* Two columns */}
                <div className="grid grid-cols-2">

                  {/* Col 1 — Our Vision */}
                  <button
                    onClick={() => { router.push('/about/vision'); setHoveredMega(null); }}
                    className="group flex flex-col p-7 text-left hover:bg-background3 transition-colors duration-150 border-r border-border"
                  >
                    {/* Icon */}
                    <div className="w-[38px] h-[38px] rounded-[10px] bg-background3 border border-border flex items-center justify-center text-text-tertiary group-hover:border-border-md mb-5 transition-colors duration-150">
                      <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      </svg>
                    </div>
                    {/* Label */}
                    <div className="text-[0.82rem] font-semibold text-text-primary mb-[0.35rem] tracking-[-0.01em]">
                      Our Vision
                    </div>
                    {/* Description */}
                    <div className="text-[0.68rem] text-text-secondary font-light leading-[1.6]">
                      The Krew ecosystem and where we're headed
                    </div>
                  </button>

                  {/* Col 2 — How It Works */}
                  <button
                    onClick={() => {
                      setHoveredMega(null);
                      if (isLandingPage) {
                        scrollTo('#products');
                      } else {
                        router.push('/#products');
                      }
                    }}
                    className="group flex flex-col p-7 text-left hover:bg-background3 transition-colors duration-150"
                  >
                    {/* Icon */}
                    <div className="w-[38px] h-[38px] rounded-[10px] bg-background3 border border-border flex items-center justify-center text-text-tertiary group-hover:border-border-md mb-5 transition-colors duration-150">
                      <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                      </svg>
                    </div>
                    {/* Label */}
                    <div className="text-[0.82rem] font-semibold text-text-primary mb-[0.35rem] tracking-[-0.01em]">
                      How It Works
                    </div>
                    {/* Description */}
                    <div className="text-[0.68rem] text-text-secondary font-light leading-[1.6]">
                      How Luna operates inside your business
                    </div>
                  </button>

                </div>
              </div>
            </div>

            {/* ── FAQ ── */}
            <Link
              href="/faq"
              className="text-[0.75rem] text-text-secondary hover:text-text-primary hover:bg-tag-bg px-[10px] py-[5px] rounded-[6px] tracking-[0.02em] transition-all duration-150"
            >
              FAQ
            </Link>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="border border-border rounded-[20px] px-[10px] py-1 flex items-center gap-[5px] text-[0.7rem] text-text-tertiary hover:border-border-md hover:text-text-secondary transition-all duration-200"
          >
            {theme === 'dark' ? (
              <svg className="w-[10px] h-[10px] fill-current" viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            ) : (
              <svg className="w-[10px] h-[10px] fill-current" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1"  x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1"  y1="12" x2="3"  y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
                <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
              </svg>
            )}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* Auth buttons — desktop only */}
          {!isAuthenticated ? (
            <div className="hidden lg:flex gap-[0.6rem]">
              <Link
                href="/auth/login"
                className="text-[0.75rem] px-[14px] py-[6px] rounded-[7px] text-text-secondary border border-border hover:border-border-md hover:text-text-primary transition-all duration-200"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="text-[0.75rem] px-[14px] py-[6px] rounded-[7px] bg-btn-bg text-btn-text font-medium hover:opacity-85 transition-opacity duration-200"
              >
                Get early access
              </Link>
            </div>
          ) : (
            <div className="relative hidden lg:block">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-[30px] h-[30px] rounded-full bg-background3 border border-border-md flex items-center justify-center text-[0.87rem] font-medium text-text-primary hover:border-border-hover transition-colors duration-200"
              >
                {(userInfo.first_name && userInfo.last_name
                  ? (userInfo.first_name[0] + userInfo.last_name[0])
                  : userInfo.first_name
                    ? userInfo.first_name.slice(0, 2)
                    : userInfo.email
                      ? userInfo.email.slice(0, 2)
                      : '?'
                ).toUpperCase()}
              </button>
              <div className={`absolute top-[calc(100%+10px)] right-0 w-[200px] bg-dropdown-bg border border-border-md rounded-[10px] overflow-hidden ${panelAnim} shadow-[0_8px_32px_rgba(0,0,0,0.2)] ${dropdownOpen ? panelVisible : panelHidden}`}>
                <div className="px-4 py-[0.9rem] border-b border-border">
                  <div className="text-[0.78rem] font-medium text-text-primary mb-[1px]">{userInfo.first_name} {userInfo.last_name}</div>
                  <div className="text-[0.68rem] text-text-tertiary">{userInfo.email}</div>
                </div>
                <button
                  onClick={() => { router.push('/dashboard'); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-[0.6rem] px-4 py-[0.7rem] text-[0.75rem] text-text-secondary hover:bg-background3 hover:text-text-primary transition-all duration-150 text-left"
                >
                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  My Krew
                </button>
                <button
                  onClick={() => { router.push('/settings'); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-[0.6rem] px-4 py-[0.7rem] text-[0.75rem] text-text-secondary hover:bg-background3 hover:text-text-primary transition-all duration-150 text-left"
                >
                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Settings
                </button>
                <div className="h-[1px] bg-border" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-[0.6rem] px-4 py-[0.7rem] text-[0.75rem] text-red-400/60 hover:bg-red-500/5 hover:text-red-400/90 transition-all duration-150 text-left"
                >
                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Log out
                </button>
              </div>
            </div>
          )}

          {/* Hamburger — mobile/tablet */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex flex-col justify-center gap-[4.5px] p-[6px] cursor-pointer"
            aria-label="Open menu"
          >
            <span className="block w-[17px] h-[1.5px] bg-text-secondary rounded-[1px]" />
            <span className="block w-[17px] h-[1.5px] bg-text-secondary rounded-[1px]" />
            <span className="block w-[17px] h-[1.5px] bg-text-secondary rounded-[1px]" />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[250] bg-overlay-bg backdrop-blur-[4px] transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <div className={`fixed top-0 right-0 bottom-0 z-[260] w-[275px] bg-background2 border-l border-border-md flex flex-col gap-[0.15rem] overflow-y-auto transition-transform duration-[280ms] ease-in-out ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-end p-4 pb-2">
          <button
            onClick={() => setMobileOpen(false)}
            className="text-text-tertiary text-[1.3rem] leading-none p-1 hover:text-text-primary transition-colors"
          >
            ×
          </button>
        </div>

        <div className="px-3 pb-4 flex flex-col gap-[0.15rem]">
          {/* Agents */}
          <div className="mb-2">
            <div className="text-[0.57rem] uppercase tracking-[0.1em] text-text-tertiary px-[0.7rem] py-[0.25rem] mb-[0.15rem]">Agents</div>
            <button
              onClick={() => { router.push('/agents/luna'); setMobileOpen(false); }}
              className="w-full text-left px-[0.8rem] py-[0.6rem] rounded-[7px] text-[0.78rem] text-text-secondary hover:bg-background3 hover:text-text-primary transition-all duration-150"
            >
              Luna — Customer Operations
            </button>
            <div className="w-full text-left px-[0.8rem] py-[0.6rem] rounded-[7px] text-[0.78rem] text-text-secondary opacity-35 cursor-default">
              Ivy — Financial Visibility
            </div>
          </div>

          {/* About */}
          <div className="mb-2">
            <div className="text-[0.57rem] uppercase tracking-[0.1em] text-text-tertiary px-[0.7rem] py-[0.25rem] mb-[0.15rem]">About</div>
            <button
              onClick={() => { router.push('/about/vision'); setMobileOpen(false); }}
              className="w-full text-left px-[0.8rem] py-[0.6rem] rounded-[7px] text-[0.78rem] text-text-secondary hover:bg-background3 hover:text-text-primary transition-all duration-150"
            >
              Our Vision
            </button>
            <button
              onClick={() => scrollTo('#products')}
              className="w-full text-left px-[0.8rem] py-[0.6rem] rounded-[7px] text-[0.78rem] text-text-secondary hover:bg-background3 hover:text-text-primary transition-all duration-150"
            >
              How It Works
            </button>
          </div>

          <Link
            href="/faq"
            onClick={() => setMobileOpen(false)}
            className="block px-[0.8rem] py-[0.6rem] rounded-[7px] text-[0.78rem] text-text-secondary hover:bg-background3 hover:text-text-primary transition-all duration-150"
          >
            FAQ
          </Link>

          <div className="h-[1px] bg-border my-3" />

          <Link
            href="/auth/login"
            onClick={() => setMobileOpen(false)}
            className="block text-center px-4 py-[9px] rounded-[8px] text-[0.78rem] text-text-secondary border border-border hover:border-border-md hover:text-text-primary transition-all duration-200 mb-2"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            onClick={() => setMobileOpen(false)}
            className="block text-center px-4 py-[9px] rounded-[8px] text-[0.78rem] bg-btn-bg text-btn-text font-medium hover:opacity-85 transition-opacity duration-200"
          >
            Get early access
          </Link>
        </div>
      </div>
    </>
  );
}
