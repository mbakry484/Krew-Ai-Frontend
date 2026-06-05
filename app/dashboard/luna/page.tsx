'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import LunaSidebar from '@/components/LunaSidebar';
import LunaTopBarActions from '@/components/LunaTopBarActions';
import Skeleton from '@/components/Skeleton';
import { getOverviewStats, getOrders, getIntegrationStatus } from '@/lib/api';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
// GET /orders                              → { orders[], total }
// GET /orders/stats                        → { total_orders, total_revenue, pending_orders, completed_orders }
// GET /exchanges-refunds?status=all        → { requests[] }
// GET /conversations?status=all            → { conversations[] }
// GET /integrations/status                 → { shopify: { linked, shop_domain } }
// =============================================================================

const TIME_OPTIONS = ['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 'Last Month'];

interface Order {
  id: string;
  shopify_order_id: string;
  shopify_order_number: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
}

interface OverviewStats {
  orders_from_dms: number;
  return_requests: number;
  refund_requests: number;
  total_conversations: number;
}

export default function LunaOverview() {
  const router = useRouter();
  const [timeLabel, setTimeLabel] = useState('Today');
  const [timeOpen, setTimeOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ first_name: '', last_name: '' });

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [shopDomain, setShopDomain] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
      return;
    }
    const stored = localStorage.getItem('user_info');
    if (stored) setUserInfo(JSON.parse(stored));
  }, [router]);

  // Fetch overview stats on mount
  useEffect(() => {
    if (!isLoggedIn()) return;
    setStatsLoading(true);
    Promise.all([getOverviewStats(), getIntegrationStatus()])
      .then(([overviewData, integrationData]) => {
        setStats(overviewData);
        setShopDomain(integrationData?.shopify?.shop_domain || null);
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  // Close time dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = document.getElementById('time-filter');
      if (el && !el.contains(e.target as Node)) setTimeOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const openOrdersModal = useCallback(async () => {
    setShowOrdersModal(true);
    if (orders.length === 0) {
      setOrdersLoading(true);
      try {
        const data = await getOrders();
        setOrders(data.orders || []);
      } catch {
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    }
  }, [orders.length]);

  const openShopifyOrder = (order: Order) => {
    if (shopDomain && order.shopify_order_id) {
      window.open(`https://${shopDomain}/admin/orders/${order.shopify_order_id}`, '_blank');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const initials = `${userInfo.first_name?.[0] || ''}${userInfo.last_name?.[0] || ''}`.toUpperCase();

  const statCards = [
    {
      label: 'Orders from DMs',
      value: statsLoading ? '—' : String(stats?.orders_from_dms ?? 0),
      clickable: true,
      onClick: openOrdersModal,
      icon: <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"/>,
    },
    {
      label: 'Return Requests',
      value: statsLoading ? '—' : String(stats?.return_requests ?? 0),
      clickable: true,
      onClick: () => router.push('/dashboard/luna/exchanges-refunds'),
      icon: <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>,
    },
    {
      label: 'Refund Requests',
      value: statsLoading ? '—' : String(stats?.refund_requests ?? 0),
      clickable: true,
      onClick: () => router.push('/dashboard/luna/exchanges-refunds'),
      icon: <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    },
    {
      label: 'Total Conversations',
      value: statsLoading ? '—' : String(stats?.total_conversations ?? 0),
      clickable: true,
      onClick: () => router.push('/dashboard/luna/conversations'),
      icon: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 gap-3 p-3 max-md:pt-[60px]">
        <LunaSidebar />

        <main className="flex-1 rounded-2xl border border-border bg-background2 flex flex-col overflow-hidden">

          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 max-md:px-4 pt-6 pb-5 flex-wrap gap-3 border-b border-border shrink-0">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">
                daily support summary
              </h2>
              <p className="text-[0.72rem] text-text-secondary">
                customer support overview and insights
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" id="time-filter">
                <button
                  onClick={() => setTimeOpen(!timeOpen)}
                  className="flex items-center gap-2 bg-background border border-border rounded-[8px] px-3 py-[7px] text-[0.75rem] text-text-secondary hover:border-border-md hover:text-text-primary transition-all duration-200"
                >
                  <span>{timeLabel}</span>
                  <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {timeOpen && (
                  <div className="absolute top-[calc(100%+6px)] right-0 bg-background border border-border-md rounded-[10px] overflow-hidden z-50 min-w-[160px] shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
                    {TIME_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setTimeLabel(opt); setTimeOpen(false); }}
                        className={`block w-full px-4 py-[0.65rem] text-[0.75rem] text-left transition-all duration-150 ${
                          timeLabel === opt ? 'text-text-primary bg-background3' : 'text-text-secondary hover:bg-background3 hover:text-text-primary'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="max-md:hidden"><LunaTopBarActions /></div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-8 py-6 pb-12 flex flex-col gap-6 scrollbar-hide">

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-background3 border border-border rounded-2xl p-[1.2rem]">
                      <div className="flex items-start justify-between mb-[0.9rem]">
                        <Skeleton className="w-4 h-4" />
                      </div>
                      <Skeleton className="w-20 h-[0.55rem] mb-[0.55rem]" />
                      <Skeleton className="w-14 h-8 rounded-[4px]" />
                    </div>
                  ))
                : statCards.map((s) => (
                    <div
                      key={s.label}
                      onClick={s.clickable ? s.onClick : undefined}
                      className={`bg-background3 border border-border rounded-2xl p-[1.2rem] transition-colors duration-200 ${
                        s.clickable
                          ? 'hover:border-border-md cursor-pointer hover:bg-background4'
                          : 'hover:border-border-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-[0.9rem]">
                        <div className="text-text-tertiary">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{s.icon}</svg>
                        </div>
                        {s.clickable && (
                          <svg className="w-[10px] h-[10px] text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M7 17L17 7M17 7H7M17 7v10"/>
                          </svg>
                        )}
                      </div>
                      <div className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary mb-[0.3rem]">{s.label}</div>
                      <div className="text-[1.9rem] font-light tracking-[-0.04em] text-text-primary">
                        {s.value}
                      </div>
                    </div>
                  ))
              }
            </div>

            {/* Bar charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-background3 border border-border rounded-2xl p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Daily Breakdown</div>
                <p className="text-[0.68rem] text-text-secondary mb-4">Conversation volume by hour</p>
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <svg className="w-7 h-7 text-text-tertiary opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M9 17v-2m3 2v-4m3 4v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                  <p className="text-[0.65rem] text-text-tertiary">No data yet</p>
                </div>
              </div>

              <div className="bg-background3 border border-border rounded-2xl p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Monthly Trends</div>
                <p className="text-[0.68rem] text-text-secondary mb-4">Conversations over time</p>
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <svg className="w-7 h-7 text-text-tertiary opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M9 17v-2m3 2v-4m3 4v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                  <p className="text-[0.65rem] text-text-tertiary">No data yet</p>
                </div>
              </div>
            </div>

            {/* Top Issues */}
            <div className="bg-background3 border border-border rounded-2xl p-[1.4rem]">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Top Issues</div>
              <p className="text-[0.68rem] text-text-secondary mb-4">Most common customer concerns</p>
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <svg className="w-8 h-8 text-text-tertiary opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M9 17v-2m3 2v-4m3 4v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                <p className="text-[0.68rem] text-text-tertiary">No issues detected yet</p>
              </div>
            </div>

            {/* Sentiment + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-background3 border border-border rounded-2xl p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Sentiment Analysis</div>
                <p className="text-[0.68rem] text-text-secondary mb-4">Customer mood overview</p>
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <svg className="w-8 h-8 text-text-tertiary opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
                  <p className="text-[0.68rem] text-text-tertiary">No sentiment data yet</p>
                </div>
              </div>

              <div className="bg-background3 border border-border rounded-2xl p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Quick Actions</div>
                <p className="text-[0.68rem] text-text-secondary mb-4">Export and share reports</p>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      label: 'export daily report (pdf/csv)',
                      icon: <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    },
                    {
                      label: 'send summary to email',
                      icon: <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    },
                    {
                      label: 'send to whatsapp',
                      icon: <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    },
                    {
                      label: 'open conversations',
                      icon: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>,
                      onClick: () => router.push('/dashboard/luna/conversations'),
                    },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      className="flex items-center gap-3 bg-transparent border border-border rounded-xl px-4 py-[0.8rem] text-[0.75rem] text-text-secondary hover:border-border-md hover:text-text-primary hover:bg-background4 transition-all duration-150 text-left w-full"
                    >
                      <svg className="w-[14px] h-[14px] shrink-0 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {action.icon}
                      </svg>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Orders Modal */}
      {showOrdersModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
          onClick={(e) => { if (e.target === e.currentTarget) setShowOrdersModal(false); }}
        >
          <div className="bg-background border border-border-md rounded-[14px] w-full max-w-[580px] mx-4 max-h-[80vh] flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <div className="text-[0.85rem] font-medium text-text-primary">Orders from DMs</div>
                <div className="text-[0.68rem] text-text-tertiary mt-[2px]">
                  {ordersLoading ? 'Loading...' : `${orders.length} order${orders.length !== 1 ? 's' : ''} total`}
                </div>
              </div>
              <button
                onClick={() => setShowOrdersModal(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors duration-150 p-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1">
              {ordersLoading ? (
                <div className="flex flex-col gap-[6px] p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[62px] bg-background2 rounded-[8px] animate-pulse" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
                  <svg className="w-8 h-8 mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"/>
                  </svg>
                  <div className="text-[0.78rem]">No orders yet</div>
                </div>
              ) : (
                <div className="flex flex-col gap-[6px] p-4">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => openShopifyOrder(order)}
                      disabled={!shopDomain || !order.shopify_order_id}
                      className="w-full flex items-center gap-4 bg-background2 border border-border rounded-[8px] px-4 py-3 hover:border-border-md hover:bg-background3 transition-all duration-150 text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-[2px]">
                          <span className="text-[0.75rem] text-text-primary font-medium truncate">
                            {order.customer_name || 'Unknown customer'}
                          </span>
                          {order.shopify_order_number && (
                            <span className="text-[0.63rem] text-text-tertiary shrink-0">
                              #{order.shopify_order_number}
                            </span>
                          )}
                        </div>
                        <div className="text-[0.65rem] text-text-tertiary truncate">
                          {order.product_name}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-[2px]">
                        <div className="text-[0.75rem] text-text-primary">
                          {order.currency} {Number(order.price).toLocaleString()}
                        </div>
                        <div className="text-[0.6rem] text-text-tertiary">
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                      {shopDomain && order.shopify_order_id && (
                        <svg className="w-[13px] h-[13px] text-text-tertiary group-hover:text-text-secondary transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
