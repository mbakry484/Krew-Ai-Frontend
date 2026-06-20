'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { getKnowledgeBase, saveKnowledgeBase, uploadSizeGuideImage, getProducts, uploadVoiceFile, getVoiceJobStatus, getVoiceProfile, updateVoiceProfile, activateVoiceProfile, deactivateVoiceProfile } from '@/lib/api';
import type { VoiceProfile } from '@/lib/api';
import LunaSidebar from '@/components/LunaSidebar';
import LunaTopBarActions from '@/components/LunaTopBarActions';
import Skeleton from '@/components/Skeleton';
import { useAgentName } from '@/components/AgentNameProvider';
import { ONBOARDING_STEPS, isSetupComplete } from '@/lib/onboarding';

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

interface Product {
  name: string;
  image?: string;
}

interface SituationItem {
  id: string;
  text: string;
}

interface SizeGuideItem {
  id: string;
  productNames: string[];
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

type DrawerType = 'knowledge' | 'situations' | 'sizing' | 'voice';

const drawerTitles = (name: string): Record<DrawerType, string> => ({
  knowledge: `What ${name} knows`,
  situations: `How ${name} acts`,
  sizing: 'Products & Sizing',
  voice: `${name}'s Voice`,
});

// Onboarding completion (ONBOARDING_STEPS) is the shared single source of truth
// in lib/onboarding.ts — imported above so the sidebar setup dot and this
// checklist never disagree. Step copy stays here (page-specific) and pulls the
// name from the shared agent-name source of truth (useAgentName()).
//
// Copy is intentionally action+benefit phrasing, decoupled from the card
// titles/subtitles — the step title is a verb-first action, the helper is the
// payoff. Editing card copy must NOT require editing this, and vice versa. The
// "Go"/"Edit" destinations are unchanged (see handleGoToStep): each step still
// routes to its existing card.
const stepCopy = (name: string): Record<DrawerType, { label: string; helper: string }> => ({
  knowledge: { label: `Start here: teach ${name} your top questions`, helper: 'Answer the questions customers ask every day, once.' },
  situations: { label: `Tell ${name} what to watch for`, helper: 'Out-of-stock items, active promos, anything she should flag.' },
  sizing: { label: 'Add your sizing info', helper: `So ${name} can answer "will this fit?" on her own.` },
  voice: { label: `Make ${name} sound like your brand`, helper: 'Train her tone from real conversations.' },
});

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function DrawerIcon({ type }: { type: DrawerType }) {
  const cls = 'w-[15px] h-[15px]';
  if (type === 'knowledge') return <BrainIcon className={cls} />;
  if (type === 'situations') return <ZapIcon className={cls} />;
  if (type === 'sizing') return <TagIcon className={cls} />;
  return <MicIcon className={cls} />;
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const agentName = useAgentName();
  const [items, setItems] = useState<KBItem[]>(FIXED_ITEMS);

  const [situationsEnabled, setSituationsEnabled] = useState(false);
  const [situations, setSituations] = useState<SituationItem[]>([]);

  const [sizeGuidesEnabled, setSizeGuidesEnabled] = useState(false);
  const [sizeGuides, setSizeGuides] = useState<SizeGuideItem[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const [productPickerOpen, setProductPickerOpen] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerTemp, setPickerTemp] = useState<string[]>([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [activeDrawer, setActiveDrawer] = useState<DrawerType | null>(null);

  // Onboarding checklist dismiss — session-only (resets on refresh, by design).
  // TODO(backend): persist a "dismissed/completed" flag so it stops reappearing.
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const cardRefs = useRef<{ [K in DrawerType]?: HTMLButtonElement | null }>({});

  const handleGoToStep = (key: DrawerType) => {
    cardRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setActiveDrawer(key);
  };

  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voiceDragOver, setVoiceDragOver] = useState(false);
  const voiceFileRef = useRef<HTMLInputElement>(null);

  // Voice profile state
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [voiceProfileLoading, setVoiceProfileLoading] = useState(false);
  const [voiceJobId, setVoiceJobId] = useState<string | null>(null);
  const [voiceProcessingStep, setVoiceProcessingStep] = useState('');
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [howToExpanded, setHowToExpanded] = useState(false);
  const [newToneChip, setNewToneChip] = useState('');
  const [newPhrase, setNewPhrase] = useState('');
  const voicePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

        const products: Product[] = (productsData?.products || []).map(
          (p: { name: string; image_url?: string; image?: string; images?: Array<{ src: string }> }) => ({
            name: p.name,
            image: p.image_url || p.image || p.images?.[0]?.src,
          })
        );
        setAllProducts(products);

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
                productNames: sg.product_names || (sg.product_name ? [sg.product_name] : []),
                content: sg.content || '',
                imageUrl: sg.image_url,
              })
            )
          );
        }
        // Fetch voice profile
        const vp = await getVoiceProfile();
        if (vp) setVoiceProfile(vp);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const claimedProducts = new Set(sizeGuides.flatMap((sg) => sg.productNames));

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

  const openProductPicker = (guideId: string, current: string[]) => {
    setProductPickerOpen(guideId);
    setPickerTemp([...current]);
    setPickerSearch('');
  };

  const closeProductPicker = () => {
    setProductPickerOpen(null);
    setPickerTemp([]);
    setPickerSearch('');
  };

  const togglePickerProduct = (name: string) => {
    setPickerTemp((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const confirmProductPicker = () => {
    if (!productPickerOpen) return;
    setSizeGuides((prev) =>
      prev.map((sg) =>
        sg.id === productPickerOpen ? { ...sg, productNames: pickerTemp } : sg
      )
    );
    closeProductPicker();
  };

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

  // Voice processing poll
  useEffect(() => {
    if (!voiceJobId) return;
    const progressSteps = [
      [0, 'Unzipping...'],
      [25, 'Reading your conversations...'],
      [50, 'Learning your style...'],
      [85, 'Almost done...'],
    ] as const;

    voicePollRef.current = setInterval(async () => {
      try {
        const result = await getVoiceJobStatus(voiceJobId);
        // null = 304 Not Modified, still processing — just keep polling
        if (!result) return;

        // Map progress number to human-readable step
        const step = [...progressSteps].reverse().find(([threshold]) => result.progress >= threshold);
        if (step) setVoiceProcessingStep(step[1]);

        if (result.status === 'ready') {
          // Job done — fetch the saved profile from DB
          const profile = await getVoiceProfile();
          if (profile) setVoiceProfile(profile);
          setVoiceJobId(null);
          setVoiceUploading(false);
          setVoiceFile(null);
        } else if (result.status === 'failed') {
          setVoiceError(result.error || 'Analysis failed. Please try again.');
          setVoiceJobId(null);
          setVoiceUploading(false);
        }
      } catch {
        // Don't kill the poll on transient errors — keep trying
      }
    }, 2000);
    return () => {
      if (voicePollRef.current) clearInterval(voicePollRef.current);
    };
  }, [voiceJobId]);

  const handleVoiceUpload = async () => {
    if (!voiceFile) return;
    setVoiceUploading(true);
    setVoiceError(null);
    setVoiceProcessingStep('Uploading...');
    try {
      const { job_id } = await uploadVoiceFile(voiceFile);
      setVoiceJobId(job_id);
      setVoiceProcessingStep('Unzipping...');
    } catch {
      setVoiceError('Upload failed. Please try again.');
      setVoiceUploading(false);
    }
  };

  const handleVoiceSave = async () => {
    if (!voiceProfile) return;
    setVoiceSaving(true);
    setVoiceError(null);
    try {
      const updated = await updateVoiceProfile(voiceProfile);
      setVoiceProfile(updated);
      setVoiceSaved(true);
      setTimeout(() => setVoiceSaved(false), 2500);
    } catch {
      setVoiceError('Failed to save. Please try again.');
    } finally {
      setVoiceSaving(false);
    }
  };

  const handleVoiceActivate = async () => {
    setVoiceError(null);
    try {
      await activateVoiceProfile();
      setVoiceProfile((prev) => prev ? { ...prev, is_active: true } : prev);
    } catch {
      setVoiceError('Failed to activate. Please try again.');
    }
  };

  const handleVoiceDeactivate = async () => {
    setVoiceError(null);
    try {
      await deactivateVoiceProfile();
      setVoiceProfile((prev) => prev ? { ...prev, is_active: false } : prev);
    } catch {
      setVoiceError('Failed to deactivate. Please try again.');
    }
  };

  const handleVoiceReanalyze = () => {
    // No dedicated re-analyze endpoint — reset to upload state
    setVoiceProfile(null);
    setVoiceFile(null);
    setVoiceError(null);
  };

  const handleCloseDrawer = () => {
    if (activeDrawer === 'knowledge') {
      setItems((prev) => prev.filter((item) => item.fixed || item.question.trim() || item.answer.trim()));
    }
    if (activeDrawer === 'situations') {
      setSituations((prev) => prev.filter((s) => s.text.trim()));
    }
    if (activeDrawer === 'sizing') {
      setSizeGuides((prev) => prev.filter((sg) => sg.productNames.length > 0 || sg.content.trim() || sg.imageUrl || sg.imageFile));
    }
    setActiveDrawer(null);
  };

  const handleAddRow = () => {
    setItems((prev) => [...prev, { id: Date.now().toString(), question: '', answer: '' }]);
  };

  const handleDeleteRow = (id: string) => {
    if (items.find((i) => i.id === id)?.fixed) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdate = (id: string, field: 'question' | 'answer', value: string) => {
    if (saveError) setSaveError(null);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleAddSituation = () => {
    setSituations((prev) => [...prev, { id: Date.now().toString(), text: '' }]);
  };

  const handleDeleteSituation = (id: string) => {
    setSituations((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateSituation = (id: string, text: string) => {
    setSituations((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
  };

  const handleSave = async () => {
    setSaveError(null);

    // Check for incomplete items: question without answer or answer without question
    const incompleteItem = items.find((i) => {
      if (i.fixed) return !i.answer.trim(); // fixed items must have an answer
      const hasQ = i.question.trim();
      const hasA = i.answer.trim();
      return (hasQ && !hasA) || (!hasQ && hasA);
    });

    if (incompleteItem) {
      if (incompleteItem.fixed) {
        setSaveError(`Please fill in the answer for "${incompleteItem.question}"`);
      } else if (incompleteItem.question.trim() && !incompleteItem.answer.trim()) {
        setSaveError('Please fill in the answer for your question');
      } else {
        setSaveError('Please fill in the question for your answer');
      }
      return;
    }

    setLoading(true);
    try {
      // Filter out completely empty custom items, keep fixed items always
      const faqs = items
        .filter((i) => i.fixed || (i.question.trim() && i.answer.trim()))
        .map(({ question, answer }) => ({ question, answer }));

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
            product_name: sg.productNames[0] || '',
            content: sg.content,
            image_url: imageUrl,
          };
        })
      );

      await saveKnowledgeBase(faqs, {
        situations_enabled: situationsEnabled,
        situations: situations.filter((s) => s.text.trim()).map((s) => ({ text: s.text })),
        size_guides_enabled: sizeGuidesEnabled,
        size_guides: processedSizeGuides,
      });

      // Clean up empty items after successful save
      setItems((prev) => prev.filter((i) => i.fixed || (i.question.trim() && i.answer.trim())));
      setSituations((prev) => prev.filter((s) => s.text.trim()));

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes kbSlideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes kbFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .kb-drawer-slide { animation: kbSlideInRight 0.27s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
        .kb-drawer-fade { animation: kbFadeIn 0.2s ease forwards; }
      ` }} />

      <div className="flex flex-1 gap-3 p-3 max-md:pt-[60px]">
        <LunaSidebar />

        <main className="flex-1 rounded-2xl border border-border overflow-y-auto bg-background2">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 max-md:px-4 pt-[1.6rem] pb-0 flex-wrap gap-3">
            <div>
              <h2 className="text-[1.4rem] font-[400] tracking-[-0.02em] text-text-primary mb-[0.15rem] lowercase">
                customize
              </h2>
              <p className="text-[0.72rem] text-text-secondary">
                teach {agentName} how to be yours
              </p>
            </div>
            <div className="max-md:hidden">
              <LunaTopBarActions />
            </div>
          </div>

          {/* Content */}
          <div className="px-8 max-md:px-4 py-8">

            {/* Loading — 2×2 card skeletons */}
            {pageLoading && (
              <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-background border border-border rounded-2xl p-6 min-h-[190px] flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <Skeleton className="w-9 h-9 rounded-xl" />
                      <Skeleton className="w-14 h-[0.5rem]" />
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      <Skeleton className="w-36 h-[0.68rem]" />
                      <Skeleton className="w-52 h-[0.5rem]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Onboarding setup checklist ──
                Inline, dismissible helper panel. NOT a modal — never gates the
                page; the cards below are usable immediately. Completion is
                mocked (ONBOARDING_STEPS); dismiss is session-only state.
                The whole panel auto-hides once all required steps are complete
                (isSetupComplete — same shared source; PRO/voice doesn't block),
                reusing the same hidden treatment as the dismiss (X) button.
                TODO(backend): "stays hidden permanently once complete" must be
                persisted server-side; today it's session state only. */}
            {!pageLoading && !onboardingDismissed && !isSetupComplete() && (() => {
              const copy = stepCopy(agentName);
              const completedCount = ONBOARDING_STEPS.filter((s) => s.completed).length;
              const totalSteps = ONBOARDING_STEPS.length;
              const progressPct = Math.round((completedCount / totalSteps) * 100);
              // Incomplete steps first so the next action is always at the top;
              // each keeps its original step number regardless of sort order.
              const orderedSteps = ONBOARDING_STEPS
                .map((step, index) => ({ step, number: index + 1 }))
                .sort((a, b) => Number(a.step.completed) - Number(b.step.completed));

              return (
                <div className="relative mb-4 bg-background border border-border rounded-2xl p-5 max-md:p-4">
                  <button
                    onClick={() => setOnboardingDismissed(true)}
                    aria-label="Dismiss setup checklist"
                    className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-[7px] text-text-tertiary hover:text-text-primary hover:bg-background3 transition-all duration-150"
                  >
                    <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                  {/* Header */}
                  <div className="pr-8">
                    <h3 className="text-[0.92rem] font-[450] text-text-primary tracking-[-0.015em]">
                      Set up {agentName} in 4 steps
                    </h3>
                    <p className="text-[0.68rem] text-text-tertiary mt-[3px] leading-[1.5]">
                      Finish setup so {agentName} can start helping your customers. You can do this anytime.
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-[5px] rounded-full bg-background3 overflow-hidden">
                      <div
                        className="h-full bg-text-primary/80 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[0.62rem] text-text-tertiary shrink-0 tabular-nums">
                      {completedCount} of {totalSteps} done
                    </span>
                  </div>

                  {/* Steps — completed ones collapse to a compact done row
                      (no helper, struck title, "Edit" instead of "Go") and sort
                      below the still-actionable steps. */}
                  <div className="mt-4 border border-border rounded-[12px] overflow-hidden divide-y divide-border">
                    {orderedSteps.map(({ step, number }) => (
                      <div
                        key={step.key}
                        className={`flex items-center gap-3 px-4 hover:bg-background3/40 transition-colors duration-150 ${
                          step.completed ? 'py-[0.5rem]' : 'py-[0.8rem]'
                        }`}
                      >
                        {/* Indicator */}
                        <span
                          className={`shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[0.58rem] transition-colors duration-150 ${
                            step.completed
                              ? 'bg-text-primary text-background'
                              : 'border border-border text-text-tertiary'
                          }`}
                        >
                          {step.completed ? (
                            <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            number
                          )}
                        </span>

                        {/* Label + helper (helper hidden once complete) */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[0.74rem] tracking-[-0.01em] ${step.completed ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                              {copy[step.key].label}
                            </span>
                            {step.optional && (
                              <span className="text-[0.52rem] text-[#a78bfa] border border-[#a78bfa]/25 bg-[#a78bfa]/5 rounded-[3px] px-[5px] py-[2px] uppercase tracking-[0.06em] shrink-0">
                                Pro
                              </span>
                            )}
                          </div>
                          {!step.completed && (
                            <p className="text-[0.62rem] text-text-tertiary mt-[1px] truncate">
                              {copy[step.key].helper}
                            </p>
                          )}
                        </div>

                        {/* Action — same destination either way (handleGoToStep) */}
                        {step.completed ? (
                          <button
                            onClick={() => handleGoToStep(step.key)}
                            className="shrink-0 text-[0.62rem] text-text-tertiary hover:text-text-secondary underline underline-offset-2 transition-colors duration-150"
                          >
                            Edit
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGoToStep(step.key)}
                            className="shrink-0 flex items-center gap-1 text-[0.68rem] text-text-secondary border border-border rounded-[7px] px-3 py-[5px] hover:text-text-primary hover:border-border-md hover:bg-background3 transition-all duration-150"
                          >
                            {step.optional ? 'Set up' : 'Go'}
                            <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 2×2 Card Grid */}
            {!pageLoading && (
              <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">

                {/* ── Card 1: What Luna knows ── */}
                <button
                  ref={(el) => { cardRefs.current.knowledge = el; }}
                  onClick={() => setActiveDrawer('knowledge')}
                  className="relative group overflow-hidden bg-background border border-border rounded-2xl p-6 text-left cursor-pointer transition-all duration-200 hover:border-border-md hover:-translate-y-px hover:shadow-lg min-h-[190px] flex flex-col"
                >
                  <div className="absolute right-[-18px] bottom-[-18px] opacity-[0.05] pointer-events-none">
                    <BrainIcon className="w-40 h-40" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-background3 border border-border flex items-center justify-center text-text-secondary">
                      <BrainIcon className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-[0.57rem] text-text-tertiary border border-border rounded-[4px] px-[6px] py-[3px]">
                      {items.length} entries
                    </span>
                  </div>
                  <div className="mt-auto pt-6">
                    <h3 className="text-[0.87rem] font-[450] text-text-primary tracking-[-0.015em] mb-[3px]">What {agentName} knows</h3>
                    <p className="text-[0.67rem] text-text-tertiary leading-[1.55]">FAQs, return &amp; refund policy, shipping, store info</p>
                  </div>
                </button>

                {/* ── Card 2: How Luna acts ── */}
                <button
                  ref={(el) => { cardRefs.current.situations = el; }}
                  onClick={() => setActiveDrawer('situations')}
                  className="relative group overflow-hidden bg-background border border-border rounded-2xl p-6 text-left cursor-pointer transition-all duration-200 hover:border-border-md hover:-translate-y-px hover:shadow-lg min-h-[190px] flex flex-col"
                >
                  <div className="absolute right-[-18px] bottom-[-18px] opacity-[0.05] pointer-events-none">
                    <ZapIcon className="w-40 h-40" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-background3 border border-border flex items-center justify-center text-text-secondary">
                      <ZapIcon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="flex items-center gap-2">
                      {situationsEnabled && (
                        <span className="w-[5px] h-[5px] rounded-full bg-green-400/80 shrink-0" />
                      )}
                      <span className="text-[0.57rem] text-text-tertiary border border-border rounded-[4px] px-[6px] py-[3px]">
                        {situations.length} situations
                      </span>
                    </div>
                  </div>
                  <div className="mt-auto pt-6">
                    <h3 className="text-[0.87rem] font-[450] text-text-primary tracking-[-0.015em] mb-[3px]">How {agentName} acts</h3>
                    <p className="text-[0.67rem] text-text-tertiary leading-[1.55]">Sales, restocks, promos, and situations to watch for</p>
                  </div>
                </button>

                {/* ── Card 3: Products & Sizing ── */}
                <button
                  ref={(el) => { cardRefs.current.sizing = el; }}
                  onClick={() => setActiveDrawer('sizing')}
                  className="relative group overflow-hidden bg-background border border-border rounded-2xl p-6 text-left cursor-pointer transition-all duration-200 hover:border-border-md hover:-translate-y-px hover:shadow-lg min-h-[190px] flex flex-col"
                >
                  <div className="absolute right-[-18px] bottom-[-18px] opacity-[0.05] pointer-events-none">
                    <TagIcon className="w-40 h-40" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-background3 border border-border flex items-center justify-center text-text-secondary">
                      <TagIcon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="flex items-center gap-2">
                      {sizeGuidesEnabled && (
                        <span className="w-[5px] h-[5px] rounded-full bg-green-400/80 shrink-0" />
                      )}
                      <span className="text-[0.57rem] text-text-tertiary border border-border rounded-[4px] px-[6px] py-[3px]">
                        {sizeGuides.length} guide{sizeGuides.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="mt-auto pt-6">
                    <h3 className="text-[0.87rem] font-[450] text-text-primary tracking-[-0.015em] mb-[3px]">Products & Sizing</h3>
                    <p className="text-[0.67rem] text-text-tertiary leading-[1.55]">Size charts and product details {agentName} shares when asked</p>
                  </div>
                </button>

                {/* ── Card 4: Luna's Voice ── */}
                <button
                  ref={(el) => { cardRefs.current.voice = el; }}
                  onClick={() => setActiveDrawer('voice')}
                  className="relative group overflow-hidden bg-background border border-border rounded-2xl p-6 text-left cursor-pointer transition-all duration-200 hover:border-border-md hover:-translate-y-px hover:shadow-lg min-h-[190px] flex flex-col"
                >
                  <div className="absolute right-[-18px] bottom-[-18px] opacity-[0.05] pointer-events-none">
                    <MicIcon className="w-40 h-40" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-background3 border border-border flex items-center justify-center text-text-secondary">
                      <MicIcon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="flex items-center gap-2">
                      {voiceProfile && (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${voiceProfile.is_active ? 'bg-green-400/80' : 'bg-text-tertiary/40'}`} />
                          <span className="text-[0.54rem] text-text-tertiary">
                            {voiceProfile.is_active ? 'Active' : 'Not set up'}
                          </span>
                        </div>
                      )}
                      <span className="text-[0.57rem] text-[#a78bfa] border border-[#a78bfa]/25 bg-[#a78bfa]/5 rounded-[4px] px-[6px] py-[3px] uppercase tracking-[0.06em]">
                        Pro
                      </span>
                    </div>
                  </div>
                  <div className="mt-auto pt-6">
                    <h3 className="text-[0.87rem] font-[450] text-text-primary tracking-[-0.015em] mb-[3px]">{agentName}&apos;s Voice</h3>
                    <p className="text-[0.67rem] text-text-tertiary leading-[1.55]">teach {agentName} how you actually talk</p>
                  </div>
                </button>

              </div>
            )}
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════
          Drawer
      ══════════════════════════════════════ */}
      {activeDrawer && (
        <div
          className="fixed inset-0 z-40 flex justify-end"
          onClick={handleCloseDrawer}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] kb-drawer-fade" />

          {/* Sheet */}
          <div
            className="relative flex flex-col w-full max-w-[540px] max-md:max-w-full h-full bg-background border-l border-border shadow-2xl kb-drawer-slide"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-[1.1rem] border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-background3 border border-border flex items-center justify-center text-text-secondary">
                  <DrawerIcon type={activeDrawer} />
                </div>
                <h3 className="text-[0.84rem] font-[450] text-text-primary tracking-[-0.015em]">
                  {drawerTitles(agentName)[activeDrawer]}
                </h3>
                {activeDrawer === 'voice' && (
                  <span className="text-[0.52rem] text-[#a78bfa] border border-[#a78bfa]/25 bg-[#a78bfa]/5 rounded-[3px] px-[5px] py-[2px] uppercase tracking-[0.06em]">
                    Pro
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeDrawer === 'voice' && voiceProfile && !voiceUploading && (
                  <button
                    onClick={handleVoiceReanalyze}
                    className="flex items-center gap-1.5 text-[0.62rem] text-text-tertiary border border-border rounded-[7px] px-2.5 py-[4px] hover:text-text-secondary hover:border-border-md hover:bg-background3 transition-all duration-150"
                  >
                    <svg className="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                    </svg>
                    Re-analyze
                  </button>
                )}
                <button
                  onClick={handleCloseDrawer}
                  className="w-7 h-7 flex items-center justify-center rounded-[8px] text-text-tertiary hover:text-text-primary hover:bg-background3 transition-all duration-150"
                >
                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── What Luna knows ── */}
              {activeDrawer === 'knowledge' && (
                <div className="px-6 py-5 flex flex-col gap-3">
                  <div className="bg-background2 border border-border rounded-[12px] overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary text-left px-4 py-[0.65rem] border-b border-border font-normal w-[40%]">
                            Question
                          </th>
                          <th className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary text-left px-4 py-[0.65rem] border-b border-border font-normal">
                            Answer
                          </th>
                          <th className="border-b border-border font-normal w-[36px]">&nbsp;</th>
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
                            <td className="px-4 py-0 border-r border-border">
                              {item.fixed ? (
                                <div className="flex items-start justify-between gap-2 py-[0.8rem]">
                                  <span className="text-[0.72rem] text-text-secondary font-medium leading-[1.5]">
                                    {item.question}
                                  </span>
                                  <span className="shrink-0 text-[0.52rem] uppercase tracking-[0.07em] text-text-tertiary border border-border rounded-[4px] px-[4px] py-[2px] mt-[1px]">
                                    req
                                  </span>
                                </div>
                              ) : (
                                <textarea
                                  value={item.question}
                                  onChange={(e) => handleUpdate(item.id, 'question', e.target.value)}
                                  placeholder="Type your question…"
                                  rows={1}
                                  className="w-full min-h-[48px] py-[0.8rem] bg-transparent border-none outline-none resize-none text-[0.72rem] text-text-secondary placeholder:text-text-tertiary font-medium focus:text-text-primary transition-colors duration-200"
                                  onInput={(e) => {
                                    const el = e.currentTarget;
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                  }}
                                  ref={(el) => {
                                    if (el) {
                                      el.style.height = 'auto';
                                      el.style.height = el.scrollHeight + 'px';
                                    }
                                  }}
                                />
                              )}
                            </td>
                            <td className="px-4 py-0">
                              <textarea
                                value={item.answer}
                                onChange={(e) => handleUpdate(item.id, 'answer', e.target.value)}
                                placeholder={item.placeholder ?? `Type the answer ${agentName} should give…`}
                                rows={2}
                                className={`w-full min-h-[48px] py-[0.8rem] bg-transparent border-none outline-none resize-none text-[0.72rem] placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200 ${
                                  item.fixed && !item.answer ? 'text-text-tertiary' : 'text-text-secondary'
                                }`}
                                onInput={(e) => {
                                  const el = e.currentTarget;
                                  el.style.height = 'auto';
                                  el.style.height = el.scrollHeight + 'px';
                                }}
                                ref={(el) => {
                                  if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                  }
                                }}
                              />
                            </td>
                            <td className="py-0 text-center">
                              {!item.fixed && (
                                <button
                                  onClick={() => handleDeleteRow(item.id)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150 p-1 text-text-tertiary"
                                  title="Remove"
                                >
                                  <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                      className="w-full flex items-center gap-2 px-4 py-3 text-[0.71rem] text-text-tertiary hover:text-text-secondary hover:bg-background3/50 transition-all duration-[180ms]"
                    >
                      <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add question
                    </button>
                  </div>
                </div>
              )}

              {/* ── How Luna acts ── */}
              {activeDrawer === 'situations' && (
                <div className="px-6 py-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-background2 border border-border rounded-[12px] px-4 py-[0.85rem]">
                    <div>
                      <p className="text-[0.75rem] text-text-primary font-[400] tracking-[-0.01em]">Enable situations</p>
                      <p className="text-[0.62rem] text-text-tertiary mt-[2px]">Turn on to let {agentName} be aware of real-time context</p>
                    </div>
                    <Toggle enabled={situationsEnabled} onToggle={() => setSituationsEnabled(!situationsEnabled)} />
                  </div>

                  {situationsEnabled && (
                    <div className="bg-background2 border border-border rounded-[12px] overflow-hidden">
                      {situations.map((sit) => (
                        <div
                          key={sit.id}
                          className="flex items-start gap-2 border-b border-border group hover:bg-background3/50 transition-colors duration-150"
                        >
                          <div className="flex-1 flex items-center gap-2 px-4 py-[0.75rem]">
                            <svg className="w-[11px] h-[11px] shrink-0 text-text-tertiary mt-[2px]" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="2" fill="currentColor" />
                              <circle cx="12" cy="5" r="1" fill="currentColor" />
                              <circle cx="12" cy="19" r="1" fill="currentColor" />
                            </svg>
                            <textarea
                              value={sit.text}
                              onChange={(e) => handleUpdateSituation(sit.id, e.target.value)}
                              placeholder="e.g. We are experiencing delays with deliveries and are working to resolve this as quickly as possible."
                              rows={1}
                              className="flex-1 bg-transparent border-none outline-none resize-none text-[0.73rem] text-text-secondary placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200 leading-[1.5] min-h-[24px]"
                              onInput={(e) => {
                                const el = e.currentTarget;
                                el.style.height = 'auto';
                                el.style.height = el.scrollHeight + 'px';
                              }}
                              ref={(el) => {
                                if (el) {
                                  el.style.height = 'auto';
                                  el.style.height = el.scrollHeight + 'px';
                                }
                              }}
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteSituation(sit.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-150 p-1 text-text-tertiary mt-[0.7rem] mr-3 shrink-0"
                            title="Remove"
                          >
                            <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={handleAddSituation}
                        className="w-full flex items-center gap-2 px-4 py-3 text-[0.71rem] text-text-tertiary hover:text-text-secondary hover:bg-background3/50 transition-all duration-[180ms] text-left"
                      >
                        <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add situation
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Products & Sizing ── */}
              {activeDrawer === 'sizing' && (
                <div className="px-6 py-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-background2 border border-border rounded-[12px] px-4 py-[0.85rem]">
                    <div>
                      <p className="text-[0.75rem] text-text-primary font-[400] tracking-[-0.01em]">Enable size guides</p>
                      <p className="text-[0.62rem] text-text-tertiary mt-[2px]">Let {agentName} share sizing info per product</p>
                    </div>
                    <Toggle enabled={sizeGuidesEnabled} onToggle={() => {
                      const next = !sizeGuidesEnabled;
                      setSizeGuidesEnabled(next);
                      if (next && sizeGuides.length === 0) {
                        handleAddSizeGuide();
                      }
                    }} />
                  </div>

                  {sizeGuidesEnabled && (
                    <div className="flex flex-col gap-3">
                      {sizeGuides.length > 0 && (
                        <div className="bg-background2 border border-border rounded-[12px] overflow-hidden">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary text-left px-4 py-[0.6rem] border-b border-border font-normal w-[40%]">
                                  Products
                                </th>
                                <th className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary text-left px-4 py-[0.6rem] border-b border-border font-normal">
                                  Size guide
                                </th>
                                <th className="border-b border-border font-normal w-[36px]">&nbsp;</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sizeGuides.map((sg) => (
                                <tr
                                  key={sg.id}
                                  className="border-b border-border transition-colors duration-150 group/row"
                                >
                                  <td className="border-r border-border align-top">
                                    {sg.productNames.length === 0 ? (
                                      <button
                                        onClick={() => openProductPicker(sg.id, sg.productNames)}
                                        className="w-full min-h-[80px] flex flex-col items-center justify-center gap-[6px] px-3 py-4 text-text-tertiary hover:text-text-secondary hover:bg-background3/50 transition-all duration-150 cursor-pointer"
                                      >
                                        <div className="w-8 h-8 rounded-full border border-dashed border-border-md flex items-center justify-center">
                                          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                          </svg>
                                        </div>
                                        <span className="text-[0.62rem]">Select products</span>
                                      </button>
                                    ) : (
                                      <div className="px-3 pt-3 pb-3 min-h-[52px] flex flex-wrap gap-[5px] items-center">
                                        {sg.productNames.map((name) => (
                                          <button
                                            key={name}
                                            onClick={() => handleToggleProduct(sg.id, name)}
                                            title="Click to remove"
                                            className="inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-full bg-background3 border border-border-md text-[0.62rem] text-text-primary font-medium transition-all duration-150 hover:border-red-400/50 hover:text-red-400 group/pill"
                                          >
                                            {name}
                                            <svg className="w-[7px] h-[7px] opacity-40 group-hover/pill:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                              <line x1="18" y1="6" x2="6" y2="18" />
                                              <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                          </button>
                                        ))}
                                        <button
                                          onClick={() => openProductPicker(sg.id, sg.productNames)}
                                          title="Add products"
                                          className="inline-flex items-center justify-center w-[24px] h-[24px] rounded-full border border-dashed border-border text-text-tertiary hover:text-text-secondary hover:border-border-md hover:bg-background3 transition-all duration-150 shrink-0"
                                        >
                                          <svg className="w-[9px] h-[9px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                          </svg>
                                        </button>
                                      </div>
                                    )}
                                  </td>

                                  <td className="px-3 py-0 align-top">
                                    {sg.imagePreview || sg.imageUrl ? (
                                      <div className="py-3 flex flex-col gap-2">
                                        <button
                                          onClick={() => setModalImage((sg.imagePreview || sg.imageUrl)!)}
                                          className="relative group/img w-full max-w-[200px] rounded-[6px] overflow-hidden border border-border hover:border-border-md transition-all duration-150"
                                        >
                                          <img
                                            src={sg.imagePreview || sg.imageUrl}
                                            alt="size guide"
                                            className="w-full h-[96px] object-cover block"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-all duration-150 flex items-center justify-center">
                                            <span className="opacity-0 group-hover/img:opacity-100 transition-opacity duration-150 text-white text-[0.62rem] tracking-[0.04em]">
                                              preview
                                            </span>
                                          </div>
                                        </button>
                                        <button
                                          onClick={() => handleRemoveSizeGuideImage(sg.id)}
                                          className="text-[0.6rem] text-text-tertiary hover:text-red-400 transition-colors duration-150 text-left w-fit"
                                        >
                                          remove image
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <textarea
                                          value={sg.content}
                                          onChange={(e) => handleUpdateContent(sg.id, e.target.value)}
                                          placeholder="e.g. XS = chest 36cm, S = 38cm, M = 42cm…"
                                          rows={2}
                                          className="w-full min-h-[48px] py-[0.8rem] bg-transparent border-none outline-none resize-none text-[0.72rem] text-text-secondary placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200"
                                        />
                                        {!sg.content.trim() && (
                                          <div className="pb-[0.65rem]">
                                            <button
                                              onClick={() => fileInputRefs.current[sg.id]?.click()}
                                              className="flex items-center gap-[5px] text-[0.6rem] text-text-tertiary hover:text-text-secondary border border-dashed border-border rounded-[4px] px-2 py-[3px] transition-all duration-150 hover:border-border-md"
                                            >
                                              <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                                              </svg>
                                              attach image
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

                                  <td className="py-0 text-center align-top pt-[0.8rem]">
                                    <button
                                      onClick={() => handleDeleteSizeGuide(sg.id)}
                                      className="opacity-0 group-hover/row:opacity-100 hover:text-red-400 transition-all duration-150 p-1 text-text-tertiary"
                                      title="Remove"
                                    >
                                      <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <button
                        onClick={handleAddSizeGuide}
                        className="w-full flex items-center gap-2 border border-dashed border-border rounded-[10px] px-4 py-3 text-[0.71rem] text-text-tertiary hover:border-border-md hover:text-text-secondary hover:bg-background3/50 transition-all duration-[180ms]"
                      >
                        <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add size guide
                      </button>

                      {allProducts.length === 0 && (
                        <p className="text-[0.65rem] text-text-tertiary">
                          No products found. Add products to your catalog first.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Luna's Voice ── */}
              {activeDrawer === 'voice' && (
                <div className="px-6 py-5 flex flex-col gap-4">

                  {/* STATE 2 — Uploading / Processing */}
                  {voiceUploading && (
                    <div className="flex flex-col items-center justify-center gap-5 py-16">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-border" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-[#a78bfa] animate-spin" />
                      </div>
                      <div className="text-center">
                        <p className="text-[0.78rem] text-text-primary font-[400]">{voiceProcessingStep || 'Processing...'}</p>
                        <p className="text-[0.62rem] text-text-tertiary mt-1.5">This usually takes 30–60 seconds</p>
                      </div>
                    </div>
                  )}

                  {/* STATE 1 — No profile yet (upload) */}
                  {!voiceUploading && !voiceProfile && (
                    <>
                      <div className="text-center pt-2 pb-1">
                        <h4 className="text-[0.88rem] font-[450] text-text-primary tracking-[-0.015em]">Upload your Instagram chat history</h4>
                        <p className="text-[0.68rem] text-text-tertiary mt-1.5 leading-[1.6] max-w-[360px] mx-auto">
                          {agentName} will study how you talk to customers and learn your voice
                        </p>
                      </div>

                      <div
                        className={`relative flex flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed px-6 py-14 text-center transition-all duration-200 ${
                          voiceDragOver
                            ? 'border-[#a78bfa]/50 bg-[#a78bfa]/5'
                            : 'border-border hover:border-border-md hover:bg-background3/20'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setVoiceDragOver(true); }}
                        onDragLeave={() => setVoiceDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setVoiceDragOver(false);
                          const file = e.dataTransfer.files[0];
                          if (file && (file.name.endsWith('.zip'))) setVoiceFile(file);
                        }}
                      >
                        {voiceFile ? (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-background3 border border-border flex items-center justify-center text-text-secondary">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-[0.73rem] text-text-primary font-medium">{voiceFile.name}</p>
                              <p className="text-[0.62rem] text-text-tertiary mt-1">{(voiceFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setVoiceFile(null)}
                                className="text-[0.62rem] text-text-tertiary hover:text-red-400 transition-colors duration-150"
                              >
                                remove
                              </button>
                              <button
                                onClick={handleVoiceUpload}
                                className="text-[0.62rem] bg-btn-bg text-btn-text px-4 py-[5px] rounded-[7px] font-medium hover:opacity-85 transition-opacity duration-200"
                              >
                                Analyze
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-background3 border border-border flex items-center justify-center text-text-tertiary">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-[0.73rem] text-text-secondary">Drop your zip file here</p>
                              <p className="text-[0.62rem] text-text-tertiary mt-[3px]">
                                or{' '}
                                <button
                                  onClick={() => voiceFileRef.current?.click()}
                                  className="underline hover:text-text-secondary transition-colors duration-150"
                                >
                                  browse files
                                </button>
                              </p>
                            </div>
                            <p className="text-[0.57rem] text-text-tertiary/60">Zip files only, up to 500MB</p>
                          </>
                        )}
                        <input
                          ref={voiceFileRef}
                          type="file"
                          accept=".zip"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setVoiceFile(file);
                            e.target.value = '';
                          }}
                        />
                      </div>

                      {/* How to get this file — expandable */}
                      <div className="bg-background2 border border-border rounded-[12px] overflow-hidden">
                        <button
                          onClick={() => setHowToExpanded(!howToExpanded)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-background3/40 transition-colors duration-150"
                        >
                          <span className="text-[0.68rem] text-text-secondary">How do I get this file?</span>
                          <svg className={`w-[11px] h-[11px] text-text-tertiary transition-transform duration-200 ${howToExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        {howToExpanded && (
                          <div className="px-4 pb-4 flex flex-col gap-2.5">
                            {[
                              'Go to Instagram → Settings → Accounts Center',
                              'Your information and permissions → Download your information',
                              'Select only "Messages"',
                              'Choose JSON format',
                              'Download when ready (Meta emails it)',
                              'Drop the zip here',
                            ].map((step, i) => (
                              <div key={i} className="flex items-start gap-2.5">
                                <span className="shrink-0 w-[18px] h-[18px] rounded-full border border-border flex items-center justify-center text-[0.54rem] text-text-tertiary mt-[1px]">
                                  {i + 1}
                                </span>
                                <p className="text-[0.66rem] text-text-secondary leading-[1.5]">{step}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {voiceError && (
                        <p className="text-[0.68rem] text-red-400 text-center">{voiceError}</p>
                      )}
                    </>
                  )}

                  {/* STATE 3 & 4 — Voice Profile (Ready / Active) */}
                  {!voiceUploading && voiceProfile && (
                    <>
                      {/* Currently active badge */}
                      {voiceProfile.is_active && (
                        <div className="flex items-center gap-2 bg-green-400/5 border border-green-400/15 rounded-[10px] px-4 py-2.5">
                          <span className="w-[6px] h-[6px] rounded-full bg-green-400/80 shrink-0" />
                          <span className="text-[0.68rem] text-green-400/90 font-[400]">Currently active</span>
                        </div>
                      )}

                      {/* Summary */}
                      {voiceProfile.summary && (
                        <div className="bg-background2 border border-border rounded-[12px] px-4 py-4">
                          <p className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary mb-2">{agentName}&apos;s understanding of your voice</p>
                          <p className="text-[0.72rem] text-text-secondary leading-[1.65] italic">{voiceProfile.summary}</p>
                        </div>
                      )}

                      {/* TONE — chips */}
                      <div className="bg-background2 border border-border rounded-[12px] px-4 py-4">
                        <p className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary mb-3">Tone</p>
                        <div className="flex flex-wrap gap-[6px]">
                          {voiceProfile.tone.map((t) => (
                            <button
                              key={t}
                              onClick={() => setVoiceProfile((p) => p ? { ...p, tone: p.tone.filter((x) => x !== t) } : p)}
                              className="inline-flex items-center gap-[5px] px-[10px] py-[5px] rounded-full bg-background3 border border-border-md text-[0.65rem] text-text-primary transition-all duration-150 hover:border-red-400/50 hover:text-red-400 group/chip"
                            >
                              {t}
                              <svg className="w-[7px] h-[7px] opacity-30 group-hover/chip:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          ))}
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="text"
                              value={newToneChip}
                              onChange={(e) => setNewToneChip(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newToneChip.trim()) {
                                  setVoiceProfile((p) => p ? { ...p, tone: [...p.tone, newToneChip.trim()] } : p);
                                  setNewToneChip('');
                                }
                              }}
                              placeholder="add..."
                              className="w-[60px] bg-transparent border-none outline-none text-[0.65rem] text-text-secondary placeholder:text-text-tertiary"
                            />
                          </div>
                        </div>
                      </div>

                      {/* HOW LUNA GREETS */}
                      <div className="bg-background2 border border-border rounded-[12px] px-4 py-4">
                        <p className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary mb-2">How {agentName} greets</p>
                        <textarea
                          value={voiceProfile.greeting}
                          onChange={(e) => setVoiceProfile((p) => p ? { ...p, greeting: e.target.value } : p)}
                          rows={2}
                          className="w-full bg-transparent border-none outline-none resize-none text-[0.72rem] text-text-secondary placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200 leading-[1.55]"
                          onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }}
                          ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                        />
                      </div>

                      {/* HOW LUNA CLOSES */}
                      <div className="bg-background2 border border-border rounded-[12px] px-4 py-4">
                        <p className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary mb-2">How {agentName} closes</p>
                        <textarea
                          value={voiceProfile.closing}
                          onChange={(e) => setVoiceProfile((p) => p ? { ...p, closing: e.target.value } : p)}
                          rows={2}
                          className="w-full bg-transparent border-none outline-none resize-none text-[0.72rem] text-text-secondary placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200 leading-[1.55]"
                          onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }}
                          ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                        />
                      </div>

                      {/* HANDLING COMPLAINTS */}
                      <div className="bg-background2 border border-border rounded-[12px] px-4 py-4">
                        <p className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary mb-2">Handling complaints</p>
                        <textarea
                          value={voiceProfile.complaint_handling}
                          onChange={(e) => setVoiceProfile((p) => p ? { ...p, complaint_handling: e.target.value } : p)}
                          placeholder="How the brand handles complaints..."
                          rows={2}
                          className="w-full bg-transparent border-none outline-none resize-none text-[0.72rem] text-text-secondary placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200 leading-[1.55]"
                          onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }}
                          ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                        />
                        {voiceProfile.complaint_example && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <p className="text-[0.54rem] uppercase tracking-[0.08em] text-text-tertiary mb-1.5">Example reply</p>
                            <textarea
                              value={voiceProfile.complaint_example}
                              onChange={(e) => setVoiceProfile((p) => p ? { ...p, complaint_example: e.target.value } : p)}
                              rows={2}
                              className="w-full bg-transparent border-none outline-none resize-none text-[0.66rem] text-text-tertiary italic placeholder:text-text-tertiary focus:text-text-primary transition-colors duration-200 leading-[1.55]"
                              onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }}
                              ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                            />
                          </div>
                        )}
                      </div>

                      {/* EMOJI VIBE — pill selector */}
                      <div className="bg-background2 border border-border rounded-[12px] px-4 py-4">
                        <p className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary mb-3">Emoji vibe</p>
                        <div className="flex gap-[6px]">
                          {(['none', 'light', 'moderate', 'heavy'] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => setVoiceProfile((p) => p ? { ...p, emoji_vibe: v } : p)}
                              className={`px-3 py-[5px] rounded-full text-[0.65rem] border transition-all duration-150 capitalize ${
                                voiceProfile.emoji_vibe === v
                                  ? 'bg-text-primary text-background border-text-primary'
                                  : 'bg-background3 text-text-secondary border-border hover:border-border-md'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* LANGUAGE MIX — visual bars */}
                      <div className="bg-background2 border border-border rounded-[12px] px-4 py-4">
                        <p className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary mb-3">Language mix</p>
                        <div className="flex flex-col gap-3">
                          {([
                            { key: 'english' as const, label: 'English' },
                            { key: 'arabic' as const, label: 'Arabic' },
                            { key: 'franco_arabic' as const, label: 'Franco Arabic' },
                          ]).map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-3">
                              <span className="text-[0.65rem] text-text-secondary w-[90px] shrink-0">{label}</span>
                              <div className="flex-1 h-[6px] rounded-full bg-background3 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-text-primary/60 transition-all duration-300"
                                  style={{ width: `${voiceProfile.language_mix[key]}%` }}
                                />
                              </div>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={voiceProfile.language_mix[key]}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                  setVoiceProfile((p) => p ? { ...p, language_mix: { ...p.language_mix, [key]: val } } : p);
                                }}
                                className="w-[42px] bg-background3 border border-border rounded-[5px] px-1.5 py-[2px] text-[0.62rem] text-text-secondary text-center outline-none focus:border-border-md transition-colors duration-150"
                              />
                              <span className="text-[0.57rem] text-text-tertiary">%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SIGNATURE PHRASES — chips */}
                      <div className="bg-background2 border border-border rounded-[12px] px-4 py-4">
                        <p className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary mb-3">Signature phrases</p>
                        <div className="flex flex-wrap gap-[6px]">
                          {voiceProfile.signature_phrases.map((phrase) => (
                            <button
                              key={phrase}
                              onClick={() => setVoiceProfile((p) => p ? { ...p, signature_phrases: p.signature_phrases.filter((x) => x !== phrase) } : p)}
                              className="inline-flex items-center gap-[5px] px-[10px] py-[5px] rounded-full bg-background3 border border-border-md text-[0.65rem] text-text-primary transition-all duration-150 hover:border-red-400/50 hover:text-red-400 group/chip"
                            >
                              &ldquo;{phrase}&rdquo;
                              <svg className="w-[7px] h-[7px] opacity-30 group-hover/chip:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          ))}
                          <div className="inline-flex items-center">
                            <input
                              type="text"
                              value={newPhrase}
                              onChange={(e) => setNewPhrase(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newPhrase.trim()) {
                                  setVoiceProfile((p) => p ? { ...p, signature_phrases: [...p.signature_phrases, newPhrase.trim()] } : p);
                                  setNewPhrase('');
                                }
                              }}
                              placeholder="Add phrase..."
                              className="w-[90px] bg-transparent border-none outline-none text-[0.65rem] text-text-secondary placeholder:text-text-tertiary"
                            />
                          </div>
                        </div>
                      </div>

                      {/* FORMALITY — pill selector */}
                      <div className="bg-background2 border border-border rounded-[12px] px-4 py-4">
                        <p className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary mb-3">Formality</p>
                        <div className="flex flex-wrap gap-[6px]">
                          {([
                            { value: 'very_casual' as const, label: 'Very casual' },
                            { value: 'casual' as const, label: 'Casual' },
                            { value: 'neutral' as const, label: 'Neutral' },
                            { value: 'formal' as const, label: 'Formal' },
                          ]).map(({ value, label }) => (
                            <button
                              key={value}
                              onClick={() => setVoiceProfile((p) => p ? { ...p, formality: value } : p)}
                              className={`px-3 py-[5px] rounded-full text-[0.65rem] border transition-all duration-150 ${
                                voiceProfile.formality === value
                                  ? 'bg-text-primary text-background border-text-primary'
                                  : 'bg-background3 text-text-secondary border-border hover:border-border-md'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* MESSAGE LENGTH — pill selector */}
                      <div className="bg-background2 border border-border rounded-[12px] px-4 py-4">
                        <p className="text-[0.57rem] uppercase tracking-[0.08em] text-text-tertiary mb-3">Message length</p>
                        <div className="flex gap-[6px]">
                          {(['short', 'medium', 'long'] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => setVoiceProfile((p) => p ? { ...p, message_length: v } : p)}
                              className={`px-3 py-[5px] rounded-full text-[0.65rem] border transition-all duration-150 capitalize ${
                                voiceProfile.message_length === v
                                  ? 'bg-text-primary text-background border-text-primary'
                                  : 'bg-background3 text-text-secondary border-border hover:border-border-md'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Deactivate link (for active profiles) */}
                      {voiceProfile.is_active && (
                        <div className="text-center pt-1">
                          <button
                            onClick={handleVoiceDeactivate}
                            className="text-[0.62rem] text-text-tertiary hover:text-red-400 underline underline-offset-2 transition-colors duration-150"
                          >
                            Deactivate {agentName}&apos;s Voice
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Footer — save button (knowledge/situations/sizing) */}
            {activeDrawer && activeDrawer !== 'voice' && (
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border shrink-0">
                <div className="flex-1 min-w-0">
                  {saved && <span className="text-[0.68rem] text-green-400">✓ Saved</span>}
                  {saveError && <span className="text-[0.68rem] text-red-400">{saveError}</span>}
                </div>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-btn-bg text-btn-text px-5 py-2 rounded-[8px] text-[0.75rem] font-medium hover:opacity-85 transition-opacity duration-200 disabled:opacity-50 shrink-0"
                >
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            )}

            {/* Footer — voice profile actions */}
            {activeDrawer === 'voice' && voiceProfile && !voiceUploading && (
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border shrink-0">
                <div className="flex-1 min-w-0">
                  {voiceSaved && <span className="text-[0.68rem] text-green-400">✓ Saved</span>}
                  {voiceError && <span className="text-[0.68rem] text-red-400">{voiceError}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVoiceSave}
                    disabled={voiceSaving}
                    className="px-4 py-[7px] rounded-[8px] text-[0.72rem] text-text-secondary border border-border hover:bg-background3 hover:border-border-md transition-all duration-150 disabled:opacity-50"
                  >
                    {voiceSaving ? 'Saving...' : 'Save changes'}
                  </button>
                  {!voiceProfile.is_active && (
                    <button
                      onClick={async () => {
                        await handleVoiceSave();
                        await handleVoiceActivate();
                        handleCloseDrawer();
                      }}
                      className="bg-btn-bg text-btn-text px-4 py-[7px] rounded-[8px] text-[0.72rem] font-medium hover:opacity-85 transition-opacity duration-200"
                    >
                      Activate {agentName}&apos;s Voice
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          Product picker modal (unchanged)
      ══════════════════════════════════════ */}
      {productPickerOpen !== null && (() => {
        const activeGuide = sizeGuides.find((sg) => sg.id === productPickerOpen);
        const pickable = allProducts.filter(
          (p) => !claimedProducts.has(p.name) || (activeGuide?.productNames ?? []).includes(p.name)
        );
        const filtered = pickable.filter((p) =>
          p.name.toLowerCase().includes(pickerSearch.toLowerCase())
        );
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-6"
            onClick={closeProductPicker}
          >
            <div
              className="bg-background border border-border rounded-[14px] shadow-2xl w-full max-w-[560px] flex flex-col overflow-hidden"
              style={{ maxHeight: '80vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-[0.83rem] font-medium text-text-primary tracking-[-0.01em]">Select products</h3>
                <button
                  onClick={closeProductPicker}
                  className="w-6 h-6 flex items-center justify-center rounded-[6px] text-text-tertiary hover:text-text-primary hover:bg-background3 transition-all duration-150"
                >
                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="px-5 py-3 border-b border-border">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-text-tertiary pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search products…"
                    autoFocus
                    className="w-full bg-background2 border border-border rounded-[8px] pl-8 pr-3 py-[7px] text-[0.73rem] text-text-secondary placeholder:text-text-tertiary outline-none focus:border-border-md transition-colors duration-150"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {filtered.length === 0 ? (
                  <p className="text-center text-[0.68rem] text-text-tertiary py-10">No products found</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {filtered.map((product) => {
                      const checked = pickerTemp.includes(product.name);
                      return (
                        <button
                          key={product.name}
                          onClick={() => togglePickerProduct(product.name)}
                          className="flex flex-col items-center gap-[6px] text-center group/card"
                        >
                          <div className={`relative w-full aspect-square rounded-[8px] overflow-hidden border transition-all duration-150 ${
                            checked ? 'border-text-primary ring-2 ring-text-primary/20' : 'border-border hover:border-border-md'
                          } bg-background3`}>
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-text-tertiary/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            )}
                            <div className={`absolute top-[6px] left-[6px] w-[16px] h-[16px] rounded-[4px] border flex items-center justify-center transition-all duration-150 ${
                              checked
                                ? 'bg-text-primary border-text-primary'
                                : 'border-white/60 bg-black/20 group-hover/card:bg-black/30'
                            }`}>
                              {checked && (
                                <svg className="w-[9px] h-[9px] text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-[0.62rem] text-text-secondary leading-tight w-full truncate px-[2px]">
                            {product.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <span className="text-[0.65rem] text-text-tertiary">{pickerTemp.length} selected</span>
                <div className="flex gap-2">
                  <button
                    onClick={closeProductPicker}
                    className="px-4 py-[6px] rounded-[8px] text-[0.72rem] text-text-secondary border border-border hover:bg-background3 transition-all duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmProductPicker}
                    className="px-4 py-[6px] rounded-[8px] text-[0.72rem] bg-btn-bg text-btn-text hover:opacity-85 transition-opacity duration-200 font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════
          Image preview modal (unchanged)
      ══════════════════════════════════════ */}
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
