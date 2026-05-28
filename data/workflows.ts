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
]
