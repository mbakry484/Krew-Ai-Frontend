'use client';

// =============================================================================
// BACKEND API NOTES (for backend team)
// =============================================================================
//
// GET /api/luna/conversations?status=all|escalated|pending|resolved
//   Returns list of conversations for the inbox.
//   Response:
//   {
//     "conversations": [
//       {
//         "id": "string",
//         "customer_name": "string",           // Display name e.g. "Sarah M."
//         "handle": "string",                  // e.g. "@sarah.style"
//         "platform": "instagram" | "whatsapp",
//         "status": "resolved" | "escalated" | "pending",
//         "last_message": "string",            // Preview of last message
//         "timestamp": "string",               // e.g. "2m ago"
//         "luna_enabled": boolean,             // Whether Luna is currently handling this chat
//         "unread_count": number               // Unread message count
//       }
//     ]
//   }
//
// GET /api/luna/conversations/:id/messages
//   Returns all messages for a specific conversation.
//   Response:
//   {
//     "messages": [
//       {
//         "id": "string",
//         "from": "customer" | "luna" | "agent",
//         "text": "string",
//         "time": "string"                     // e.g. "10:32 AM"
//       }
//     ]
//   }
//
// POST /api/luna/conversations/:id/messages
//   Send a message as the agent (only valid when luna_enabled is false / takeover active).
//   Body: { "text": "string" }
//   Returns: { "message": { id, from: "agent", text, time } }
//
// PATCH /api/luna/conversations/:id/luna
//   Toggle Luna on or off for a specific conversation.
//   Body: { "enabled": boolean }
//   Returns: { "success": boolean, "luna_enabled": boolean }
//
// POST /api/luna/conversations/:id/takeover
//   Agent takes over the conversation from Luna. Sets luna_enabled = false.
//   Body: {} (empty)
//   Returns: { "success": boolean }
//
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import LunaSidebar from '@/components/LunaSidebar';

type Platform = 'instagram' | 'whatsapp';
type Status = 'resolved' | 'escalated' | 'pending';
type MessageFrom = 'customer' | 'luna' | 'agent';

interface Message {
  id: string;
  from: MessageFrom;
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  customer_name: string;
  handle: string;
  platform: Platform;
  status: Status;
  last_message: string;
  timestamp: string;
  luna_enabled: boolean;
  unread_count: number;
  messages: Message[];
}

const FILTER_TABS: { label: string; value: 'all' | Status }[] = [
  { label: 'All', value: 'all' },
  { label: 'Escalated', value: 'escalated' },
  { label: 'Pending', value: 'pending' },
  { label: 'Resolved', value: 'resolved' },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    customer_name: 'Sarah M.',
    handle: '@sarah.style',
    platform: 'instagram',
    status: 'escalated',
    last_message: "I've been waiting 2 weeks for my order!",
    timestamp: '2m ago',
    luna_enabled: true,
    unread_count: 2,
    messages: [
      { id: 'm1', from: 'customer', text: 'Hi, where is my order #1234?', time: '10:28 AM' },
      { id: 'm2', from: 'luna', text: 'Hi Sarah! Let me check that order for you right away.', time: '10:28 AM' },
      { id: 'm3', from: 'customer', text: "It's been 10 days already!", time: '10:29 AM' },
      { id: 'm4', from: 'luna', text: 'I understand your frustration. Your order is currently in transit and should arrive by tomorrow.', time: '10:29 AM' },
      { id: 'm5', from: 'customer', text: "I've been waiting 2 weeks for my order!", time: '10:31 AM' },
    ],
  },
  {
    id: '2',
    customer_name: 'Mike R.',
    handle: '@mike.runs',
    platform: 'whatsapp',
    status: 'pending',
    last_message: 'Do you have the blue one in size L?',
    timestamp: '8m ago',
    luna_enabled: true,
    unread_count: 1,
    messages: [
      { id: 'm1', from: 'customer', text: 'Hey, do you have the blue hoodie in size L?', time: '10:20 AM' },
      { id: 'm2', from: 'luna', text: 'Hi Mike! Let me check our inventory for you.', time: '10:20 AM' },
      { id: 'm3', from: 'customer', text: 'Do you have the blue one in size L?', time: '10:22 AM' },
    ],
  },
  {
    id: '3',
    customer_name: 'Emma L.',
    handle: '@emma.looks',
    platform: 'instagram',
    status: 'pending',
    last_message: 'I want to return my order, it was the wrong color.',
    timestamp: '15m ago',
    luna_enabled: false,
    unread_count: 0,
    messages: [
      { id: 'm1', from: 'customer', text: 'I received my order but it was the wrong color.', time: '10:05 AM' },
      { id: 'm2', from: 'luna', text: 'I\'m so sorry about that Emma! I can help you with a return.', time: '10:05 AM' },
      { id: 'm3', from: 'agent', text: 'Hi Emma, I\'ve taken over to personally assist you. I\'ll arrange a free return pickup for tomorrow.', time: '10:08 AM' },
      { id: 'm4', from: 'customer', text: 'I want to return my order, it was the wrong color.', time: '10:10 AM' },
    ],
  },
  {
    id: '4',
    customer_name: 'James K.',
    handle: '@james.k',
    platform: 'whatsapp',
    status: 'resolved',
    last_message: 'Thanks! That was super helpful.',
    timestamp: '1h ago',
    luna_enabled: true,
    unread_count: 0,
    messages: [
      { id: 'm1', from: 'customer', text: 'What are your shipping options?', time: '9:00 AM' },
      { id: 'm2', from: 'luna', text: 'We offer standard (3-5 days) and express (1-2 days) shipping!', time: '9:00 AM' },
      { id: 'm3', from: 'customer', text: 'Thanks! That was super helpful.', time: '9:02 AM' },
    ],
  },
  {
    id: '5',
    customer_name: 'Nour A.',
    handle: '@nour.a',
    platform: 'instagram',
    status: 'resolved',
    last_message: 'Got it, appreciate the quick reply.',
    timestamp: '2h ago',
    luna_enabled: true,
    unread_count: 0,
    messages: [
      { id: 'm1', from: 'customer', text: 'Is this item available in red?', time: '8:30 AM' },
      { id: 'm2', from: 'luna', text: 'Yes! The red version is in stock in all sizes.', time: '8:30 AM' },
      { id: 'm3', from: 'customer', text: 'Got it, appreciate the quick reply.', time: '8:31 AM' },
    ],
  },
  {
    id: '6',
    customer_name: 'Carlos D.',
    handle: '@carlos.d',
    platform: 'whatsapp',
    status: 'escalated',
    last_message: 'This is unacceptable, I want a refund NOW.',
    timestamp: '5m ago',
    luna_enabled: true,
    unread_count: 3,
    messages: [
      { id: 'm1', from: 'customer', text: 'My package arrived damaged.', time: '10:25 AM' },
      { id: 'm2', from: 'luna', text: 'I\'m really sorry to hear that Carlos. Can you share a photo?', time: '10:25 AM' },
      { id: 'm3', from: 'customer', text: 'I already sent it yesterday and no one helped me!', time: '10:26 AM' },
      { id: 'm4', from: 'customer', text: 'This is unacceptable, I want a refund NOW.', time: '10:27 AM' },
    ],
  },
];

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function PlatformBadge({ platform }: { platform: Platform }) {
  if (platform === 'instagram') {
    return (
      <span className="inline-flex items-center gap-[3px] text-[0.58rem] px-[5px] py-[2px] rounded-[4px] bg-[#e8d5f5] text-[#7c3aed]">
        <InstagramIcon className="w-[9px] h-[9px]" />
        IG
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[3px] text-[0.58rem] px-[5px] py-[2px] rounded-[4px] bg-[#d4edd9] text-[#16a34a]">
      <WhatsAppIcon className="w-[9px] h-[9px]" />
      WA
    </span>
  );
}

function StatusDot({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    escalated: 'bg-[#e07070]',
    pending: 'bg-[#d4a843]',
    resolved: 'bg-[#6bcf8f]',
  };
  return <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${colors[status]}`} />;
}

function LunaToggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(!enabled); }}
      title={enabled ? 'Luna is ON — click to disable' : 'Luna is OFF — click to enable'}
      className={`relative w-[28px] h-[15px] rounded-full transition-colors duration-200 shrink-0 ${enabled ? 'bg-text-secondary' : 'bg-border-md'}`}
    >
      <span
        className={`absolute top-[2px] w-[11px] h-[11px] rounded-full bg-background transition-all duration-200 ${enabled ? 'left-[15px]' : 'left-[2px]'}`}
      />
    </button>
  );
}

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [selectedId, setSelectedId] = useState<string | null>('1');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
    }
    // API: GET /api/luna/conversations?status=all
    // Replace MOCK_CONVERSATIONS with API response
  }, [router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, conversations]);

  const filtered = filter === 'all'
    ? conversations
    : conversations.filter((c) => c.status === filter);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const handleLunaToggle = (id: string, enabled: boolean) => {
    // API: PATCH /api/luna/conversations/:id/luna  { enabled }
    setConversations((prev) =>
      prev.map((c) => c.id === id ? { ...c, luna_enabled: enabled } : c)
    );
  };

  const handleTakeover = (id: string) => {
    // API: POST /api/luna/conversations/:id/takeover
    setConversations((prev) =>
      prev.map((c) => c.id === id ? { ...c, luna_enabled: false } : c)
    );
  };

  const handleSend = () => {
    if (!inputText.trim() || !selectedId) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = { id: `m${Date.now()}`, from: 'agent', text: inputText.trim(), time: timeStr };
    // API: POST /api/luna/conversations/:id/messages  { text: inputText }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, messages: [...c.messages, newMsg], last_message: inputText.trim(), timestamp: 'just now' }
          : c
      )
    );
    setInputText('');
  };

  const escalatedCount = conversations.filter((c) => c.status === 'escalated').length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1 h-screen overflow-hidden">
        <LunaSidebar />

        <main className="flex-1 flex flex-col overflow-hidden bg-background2">

          {/* Top bar */}
          <div className="flex items-end px-6 pt-5 pb-0 bg-background border-b border-border shrink-0">
            <div className="pb-0 flex flex-col">
              <div className="pb-3">
                <h2 className="text-[1.25rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">
                  conversations
                </h2>
                <p className="text-[0.68rem] text-text-secondary">
                  {conversations.length} total · {escalatedCount > 0 && (
                    <span className="text-[#e07070]">{escalatedCount} escalated</span>
                  )}
                </p>
              </div>

              {/* Filter tabs — pill style, left-aligned under title */}
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
                    {tab.value === 'escalated' && escalatedCount > 0 && (
                      <span className={`inline-flex items-center justify-center w-[14px] h-[14px] rounded-full text-[0.52rem] ${
                        filter === tab.value ? 'bg-background/20 text-background' : 'bg-[#e07070]/15 text-[#e07070]'
                      }`}>
                        {escalatedCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Two-panel area */}
          <div className="flex flex-1 overflow-hidden">

            {/* Left: Chat list */}
            <div className="w-[260px] shrink-0 border-r border-border bg-background overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-[0.7rem] text-text-tertiary">
                  no conversations
                </div>
              ) : (
                <div className="flex flex-col">
                  {filtered.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedId(conv.id);
                        // Mark as read — API: PATCH /api/luna/conversations/:id/read
                        setConversations((prev) =>
                          prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c)
                        );
                      }}
                      className={`w-full text-left px-4 py-[0.85rem] border-b border-border transition-colors duration-150 ${
                        selectedId === conv.id
                          ? 'bg-background3'
                          : 'hover:bg-background2'
                      }`}
                    >
                      <div className="flex items-center gap-[0.6rem]">
                        {/* Avatar */}
                        <div className="w-[28px] h-[28px] rounded-full bg-background3 border border-border flex items-center justify-center text-[0.58rem] font-medium text-text-secondary shrink-0">
                          {conv.customer_name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        {/* Name + timestamp */}
                        <span className="flex-1 text-[0.72rem] text-text-primary font-[450] truncate">{conv.customer_name}</span>
                        {/* Escalation flag */}
                        {conv.status === 'escalated' && (
                          <span className="w-[6px] h-[6px] rounded-full bg-[#e07070] shrink-0" title="escalated" />
                        )}
                        <span className="text-[0.58rem] text-text-tertiary shrink-0">{conv.timestamp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Chat view */}
            {selected ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Chat header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-[30px] h-[30px] rounded-full bg-background3 border border-border flex items-center justify-center text-[0.6rem] font-medium text-text-secondary">
                      {selected.customer_name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.78rem] text-text-primary font-[450]">{selected.customer_name}</span>
                        <PlatformBadge platform={selected.platform} />
                        <div className={`text-[0.6rem] flex items-center gap-[4px] px-[6px] py-[2px] rounded-[4px] border ${
                          selected.status === 'escalated'
                            ? 'text-[#e07070] bg-[#e07070]/10 border-[#e07070]/20'
                            : selected.status === 'pending'
                            ? 'text-[#d4a843] bg-[#d4a843]/10 border-[#d4a843]/20'
                            : 'text-[#6bcf8f] bg-[#6bcf8f]/10 border-[#6bcf8f]/20'
                        }`}>
                          <StatusDot status={selected.status} />
                          {selected.status}
                        </div>
                      </div>
                      <div className="text-[0.62rem] text-text-tertiary mt-[1px]">{selected.handle}</div>
                    </div>
                  </div>

                  {/* Header actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-[6px]">
                      <span className="text-[0.65rem] text-text-tertiary">Luna</span>
                      <LunaToggle
                        enabled={selected.luna_enabled}
                        onChange={(v) => handleLunaToggle(selected.id, v)}
                      />
                    </div>
                    {selected.luna_enabled && (
                      <button
                        onClick={() => handleTakeover(selected.id)}
                        className="flex items-center gap-[5px] text-[0.68rem] text-text-secondary border border-border hover:border-border-md hover:text-text-primary rounded-[7px] px-3 py-[5px] transition-all duration-150"
                      >
                        <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        takeover
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-[0.6rem]">
                  {selected.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.from === 'customer' ? 'items-start' : 'items-end'} max-w-[75%] ${msg.from === 'customer' ? '' : 'self-end'}`}
                    >
                      <div
                        className={`px-[0.85rem] py-[0.6rem] rounded-[10px] text-[0.72rem] leading-[1.5] ${
                          msg.from === 'customer'
                            ? 'bg-background border border-border text-text-primary rounded-tl-[3px]'
                            : msg.from === 'luna'
                            ? 'bg-background3 border border-border text-text-primary rounded-tr-[3px]'
                            : 'bg-text-secondary text-background rounded-tr-[3px]'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-[4px] mt-[3px]">
                        {msg.from !== 'customer' && (
                          <span className={`text-[0.55rem] ${msg.from === 'luna' ? 'text-text-tertiary' : 'text-text-tertiary'}`}>
                            {msg.from === 'luna' ? '✦ Luna' : 'You'}
                          </span>
                        )}
                        <span className="text-[0.55rem] text-text-tertiary">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="shrink-0 border-t border-border bg-background px-4 py-3">
                  {selected.luna_enabled ? (
                    <div className="flex items-center gap-3 bg-background2 border border-border rounded-[8px] px-4 py-[0.7rem]">
                      <svg className="w-[13px] h-[13px] text-text-tertiary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      <span className="text-[0.68rem] text-text-tertiary">Luna is handling this conversation — takeover to reply manually</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Type a message..."
                        className="flex-1 bg-background2 border border-border rounded-[8px] px-4 py-[0.65rem] text-[0.72rem] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-md transition-colors duration-150"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className="w-[34px] h-[34px] rounded-[8px] bg-text-secondary flex items-center justify-center hover:opacity-80 transition-opacity duration-150 disabled:opacity-30 shrink-0"
                      >
                        <svg className="w-[13px] h-[13px] text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-background2">
                <div className="text-center">
                  <svg className="w-[28px] h-[28px] text-text-tertiary mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                  </svg>
                  <p className="text-[0.72rem] text-text-tertiary">select a conversation</p>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
