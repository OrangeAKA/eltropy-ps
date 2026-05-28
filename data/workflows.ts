// data/workflows.ts

export type WorkflowStep = {
  skillId: string
  displayName?: string
  humanInTheLoop: boolean
  guardrails: {
    condition?: string
    autoExecute: boolean
  }
}

export type Workflow = {
  id: string
  name: string
  displayName?: string
  description: string
  triggerIntents: string[]
  steps: WorkflowStep[]
}

export const workflows: Workflow[] = [
  {
    id: 'workflow-001',
    name: 'OneCallLending',
    displayName: 'One-Call Lending',
    description:
      'Handles inbound lending inquiries end-to-end in a single interaction. Resolves the member, verifies identity, pulls a soft credit report, runs loan decisioning, pauses for human review of the offer, then dispatches e-sign documents if the member accepts.',
    triggerIntents: ['lending_inquiry'],
    steps: [
      {
        skillId: 'skill-member-lookup',
        humanInTheLoop: false,
        guardrails: {
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-identity-verify',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Hands off to officer if identity confidence drops below 75%',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-soft-credit-pull',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Requires verbal consent before pulling credit',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-loan-decisioning',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Loans over $50K need officer approval before continuing',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-loan-decisioning',
        displayName: 'Officer Review of Offer',
        humanInTheLoop: true,
        guardrails: {
          condition: 'Officer reviews the offer before reading terms back to the member',
          autoExecute: false,
        },
      },
      {
        skillId: 'skill-esign-dispatch',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Sends only after the member verbally accepts the terms',
          autoExecute: false,
        },
      },
    ],
  },
  {
    id: 'workflow-002',
    name: 'AutoRefinanceFlow',
    displayName: 'Auto Refinance',
    description:
      'Handles inbound auto loan refinance requests. Resolves the member, verifies identity, retrieves the existing loan details, runs a comparative-rate decisioning pass against current rate sheet, then pauses for human MSR review before presenting the refinance offer.',
    triggerIntents: ['refinance_inquiry'],
    steps: [
      {
        skillId: 'skill-member-lookup',
        humanInTheLoop: false,
        guardrails: {
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-identity-verify',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Hands off to officer if identity confidence drops below 75%',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-soft-credit-pull',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Requires verbal consent before pulling credit',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-loan-decisioning',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Requires an existing auto loan on file',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-loan-decisioning',
        displayName: 'Officer Review of Refi Offer',
        humanInTheLoop: true,
        guardrails: {
          condition: 'Officer reviews the rate delta before offering the refinance',
          autoExecute: false,
        },
      },
      {
        skillId: 'skill-esign-dispatch',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Sends only after the member accepts refinance terms',
          autoExecute: false,
        },
      },
    ],
  },
  {
    id: 'workflow-003',
    name: 'CardDisputeFlow',
    displayName: 'Card Dispute Resolution',
    description:
      "Handles inbound 'I didn't recognize this charge' disputes end-to-end. Resolves the member, verifies identity, retrieves the disputed transaction, pauses for officer review under Reg E, then files the dispute with Velera and issues provisional credit if eligible.",
    triggerIntents: ['card_dispute'],
    steps: [
      {
        skillId: 'skill-member-lookup',
        humanInTheLoop: false,
        guardrails: { autoExecute: true },
      },
      {
        skillId: 'skill-identity-verify',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Step-up auth required: dispute is account-impacting',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-transaction-lookup',
        displayName: 'Transaction Lookup & Reg E Triage',
        humanInTheLoop: true,
        guardrails: {
          condition: 'Officer confirms the disputed transaction before filing',
          autoExecute: false,
        },
      },
      {
        skillId: 'skill-dispute-file',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Files with Velera; auto-issues provisional credit when amount under $2,500',
          autoExecute: true,
        },
      },
    ],
  },
  {
    id: 'workflow-004',
    name: 'BalanceInquiryFlow',
    displayName: 'Balance Inquiry',
    description:
      'Handles inbound balance and recent-transaction inquiries. Resolves the member, verifies identity, retrieves account balances, and surfaces the last few transactions for the officer to read back.',
    triggerIntents: ['balance_inquiry'],
    steps: [
      {
        skillId: 'skill-member-lookup',
        humanInTheLoop: false,
        guardrails: { autoExecute: true },
      },
      {
        skillId: 'skill-identity-verify',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Identity must verify before account data is disclosed (GLBA)',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-account-summary',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Discloses only the account types the member asked about',
          autoExecute: true,
        },
      },
    ],
  },
]
