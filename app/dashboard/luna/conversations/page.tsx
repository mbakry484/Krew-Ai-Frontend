'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import LunaSidebar from '@/components/LunaSidebar';
import LunaTopBarActions from '@/components/LunaTopBarActions';
import Skeleton from '@/components/Skeleton';
import {
  getConversations,
  getConversation,
  sendConversationMessage,
  handoverConversation,
  restoreLuna,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';

type Platform = 'instagram' | 'shopify' | 'whatsapp';
type Status = 'resolved' | 'escalated' | 'pending';
type MessageFrom = 'customer' | 'luna' | 'agent' | 'system';

interface Message {
  id: string;
  from: MessageFrom;
  text: string;
  time: string;
  image_url?: string | null;
}

interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string;
  handle: string;
  platform: Platform;
  status: Status;
  is_escalated: boolean;
  escalation_type?: string | null;
  escalation_reason?: string | null;
  last_message: string;
  timestamp: string;
  luna_enabled: boolean;
  unread_count: number;
  message_count: number;
}

const FILTER_TABS: { label: string; value: 'all' | Status }[] = [
  { label: 'All', value: 'all' },
  { label: 'Escalated', value: 'escalated' },
  { label: 'Pending', value: 'pending' },
  { label: 'Resolved', value: 'resolved' },
];

function formatTimestamp(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

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
  if (platform === 'shopify') {
    return (
      <span className="inline-flex items-center gap-[3px] text-[0.58rem] px-[5px] py-[2px] rounded-[4px] bg-[#d4edda] text-[#2d6a4f]">
        Shopify
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

function ConversationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation list
  const fetchConversations = useCallback(async (statusFilter: 'all' | Status = 'all') => {
    try {
      setError(null);
      const data = await getConversations(statusFilter);
      setConversations(data.conversations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (id: string) => {
    setMessagesLoading(true);
    try {
      const data = await getConversation(id);
      const msgs: Message[] = (data.messages || []).map((m: Message) => ({
        ...m,
        from: m.from === 'agent' && m.text.startsWith('[') && m.text.endsWith(']') ? 'system' : m.from,
      }));
      setMessages(msgs);
      // Update the conversation in list with latest data
      if (data.conversation) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, ...data.conversation, unread_count: 0 }
              : c
          )
        );
      }
    } catch (err: any) {
      // silently fail for messages
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
      return;
    }
    fetchConversations('all');
  }, [router, fetchConversations]);

  // Open conversation from ?open= query param (e.g. navigated from exchanges/refunds page)
  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId && conversations.length > 0) {
      setSelectedId(openId);
    }
  }, [searchParams, conversations]);

  // Realtime: subscribe to new/updated messages for the selected conversation
  useEffect(() => {
    if (!selectedId) return;

    const channel = supabase
      .channel(`messages:${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          const raw = payload.new as {
            id: string;
            sender: string;
            content: string;
            image_url?: string | null;
            created_at: string;
          };
          const isSystemMsg = raw.content.startsWith('[') && raw.content.endsWith(']');
          const fromMap: Record<string, MessageFrom> = {
            customer: 'customer',
            ai: 'luna',
            human: isSystemMsg ? 'system' : 'agent',
          };
          const newMsg: Message = {
            id: raw.id,
            from: fromMap[raw.sender] ?? 'customer',
            text: raw.content,
            image_url: raw.image_url ?? null,
            time: new Date(raw.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          setMessages((prev) => {
            // Avoid duplicates (optimistic message already added for 'agent')
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Update conversation last_message in the list
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedId
                ? { ...c, last_message: raw.content, timestamp: raw.created_at }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  // Realtime: subscribe to conversation list changes (new convos, status updates)
  useEffect(() => {
    const channel = supabase
      .channel('conversations:list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          // Re-fetch the list when any conversation changes
          fetchConversations(filter);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, fetchConversations]);

  // Fetch messages when selection changes
  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
    }
  }, [selectedId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filtered = filter === 'all'
    ? conversations
    : conversations.filter((c) => c.status === filter);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const handleFilterChange = (f: 'all' | Status) => {
    setFilter(f);
    setLoading(true);
    fetchConversations(f);
  };

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    // Optimistically clear unread count
    setConversations((prev) =>
      prev.map((c) => c.id === id ? { ...c, unread_count: 0 } : c)
    );
  };

  const handleLunaToggle = async (id: string, enabled: boolean) => {
    // Optimistic update
    setConversations((prev) =>
      prev.map((c) => c.id === id ? { ...c, luna_enabled: enabled } : c)
    );
    try {
      if (enabled) {
        await restoreLuna(id);
      } else {
        await handoverConversation(id);
        // Reload messages to show handover system message
        if (selectedId === id) fetchMessages(id);
      }
    } catch (err: any) {
      // Revert on failure
      setConversations((prev) =>
        prev.map((c) => c.id === id ? { ...c, luna_enabled: !enabled } : c)
      );
    }
  };

  const handleTakeover = async (id: string) => {
    setConversations((prev) =>
      prev.map((c) => c.id === id ? { ...c, luna_enabled: false, is_escalated: true } : c)
    );
    try {
      await handoverConversation(id);
      if (selectedId === id) fetchMessages(id);
    } catch (err: any) {
      setConversations((prev) =>
        prev.map((c) => c.id === id ? { ...c, luna_enabled: true, is_escalated: false } : c)
      );
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !selectedId || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const now = new Date();
    const tempMsg: Message = {
      id: tempId,
      from: 'agent',
      text,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const data = await sendConversationMessage(selectedId, text);
      // Replace temp message with real one from server
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...data.message } : m)
      );
      // Update conversation last_message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, last_message: text, timestamp: new Date().toISOString() }
            : c
        )
      );
    } catch (err: any) {
      // Remove temp message on failure and restore input
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const escalatedCount = conversations.filter((c) => c.status === 'escalated').length;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden gap-3 p-3 max-md:pt-[60px]">
        <LunaSidebar />

        <main className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-border bg-background2">

          {/* Top bar — hidden on mobile when viewing a chat */}
          <div className={`flex items-start justify-between px-8 max-md:px-4 pt-6 pb-0 border-b border-border shrink-0 gap-3 ${selectedId ? 'max-md:hidden' : ''}`}>
            <div className="pb-0 flex flex-col">
              <div className="pb-3">
                <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">
                  conversations
                </h2>
                <p className="text-[0.68rem] text-text-secondary">
                  {loading ? 'loading...' : `${conversations.length} total`}
                  {!loading && escalatedCount > 0 && (
                    <> · <span className="text-[#e07070]">{escalatedCount} escalated</span></>
                  )}
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-[5px]">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => handleFilterChange(tab.value)}
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
            <div className="pt-4 pb-3 max-md:hidden">
              <LunaTopBarActions />
            </div>
          </div>

          {/* Two-panel area */}
          <div className="flex flex-1 overflow-hidden">

            {/* Left: Chat list — full-width on mobile, hidden when a chat is open */}
            <div className={`w-[260px] max-md:w-full shrink-0 border-r border-border bg-background overflow-y-auto ${selectedId ? 'max-md:hidden' : ''}`}>
              {loading ? (
                <div className="flex flex-col">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="px-4 py-[0.85rem] border-b border-border">
                      <div className="flex items-center gap-[0.6rem]">
                        <Skeleton className="w-[28px] h-[28px] rounded-full shrink-0" />
                        <Skeleton className="flex-1 h-[0.6rem]" />
                        <Skeleton className="w-7 h-[0.5rem] shrink-0" />
                      </div>
                      <Skeleton className="h-[0.55rem] mt-[6px] ml-[34px] w-3/4" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 px-4">
                  <p className="text-[0.68rem] text-[#e07070] text-center">{error}</p>
                  <button
                    onClick={() => fetchConversations(filter)}
                    className="text-[0.65rem] text-text-secondary underline"
                  >
                    retry
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-[0.7rem] text-text-tertiary">
                  no conversations
                </div>
              ) : (
                <div className="flex flex-col">
                  {filtered.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full text-left px-4 py-[0.85rem] border-b border-border transition-colors duration-150 ${
                        selectedId === conv.id
                          ? 'bg-background3'
                          : 'hover:bg-background2'
                      }`}
                    >
                      <div className="flex items-center gap-[0.6rem]">
                        {/* Avatar */}
                        <div className="w-[28px] h-[28px] rounded-full bg-background3 border border-border flex items-center justify-center text-[0.58rem] font-medium text-text-secondary shrink-0">
                          {conv.customer_name.slice(0, 2).toUpperCase()}
                        </div>
                        {/* Name */}
                        <span className="flex-1 text-[0.72rem] text-text-primary font-[450] truncate">{conv.customer_name}</span>
                        {/* Escalation flag */}
                        {conv.status === 'escalated' && (
                          <span className="w-[6px] h-[6px] rounded-full bg-[#e07070] shrink-0" title={conv.escalation_type || 'escalated'} />
                        )}
                        {conv.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-text-secondary text-background text-[0.52rem] px-[3px] shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                        <span className="text-[0.58rem] text-text-tertiary shrink-0">
                          {formatTimestamp(conv.timestamp)}
                        </span>
                      </div>
                      {conv.last_message && (
                        <p className="text-[0.63rem] text-text-tertiary truncate mt-[3px] pl-[34px]">
                          {conv.last_message}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Chat view — hidden on mobile when no chat selected */}
            {selected ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Chat header */}
                <div className="flex items-center justify-between px-5 max-md:px-3 py-3 border-b border-border bg-background shrink-0">
                  <div className="flex items-center gap-3 max-md:gap-2">
                    {/* Back button — mobile only */}
                    <button
                      onClick={() => setSelectedId(null)}
                      className="hidden max-md:flex items-center justify-center w-7 h-7 rounded-[6px] text-text-secondary hover:bg-background3 hover:text-text-primary transition-all duration-150 shrink-0"
                      aria-label="Back to conversations"
                    >
                      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <div className="w-[30px] h-[30px] rounded-full bg-background3 border border-border flex items-center justify-center text-[0.6rem] font-medium text-text-secondary">
                      {selected.customer_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[0.78rem] text-text-primary font-[450]">{selected.customer_name}</span>
                        <span className="max-md:hidden"><PlatformBadge platform={selected.platform} /></span>
                        <div className={`max-md:hidden text-[0.6rem] flex items-center gap-[4px] px-[6px] py-[2px] rounded-[4px] border ${
                          selected.status === 'escalated'
                            ? 'text-[#e07070] bg-[#e07070]/10 border-[#e07070]/20'
                            : selected.status === 'pending'
                            ? 'text-[#d4a843] bg-[#d4a843]/10 border-[#d4a843]/20'
                            : 'text-[#6bcf8f] bg-[#6bcf8f]/10 border-[#6bcf8f]/20'
                        }`}>
                          <StatusDot status={selected.status} />
                          {selected.status}
                          {selected.escalation_type && selected.status === 'escalated' && (
                            <span className="opacity-70"> · {selected.escalation_type}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-[0.62rem] text-text-tertiary mt-[1px]">{selected.handle}</div>
                    </div>
                  </div>

                  {/* Header actions — compact on mobile */}
                  <div className="flex items-center gap-2 max-md:gap-1">
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
                  {messagesLoading ? (
                    <div className="flex flex-col gap-[0.6rem] flex-1 pt-2">
                      {[false, true, false, false, true, false].map((isRight, i) => (
                        <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
                          <Skeleton
                            className={`h-[2.2rem] rounded-[10px] ${isRight ? 'w-[52%]' : 'w-[42%]'}`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center flex-1 text-[0.7rem] text-text-tertiary">
                      no messages yet
                    </div>
                  ) : (
                    messages.map((msg) => {
                      if (msg.from === 'system') {
                        return (
                          <div key={msg.id} className="flex items-center gap-3 my-[0.4rem]">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[0.6rem] text-text-tertiary shrink-0 px-1">
                              {msg.text.replace(/^\[|\]$/g, '')}
                            </span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                        );
                      }
                      return (
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
                            {msg.image_url && (
                              <img
                                src={msg.image_url}
                                alt="attachment"
                                className="max-w-[180px] rounded-[6px] mb-[6px]"
                              />
                            )}
                            {msg.text}
                          </div>
                          <div className="flex items-center gap-[4px] mt-[3px]">
                            {msg.from !== 'customer' && (
                              <span className="text-[0.55rem] text-text-tertiary">
                                {msg.from === 'luna' ? '✦ Luna' : 'You'}
                              </span>
                            )}
                            <span className="text-[0.55rem] text-text-tertiary">{msg.time}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
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
                        disabled={sending}
                        className="flex-1 bg-background2 border border-border rounded-[8px] px-4 py-[0.65rem] text-[0.72rem] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-md transition-colors duration-150 disabled:opacity-50"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!inputText.trim() || sending}
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
              <div className="flex-1 flex items-center justify-center bg-background2 max-md:hidden">
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

export default function ConversationsPage() {
  return (
    <Suspense fallback={null}>
      <ConversationsContent />
    </Suspense>
  );
}
