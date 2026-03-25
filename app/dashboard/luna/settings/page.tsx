'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { connectShopify, getShopifyStatus } from '@/lib/api';
import LunaSidebar from '@/components/LunaSidebar';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState({
    lunaName: 'Luna',
    personality: 'Professional & friendly',
    responseLanguage: 'English',
    escalationThreshold: 'Medium',
    notificationsEnabled: true
  });

  // Shopify connection state
  const [showShopifyModal, setShowShopifyModal] = useState(false);
  const [shopDomain, setShopDomain] = useState('');
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyStoreDomain, setShopifyStoreDomain] = useState('');
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyError, setShopifyError] = useState('');

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
    }
  }, [router]);

  // Function to check Shopify connection status
  const checkShopifyStatus = async () => {
    try {
      const response = await getShopifyStatus();
      // Use 'linked' field from API response
      if (response.linked === true) {
        setShopifyConnected(true);
        setShopifyStoreDomain(response.shop_domain || '');
      } else {
        setShopifyConnected(false);
        setShopifyStoreDomain('');
      }
    } catch (error) {
      // Not connected or error - keep default state
      console.log('Shopify not connected');
      setShopifyConnected(false);
      setShopifyStoreDomain('');
    }
  };

  // Check Shopify connection status on mount
  useEffect(() => {
    if (isLoggedIn()) {
      checkShopifyStatus();
    }
  }, []);

  // Check for Shopify connection success from OAuth redirect
  useEffect(() => {
    const shopifyParam = searchParams.get('shopify');
    if (shopifyParam === 'connected') {
      // Show success toast
      setToastMessage('Shopify connected successfully');
      setShowToast(true);

      // Auto-hide toast after 4 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 4000);

      // Remove query param from URL
      router.replace('/dashboard/luna/settings', { scroll: false });

      // Force refresh integration status
      checkShopifyStatus();
    }
  }, [searchParams, router]);

  const handleChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = () => {
    // In production, save to API
    console.log('Settings saved:', settings);
  };

  const cleanShopDomain = (input: string): string => {
    let cleaned = input.trim();

    // Case 1: https://admin.shopify.com/store/krew-ai/ → extract krew-ai
    const adminMatch = cleaned.match(/admin\.shopify\.com\/store\/([^\/]+)/);
    if (adminMatch) {
      return `${adminMatch[1]}.myshopify.com`;
    }

    // Case 2: https://krew-ai.myshopify.com → strip https://
    cleaned = cleaned.replace(/^https?:\/\//, '');

    // Remove trailing slashes
    cleaned = cleaned.replace(/\/$/, '');

    // Case 3: krew-ai.myshopify.com → use as-is
    if (cleaned.endsWith('.myshopify.com')) {
      return cleaned;
    }

    // Case 4: krew-ai → append .myshopify.com
    return `${cleaned}.myshopify.com`;
  };

  const handleShopifyConnect = async () => {
    if (!shopDomain.trim()) {
      setShopifyError('Please enter a store domain');
      return;
    }

    setShopifyLoading(true);
    setShopifyError('');

    try {
      const cleanedDomain = cleanShopDomain(shopDomain);
      const response = await connectShopify(cleanedDomain);

      // Redirect to Shopify OAuth URL
      if (response.oauth_url) {
        window.location.href = response.oauth_url;
      } else {
        throw new Error('No OAuth URL returned from server');
      }
    } catch (error: any) {
      setShopifyError(error.message || 'Failed to connect to Shopify');
      setShopifyLoading(false);
    }
  };

  const integrations = [
    {
      name: 'Shopify',
      desc: shopifyConnected ? shopifyStoreDomain : 'Sync products and orders',
      status: shopifyConnected ? 'connected' : 'not-connected',
      icon: 'S'
    },
    {
      name: 'Meta',
      desc: 'Connect Instagram & WhatsApp',
      status: 'connected',
      icon: 'M'
    },
    {
      name: 'Bosta',
      desc: 'Track shipments in real-time',
      status: 'not-connected',
      icon: 'B'
    }
  ];

  return (
    <div className="min-h-screen pt-12 flex flex-col">
      <div className="flex flex-1">
        <LunaSidebar />

        <main className="flex-1 overflow-y-auto bg-background2">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 pt-6 pb-0">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.2rem]">
                Settings
              </h2>
              <p className="text-[0.72rem] text-text-secondary">
                Configure Luna & manage integrations
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 pb-12 max-w-2xl">
            {/* Luna Configuration */}
            <div className="bg-background border border-border rounded-[12px] p-[1.4rem] mb-6">
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">
                Luna Configuration
              </h3>
              <p className="text-[0.68rem] text-text-secondary mb-6">
                Customize how Luna responds to customers
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-2 block">
                    Luna's Name
                  </label>
                  <input
                    type="text"
                    value={settings.lunaName}
                    onChange={(e) => handleChange('lunaName', e.target.value)}
                    className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.75rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-2 block">
                    Personality
                  </label>
                  <select
                    value={settings.personality}
                    onChange={(e) => handleChange('personality', e.target.value)}
                    className="w-full bg-input-bg border border-border rounded-[8px] pl-3 pr-10 py-2 text-[0.75rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200 cursor-pointer appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
                    }}
                  >
                    <option value="Professional & friendly">Professional & friendly</option>
                    <option value="Casual & upbeat">Casual & upbeat</option>
                    <option value="Formal & precise">Formal & precise</option>
                  </select>
                </div>

                <div>
                  <label className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-2 block">
                    Response Language
                  </label>
                  <select
                    value={settings.responseLanguage}
                    onChange={(e) => handleChange('responseLanguage', e.target.value)}
                    className="w-full bg-input-bg border border-border rounded-[8px] pl-3 pr-10 py-2 text-[0.75rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200 cursor-pointer appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
                    }}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>

                <div>
                  <label className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-2 block">
                    Escalation Threshold
                  </label>
                  <select
                    value={settings.escalationThreshold}
                    onChange={(e) => handleChange('escalationThreshold', e.target.value)}
                    className="w-full bg-input-bg border border-border rounded-[8px] pl-3 pr-10 py-2 text-[0.75rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200 cursor-pointer appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
                    }}
                  >
                    <option value="Low (escalate often)">Low (escalate often)</option>
                    <option value="Medium (balanced)">Medium (balanced)</option>
                    <option value="High (escalate rarely)">High (escalate rarely)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <label className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary block">
                      Notifications
                    </label>
                    <p className="text-[0.68rem] text-text-secondary">Receive alerts for escalations</p>
                  </div>
                  <button
                    onClick={() => handleChange('notificationsEnabled', !settings.notificationsEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      settings.notificationsEnabled ? 'bg-text-secondary' : 'bg-border'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-background rounded-full transition-transform duration-200 ${
                        settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full mt-6 bg-btn-bg text-btn-text px-4 py-2 rounded-[8px] text-[0.75rem] font-medium hover:opacity-85 transition-opacity duration-200"
              >
                Save settings
              </button>
            </div>

            {/* Integrations */}
            <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">
                Integrations
              </h3>
              <p className="text-[0.68rem] text-text-secondary mb-6">
                Connect external services
              </p>

              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div
                    key={integration.name}
                    className={`flex items-center gap-4 bg-background2 border rounded-[12px] px-[1.3rem] py-[1.1rem] transition-colors duration-[180ms] ${
                      integration.status === 'connected' ? 'border-green-400/30' : 'border-border hover:border-border-md'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-background font-bold text-[1rem] tracking-[-0.02em]">
                      {integration.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-[0.82rem] font-medium text-text-primary mb-[0.15rem]">
                        {integration.name}
                      </div>
                      <div className="text-[0.68rem] text-text-tertiary">
                        {integration.desc}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {integration.status === 'connected' && (
                        <div className="w-[6px] h-[6px] rounded-full bg-green-400 shadow-[0_0_6px_rgba(92,207,143,0.5)]" />
                      )}
                      <button
                        onClick={() => {
                          // Disabled for already connected accounts
                          if (integration.status === 'connected') {
                            return;
                          }

                          // Handle connection based on integration type
                          if (integration.name === 'Shopify') {
                            setShowShopifyModal(true);
                          } else if (integration.name === 'Meta') {
                            // TODO: Implement Meta connection logic
                            console.log('Meta connection not implemented yet');
                          } else if (integration.name === 'Bosta') {
                            // TODO: Implement Bosta connection logic
                            console.log('Bosta connection not implemented yet');
                          }
                        }}
                        disabled={integration.status === 'connected'}
                        className={`flex-shrink-0 rounded-[8px] px-4 py-[7px] text-[0.72rem] font-medium transition-all duration-[180ms] ${
                          integration.status === 'connected'
                            ? 'bg-none text-text-tertiary border border-border opacity-50 cursor-not-allowed'
                            : 'bg-btn-bg text-btn-text hover:opacity-85 cursor-pointer'
                        }`}
                      >
                        {integration.status === 'connected' ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Shopify Connection Modal */}
      {showShopifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-[12px] p-6 w-full max-w-md mx-4">
            <h3 className="text-[0.9rem] font-semibold text-text-primary mb-2">
              Connect Shopify Store
            </h3>
            <p className="text-[0.72rem] text-text-secondary mb-6">
              Enter your Shopify store domain to connect
            </p>

            <div className="mb-4">
              <label className="text-[0.63rem] uppercase tracking-[0.07em] text-text-tertiary mb-2 block">
                Store domain
              </label>
              <input
                type="text"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="your-store.myshopify.com"
                className="w-full bg-input-bg border border-border rounded-[8px] px-3 py-2 text-[0.75rem] text-text-primary outline-none focus:border-border-md transition-colors duration-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleShopifyConnect();
                  }
                }}
              />
            </div>

            {shopifyError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-[8px] text-[0.72rem] text-red-400">
                {shopifyError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowShopifyModal(false);
                  setShopDomain('');
                  setShopifyError('');
                }}
                disabled={shopifyLoading}
                className="flex-1 bg-background2 text-text-secondary border border-border px-4 py-2 rounded-[8px] text-[0.75rem] font-medium hover:border-border-md transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleShopifyConnect}
                disabled={shopifyLoading}
                className="flex-1 bg-btn-bg text-btn-text px-4 py-2 rounded-[8px] text-[0.75rem] font-medium hover:opacity-85 transition-opacity duration-200 disabled:opacity-50"
              >
                {shopifyLoading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-green-500/10 border border-green-500/30 rounded-[12px] px-5 py-3.5 shadow-lg backdrop-blur-sm flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[0.82rem] text-green-400 font-medium">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}