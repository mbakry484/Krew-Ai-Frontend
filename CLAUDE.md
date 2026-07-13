# CLAUDE.md — Krew Frontend

Next.js 14 App Router · Tailwind · deployed on Railway.
Marketing site + dashboard for Krew (mykrew.co) — multi-agent platform.
Current launch state: **Ivy = live, Luna = beta, Nova = soon.**

## Hard rules — these override everything

1. **Read before write.** Every session starts read-only: inventory the files involved, output a plan listing exactly which files you will create/modify, and WAIT for approval. No code before the plan is approved.
2. **Registry is law.** All agent data (name, role, status, accent color, tagline, route, mascot) lives ONLY in `lib/agents.ts` and per-agent content configs. Never hardcode an agent name, color, or status inside a page or component. Acceptance test: `grep -ri "luna\|ivy\|nova" app/ components/` returns zero marketing-copy hits outside registry/content/copy files.
3. **No invented copy.** All user-facing strings come from `content/COPY.md`. If a string is missing, STOP and ask — never draft placeholder marketing copy.
4. **No invented colors.** Only tokens from `KREW-DESIGN.md`. No new hex values, no new gradients. Base #0A0A0A, elevated surface #161618, one accent per agent.
5. **No new dependencies** without asking first. Prefer what already exists in the repo.
6. **Reuse the shell.** Study existing layout/section components before creating new ones. New components only when nothing existing fits.
7. **Everyone works directly on `dev` — NEVER create a new branch.** (Changed 2026-07-13: parallel sessions each spawning feature branches in one shared folder caused divergence chaos.) Workflow: at session start `git checkout dev && git pull origin dev`; commit small and often; every commit leaves `npm run build` passing; `git push origin dev` at least at session end so parallel sessions stay in sync. The partner merges `dev` → `main` for prod. Old `feat/*` branches are legacy — do not resume them.
8. **Stay in scope.** Only touch files belonging to the current session's phase (see `KREW-RELAUNCH.md`). Do not opportunistically refactor unrelated code.
9. **Never kill processes broadly.** Never run `killall node`, `pkill node`, or equivalent. Stop only your own dev server, by its specific port or PID.
10. **Log progress.** At the end of every session, update KREW-RELAUNCH.md: check off completed items (- [x]) and add a one-line "Session N — done, <date>" note to the session table row. Include this in the final commit.


## Key files
- `KREW-RELAUNCH.md` — the relaunch plan and session breakdown. Always check which session we are in.
- `KREW-DESIGN.md` — design tokens and anti-drift checklist.
- `content/COPY.md` — the only source of user-facing strings.
- `public/mascots/` — agent mascot SVGs.
- `design-refs/` — visual references (agent cards, dashboard screenshots, current homepage). Open these when building UI; match their craft level.

## Docs hygiene
Loose status/integration .md files belong in `docs/`, not root. Root keeps only: README.md, CLAUDE.md, KREW-RELAUNCH.md, KREW-DESIGN.md.
