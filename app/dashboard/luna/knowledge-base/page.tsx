'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { getKnowledgeBase, saveKnowledgeBase, deleteKnowledgeFAQ } from '@/lib/api';
import LunaSidebar from '@/components/LunaSidebar';

interface KBItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [items, setItems] = useState<KBItem[]>([
    { id: '1', question: 'What is your return policy?', answer: 'We accept returns within 30 days of purchase...' },
    { id: '2', question: 'How long does shipping take?', answer: 'Standard shipping takes 5-7 business days...' }
  ]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
      return;
    }

    const fetchKB = async () => {
      try {
        const data = await getKnowledgeBase();
        // Map backend FAQs to frontend items with IDs
        if (data.faqs && Array.isArray(data.faqs)) {
          const mappedItems = data.faqs.map((faq: FAQ, index: number) => ({
            id: index.toString(),
            question: faq.question || '',
            answer: faq.answer || ''
          }));
          setItems(mappedItems);
        }
      } catch (error) {
        console.error('Failed to fetch knowledge base:', error);
        // Keep default items if fetch fails
      }
    };

    fetchKB();
  }, [router]);

  const handleAddRow = () => {
    setItems([...items, { id: Date.now().toString(), question: '', answer: '' }]);
  };

  const handleDeleteRow = async (id: string) => {
    // For now, just remove from local state
    // In a real scenario, you might want to:
    // 1. Optimistically remove from UI
    // 2. Call DELETE /knowledge-base/:index on save
    // 3. Or call delete immediately
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdate = (id: string, field: 'question' | 'answer', value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Convert items to FAQs format (remove id, only keep question/answer)
      const faqs = items.map(({ id, ...rest }) => ({
        question: rest.question,
        answer: rest.answer
      }));

      // Save to backend
      await saveKnowledgeBase(faqs);

      // Show success message
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error('Failed to save knowledge base:', error);
      alert('Failed to save knowledge base. Please try again.');
    } finally {
      setLoading(false);
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
                Knowledge Base
              </h2>
              <p className="text-[0.72rem] text-text-secondary">
                Teach Luna how to respond to common questions
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 pb-12">
            <div className="bg-background border border-border rounded-[12px] overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary text-left px-4 py-[0.7rem] border-b border-border font-normal w-[38%]">
                      Question
                    </th>
                    <th className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary text-left px-4 py-[0.7rem] border-b border-border font-normal">
                      Answer
                    </th>
                    <th className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary text-left px-4 py-[0.7rem] border-b border-border font-normal w-[40px]">
                      &nbsp;
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-background3/50 transition-colors duration-150">
                      <td className="px-4 py-0 border-r border-border">
                        <textarea
                          value={item.question}
                          onChange={(e) => handleUpdate(item.id, 'question', e.target.value)}
                          placeholder="Type your question…"
                          rows={2}
                          className="w-full min-h-[52px] px-4 py-[0.85rem] bg-transparent border-none outline-none resize-none text-[0.75rem] text-text-secondary placeholder:text-text-tertiary font-medium focus:text-text-primary transition-colors duration-200"
                        />
                      </td>
                      <td className="px-4 py-0">
                        <textarea
                          value={item.answer}
                          onChange={(e) => handleUpdate(item.id, 'answer', e.target.value)}
                          placeholder="Type the answer Luna should give…"
                          rows={2}
                          className="w-full min-h-[52px] px-4 py-[0.85rem] bg-transparent border-none outline-none resize-none text-[0.75rem] text-text-secondary placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200"
                        />
                      </td>
                      <td className="px-4 py-0 text-center">
                        <button
                          onClick={() => handleDeleteRow(item.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150 p-1 text-text-tertiary"
                          title="Remove"
                        >
                          <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add Button */}
              <button
                onClick={handleAddRow}
                className="w-full flex items-center gap-2 mt-4 mx-4 mb-4 bg-none border border-dashed border-border rounded-[8px] px-4 py-3 text-[0.75rem] text-text-tertiary hover:border-border-md hover:text-text-secondary hover:bg-background3 transition-all duration-[180ms]"
              >
                <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add question
              </button>
            </div>

            {/* Save Row */}
            <div className="flex justify-end items-center gap-4 mt-4">
              {saved && (
                <div className="text-[0.7rem] text-green-400">
                  ✓ Knowledge base saved
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-btn-bg text-btn-text px-5 py-2 rounded-[8px] text-[0.75rem] font-medium hover:opacity-85 transition-opacity duration-200 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}