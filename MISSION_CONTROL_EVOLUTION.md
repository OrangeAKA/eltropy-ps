# Eltropy Mission Control — Prototype Evolution

## What We Started With (V1)

The prototype demonstrated a fully AI-orchestrated contact center pipeline for credit union operations. The core premise: the AI handles intake, triage, and processing while the officer retains accountability at defined decision gates.

**Capabilities live in V1:**

- LLM intent classification (Claude Haiku) routing voice and SMS inputs to the correct workflow
- Member lookup and identity verification with confidence scoring
- **One-Call Lending** — soft credit pull, risk-banded loan decisioning, officer review of offer, e-sign dispatch
- **Auto Refinance** — comparative rate pass against existing auto loan, officer review before presenting delta
- **Card Dispute Resolution** — Reg E triage, provisional credit eligibility check ($2,500 threshold), Velera network filing
- **Balance Inquiry** — account summary and recent transactions surfaced to officer for member readback
- **Internal Funds Transfer** — step-up authentication gate, daily-limit policy check, officer confirmation before execution
- FFIEC risk-based MFA: verbal authorization on authenticated voice channel for amounts under $25K; push or secure-link for higher amounts or digital channels
- Full audit trail with rule citations at every step (Reg E, GLBA, NCUA Part 707, FFIEC MFA Guidance)
- Architecture modal showing the live skill pipeline, rules engine, and flow trace

**Guardrails enforced in V1:**

- Identity confidence threshold — hands off to officer if below 75%
- Step-up auth required before any account-impacting action
- Daily transfer limit ($50K cap, Reg E §1005.10 citation surfaced on breach)
- Synchronous officer confirmation before any funds move
- Loan offer not presented to member until officer reviews and approves

---

## What V2 Adds and Why

Three structural gaps surfaced after reviewing the V1 architecture against how credit unions actually operate.

---

### 1. Autonomous Zone — Informational Requests Need No Officer

Balance inquiries and transaction history lookups now complete without entering the officer pipeline at all.

An officer confirming a balance readback adds no compliance value. Roughly 60–65% of CU contact center volume is informational — members checking balances, recent transactions, rates, hours. Keeping these in the officer approval loop consumes agent time on the lowest-value interaction type. Removing officer gates from purely informational flows frees capacity for interactions that actually require judgment.

---

### 2. Three-Tier Transfer Model — Risk-Proportionate Processing

Transfers now route based on dollar amount rather than treating all transfers identically:

| Amount | Path |
|--------|------|
| Below $2,500, voice-authenticated channel | Executes autonomously — no officer gate |
| $2,500 – $25,000 | Stages for officer review via queue; member waits for SMS confirmation |
| Above $25,000 | Synchronous officer confirmation (V1 behavior unchanged) |

The risk profile of a $1,500 share-to-share transfer on a voice-authenticated call is identical to the same member initiating the transfer through online banking at 2am. Online banking self-service has no officer in the loop. The autonomous tier mirrors that, applied to the voice channel — same authentication, same authorization standard.

---

### 3. Async Officer Queue — Removing the Availability Dependency

Mid-range transfers now queue in Mission Control instead of requiring a live officer at the exact moment of the call. The officer reviews and approves from the queue; nothing posts until they act.

V1 had an implicit assumption: an officer is always watching Mission Control during every call. That assumption breaks at night, on weekends, and during peak volume. The queue model removes the availability dependency for transactions that don't require a real-time response.

---

## Key Decisions and the Reasoning Behind Them

**FFIEC risk-based MFA instead of blanket step-up for every transfer.**
Blanket two-factor on voice calls imposes friction that institutions don't require for equivalent online banking actions by the same member. The FFIEC standard is explicitly risk-based: channel, amount, and verified identity state together determine what authentication is warranted. Applying uniform step-up regardless of these factors is more conservative than the standard requires and degrades the member experience without corresponding risk reduction.

**Verbal authorization on a recorded voice call counts as step-up authentication.**
Reg E §1005.10(b) recognizes oral authorization for one-time EFTs. A recorded call from a registered number with a verified identity is not legally weaker than an SMS OTP for the same action. The channel itself is authenticated (ANI check), the identity is verified, and the consent is on record. Treating this as insufficient would misstate the regulatory requirement.

**No auto-disposition on queued items.**
If a transfer was classified as requiring officer approval, that classification holds regardless of how long it sits. Auto-approving after a timer would mean: the system identified a risk threshold that warranted human review, no human reviewed it, the system executed it anyway. The audit trail would reflect exactly that — and it would not survive regulatory examination. The correct behavior is: the item stays pending, the member gets status updates if the queue ages, and execution waits for an explicit officer action. A supervised escalation path handles aging items without bypassing the control.

**Officer queue lives in Mission Control, not on a mobile device.**
The officer's approval action needs to be in the same system where the audit trail lives. Routing approvals to a phone creates a split audit record and moves the most consequential action outside the controlled interface. The officer's decision — including their identity, timestamp, and the context they reviewed — is logged in Mission Control at the moment they act.

**Contact center value story is AHT reduction and volume separation, not headcount reduction.**
The savings from this system are realized through: (a) fully automated handling of the 60–65% routine inquiry volume, freeing agent capacity without removing agents; (b) AHT collapse on the interactions that do reach officers, because intent, identity, and policy are already resolved when the officer sees it; (c) growth absorption — CU membership grows without proportional contact center headcount growth. Day-one layoffs are not the mechanism. Long-term efficiency is.

---

## The Net Effect

Officers using Mission Control spend their time on decisions that require judgment — not on reading balances back to members or manually keying in transfer details. Every action they take is pre-processed: identity verified, policy checked, rule citations surfaced, member authorization on record.

The audit trail is the other half of the value. Every step is tagged with the governing rule, the authentication method used, and the officer who acted. There is no ambiguity about what was authorized, when, and by whom — which matters both for internal review and for examiner-facing compliance documentation.
