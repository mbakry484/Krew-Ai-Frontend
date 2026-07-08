import Button from '@/components/Button';

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

// ─── Roster data (Section 5) ──────────────────────────────────────────────────
const ROSTER: Array<{ name: string; role: string; status: string; live: boolean }> = [
  { name: 'Luna', role: 'Customer Operations',    status: 'Live', live: true  },
  { name: 'Ivy',  role: 'Financial Visibility',   status: 'Soon', live: false },
  { name: '—',    role: 'Performance Reporting',  status: 'Soon', live: false },
  { name: '—',    role: 'Marketing Intelligence', status: 'Soon', live: false },
];

// ─── The Belief tenets (Section 4) ────────────────────────────────────────────
const TENETS: Array<{ num: string; text: string }> = [
  { num: '01', text: "The best-run brands won't be the ones with the biggest teams. They'll be the ones with the right agents." },
  { num: '02', text: "Doing everything by hand isn't dedication. It's what's holding your brand back." },
  { num: '03', text: 'You shouldn’t need to hire a team to run your store. You should get one from day one.' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VisionPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── SECTION 1 — THE DECLARATION (hero) ── */}
      <section className="pt-32 md:pt-40 pb-24 md:pb-28 px-8">
        <div className="max-w-[1100px] mx-auto">
          <Eyebrow>Krew — A New Operating Model for Brands</Eyebrow>
          <h1 className="text-[clamp(2.6rem,7vw,5.5rem)] font-bold tracking-[-0.04em] leading-[1.02] text-text-primary">
            Founders should build.<br />
            Agents should operate.
          </h1>
          <p className="mt-8 text-[clamp(0.95rem,1.4vw,1.15rem)] text-text-secondary font-light leading-[1.7] max-w-[560px]">
            Krew gives every brand an AI-powered operations team — so the people who start
            companies can go back to building them.
          </p>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 2 — THE OLD WAY ── */}
      <section className="py-24 md:py-28 px-8">
        <div className="max-w-[1100px] mx-auto">
          <Eyebrow>The Old Way</Eyebrow>
          <div className="max-w-[680px] space-y-6 text-[clamp(1.15rem,2vw,1.7rem)] font-light tracking-[-0.02em] leading-[1.45] text-text-secondary">
            <p>For a decade, running a brand meant becoming its back office.</p>
            <p>
              Answering the same DM at midnight. Chasing orders by hand. Logging refunds in a
              spreadsheet nobody asked for.
            </p>
            <p>
              The operator got buried under the operation. Founders stopped building the thing —
              and spent their days running it.
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 3 — THE TURN ── */}
      <section className="py-36 md:py-44 px-8">
        <div className="max-w-[1100px] mx-auto text-center">
          <h2 className="text-[clamp(3rem,9vw,7rem)] font-bold tracking-[-0.045em] leading-[1] text-text-primary">
            That era is ending.
          </h2>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 4 — THE BELIEF ── */}
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

      {/* ── SECTION 5 — THE KREW (roster) ── */}
      <section className="py-24 md:py-28 px-8">
        <div className="max-w-[1100px] mx-auto">
          <Eyebrow>The Krew</Eyebrow>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light tracking-[-0.03em] leading-[1.15] text-text-primary max-w-[620px]">
            One platform.<br />A growing family of agents.
          </h2>
          <p className="mt-6 text-[clamp(0.9rem,1.3vw,1.05rem)] text-text-secondary font-light leading-[1.8] max-w-[520px]">
            Luna is the first. A named, specialized team is being built behind her — each agent
            owning a distinct layer of how a brand runs.
          </p>

          <div className="mt-14 border-t border-border">
            {ROSTER.map((agent, i) => (
              <div
                key={`${agent.role}-${i}`}
                className="flex items-center justify-between py-5 border-b border-border"
              >
                <div className="flex items-center gap-4">
                  <span className={`text-[0.95rem] tracking-[-0.01em] ${agent.live ? 'text-text-primary' : 'text-text-tertiary'}`}>
                    {agent.name}
                  </span>
                  <span className={`text-[0.55rem] uppercase tracking-[0.07em] px-[7px] py-[2px] rounded border ${
                    agent.live
                      ? 'border-[rgba(61,187,119,0.4)] text-[#3dbb77]'
                      : 'border-border text-text-tertiary'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <span className={`text-[0.78rem] ${agent.live ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                  {agent.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 6 — THE HORIZON (mission & vision) ── */}
      <section className="py-24 md:py-28 px-8">
        <div className="max-w-[1100px] mx-auto">
          <Eyebrow>Mission &amp; Vision</Eyebrow>
          <div className="grid md:grid-cols-2 gap-x-20 gap-y-12 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-text-tertiary mb-[16px]">Mission</p>
              <p className="text-[clamp(1rem,1.6vw,1.3rem)] text-text-secondary font-light leading-[1.6] tracking-[-0.015em]">
                To give every MENA brand owner an AI-powered operations team — starting with
                customer support, expanding across every repetitive task that slows growth.
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-text-tertiary mb-[16px]">Vision</p>
              <p className="text-[clamp(1rem,1.6vw,1.3rem)] text-text-secondary font-light leading-[1.6] tracking-[-0.015em]">
                The MENA brands defining the next decade won’t be run by the biggest teams.
                They’ll be run by founders and their Krew — always on, always accurate,
                operating in the background while the founder builds in the foreground.
              </p>
            </div>
          </div>

          <p className="mt-16 md:mt-20 text-[clamp(1.4rem,3vw,2.4rem)] font-bold tracking-[-0.03em] leading-[1.25] text-text-primary max-w-[820px]">
            This is the new era of e-commerce. It starts here.
          </p>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 7 — THE INVITATION (close) ── */}
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
