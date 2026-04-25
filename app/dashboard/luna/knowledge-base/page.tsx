'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { getKnowledgeBase, saveKnowledgeBase, uploadSizeGuideImage } from '@/lib/api';
import LunaSidebar from '@/components/LunaSidebar';
import LunaTopBarActions from '@/components/LunaTopBarActions';

interface KBItem {
  id: string;
  question: string;
  answer: string;
  fixed?: boolean;
  placeholder?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface SituationItem {
  id: string;
  text: string;
}

interface SizeGuideItem {
  id: string;
  productName: string;
  content: string;
  imageUrl?: string;
  imageFile?: File;
  imagePreview?: string;
}

const FIXED_ITEMS: KBItem[] = [
  {
    id: 'fixed-1',
    question: "What's the delivery time?",
    answer: '',
    fixed: true,
    placeholder: 'e.g. We deliver within 3–5 business days inside Egypt, and 7–14 days for international orders.',
  },
  {
    id: 'fixed-2',
    question: "What's your exchange and refund policy?",
    answer: '',
    fixed: true,
    placeholder: 'e.g. You can exchange or return any item within 14 days of delivery, unused and in original packaging. Refunds are processed within 5–7 business days.',
  },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={enabled}
      className={`group relative flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center transition-colors duration-150 ${
        enabled ? 'text-text-secondary' : 'text-text-tertiary hover:text-text-primary'
      }`}
    >
      <span
        className={`relative flex items-center justify-center transition-transform duration-[240ms] ease-out ${
          !enabled ? 'group-hover:rotate-90 group-active:rotate-[120deg]' : ''
        }`}
      >
        {/* horizontal bar — always visible */}
        <span className="absolute w-[11px] h-px bg-current rounded-full" />
        {/* vertical bar — visible only when collapsed (+ state) */}
        <span
          className={`absolute w-px h-[11px] bg-current rounded-full transition-all duration-[200ms] ${
            enabled ? 'scale-y-0 opacity-0' : 'scale-y-100 opacity-100'
          }`}
        />
      </span>
    </button>
  );
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [items, setItems] = useState<KBItem[]>(FIXED_ITEMS);

  const [situationsEnabled, setSituationsEnabled] = useState(false);
  const [situations, setSituations] = useState<SituationItem[]>([]);

  const [sizeGuidesEnabled, setSizeGuidesEnabled] = useState(false);
  const [sizeGuides, setSizeGuides] = useState<SizeGuideItem[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
      return;
    }

    const fetchKB = async () => {
      try {
        const data = await getKnowledgeBase();

        if (data.faqs && Array.isArray(data.faqs)) {
          const fixedWithAnswers = FIXED_ITEMS.map((fi) => {
            const saved = data.faqs.find((f: FAQ) => f.question === fi.question);
            return saved ? { ...fi, answer: saved.answer } : fi;
          });
          const customItems = data.faqs
            .filter((f: FAQ) => !FIXED_ITEMS.some((fi) => fi.question === f.question))
            .map((faq: FAQ, index: number) => ({
              id: `custom-${index}`,
              question: faq.question || '',
              answer: faq.answer || '',
            }));
          setItems([...fixedWithAnswers, ...customItems]);
        }

        if (data.situations_enabled !== undefined) setSituationsEnabled(data.situations_enabled);
        if (data.situations && Array.isArray(data.situations)) {
          setSituations(
            data.situations.map((s: { text: string }, i: number) => ({ id: `sit-${i}`, text: s.text }))
          );
        }

        if (data.size_guides_enabled !== undefined) setSizeGuidesEnabled(data.size_guides_enabled);
        if (data.size_guides && Array.isArray(data.size_guides)) {
          setSizeGuides(
            data.size_guides.map(
              (sg: { product_name: string; content: string; image_url?: string }, i: number) => ({
                id: `sg-${i}`,
                productName: sg.product_name || '',
                content: sg.content || '',
                imageUrl: sg.image_url,
              })
            )
          );
        }
      } catch (error) {
        console.error('Failed to fetch customize data:', error);
      }
    };

    fetchKB();
  }, [router]);

  // --- FAQ handlers ---
  const handleAddRow = () => {
    setItems([...items, { id: Date.now().toString(), question: '', answer: '' }]);
  };

  const handleDeleteRow = (id: string) => {
    if (items.find((i) => i.id === id)?.fixed) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdate = (id: string, field: 'question' | 'answer', value: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // --- Situation handlers ---
  const handleAddSituation = () => {
    setSituations([...situations, { id: Date.now().toString(), text: '' }]);
  };

  const handleDeleteSituation = (id: string) => {
    setSituations(situations.filter((s) => s.id !== id));
  };

  const handleUpdateSituation = (id: string, text: string) => {
    setSituations(situations.map((s) => (s.id === id ? { ...s, text } : s)));
  };

  // --- Size guide handlers ---
  const handleAddSizeGuide = () => {
    setSizeGuides([...sizeGuides, { id: Date.now().toString(), productName: '', content: '' }]);
  };

  const handleDeleteSizeGuide = (id: string) => {
    setSizeGuides(sizeGuides.filter((sg) => sg.id !== id));
  };

  const handleUpdateSizeGuide = (id: string, field: 'productName' | 'content', value: string) => {
    setSizeGuides(sizeGuides.map((sg) => (sg.id === id ? { ...sg, [field]: value } : sg)));
  };

  const handleSizeGuideImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSizeGuides(
        sizeGuides.map((sg) =>
          sg.id === id
            ? { ...sg, imageFile: file, imagePreview: e.target?.result as string, imageUrl: undefined }
            : sg
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSizeGuideImage = (id: string) => {
    setSizeGuides(
      sizeGuides.map((sg) =>
        sg.id === id ? { ...sg, imageFile: undefined, imagePreview: undefined, imageUrl: undefined } : sg
      )
    );
  };

  // --- Save ---
  const handleSave = async () => {
    const missingRequired = items.filter((i) => i.fixed && !i.answer.trim());
    if (missingRequired.length > 0) {
      alert('Please fill in the answers for all required questions before saving.');
      return;
    }

    setLoading(true);
    try {
      const faqs = items.map(({ question, answer }) => ({ question, answer }));

      const processedSizeGuides = await Promise.all(
        sizeGuides.map(async (sg) => {
          let imageUrl = sg.imageUrl;
          if (sg.imageFile) {
            try {
              const res = await uploadSizeGuideImage(sg.imageFile);
              imageUrl = res.url;
            } catch {
              imageUrl = sg.imagePreview;
            }
          }
          return { product_name: sg.productName, content: sg.content, image_url: imageUrl };
        })
      );

      await saveKnowledgeBase(faqs, {
        situations_enabled: situationsEnabled,
        situations: situations.map((s) => ({ text: s.text })),
        size_guides_enabled: sizeGuidesEnabled,
        size_guides: processedSizeGuides,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error('Failed to save customize data:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <LunaSidebar />

        <main className="flex-1 overflow-y-auto bg-background2 max-md:pt-12">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 max-md:px-4 pt-[1.6rem] pb-0 flex-wrap gap-3">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">
                customize
              </h2>
              <p className="text-[0.72rem] text-text-secondary">
                fine-tune how Luna thinks, responds, and behaves
              </p>
            </div>
            <div className="max-md:hidden">
              <LunaTopBarActions />
            </div>
          </div>

          {/* Content */}
          <div className="px-8 max-md:px-4 py-6 pb-12 flex flex-col gap-3">

            {/* ── FAQ table ── */}
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
                    <th className="text-[0.6rem] border-b border-border font-normal w-[40px]">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-border transition-colors duration-150 group ${
                        item.fixed ? '' : 'hover:bg-background3/50'
                      }`}
                    >
                      <td className="px-4 py-0 border-r border-border relative">
                        {item.fixed ? (
                          <div className="flex items-start justify-between gap-2 px-4 py-[0.85rem]">
                            <span className="text-[0.75rem] text-text-secondary font-medium leading-[1.5]">
                              {item.question}
                            </span>
                            <span className="shrink-0 text-[0.56rem] uppercase tracking-[0.07em] text-text-tertiary border border-border rounded-[4px] px-[5px] py-[2px] mt-[1px]">
                              required
                            </span>
                          </div>
                        ) : (
                          <textarea
                            value={item.question}
                            onChange={(e) => handleUpdate(item.id, 'question', e.target.value)}
                            placeholder="Type your question…"
                            rows={2}
                            className="w-full min-h-[52px] px-4 py-[0.85rem] bg-transparent border-none outline-none resize-none text-[0.75rem] text-text-secondary placeholder:text-text-tertiary font-medium focus:text-text-primary transition-colors duration-200"
                          />
                        )}
                      </td>

                      <td className="px-4 py-0">
                        <textarea
                          value={item.answer}
                          onChange={(e) => handleUpdate(item.id, 'answer', e.target.value)}
                          placeholder={item.placeholder ?? 'Type the answer Luna should give…'}
                          rows={2}
                          className={`w-full min-h-[52px] px-4 py-[0.85rem] bg-transparent border-none outline-none resize-none text-[0.75rem] placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200 ${
                            item.fixed && !item.answer ? 'text-text-tertiary' : 'text-text-secondary'
                          }`}
                        />
                      </td>

                      <td className="px-4 py-0 text-center">
                        {!item.fixed && (
                          <button
                            onClick={() => handleDeleteRow(item.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150 p-1 text-text-tertiary"
                            title="Remove"
                          >
                            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={handleAddRow}
                className="w-full flex items-center gap-2 mt-4 mx-4 mb-4 bg-none border border-dashed border-border rounded-[8px] px-4 py-3 text-[0.75rem] text-text-tertiary hover:border-border-md hover:text-text-secondary hover:bg-background3 transition-all duration-[180ms]"
                style={{ width: 'calc(100% - 2rem)' }}
              >
                <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add question
              </button>
            </div>

            {/* ── Situations ── */}
            <div className="bg-background border border-border rounded-[12px] overflow-hidden">
              {/* Toggle bar */}
              <div className="flex items-center justify-between px-4 py-[0.85rem]">
                <div>
                  <p className="text-[0.78rem] text-text-primary font-[400] lowercase tracking-[-0.01em]">
                    situations
                  </p>
                  <p className="text-[0.65rem] text-text-tertiary mt-[2px]">
                    real-time context Luna should be aware of
                  </p>
                </div>
                <Toggle enabled={situationsEnabled} onToggle={() => setSituationsEnabled(!situationsEnabled)} />
              </div>

              {/* Expandable content */}
              {situationsEnabled && (
                <div className="border-t border-border">
                  {situations.length > 0 && (
                    <div>
                      {situations.map((sit) => (
                        <div
                          key={sit.id}
                          className="flex items-start gap-2 border-b border-border group hover:bg-background3/50 transition-colors duration-150"
                        >
                          <div className="flex-1 flex items-center gap-2 px-4 py-[0.75rem]">
                            <svg className="w-[12px] h-[12px] shrink-0 text-text-tertiary mt-[2px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                              <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
                              <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
                            </svg>
                            <textarea
                              value={sit.text}
                              onChange={(e) => handleUpdateSituation(sit.id, e.target.value)}
                              placeholder="e.g. We are experiencing delays with deliveries and are working to resolve this as quickly as possible."
                              rows={1}
                              className="flex-1 bg-transparent border-none outline-none resize-none text-[0.75rem] text-text-secondary placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200 leading-[1.5] min-h-[24px]"
                              onInput={(e) => {
                                const el = e.currentTarget;
                                el.style.height = 'auto';
                                el.style.height = el.scrollHeight + 'px';
                              }}
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteSituation(sit.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150 p-1 text-text-tertiary mt-[0.7rem] mr-3 shrink-0"
                            title="Remove"
                          >
                            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleAddSituation}
                    className="w-full flex items-center gap-2 border-0 px-4 py-3 text-[0.73rem] text-text-tertiary hover:text-text-secondary hover:bg-background3/50 transition-all duration-[180ms] text-left"
                  >
                    <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add situation
                  </button>
                </div>
              )}
            </div>

            {/* ── Size guides ── */}
            <div className="bg-background border border-border rounded-[12px] overflow-hidden">
              {/* Toggle bar */}
              <div className="flex items-center justify-between px-4 py-[0.85rem]">
                <div>
                  <p className="text-[0.78rem] text-text-primary font-[400] lowercase tracking-[-0.01em]">
                    size guides
                  </p>
                  <p className="text-[0.65rem] text-text-tertiary mt-[2px]">
                    help Luna share the right sizing info per product
                  </p>
                </div>
                <Toggle enabled={sizeGuidesEnabled} onToggle={() => setSizeGuidesEnabled(!sizeGuidesEnabled)} />
              </div>

              {/* Expandable content */}
              {sizeGuidesEnabled && (
                <div className="border-t border-border">
                  {sizeGuides.length > 0 && (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary text-left px-4 py-[0.6rem] border-b border-border font-normal w-[32%]">
                            Product
                          </th>
                          <th className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary text-left px-4 py-[0.6rem] border-b border-border font-normal">
                            Size guide
                          </th>
                          <th className="text-[0.6rem] border-b border-border font-normal w-[40px]">&nbsp;</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizeGuides.map((sg) => (
                          <tr
                            key={sg.id}
                            className="border-b border-border transition-colors duration-150 group hover:bg-background3/50"
                          >
                            {/* Product name */}
                            <td className="px-4 py-0 border-r border-border align-top">
                              <textarea
                                value={sg.productName}
                                onChange={(e) => handleUpdateSizeGuide(sg.id, 'productName', e.target.value)}
                                placeholder="Product name…"
                                rows={2}
                                className="w-full min-h-[52px] px-4 py-[0.85rem] bg-transparent border-none outline-none resize-none text-[0.75rem] text-text-secondary placeholder:text-text-tertiary font-medium focus:text-text-primary transition-colors duration-200"
                              />
                            </td>

                            {/* Size guide content — image OR text, mutually exclusive */}
                            <td className="px-4 py-0 align-top">
                              {sg.imagePreview || sg.imageUrl ? (
                                /* ── Image mode ── */
                                <div className="px-4 py-3 flex flex-col gap-2">
                                  <button
                                    onClick={() => setModalImage((sg.imagePreview || sg.imageUrl)!)}
                                    className="relative group/img w-full max-w-[260px] rounded-[6px] overflow-hidden border border-border hover:border-border-md transition-all duration-150"
                                  >
                                    <img
                                      src={sg.imagePreview || sg.imageUrl}
                                      alt="size guide"
                                      className="w-full h-[120px] object-cover block"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-all duration-150 flex items-center justify-center">
                                      <span className="opacity-0 group-hover/img:opacity-100 transition-opacity duration-150 text-white text-[0.65rem] tracking-[0.04em]">
                                        preview
                                      </span>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => handleRemoveSizeGuideImage(sg.id)}
                                    className="text-[0.62rem] text-text-tertiary hover:text-red-400 transition-colors duration-150 text-left w-fit"
                                  >
                                    remove image
                                  </button>
                                </div>
                              ) : (
                                /* ── Text mode ── */
                                <>
                                  <textarea
                                    value={sg.content}
                                    onChange={(e) => handleUpdateSizeGuide(sg.id, 'content', e.target.value)}
                                    placeholder="e.g. XS = chest 36cm, S = chest 38cm, M = chest 42cm, L = chest 46cm, XL = chest 50cm"
                                    rows={2}
                                    className="w-full min-h-[52px] px-4 py-[0.85rem] bg-transparent border-none outline-none resize-none text-[0.75rem] text-text-secondary placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200"
                                  />
                                  {/* Only show attach option when no text is entered */}
                                  {!sg.content.trim() && (
                                    <div className="px-4 pb-[0.75rem]">
                                      <button
                                        onClick={() => fileInputRefs.current[sg.id]?.click()}
                                        className="flex items-center gap-[5px] text-[0.62rem] text-text-tertiary hover:text-text-secondary border border-dashed border-border rounded-[4px] px-2 py-[3px] transition-all duration-150 hover:border-border-md"
                                      >
                                        <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        attach image instead
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                              <input
                                ref={(el) => { fileInputRefs.current[sg.id] = el; }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleSizeGuideImageUpload(sg.id, file);
                                  e.target.value = '';
                                }}
                              />
                            </td>

                            {/* Delete */}
                            <td className="px-4 py-0 text-center align-top pt-[0.85rem]">
                              <button
                                onClick={() => handleDeleteSizeGuide(sg.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150 p-1 text-text-tertiary"
                                title="Remove"
                              >
                                <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <button
                    onClick={handleAddSizeGuide}
                    className="w-full flex items-center gap-2 border-0 px-4 py-3 text-[0.73rem] text-text-tertiary hover:text-text-secondary hover:bg-background3/50 transition-all duration-[180ms] text-left"
                  >
                    <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add product
                  </button>
                </div>
              )}
            </div>

            {/* Save Row */}
            <div className="flex justify-end items-center gap-4 mt-1">
              {saved && (
                <div className="text-[0.7rem] text-green-400">✓ Customize saved</div>
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

      {/* ── Image preview modal ── */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-6"
          onClick={() => setModalImage(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[85vh] rounded-[8px] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={modalImage}
              alt="size guide preview"
              className="block max-w-[90vw] max-h-[85vh] object-contain"
            />
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors duration-150"
            >
              <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
