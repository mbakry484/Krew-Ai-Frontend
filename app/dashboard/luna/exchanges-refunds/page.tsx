'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import LunaSidebar from '@/components/LunaSidebar';
import LunaTopBarActions from '@/components/LunaTopBarActions';
import { getExchangesRefunds, updateExchangeRefundStatus } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import Skeleton from '@/components/Skeleton';

type RequestType = 'exchange' | 'refund';
type RequestStatus = 'pending' | 'done' | 'dismissed';
type FilterTab = 'all' | 'pending' | 'exchanges' | 'refunds' | 'done';

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
  { label: 'Exchanges', value: 'exchanges' },
  { label: 'Refunds', value: 'refunds' },
  { label: 'Done', value: 'done' },
];

function StatusBadge({ status }: { status: RequestStatus }) {
  const base = 'inline-flex items-center px-[7px] py-[3px] rounded-full text-[0.6rem] font-[450] border border-border bg-background3';
  if (status === 'pending') return <span className={`${base} text-text-secondary`}>Pending</span>;
  if (status === 'done') return <span className={`${base} text-text-secondary`}>Done</span>;
  return <span className={`${base} text-text-tertiary`}>Dismissed</span>;
}

function formatRelativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
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
  const isDismissed = req.status === 'dismissed';
  const [copied, setCopied] = useState(false);
  const cleanId = String(req.order_id).replace(/^#/, '');

  return (
    <div
      className={`bg-background rounded-[12px] px-5 py-4 transition-all duration-200 hover:border-border-md ${
        isPending
          ? 'border border-border border-l-2 border-l-border-md'
          : 'border border-border'
      } ${isDismissed ? 'opacity-50' : ''}`}
    >
      {/* Top row: order id · customer · date · type tag (mobile) · status */}
      <div className="flex items-center justify-between gap-3 mb-[0.6rem]">
        <div className="flex items-center gap-[0.5rem] flex-wrap min-w-0">
          <span
            className="relative text-[0.78rem] font-[450] text-text-primary cursor-pointer hover:text-text-secondary transition-colors duration-150"
            title="Click to copy ID"
            onClick={() => {
              navigator.clipboard.writeText(cleanId);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            #{cleanId}
            <span
              className={`absolute left-[calc(100%+6px)] top-1/2 -translate-y-1/2 text-[0.55rem] font-medium text-text-tertiary bg-background3 border border-border rounded-[6px] px-[6px] py-[2px] whitespace-nowrap pointer-events-none transition-all duration-200 ${
                copied ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
              }`}
            >
              Copied
            </span>
          </span>
          <span className="font-mono text-[0.65rem] text-text-tertiary truncate">{req.customer_name}</span>
          <span className="text-[0.62rem] text-text-tertiary">{formatRelativeDate(req.date)}</span>
          <span className="md:hidden inline-flex items-center px-[6px] py-[2px] rounded-[5px] text-[0.55rem] font-[450] bg-background3 border border-border text-text-tertiary uppercase tracking-[0.06em]">
            {req.type}
          </span>
        </div>
        <StatusBadge status={req.status} />
      </div>

      {/* Message block */}
      <div className="bg-background3 rounded-[8px] px-[0.75rem] py-[0.55rem] mb-[0.75rem]">
        <p className="text-[0.69rem] text-text-secondary leading-[1.5]">{req.reason}</p>
      </div>

      {/* Actions */}
      {!isDismissed && (
        <div className="flex items-center justify-end gap-[6px] max-md:flex-col max-md:items-stretch">
          {req.conversation_id && (
            <button
              onClick={() => onOpenConversation(req.conversation_id!)}
              className="flex items-center justify-center gap-[5px] px-[10px] py-[5px] rounded-[7px] text-[0.68rem] font-[450] border border-border text-text-tertiary bg-background hover:border-border-md hover:text-text-secondary transition-all duration-150"
            >
              <svg className="w-[11px] h-[11px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
              </svg>
              View convo
            </button>
          )}

          {isPending && (
            <div className="flex items-center gap-[6px] max-md:w-full">
              <button
                onClick={() => onDismiss(req.id, req.type)}
                className="flex flex-1 items-center justify-center gap-[5px] px-[10px] py-[5px] rounded-[7px] text-[0.68rem] font-[450] border border-border text-text-tertiary bg-background hover:border-red-500/40 hover:text-red-500 hover:bg-red-500/5 transition-all duration-150"
              >
                <svg className="w-[10px] h-[10px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                Dismiss
              </button>
              <button
                onClick={() => onMarkDone(req.id, req.type)}
                className="flex flex-1 items-center justify-center gap-[5px] px-[10px] py-[5px] rounded-[7px] text-[0.68rem] font-[450] border border-border text-text-tertiary bg-background hover:border-green-600/40 hover:text-green-600 hover:bg-green-600/5 transition-all duration-150"
              >
                <svg className="w-[10px] h-[10px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Approve
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-[0.4rem]">
      <svg className="w-[18px] h-[18px] text-text-tertiary mb-[2px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      <span className="text-[0.68rem] text-text-tertiary">{message}</span>
    </div>
  );
}

function SkeletonColumn() {
  return (
    <div>
      <div className="flex items-center gap-[7px] mb-4">
        <Skeleton className="w-20 h-[0.6rem]" />
        <Skeleton className="w-[22px] h-[1rem] rounded-full" />
      </div>
      <div className="flex flex-col gap-[10px]">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-background border border-border rounded-[12px] px-5 py-4">
            <div className="flex items-center justify-between gap-3 mb-[0.6rem]">
              <div className="flex items-center gap-[0.5rem]">
                <Skeleton className="w-14 h-[0.65rem]" />
                <Skeleton className="w-20 h-[0.55rem]" />
                <Skeleton className="w-10 h-[0.55rem]" />
              </div>
              <Skeleton className="w-[52px] h-[1.1rem] rounded-full" />
            </div>
            <Skeleton className="w-full h-[2.2rem] rounded-[8px] mb-[0.75rem]" />
            <div className="flex justify-end gap-[6px]">
              <Skeleton className="w-[78px] h-[26px] rounded-[7px]" />
              <Skeleton className="w-[70px] h-[26px] rounded-[7px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 items-start max-md:grid-cols-1">
      <SkeletonColumn />
      <SkeletonColumn />
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

  const getFiltered = (type: RequestType): ExchangeRefundRequest[] =>
    requests.filter((r) => {
      if (r.type !== type) return false;
      if (filter === 'pending') return r.status === 'pending';
      if (filter === 'done') return r.status === 'done';
      return true;
    });

  const showExchanges = filter !== 'refunds';
  const showRefunds = filter !== 'exchanges';
  const filteredExchanges = showExchanges ? getFiltered('exchange') : [];
  const filteredRefunds = showRefunds ? getFiltered('refund') : [];

  const bothVisible = showExchanges && showRefunds;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 gap-3 p-3 max-md:pt-[60px]">
        <LunaSidebar />

        <main className="flex-1 rounded-2xl border border-border overflow-y-auto bg-background2">
          {/* Header */}
          <div className="px-8 max-md:px-4 pt-6 pb-0">
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

            {/* Filter pills */}
            <div className="flex items-center gap-[5px] overflow-x-auto pb-[2px]">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`flex shrink-0 items-center gap-[5px] px-[10px] py-[5px] rounded-[6px] text-[0.7rem] font-[450] transition-all duration-150 border ${
                    filter === tab.value
                      ? 'bg-text-primary text-background border-text-primary'
                      : 'bg-background border-border text-text-secondary hover:border-border-md hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                  {tab.value === 'pending' && pendingCount > 0 && (
                    <span className={`inline-flex items-center justify-center w-[14px] h-[14px] rounded-full text-[0.52rem] ${
                      filter === 'pending'
                        ? 'bg-background/20 text-background'
                        : 'bg-background3 text-text-tertiary'
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="border-b border-border mt-4" />
          </div>

          {/* Content */}
          <div className="px-8 max-md:px-4 py-6 pb-12">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <div className={`grid gap-5 items-start ${bothVisible ? 'grid-cols-2 max-md:grid-cols-1' : 'grid-cols-1'}`}>

                {/* Exchanges column */}
                {showExchanges && (
                  <div>
                    <div className="flex items-center gap-[7px] mb-4">
                      <span className="text-[0.72rem] font-[450] text-text-primary lowercase tracking-[-0.01em]">
                        exchanges
                      </span>
                      <span className="inline-flex items-center justify-center px-[7px] py-[2px] rounded-full text-[0.58rem] font-[450] bg-background3 border border-border text-text-tertiary">
                        {filteredExchanges.length}
                      </span>
                    </div>
                    {filteredExchanges.length === 0 ? (
                      <SectionEmptyState message="no exchanges" />
                    ) : (
                      <div className="flex flex-col gap-[10px]">
                        {filteredExchanges.map((req) => (
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
                )}

                {/* Refunds column */}
                {showRefunds && (
                  <div>
                    <div className="flex items-center gap-[7px] mb-4">
                      <span className="text-[0.72rem] font-[450] text-text-primary lowercase tracking-[-0.01em]">
                        refunds
                      </span>
                      <span className="inline-flex items-center justify-center px-[7px] py-[2px] rounded-full text-[0.58rem] font-[450] bg-background3 border border-border text-text-tertiary">
                        {filteredRefunds.length}
                      </span>
                    </div>
                    {filteredRefunds.length === 0 ? (
                      <SectionEmptyState message="no refunds" />
                    ) : (
                      <div className="flex flex-col gap-[10px]">
                        {filteredRefunds.map((req) => (
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
                )}

                {/* Empty state when a type-only filter has no matches */}
                {!showExchanges && !showRefunds && (
                  <SectionEmptyState message="no requests match this filter" />
                )}

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
