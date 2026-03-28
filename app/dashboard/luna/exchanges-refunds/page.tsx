'use client';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
//
// GET /api/luna/exchanges-refunds?status=all|pending|done|dismissed
//   Returns list of exchange and refund requests.
//   Response:
//   {
//     "requests": [
//       {
//         "id": "string",
//         "type": "exchange" | "refund",
//         "status": "pending" | "done" | "dismissed",
//         "customer_name": "string",         // e.g. "Sarah M."
//         "order_id": "string",              // e.g. "#ORD-4821"
//         "date": "string",                  // ISO date string e.g. "2024-03-15"
//         "reason": "string",                // e.g. "Wrong size received"
//         "conversation_id": "string"        // Linked conversation ID — set at creation time
//                                            // when Luna detects exchange/refund intent
//       }
//     ]
//   }
//
// PATCH /api/luna/exchanges-refunds/:id/status
//   Update the status of a specific request (mark as done or dismissed).
//   Body: { "status": "done" | "dismissed" }
//   Returns: { "success": boolean, "request": { id, status } }
//
// GET /api/luna/exchanges-refunds/:id/conversation
//   Called when the user clicks the chat bubble on a request card.
//   Returns the conversation data needed for the Conversations tab to open
//   and highlight the correct thread.
//
//   IMPORTANT (creation-time requirement):
//   When Luna detects an exchange or refund intent in a conversation, it MUST
//   save the linked conversation_id on the request record at creation time.
//   This field cannot be backfilled later and must be present for the chat
//   button to function.
//
//   Response:
//   {
//     "conversation_id": "string",          // ID to pass to the Conversations tab
//     "customer_name": "string",
//     "handle": "string",
//     "platform": "instagram" | "whatsapp",
//     "status": "resolved" | "escalated" | "pending"
//   }
//
//   Frontend behaviour:
//   On success, navigates to /dashboard/luna/conversations?open=<conversation_id>
//   The Conversations page reads the `open` query param on mount and sets
//   the initially selected conversation thread.
//
// =============================================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import LunaSidebar from '@/components/LunaSidebar';

type RequestType = 'exchange' | 'refund';
type RequestStatus = 'pending' | 'done' | 'dismissed';

interface ExchangeRefundRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;
  customer_name: string;
  order_id: string;
  date: string;
  reason: string;
  conversation_id: string;
}

type FilterTab = 'all' | RequestStatus;

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Done', value: 'done' },
];

const MOCK_REQUESTS: ExchangeRefundRequest[] = [
  {
    id: '1',
    type: 'exchange',
    status: 'pending',
    customer_name: 'Sarah M.',
    order_id: '#ORD-4821',
    date: '2024-03-24',
    reason: 'Wrong size received — ordered L, got M',
    conversation_id: 'conv_001',
  },
  {
    id: '2',
    type: 'refund',
    status: 'pending',
    customer_name: 'Carlos D.',
    order_id: '#ORD-4793',
    date: '2024-03-23',
    reason: 'Package arrived damaged, item unusable',
    conversation_id: 'conv_002',
  },
  {
    id: '3',
    type: 'refund',
    status: 'done',
    customer_name: 'Emma L.',
    order_id: '#ORD-4760',
    date: '2024-03-21',
    reason: 'Color mismatch — ordered black, received navy',
    conversation_id: 'conv_003',
  },
  {
    id: '4',
    type: 'exchange',
    status: 'pending',
    customer_name: 'Nour A.',
    order_id: '#ORD-4748',
    date: '2024-03-20',
    reason: 'Item defective — zipper broken on arrival',
    conversation_id: 'conv_004',
  },
  {
    id: '5',
    type: 'refund',
    status: 'dismissed',
    customer_name: 'Mike R.',
    order_id: '#ORD-4712',
    date: '2024-03-18',
    reason: 'Changed mind after delivery — outside return window',
    conversation_id: 'conv_005',
  },
  {
    id: '6',
    type: 'exchange',
    status: 'done',
    customer_name: 'James K.',
    order_id: '#ORD-4698',
    date: '2024-03-17',
    reason: 'Sizing issue — product runs small per feedback',
    conversation_id: 'conv_006',
  },
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
  onMarkDone: (id: string) => void;
  onDismiss: (id: string) => void;
  onOpenConversation: (conversationId: string) => void;
}

function RequestCard({ req, onMarkDone, onDismiss, onOpenConversation }: RequestCardProps) {
  // When pending: chat button height = ✓ height + gap + ✗ height = 28 + 6 + 28 = 62px
  // When not pending: chat button is a normal square
  const isPending = req.status === 'pending';

  return (
    <div
      className={`bg-background border border-border rounded-[12px] px-5 py-4 transition-all duration-200 hover:border-border-md ${
        req.status === 'dismissed' ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">

        {/* Left: info */}
        <div className="flex-1 min-w-0">
          {/* Status badge */}
          <div className="mb-[0.55rem]">
            <StatusBadge status={req.status} />
          </div>

          {/* Customer name + order ID */}
          <div className="flex items-baseline gap-[0.5rem] mb-[0.25rem] flex-wrap">
            <span className="text-[0.78rem] font-[450] text-text-primary">
              {req.customer_name}
            </span>
            <span className="font-mono text-[0.65rem] text-text-tertiary">
              {req.order_id}
            </span>
          </div>

          {/* Date */}
          <div className="text-[0.62rem] text-text-tertiary mb-[0.3rem]">
            {formatDate(req.date)}
          </div>

          {/* Reason */}
          <p className="text-[0.69rem] text-text-secondary leading-[1.5]">
            {req.reason}
          </p>
        </div>

        {/* Right: actions */}
        <div className="flex items-start gap-[6px] shrink-0 mt-[1px]">

          {/* Chat bubble — always visible, tall when pending to match stacked buttons */}
          <button
            onClick={() => onOpenConversation(req.conversation_id)}
            title="open conversation"
            style={{ height: isPending ? '62px' : '28px' }}
            className="w-[28px] rounded-[8px] border border-border flex items-center justify-center text-text-tertiary hover:border-border-md hover:text-text-primary hover:bg-background3 transition-all duration-150"
          >
            <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
          </button>

          {/* ✓ Mark as done + ✗ Dismiss — pending only */}
          {isPending && (
            <div className="flex flex-col gap-[6px]">
              <button
                onClick={() => onMarkDone(req.id)}
                title="Mark as done"
                className="w-[28px] h-[28px] rounded-[7px] border border-border flex items-center justify-center text-text-tertiary hover:border-[#16a34a]/40 hover:text-[#16a34a] hover:bg-[#d4edd9]/40 transition-all duration-150"
              >
                <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </button>
              <button
                onClick={() => onDismiss(req.id)}
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
  const [requests, setRequests] = useState<ExchangeRefundRequest[]>(MOCK_REQUESTS);
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
    }
    // API: GET /api/luna/exchanges-refunds?status=all
    // Replace MOCK_REQUESTS with API response
  }, [router]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const applyFilter = (list: ExchangeRefundRequest[]) =>
    filter === 'all' ? list : list.filter((r) => r.status === filter);

  const exchanges = applyFilter(requests.filter((r) => r.type === 'exchange'));
  const refunds = applyFilter(requests.filter((r) => r.type === 'refund'));

  const exchangeCount = requests.filter((r) => r.type === 'exchange').length;
  const refundCount = requests.filter((r) => r.type === 'refund').length;

  const markDone = (id: string) => {
    // API: PATCH /api/luna/exchanges-refunds/:id/status  { status: 'done' }
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'done' } : r)
    );
  };

  const dismiss = (id: string) => {
    // API: PATCH /api/luna/exchanges-refunds/:id/status  { status: 'dismissed' }
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'dismissed' } : r)
    );
  };

  const openConversation = (conversationId: string) => {
    // API: GET /api/luna/exchanges-refunds/:id/conversation
    // Navigates to the Conversations tab with the linked thread pre-selected.
    // The conversations page reads ?open=<id> on mount to set the active thread.
    router.push(`/dashboard/luna/conversations?open=${conversationId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <LunaSidebar />

        <main className="flex-1 overflow-y-auto bg-background2">

          {/* Top Bar */}
          <div className="px-8 pt-[1.6rem] pb-0 bg-background2">
            <div className="mb-[1.1rem]">
              <h2 className="text-[1.25rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">
                exchanges &amp; refunds
              </h2>
              <p className="text-[0.72rem] text-text-secondary">
                manage customer exchange and refund requests
              </p>
            </div>

            {/* Filter tabs */}
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

          {/* Two-column layout */}
          <div className="px-8 py-6 pb-12">
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
          </div>

        </main>
      </div>
    </div>
  );
}
