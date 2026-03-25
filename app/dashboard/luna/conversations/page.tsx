'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { getConversations } from '@/lib/api';
import LunaSidebar from '@/components/LunaSidebar';

interface Conversation {
  id: string;
  customer: string;
  message: string;
  platform: 'instagram' | 'whatsapp';
  status: 'resolved' | 'escalated' | 'pending';
  timestamp: string;
}

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
      return;
    }

    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data.conversations || []);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        // Use mock data if API fails
        setConversations([
          { id: '1', customer: 'Sarah M.', message: 'Is this item available in size M?', platform: 'instagram', status: 'resolved', timestamp: '2 hours ago' },
          { id: '2', customer: 'Mike R.', message: 'Can you help with a technical issue?', platform: 'whatsapp', status: 'escalated', timestamp: '4 hours ago' },
          { id: '3', customer: 'Emma L.', message: 'I want to return my order', platform: 'instagram', status: 'pending', timestamp: '6 hours ago' },
          { id: '4', customer: 'James K.', message: 'What colors do you have?', platform: 'whatsapp', status: 'resolved', timestamp: '8 hours ago' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-400 border-green-400/25';
      case 'escalated':
        return 'text-red-400 border-red-400/25';
      default:
        return 'text-text-tertiary';
    }
  };

  return (
    <div className="min-h-screen pt-12 flex flex-col">
      <div className="flex flex-1">
        <LunaSidebar />

        <main className="flex-1 overflow-y-auto bg-background2">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 pt-6 pb-0">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.2rem]">
                Conversations
              </h2>
              <p className="text-[0.72rem] text-text-secondary">
                {conversations.length} conversations
              </p>
            </div>
          </div>

          {/* Conversations Table */}
          <div className="px-8 py-6">
            <div className="bg-background border border-border rounded-[12px] overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-[0.6rem] uppercase tracking-[0.07em] text-text-tertiary text-left px-6 py-4 border-b border-border font-normal">
                      Customer
                    </th>
                    <th className="text-[0.6rem] uppercase tracking-[0.07em] text-text-tertiary text-left px-6 py-4 border-b border-border font-normal">
                      Message
                    </th>
                    <th className="text-[0.6rem] uppercase tracking-[0.07em] text-text-tertiary text-left px-6 py-4 border-b border-border font-normal">
                      Platform
                    </th>
                    <th className="text-[0.6rem] uppercase tracking-[0.07em] text-text-tertiary text-left px-6 py-4 border-b border-border font-normal">
                      Status
                    </th>
                    <th className="text-[0.6rem] uppercase tracking-[0.07em] text-text-tertiary text-left px-6 py-4 border-b border-border font-normal">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[0.75rem] text-text-secondary">
                        Loading conversations...
                      </td>
                    </tr>
                  ) : conversations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[0.75rem] text-text-secondary">
                        No conversations yet
                      </td>
                    </tr>
                  ) : (
                    conversations.map((conv) => (
                      <tr key={conv.id} className="border-b border-border hover:bg-background3 transition-colors duration-150">
                        <td className="px-6 py-4 text-[0.72rem] text-text-secondary">{conv.customer}</td>
                        <td className="px-6 py-4 text-[0.72rem] text-text-secondary max-w-xs truncate">{conv.message}</td>
                        <td className="px-6 py-4 text-[0.72rem] text-text-secondary capitalize">{conv.platform}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[0.62rem] px-[7px] py-[2px] border rounded-[20px] border-current ${getStatusColor(conv.status)}`}>
                            {conv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[0.72rem] text-text-secondary">{conv.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}