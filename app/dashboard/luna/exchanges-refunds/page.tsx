'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import LunaSidebar from '@/components/LunaSidebar';
import LunaTopBarActions from '@/components/LunaTopBarActions';
import { getExchangesRefunds, updateExchangeRefundStatus } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type RequestType = 'exchange' | 'refund';
type RequestStatus = 'pending' | 'done' | 'dismissed';
type FilterTab = 'all' | RequestStatus;

interface ExchangeRefundRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;
  customer_name: string;
  order_id: string;
  date: string;
  reason: string;
  conversation_id: string | null;
}

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Done', value: 'done' },
];

function StatusBadge({ status }: { status: RequestStatus }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center px-[7px] py-[3px] rounded-full text-[0.6rem] font-[450] bg-[#fef3c7] text-[#b45309]">
        Pending
      </span>
    );
  }
  if (status === 'done') {
    return (
      <span className="inline-flex items-center px-[7px] py-[3px] rounded-full text-[0.6rem] font-[450] bg-[#d4edd9] text-[#16a34a]">
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-[7px] py-[3px] rounded-full text-[0.6rem] font-[450] bg-[#f3f4f6] text-[#6b7280]">
      Dismissed
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface RequestCardProps {
  req: ExchangeRefundRequest;
  onMarkDone: (id: string, type: RequestType) => void;
  onDismiss: (id: string, type: RequestType) => void;
  onOpenConversation: (conversationId: string) => void;
}

function RequestCard({ req, onMarkDone, onDismiss, onOpenConversation }: RequestCardProps) {
  const isPending = req.status === 'pending';
  const [copied, setCopied] = useState(false);
  const cleanId = String(req.order_id).replace(/^#/, '');

  return (
    <div
      className={`bg-background border border-border rounded-[12px] px-5 py-4 transition-all duration-200 hover:border-border-md ${
        req.status === 'dismissed' ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-[0.55rem]">
            <StatusBadge status={req.status} />
          </div>
          <div className="flex items-baseline gap-[0.5rem] mb-[0.25rem] flex-wrap">
            <span className="relative inline-flex items-center">
              <span
                className="text-[0.78rem] font-[450] text-text-primary cursor-pointer hover:text-text-secondary transition-colors duration-150"
                title="Click to copy ID"
                onClick={() => {
                  navigator.clipboard.writeText(cleanId);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                #{cleanId}
              </span>
              <span
                className={`absolute left-[calc(100%+6px)] top-1/2 -translate-y-1/2 text-[0.55rem] font-medium text-text-tertiary bg-background3 border border-border rounded-[6px] px-[6px] py-[2px] whitespace-nowrap pointer-events-none transition-all duration-200 ${
                  copied ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
                }`}
              >
                Copied
              </span>
            </span>
            <span className="font-mono text-[0.65rem] text-text-tertiary">{req.customer_name}</span>
          </div>
          <div className="text-[0.62rem] text-text-tertiary mb-[0.3rem]">{formatDate(req.date)}</div>
          <p className="text-[0.69rem] text-text-secondary leading-[1.5]">{req.reason}</p>
        </div>

        <div className="flex items-start gap-[6px] shrink-0 mt-[1px]">
          {req.conversation_id && (
            <button
              onClick={() => onOpenConversation(req.conversation_id!)}
              title="open conversation"
              style={{ height: isPending ? '62px' : '28px' }}
              className="w-[28px] rounded-[8px] border border-border flex items-center justify-center text-text-tertiary hover:border-border-md hover:text-text-primary hover:bg-background3 transition-all duration-150"
            >
              <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
              </svg>
            </button>
          )}

          {isPending && (
            <div className="flex flex-col gap-[6px]">
              <button
                onClick={() => onMarkDone(req.id, req.type)}
                title="Mark as done"
                className="w-[28px] h-[28px] rounded-[7px] border border-border flex items-center justify-center text-text-tertiary hover:border-[#16a34a]/40 hover:text-[#16a34a] hover:bg-[#d4edd9]/40 transition-all duration-150"
              >
                <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </button>
              <button
                onClick={() => onDismiss(req.id, req.type)}
                title="Dismiss"
                className="w-[28px] h-[28px] rounded-[7px] border border-border flex items-center justify-center text-text-tertiary hover:border-[#e07070]/40 hover:text-[#e07070] hover:bg-[#e07070]/10 transition-all duration-150"
              >
                <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExchangesRefundsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ExchangeRefundRequest[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getExchangesRefunds('all');
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to load exchanges/refunds:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
      return;
    }
    fetchRequests();
  }, [router, fetchRequests]);

  // Realtime: re-fetch when exchanges or refunds are inserted/updated
  useEffect(() => {
    const channel = supabase
      .channel('exchanges-refunds:live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exchanges' }, fetchRequests)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refunds' }, fetchRequests)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchRequests]);

  const markDone = async (id: string, type: RequestType) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'done' } : r));
    try {
      await updateExchangeRefundStatus(type, id, 'done');
    } catch {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'pending' } : r));
    }
  };

  const dismiss = async (id: string, type: RequestType) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'dismissed' } : r));
    try {
      await updateExchangeRefundStatus(type, id, 'dismissed');
    } catch {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'pending' } : r));
    }
  };

  const openConversation = (conversationId: string) => {
    router.push(`/dashboard/luna/conversations?open=${conversationId}`);
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const applyFilter = (list: ExchangeRefundRequest[]) =>
    filter === 'all' ? list : list.filter((r) => r.status === filter);

  const exchanges = applyFilter(requests.filter((r) => r.type === 'exchange'));
  const refunds = applyFilter(requests.filter((r) => r.type === 'refund'));

  const exchangeCount = requests.filter((r) => r.type === 'exchange').length;
  const refundCount = requests.filter((r) => r.type === 'refund').length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <LunaSidebar />

        <main className="flex-1 overflow-y-auto bg-background2 max-md:pt-12">
          <div className="px-8 max-md:px-4 pt-[1.6rem] pb-0 bg-background2">
            <div className="flex items-start justify-between gap-3 mb-[1.1rem]">
              <div>
                <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">
                  exchanges &amp; refunds
                </h2>
                <p className="text-[0.72rem] text-text-secondary">
                  {loading ? 'loading...' : 'manage customer exchange and refund requests'}
                </p>
              </div>
              <div className="max-md:hidden"><LunaTopBarActions /></div>
            </div>

            <div className="flex items-center gap-[5px]">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`flex items-center gap-[5px] px-[10px] py-[5px] rounded-[6px] text-[0.7rem] font-[450] transition-all duration-150 border ${
                    filter === tab.value
                      ? 'bg-text-primary text-background border-text-primary'
                      : 'bg-background border-border text-text-secondary hover:border-border-md hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                  {tab.value === 'pending' && pendingCount > 0 && (
                    <span className={`inline-flex items-center justify-center w-[14px] h-[14px] rounded-full text-[0.52rem] ${
                      filter === 'pending' ? 'bg-background/20 text-background' : 'bg-[#b45309]/15 text-[#b45309]'
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="border-b border-border mt-4" />
          </div>

          <div className="px-8 py-6 pb-12">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-[0.7rem] text-text-tertiary">
                loading...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 items-start">

                {/* Exchanges column */}
                <div>
                  <div className="flex items-center gap-[7px] mb-4">
                    <span className="text-[0.72rem] font-[450] text-text-primary lowercase tracking-[-0.01em]">
                      exchanges
                    </span>
                    <span className="inline-flex items-center px-[7px] py-[2px] rounded-full text-[0.58rem] font-[450] bg-[#dbeafe] text-[#2563eb]">
                      {exchangeCount}
                    </span>
                  </div>
                  {exchanges.length === 0 ? (
                    <div className="flex items-center justify-center h-24 rounded-[12px] border border-border border-dashed">
                      <span className="text-[0.68rem] text-text-tertiary">no exchanges</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[10px]">
                      {exchanges.map((req) => (
                        <RequestCard
                          key={req.id}
                          req={req}
                          onMarkDone={markDone}
                          onDismiss={dismiss}
                          onOpenConversation={openConversation}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Refunds column */}
                <div>
                  <div className="flex items-center gap-[7px] mb-4">
                    <span className="text-[0.72rem] font-[450] text-text-primary lowercase tracking-[-0.01em]">
                      refunds
                    </span>
                    <span className="inline-flex items-center px-[7px] py-[2px] rounded-full text-[0.58rem] font-[450] bg-[#ede9fe] text-[#7c3aed]">
                      {refundCount}
                    </span>
                  </div>
                  {refunds.length === 0 ? (
                    <div className="flex items-center justify-center h-24 rounded-[12px] border border-border border-dashed">
                      <span className="text-[0.68rem] text-text-tertiary">no refunds</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[10px]">
                      {refunds.map((req) => (
                        <RequestCard
                          key={req.id}
                          req={req}
                          onMarkDone={markDone}
                          onDismiss={dismiss}
                          onOpenConversation={openConversation}
                        />
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
