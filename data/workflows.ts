// data/workflows.ts

export type WorkflowStep = {
  skillId: string
  humanInTheLoop: boolean
  guardrails: {
    condition?: string
    autoExecute: boolean
  }
}

export type Workflow = {
  id: string
  name: string
  description: string
  triggerIntents: string[]
  steps: WorkflowStep[]
}

export const workflows: Workflow[] = [
  {
    id: 'workflow-001',
    name: 'OneCallLending',
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
          condition: 'confidenceScore < 0.75 requires human takeover',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-soft-credit-pull',
        humanInTheLoop: false,
        guardrails: {
          condition: 'memberConsentConfirmed must be true before execution',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-loan-decisioning',
        humanInTheLoop: false,
        guardrails: {
          condition: 'requestedAmount > 50000 requires human approval before continuing',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-loan-decisioning',
        humanInTheLoop: true,
        guardrails: {
          condition: 'Agent presents offer to MSR for review before reading back to member',
          autoExecute: false,
        },
      },
      {
        skillId: 'skill-esign-dispatch',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Only executes if member verbally accepts the offered terms',
          autoExecute: false,
        },
      },
    ],
  },
  {
    id: 'workflow-002',
    name: 'AutoRefinanceFlow',
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
          condition: 'confidenceScore < 0.75 requires human takeover',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-soft-credit-pull',
        humanInTheLoop: false,
        guardrails: {
          condition: 'memberConsentConfirmed must be true before execution',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-loan-decisioning',
        humanInTheLoop: false,
        guardrails: {
          condition: 'existingLoanAccountId must be populated; productType locked to auto_loan',
          autoExecute: true,
        },
      },
      {
        skillId: 'skill-loan-decisioning',
        humanInTheLoop: true,
        guardrails: {
          condition: 'Agent surfaces rate delta vs existing loan for MSR review before presenting to member',
          autoExecute: false,
        },
      },
      {
        skillId: 'skill-esign-dispatch',
        humanInTheLoop: false,
        guardrails: {
          condition: 'Only executes if member verbally accepts the refinance offer',
          autoExecute: false,
        },
      },
    ],
  },
]
