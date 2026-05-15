'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { getUserInfo, getIssues, getSentiment, getIssueInteractions } from '@/lib/api';
import LunaSidebar from '@/components/LunaSidebar';
import LunaTopBarActions from '@/components/LunaTopBarActions';

interface Issue {
  category: string;
  count: number;
  previous_count: number;
  change_percent: number;
}

interface SentimentItem {
  sentiment: string;
  count: number;
  percentage: number;
}

interface Interaction {
  id: string;
  conversation_id: string;
  customer_username: string | null;
  customer_id: string;
  started_at: string;
  issue_summary: string | null;
  sentiment: string | null;
  resolution_status: string | null;
  first_message_id: string | null;
}

const SENTIMENT_COLORS: Record<string, string> = {
  angry:      '#c45c5c',
  frustrated: '#d4845c',
  neutral:    'var(--text-tertiary)',
  satisfied:  '#6bcf8f',
  happy:      '#5c9c6e',
};

const SENTIMENT_LABEL: Record<string, string> = {
  angry:      'Angry',
  frustrated: 'Frustrated',
  neutral:    'Neutral',
  satisfied:  'Satisfied',
  happy:      'Happy',
};

export default function IssuesPage() {
  const router = useRouter();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [sentiment, setSentiment] = useState<SentimentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Popup state
  const [popup, setPopup] = useState<{ category: string; interactions: Interaction[] } | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);

  // Load brand_id once
  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    getUserInfo().then((res) => {
      const id = res.user?.brand_id || res.brand_id;
      if (id) setBrandId(id);
    }).catch(() => {});
  }, [router]);

  // Load issues + sentiment when brand_id is ready
  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    Promise.all([
      getIssues(brandId, 30),
      getSentiment(brandId, 30),
    ]).then(([issuesRes, sentimentRes]) => {
      setIssues(issuesRes.issues || []);
      setSentiment(sentimentRes.distribution || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [brandId]);

  const openPopup = useCallback(async (category: string) => {
    if (!brandId) return;
    setPopupLoading(true);
    setPopup({ category, interactions: [] });
    try {
      const res = await getIssueInteractions(brandId, category, 30);
      setPopup({ category, interactions: res.interactions || [] });
    } catch {
      setPopup({ category, interactions: [] });
    } finally {
      setPopupLoading(false);
    }
  }, [brandId]);

  const goToConversation = (conversationId: string, firstMessageId: string | null) => {
    const params = new URLSearchParams({ open: conversationId });
    if (firstMessageId) params.set('highlight', firstMessageId);
    router.push(`/dashboard/luna/conversations?${params.toString()}`);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 gap-3 p-3 max-md:pt-[60px]">
        <LunaSidebar />

        <main className="flex-1 rounded-2xl border border-border overflow-y-auto bg-background2">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 max-md:px-4 pt-[1.6rem] pb-0 flex-wrap gap-3">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">
                issues
              </h2>
              <p className="text-[0.72rem] text-text-secondary">recurring and flagged customer problems</p>
            </div>
            <div className="max-md:hidden"><LunaTopBarActions /></div>
          </div>

          <div className="px-8 py-6 pb-12 flex flex-col gap-6">

            {/* All Issues */}
            <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">All Issues</div>
              <p className="text-[0.68rem] text-text-secondary mb-4">Flagged and recurring problems</p>

              {loading ? (
                <div className="flex flex-col gap-[0.6rem]">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[58px] bg-background2 border border-border rounded-[8px] animate-pulse" />
                  ))}
                </div>
              ) : issues.length === 0 ? (
                <div className="text-[0.72rem] text-text-tertiary py-4 text-center">
                  no issues detected yet — data appears after interactions are analyzed
                </div>
              ) : (
                <div className="flex flex-col gap-[0.6rem]">
                  {issues.map((issue) => {
                    const up = issue.change_percent > 0;
                    const deltaStr = issue.change_percent === 0
                      ? '0%'
                      : `${up ? '+' : ''}${issue.change_percent}%`;
                    return (
                      <button
                        key={issue.category}
                        onClick={() => openPopup(issue.category)}
                        className="flex items-center gap-4 bg-background2 border border-border rounded-[8px] p-4 hover:border-border-md transition-colors duration-150 text-left w-full"
                      >
                        <div className="text-[1.1rem] font-light text-text-primary tracking-[-0.03em] min-w-[22px]">{issue.count}</div>
                        <div className="flex-1">
                          <div className="text-[0.75rem] text-text-primary mb-[1px] capitalize">{issue.category}</div>
                        </div>
                        <div className={`text-[0.68rem] flex items-center gap-[3px] whitespace-nowrap ${up ? 'text-[#e07070]' : 'text-text-tertiary'}`}>
                          {up ? (
                            <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                          ) : (
                            <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 7l10 10M17 7v10H7"/></svg>
                          )}
                          {deltaStr}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sentiment + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Sentiment Analysis</div>
                <p className="text-[0.68rem] text-text-secondary mb-4">Customer mood on flagged issues</p>

                {loading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-border rounded animate-pulse" />)}
                  </div>
                ) : sentiment.length === 0 ? (
                  <div className="text-[0.72rem] text-text-tertiary py-4 text-center">no sentiment data yet</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {sentiment.map((s) => (
                      <div key={s.sentiment}>
                        <div className="flex justify-between text-[0.72rem] mb-[5px]">
                          <span className="text-text-secondary">{SENTIMENT_LABEL[s.sentiment] || s.sentiment}</span>
                          <span className="text-text-tertiary">{s.percentage}%</span>
                        </div>
                        <div className="bg-border-md rounded-[3px] h-1 overflow-hidden">
                          <div
                            className="h-full rounded-[3px]"
                            style={{ width: `${s.percentage}%`, background: SENTIMENT_COLORS[s.sentiment] || 'var(--text-tertiary)' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-background border border-border rounded-[12px] p-[1.4rem]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-text-primary mb-[0.3rem]">Quick Actions</div>
                <p className="text-[0.68rem] text-text-secondary mb-4">Respond to flagged issues</p>
                <div className="flex flex-col gap-2">
                  <button className="flex items-center gap-3 border border-border rounded-[8px] px-4 py-[0.8rem] text-[0.75rem] text-text-secondary hover:border-border-md hover:text-text-primary hover:bg-background2 transition-all duration-150 text-left w-full">
                    <svg className="w-[14px] h-[14px] shrink-0 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    export issues report
                  </button>
                  <button className="flex items-center gap-3 border border-border rounded-[8px] px-4 py-[0.8rem] text-[0.75rem] text-text-secondary hover:border-border-md hover:text-text-primary hover:bg-background2 transition-all duration-150 text-left w-full">
                    <svg className="w-[14px] h-[14px] shrink-0 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                    flag for team review
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Issue Drill-Down Popup */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
          onClick={() => setPopup(null)}
        >
          <div
            className="bg-background border border-border rounded-[14px] w-full max-w-[520px] mx-4 max-h-[80vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popup Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div>
                <div className="text-[0.78rem] font-medium text-text-primary capitalize">{popup.category}</div>
                <div className="text-[0.64rem] text-text-tertiary mt-[2px]">conversations with this issue</div>
              </div>
              <button
                onClick={() => setPopup(null)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Popup Body */}
            <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-[6px]">
              {popupLoading ? (
                <div className="flex flex-col gap-2 py-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-[60px] bg-background2 border border-border rounded-[8px] animate-pulse" />)}
                </div>
              ) : popup.interactions.length === 0 ? (
                <div className="text-[0.72rem] text-text-tertiary py-6 text-center">no conversations found</div>
              ) : (
                popup.interactions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => goToConversation(item.conversation_id, item.first_message_id)}
                    className="flex flex-col gap-[3px] bg-background2 border border-border rounded-[8px] px-4 py-3 hover:border-border-md transition-colors text-left w-full"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[0.73rem] text-text-primary">
                        {item.customer_username ? `@${item.customer_username}` : item.customer_id}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.sentiment && (
                          <span
                            className="text-[0.6rem] px-[6px] py-[2px] rounded-full border"
                            style={{
                              color: SENTIMENT_COLORS[item.sentiment] || 'var(--text-tertiary)',
                              borderColor: SENTIMENT_COLORS[item.sentiment] || 'var(--border)',
                            }}
                          >
                            {SENTIMENT_LABEL[item.sentiment] || item.sentiment}
                          </span>
                        )}
                        <span className="text-[0.62rem] text-text-tertiary">{formatTime(item.started_at)}</span>
                      </div>
                    </div>
                    {item.issue_summary && (
                      <div className="text-[0.67rem] text-text-secondary line-clamp-2">{item.issue_summary}</div>
                    )}
                    <div className="text-[0.6rem] text-text-tertiary flex items-center gap-1 mt-[2px]">
                      <svg className="w-[9px] h-[9px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5l7 7-7 7"/>
                      </svg>
                      view conversation
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
