'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { getKnowledgeBase, saveKnowledgeBase, uploadSizeGuideImage, getProducts } from '@/lib/api';
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

// One size guide row can cover multiple products
interface SizeGuideItem {
  id: string;
  productNames: string[];   // one or more products sharing this chart
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
        <span className="absolute w-[11px] h-px bg-current rounded-full" />
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

  const [allProducts, setAllProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState<{ [guideId: string]: string }>({});

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [kbData, productsData] = await Promise.all([
          getKnowledgeBase(),
          getProducts().catch(() => ({ products: [] as { name: string }[] })),
        ]);

        const productNames: string[] = (productsData?.products || []).map(
          (p: { name: string }) => p.name
        );
        setAllProducts(productNames);

        if (kbData.faqs && Array.isArray(kbData.faqs)) {
          const fixedWithAnswers = FIXED_ITEMS.map((fi) => {
            const savedFaq = kbData.faqs.find((f: FAQ) => f.question === fi.question);
            return savedFaq ? { ...fi, answer: savedFaq.answer } : fi;
          });
          const customItems = kbData.faqs
            .filter((f: FAQ) => !FIXED_ITEMS.some((fi) => fi.question === f.question))
            .map((faq: FAQ, index: number) => ({
              id: `custom-${index}`,
              question: faq.question || '',
              answer: faq.answer || '',
            }));
          setItems([...fixedWithAnswers, ...customItems]);
        }

        if (kbData.situations_enabled !== undefined) setSituationsEnabled(kbData.situations_enabled);
        if (kbData.situations && Array.isArray(kbData.situations)) {
          setSituations(
            kbData.situations.map((s: { text: string }, i: number) => ({ id: `sit-${i}`, text: s.text }))
          );
        }

        if (kbData.size_guides_enabled !== undefined) setSizeGuidesEnabled(kbData.size_guides_enabled);
        if (kbData.size_guides && Array.isArray(kbData.size_guides)) {
          setSizeGuides(
            kbData.size_guides.map(
              (sg: { product_names?: string[]; product_name?: string; content: string; image_url?: string }, i: number) => ({
                id: `sg-${i}`,
                // support both old single and new multi format
                productNames: sg.product_names || (sg.product_name ? [sg.product_name] : []),
                content: sg.content || '',
                imageUrl: sg.image_url,
              })
            )
          );
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [router]);

  // All products claimed by any size guide row
  const claimedProducts = new Set(sizeGuides.flatMap((sg) => sg.productNames));

  // Products not yet assigned to any row
  const unassignedProducts = allProducts.filter((name) => !claimedProducts.has(name));

  // Toggle a product in/out of a specific size guide row
  const handleToggleProduct = (guideId: string, productName: string) => {
    setSizeGuides((prev) =>
      prev.map((sg) => {
        if (sg.id !== guideId) return sg;
        const already = sg.productNames.includes(productName);
        return {
          ...sg,
          productNames: already
            ? sg.productNames.filter((n) => n !== productName)
            : [...sg.productNames, productName],
        };
      })
    );
  };

  // Add a new empty size guide row
  const handleAddSizeGuide = () => {
    setSizeGuides((prev) => [...prev, { id: `sg-${Date.now()}`, productNames: [], content: '' }]);
  };

  const handleDeleteSizeGuide = (id: string) => {
    setSizeGuides((prev) => prev.filter((sg) => sg.id !== id));
  };

  const handleUpdateContent = (id: string, value: string) => {
    setSizeGuides((prev) => prev.map((sg) => (sg.id === id ? { ...sg, content: value } : sg)));
  };

  const handleSizeGuideImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSizeGuides((prev) =>
        prev.map((sg) =>
          sg.id === id
            ? { ...sg, imageFile: file, imagePreview: e.target?.result as string, imageUrl: undefined }
            : sg
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSizeGuideImage = (id: string) => {
    setSizeGuides((prev) =>
      prev.map((sg) =>
        sg.id === id ? { ...sg, imageFile: undefined, imagePreview: undefined, imageUrl: undefined } : sg
      )
    );
  };

  // --- FAQ handlers ---
  const handleAddRow = () => {
    setItems((prev) => [...prev, { id: Date.now().toString(), question: '', answer: '' }]);
  };

  const handleDeleteRow = (id: string) => {
    if (items.find((i) => i.id === id)?.fixed) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdate = (id: string, field: 'question' | 'answer', value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // --- Situation handlers ---
  const handleAddSituation = () => {
    setSituations((prev) => [...prev, { id: Date.now().toString(), text: '' }]);
  };

  const handleDeleteSituation = (id: string) => {
    setSituations((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateSituation = (id: string, text: string) => {
    setSituations((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
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
          return {
            product_names: sg.productNames,
            // keep legacy product_name as first for backwards compat with backend prompt
            product_name: sg.productNames[0] || '',
            content: sg.content,
            image_url: imageUrl,
          };
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
      console.error('Failed to save:', error);
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
              <div className="flex items-center justify-between px-4 py-[0.85rem]">
                <div>
                  <p className="text-[0.78rem] text-text-primary font-[400] lowercase tracking-[-0.01em]">situations</p>
                  <p className="text-[0.65rem] text-text-tertiary mt-[2px]">real-time context Luna should be aware of</p>
                </div>
                <Toggle enabled={situationsEnabled} onToggle={() => setSituationsEnabled(!situationsEnabled)} />
              </div>

              {situationsEnabled && (
                <div className="border-t border-border">
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
              <div className="flex items-center justify-between px-4 py-[0.85rem]">
                <div>
                  <p className="text-[0.78rem] text-text-primary font-[400] lowercase tracking-[-0.01em]">size guides</p>
                  <p className="text-[0.65rem] text-text-tertiary mt-[2px]">help Luna share the right sizing info per product</p>
                </div>
                <Toggle enabled={sizeGuidesEnabled} onToggle={() => setSizeGuidesEnabled(!sizeGuidesEnabled)} />
              </div>

              {sizeGuidesEnabled && (
                <div className="border-t border-border">
                  {sizeGuides.length > 0 && (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary text-left px-4 py-[0.6rem] border-b border-border font-normal w-[38%]">
                            Products
                          </th>
                          <th className="text-[0.6rem] uppercase tracking-[0.08em] text-text-tertiary text-left px-4 py-[0.6rem] border-b border-border font-normal">
                            Size guide
                          </th>
                          <th className="text-[0.6rem] border-b border-border font-normal w-[40px]">&nbsp;</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizeGuides.map((sg) => {
                          // Products available to be added to THIS row = unassigned + already on this row
                          const pickableForRow = allProducts.filter(
                            (name) => !claimedProducts.has(name) || sg.productNames.includes(name)
                          );

                          return (
                            <tr
                              key={sg.id}
                              className="border-b border-border transition-colors duration-150 group/row"
                            >
                              {/* Left: split — selected pills top, searchable list bottom */}
                              <td className="border-r border-border align-top">
                                {/* Top: selected products */}
                                <div className="px-3 pt-3 pb-2 min-h-[40px] flex flex-wrap gap-[5px]">
                                  {sg.productNames.length === 0 ? (
                                    <span className="text-[0.65rem] text-text-tertiary italic">select products from below</span>
                                  ) : (
                                    sg.productNames.map((name) => (
                                      <button
                                        key={name}
                                        onClick={() => handleToggleProduct(sg.id, name)}
                                        title="Click to remove"
                                        className="inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-full bg-background3 border border-border-md text-[0.67rem] text-text-primary font-medium transition-all duration-150 hover:border-red-400/50 hover:text-red-400 group/pill"
                                      >
                                        {name}
                                        <svg className="w-[8px] h-[8px] opacity-40 group-hover/pill:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                          <line x1="18" y1="6" x2="6" y2="18" />
                                          <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                      </button>
                                    ))
                                  )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-border" />

                                {/* Bottom: search + scrollable product list */}
                                <div className="px-3 pt-2 pb-2">
                                  <input
                                    type="text"
                                    value={productSearch[sg.id] || ''}
                                    onChange={(e) =>
                                      setProductSearch((prev) => ({ ...prev, [sg.id]: e.target.value }))
                                    }
                                    placeholder="Search products…"
                                    className="w-full bg-background2 border border-border rounded-[6px] px-3 py-[5px] text-[0.68rem] text-text-secondary placeholder:text-text-tertiary outline-none focus:border-border-md transition-colors duration-150 mb-2"
                                  />
                                  <div className="flex flex-wrap gap-[5px] max-h-[90px] overflow-y-auto">
                                    {pickableForRow
                                      .filter((n) => !sg.productNames.includes(n))
                                      .filter((n) =>
                                        n.toLowerCase().includes((productSearch[sg.id] || '').toLowerCase())
                                      )
                                      .map((name) => (
                                        <button
                                          key={name}
                                          onClick={() => handleToggleProduct(sg.id, name)}
                                          className="inline-flex items-center gap-[4px] px-[9px] py-[3px] rounded-full border border-dashed border-border text-[0.67rem] text-text-tertiary hover:text-text-secondary hover:border-border-md hover:bg-background3 transition-all duration-150"
                                        >
                                          <svg className="w-[8px] h-[8px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                          </svg>
                                          {name}
                                        </button>
                                      ))}
                                    {pickableForRow.filter((n) => !sg.productNames.includes(n)).length === 0 && (
                                      <span className="text-[0.63rem] text-text-tertiary italic">all products selected</span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Right: chart image or text */}
                              <td className="px-4 py-0 align-top">
                                {sg.imagePreview || sg.imageUrl ? (
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
                                  <>
                                    <textarea
                                      value={sg.content}
                                      onChange={(e) => handleUpdateContent(sg.id, e.target.value)}
                                      placeholder="e.g. XS = chest 36cm, S = chest 38cm, M = chest 42cm, L = chest 46cm, XL = chest 50cm"
                                      rows={2}
                                      className="w-full min-h-[52px] px-4 py-[0.85rem] bg-transparent border-none outline-none resize-none text-[0.75rem] text-text-secondary placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200"
                                    />
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

                              {/* Delete row */}
                              <td className="px-4 py-0 text-center align-top pt-[0.85rem]">
                                <button
                                  onClick={() => handleDeleteSizeGuide(sg.id)}
                                  className="opacity-0 group-hover/row:opacity-100 hover:text-red-400 transition-all duration-150 p-1 text-text-tertiary"
                                  title="Remove"
                                >
                                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {/* Add size guide row button */}
                  <button
                    onClick={handleAddSizeGuide}
                    className="w-full flex items-center gap-2 border-0 px-4 py-3 text-[0.73rem] text-text-tertiary hover:text-text-secondary hover:bg-background3/50 transition-all duration-[180ms] text-left border-t border-border"
                  >
                    <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add size guide
                  </button>

                  {allProducts.length === 0 && (
                    <p className="px-4 pb-3 text-[0.68rem] text-text-tertiary">
                      No products found. Add products to your catalog first.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Save Row */}
            <div className="flex justify-end items-center gap-4 mt-1">
              {saved && <div className="text-[0.7rem] text-green-400">✓ Customize saved</div>}
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

      {/* Image preview modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-6"
          onClick={() => setModalImage(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[85vh] rounded-[8px] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={modalImage} alt="size guide preview" className="block max-w-[90vw] max-h-[85vh] object-contain" />
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
