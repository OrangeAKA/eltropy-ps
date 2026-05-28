# Eltropy Mission Control — Spec-Grade Prototype

A clickable demonstration of the **Mission Control + Agent Exchange** product line proposed in the accompanying BID. Built for the Eltropy FDPM evaluation, May 2026.

**Live demo:** [eltropy-ps.vercel.app](https://eltropy-ps.vercel.app)

---

## What this is, and what it isn't

This is a **spec-grade prototype**, not a polished demo. The visual fidelity targets a real product, but every backend integration is mocked. The point is to demonstrate the **shape** of the system so engineering can preserve interfaces and replace implementations.

| Layer | This prototype | Production |
|---|---|---|
| UI | Real (Next.js 16, React 19, Tailwind v4, shadcn/ui) | Same |
| Orchestrator pipeline | Real shapes, real interfaces | Same shapes, real adapters |
| Skill executors | Mock outputs, real logic where appropriate (loan decisioning has actual rule-based scoring) | Same interfaces, real systems |
| Adapters (Symitar, MeridianLink) | Mock — returns synthetic data | Real SymXchange + MeridianLink Consumer API clients |
| Speech-to-text | Browser Web Speech API (free, client-side) | Whisper, Deepgram, or equivalent CFI-compliant STT |
| Intent classifier | Keyword heuristic | LLM-backed (Claude Haiku, GPT-4o-mini) |
| Guardrails / policy engine | Mock rule evaluator | Real rules engine + LLM policy classifier |
| Data store | Static TypeScript constants | Symitar / Keystone / Fiserv DNA via adapters |

**Engineering's job:** replace mock implementations. Keep the interfaces.

---

## The product, in one screen

Split-screen single-page app:

- **Left pane — Mission Control admin:** Three tabs (Catalog, Composer, Runtime). The Catalog lists 10 skills (6 Eltropy-authored, 4 from fintech partners as marketplace placeholders — Akuvo, MeridianLink, Velera, Verafin). The Composer renders the One-Conversation Lending workflow as a 5-node graph with guardrails visible per step. The Runtime tab streams the live audit log in Datadog-style monospace.

- **Right pane — Loan Officer's Copilot view:** Officer identity strip at top, member context card (populates dynamically from member resolution), conversation thread, and a Copilot sidebar that surfaces intent classification, active skill, and the final loan offer with a Confirm / Modify gate (the human-in-the-loop pause).

- **Trigger entry:** Click "Send trigger" in the header. Modal offers three modes: speak as the member via the browser's mic, paste a preset scenario for one of the two named members, or type the message manually. All three feed the same `trigger.receive()` entry point.

---

## Try the demo

1. Open [eltropy-ps.vercel.app](https://eltropy-ps.vercel.app) in Chrome or Edge (Web Speech requires it).
2. Click **Send trigger** in the top right.
3. Pick a member (Michael Tanaka or Maria Vega) and either:
   - Click **Speak as [member]** and speak the message into your mic
   - Click **Use preset** to load a pre-written message
   - Type freely in the textarea
4. Click **Send to Mission Control**.
5. Watch the left pane: the Composer auto-switches to the Runtime tab, audit log streams, skill cards in the Composer light up in sequence.
6. Watch the right pane: member context populates, intent classification surfaces, Copilot pane streams status, then a structured loan offer appears with **Confirm & Send** + **Modify** buttons.
7. Click **Confirm & Send** to dispatch the e-sign skill. Demo completes with a summary card.
8. Click **Reset** in the header to start over with a different trigger.

The two preset members produce different outcomes because the decisioning skill runs real rule-based logic:

- **Michael Tanaka** (FICO 758, prime, 8.2y tenure) → 5.99% APR auto loan (prime band, tenure-adjusted)
- **Maria Vega** (FICO 692, standard, 3.5y tenure) → 8.99% APR (near-prime band, tenure adjustment, refi inquiry)

Change `data/members.ts` FICO values, and the outputs change accordingly. **The system adapts to the data, not to a script.**

---

## Architecture

```
TRIGGER ──▶ RESOLVE ──▶ CLASSIFY ──▶ ROUTE ──▶ RUN
   │           │            │           │         │
   │           │            │           │         └── lib/orchestrator/workflow-runner.ts
   │           │            │           │             walks workflow steps, evaluates
   │           │            │           │             guardrails, executes skills
   │           │            │           │             against context
   │           │            │           │
   │           │            │           └── lib/orchestrator/workflow-router.ts
   │           │            │               intent → workflow ID
   │           │            │
   │           │            └── lib/orchestrator/intent-classifier.ts
   │           │                free text → structured intent + entities
   │           │
   │           └── lib/orchestrator/member-resolver.ts
   │               phone → member (calls Symitar adapter)
   │
   └── lib/orchestrator/trigger-handler.ts
       top-level entry point; takes a TriggerEvent
```

State management: `lib/demo-state.ts` exports a pure reducer. `lib/hooks/useDemoController.ts` wraps the reducer and bridges async orchestrator events to dispatched actions. UI is purely a reflection of reducer state — no orchestration logic in components.

---

## Project layout

```
app/                          # Next.js App Router
  layout.tsx                  # Root layout
  page.tsx                    # Main split-screen page
  globals.css                 # Tailwind v4 entry

components/
  AppHeader.tsx               # Branding, connection-status indicators, demo controls
  AppFooter.tsx               # Disclaimer + live clock
  TriggerModal.tsx            # 3-mode trigger entry: speak / preset / type
                              # Integrates browser Web Speech API for live STT
  mission-control/            # Left pane components
    MissionControlPane.tsx
    CatalogTab.tsx
    ComposerTab.tsx
    RuntimeTab.tsx
    SkillDetailModal.tsx
  copilot/                    # Right pane components
    CopilotPane.tsx
    MemberContextCard.tsx
    ConversationThread.tsx
    CopilotSidebar.tsx
  shared/
    SkillCard.tsx             # Reusable skill card with state variants
    AuditLogEntry.tsx         # Single log line with timestamps + level color
  ui/                         # shadcn/ui primitives (auto-generated)

lib/
  types.ts                    # Central type definitions
  demo-state.ts               # useReducer state machine
  hooks/
    useDemoController.ts      # React hook bridging reducer to orchestrator
  orchestrator/               # Spec-grade pipeline
    trigger-handler.ts
    member-resolver.ts
    intent-classifier.ts
    workflow-router.ts
    workflow-runner.ts
  skills/                     # Skill executors (one file per skill)
    member-lookup.ts
    identity-verification.ts
    soft-credit-pull.ts
    loan-decisioning.ts       # REAL rule-based scoring
    e-sign-dispatch.ts
  adapters/                   # System-of-record adapters
    symitar-mock.ts           # Replace with real SymXchange client
    meridianlink-mock.ts      # Replace with real MeridianLink Consumer
  guardrails/
    policy-engine.ts          # Guardrail evaluator

data/                         # Static demo data — replace with live adapters
  members.ts                  # 2 mock members (Michael Tanaka, Maria Vega)
  triggers.ts                 # 2 preset trigger scenarios
  skills.ts                   # 10 skill manifests
  workflows.ts                # 2 workflow definitions
  demo-script.ts              # Reference for audit-log message formatting
```

---

## What engineering needs to do to ship this for real

The interfaces are the contract. Production replaces the bodies.

1. **Replace `lib/adapters/symitar-mock.ts`** with a real Symitar SymXchange client. Match the function signatures (`lookupByPhone`, `lookupById`, `getAccountSummary`).
2. **Replace `lib/adapters/meridianlink-mock.ts`** with a real MeridianLink Consumer client. Match `runSoftCreditPull`.
3. **Replace `lib/orchestrator/intent-classifier.ts`** body with an LLM-backed classifier (Claude Haiku 4.5 is a good fit for the cost and latency profile). Keep the same `classifyIntent(body): Promise<IntentClassification>` signature.
4. **Replace `lib/skills/loan-decisioning.ts`** rule-based logic with the bank's actual underwriting engine. The structured output (`LoanOffer` with rationale string) stays.
5. **Replace `lib/skills/e-sign-dispatch.ts`** with a real DocuSign or OneSpan call. Same outputs.
6. **Build a real `lib/guardrails/policy-engine.ts`** with a proper rules DSL. Mock evaluator is sufficient to demonstrate the pattern.
7. **Add real STT** — swap browser Web Speech for Whisper API or Deepgram via a Vercel serverless route. UI integration in `TriggerModal.tsx` stays.
8. **Persist audit logs** — currently in React state, needs to write to an immutable log store (S3 + a query layer, or a dedicated observability backend).
9. **Add real auth + multi-tenant scoping.** This prototype has no auth.

The component layer, state machine, orchestrator pipeline shape, and skill manifest schemas should not change.

---

## Local development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in Chrome.

```bash
npm run build      # Production build
npm run lint       # ESLint check
```

---

## Tech stack

- **Next.js 16.2** with App Router and Turbopack
- **React 19.2**
- **TypeScript** strict mode
- **Tailwind CSS v4**
- **shadcn/ui** (Card, Tabs, Button, Badge, ScrollArea, Separator, Avatar, Dialog, Textarea)
- **Framer Motion** for skill execution animations and live transitions
- **Lucide React** for icons
- Deployed to **Vercel** via the Vercel CLI

---

## A note on STT choice

The prototype uses the browser's built-in Web Speech API (Chrome / Edge). This was a deliberate choice for the prototype: zero backend, zero API keys, free, real-time streaming results. Word error rate of 4-7% on American English is good enough to demonstrate the orchestrator's ability to handle voice → text → intent → workflow.

Production would not use Web Speech — Google's STT lacks the accuracy on accented speech and noisy environments that a CFI-grade voice channel needs. The intended swap is OpenAI Whisper or Deepgram Nova-3 via a Vercel serverless function. The `TriggerModal.tsx` integration point stays the same; only the implementation behind the `onresult` callback changes.

---

*Built with Claude Code for the Eltropy FDPM evaluation. Krishna Akhil Allumolu, May 2026.*
