import Button from '@/components/Button';
import AgentStatusBadge from '@/components/agents/AgentStatusBadge';
import VisionFilms from '@/components/vision/VisionFilms';
import VisionTodo from '@/components/vision/VisionTodo';
import { AGENTS } from '@/lib/agents';

// =============================================================================
// /about/vision — the film-led manifesto page (COPY.md "ABOUT / VISION").
// Films hero (headline + vision body + accordion) → the "Today" list ("Founders
// should build. Agents should operate.", shown as one iPhone whose busywork
// gets struck through on scroll) → belief tenets → roster → invitation. The old
// "The Old Way" / "That era is ending." / Mission & Vision beats and the
// abstract declaration text are retired — the films and the list carry that
// story now. Roster renders from the registry.
// =============================================================================

// ─── Shared primitives ────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.12em] text-text-tertiary mb-[18px]">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-[0.5px] bg-border" />;
}

// ─── The Belief tenets ────────────────────────────────────────────────────────
const TENETS: Array<{ num: string; text: string }> = [
  { num: '01', text: "The best-run brands won't be the ones with the biggest teams. They'll be the ones with the right agents." },
  { num: '02', text: "Doing everything by hand isn't dedication. It's what's holding your brand back." },
  { num: '03', text: 'You shouldn’t need to hire a team to run your store. You should get one from day one.' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VisionPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── SECTION 1 — THE FILMS HERO ── */}
      <div className="pt-28 md:pt-36 pb-14 md:pb-28">
        <VisionFilms />
      </div>

      <Divider />

      {/* ── SECTION 2 — THE "TODAY" LIST (shows the declaration) ── */}
      <VisionTodo />

      <Divider />

      {/* ── SECTION 3 — THE BELIEF ── */}
      <section className="py-24 md:py-28 px-8">
        <div className="max-w-[1100px] mx-auto">
          <Eyebrow>What We Believe</Eyebrow>
          <div className="mt-4 border-t border-border">
            {TENETS.map((tenet) => (
              <div
                key={tenet.num}
                className="flex flex-col gap-3 md:flex-row md:gap-10 py-8 border-b border-border"
              >
                <span className="text-[11px] uppercase tracking-[0.12em] text-text-tertiary pt-1 md:w-[60px] shrink-0 tabular-nums">
                  {tenet.num}
                </span>
                <p className="text-[clamp(1.25rem,2.4vw,2rem)] font-bold tracking-[-0.025em] leading-[1.3] text-text-primary max-w-[760px]">
                  {tenet.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 4 — THE KREW (roster, from the registry) ── */}
      <section className="py-24 md:py-28 px-8">
        <div className="max-w-[1100px] mx-auto">
          <Eyebrow>The Krew</Eyebrow>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light tracking-[-0.03em] leading-[1.15] text-text-primary max-w-[620px]">
            One platform.<br />A growing family of agents.
          </h2>

          <div className="mt-14 border-t border-border">
            {AGENTS.map((agent) => (
              <div
                key={agent.slug}
                className="flex items-center justify-between py-5 border-b border-border"
              >
                <div className="flex items-center gap-4">
                  <span className={`text-[0.95rem] tracking-[-0.01em] ${agent.status === 'soon' ? 'text-text-tertiary' : 'text-text-primary'}`}>
                    {agent.name}
                  </span>
                  <AgentStatusBadge agent={agent} />
                </div>
                <span className={`text-[0.78rem] ${agent.status === 'soon' ? 'text-text-tertiary' : 'text-text-secondary'}`}>
                  {agent.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 5 — THE INVITATION (close) ── */}
      <section className="py-36 md:py-44 px-8">
        <div className="max-w-[1100px] mx-auto text-center">
          <h2 className="text-[clamp(2.4rem,6vw,4.5rem)] font-bold tracking-[-0.04em] leading-[1.05] text-text-primary">
            This is Krew.<br />
            Come build. We&apos;ll handle the rest.
          </h2>
          <div className="mt-10">
            <Button href="/early-access" variant="primary">
              Join the early access →
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
