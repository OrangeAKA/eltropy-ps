// data/skills.ts

export type SkillInput = {
  name: string
  type: string
  required: boolean
}

export type SkillOutput = {
  name: string
  type: string
}

export type Skill = {
  id: string
  name: string
  description: string
  publisher: 'eltropy' | 'akuvo' | 'meridianlink' | 'velera' | 'verafin'
  category: 'lending' | 'servicing' | 'collections' | 'card' | 'compliance' | 'core'
  inputs: SkillInput[]
  outputs: SkillOutput[]
  requiredIntegrations: string[]
  regulatoryTags: string[]
  version: string
  status: 'installed' | 'available' | 'coming_soon'
  avgRuntimeMs: number
}

export const skills: Skill[] = [
  {
    id: 'skill-member-lookup',
    name: 'Member Lookup & Context Pull',
    description:
      'Resolves an inbound caller or sender to a core member record and assembles a full account context summary. Returns deposit balances, open loans, and relationship tier in a single payload.',
    publisher: 'eltropy',
    category: 'core',
    inputs: [
      { name: 'phone', type: 'string', required: false },
      { name: 'memberId', type: 'string', required: false },
      { name: 'email', type: 'string', required: false },
    ],
    outputs: [
      { name: 'member', type: 'Member' },
      { name: 'accountSummary', type: 'AccountSummary' },
      { name: 'resolvedAt', type: 'string' },
    ],
    requiredIntegrations: ['Symitar SymXchange'],
    regulatoryTags: ['GLBA', 'TCPA'],
    version: '2.1.0',
    status: 'installed',
    avgRuntimeMs: 340,
  },
  {
    id: 'skill-identity-verify',
    name: 'Identity Verification',
    description:
      'Authenticates a member via voice biometric match or knowledge-based authentication (KBA) depending on channel. Returns a confidence score and a pass/fail decision for downstream skills.',
    publisher: 'eltropy',
    category: 'compliance',
    inputs: [
      { name: 'memberId', type: 'string', required: true },
      { name: 'channel', type: "'voice' | 'sms' | 'chat'", required: true },
      { name: 'verificationMethod', type: "'biometric' | 'kba'", required: true },
      { name: 'audioStreamUrl', type: 'string', required: false },
    ],
    outputs: [
      { name: 'verified', type: 'boolean' },
      { name: 'confidenceScore', type: 'number' },
      { name: 'method', type: 'string' },
      { name: 'verifiedAt', type: 'string' },
    ],
    requiredIntegrations: ['Pindrop Voice Intelligence', 'Jumio KBA'],
    regulatoryTags: ['BSA', 'CIP', 'FFIEC'],
    version: '1.8.3',
    status: 'installed',
    avgRuntimeMs: 1850,
  },
  {
    id: 'skill-soft-credit-pull',
    name: 'Soft Credit Pull',
    description:
      'Performs a soft credit inquiry through MeridianLink Consumer to retrieve a current FICO score and condensed tradeline summary. Does not affect the member\'s credit score.',
    publisher: 'eltropy',
    category: 'lending',
    inputs: [
      { name: 'memberId', type: 'string', required: true },
      { name: 'memberConsentConfirmed', type: 'boolean', required: true },
      { name: 'bureauPreference', type: "'experian' | 'equifax' | 'transunion'", required: false },
    ],
    outputs: [
      { name: 'fico', type: 'number' },
      { name: 'ficoModel', type: 'string' },
      { name: 'creditBand', type: 'string' },
      { name: 'openTradelines', type: 'number' },
      { name: 'derogatoryMarks', type: 'number' },
      { name: 'utilizationPct', type: 'number' },
      { name: 'pulledAt', type: 'string' },
    ],
    requiredIntegrations: ['MeridianLink Consumer', 'Experian Connect'],
    regulatoryTags: ['FCRA', 'ECOA', 'Reg B'],
    version: '1.4.2',
    status: 'installed',
    avgRuntimeMs: 2100,
  },
  {
    id: 'skill-loan-decisioning',
    name: 'Loan Decisioning',
    description:
      'Runs the credit union\'s decisioning rules against a loan request, returning an approval decision, offered APR, monthly payment estimate, and a plain-language rationale string suitable for reading back to the member.',
    publisher: 'eltropy',
    category: 'lending',
    inputs: [
      { name: 'memberId', type: 'string', required: true },
      { name: 'requestedAmount', type: 'number', required: true },
      { name: 'termMonths', type: 'number', required: true },
      { name: 'productType', type: "'auto_loan' | 'personal_loan' | 'heloc'", required: true },
      { name: 'vehicleYear', type: 'number', required: false },
      { name: 'vehicleMake', type: 'string', required: false },
      { name: 'vehicleModel', type: 'string', required: false },
      { name: 'existingLoanAccountId', type: 'string', required: false },
    ],
    outputs: [
      { name: 'approved', type: 'boolean' },
      { name: 'offeredApr', type: 'number' },
      { name: 'monthlyPayment', type: 'number' },
      { name: 'loanTermMonths', type: 'number' },
      { name: 'rationale', type: 'string' },
      { name: 'counterofferAmount', type: 'number | null' },
      { name: 'decisionedAt', type: 'string' },
    ],
    requiredIntegrations: ['MeridianLink LOS', 'Symitar SymXchange'],
    regulatoryTags: ['ECOA', 'Reg B', 'HMDA'],
    version: '3.0.1',
    status: 'installed',
    avgRuntimeMs: 3400,
  },
  {
    id: 'skill-esign-dispatch',
    name: 'E-Sign Dispatch',
    description:
      'Packages loan documents and dispatches a DocuSign envelope to the member\'s preferred contact point. Tracks signing status and posts back to the LOS on completion.',
    publisher: 'eltropy',
    category: 'lending',
    inputs: [
      { name: 'loanApplicationId', type: 'string', required: true },
      { name: 'memberId', type: 'string', required: true },
      { name: 'deliveryChannel', type: "'sms' | 'email'", required: true },
      { name: 'documentPackage', type: 'string[]', required: true },
    ],
    outputs: [
      { name: 'envelopeId', type: 'string' },
      { name: 'signingUrl', type: 'string' },
      { name: 'expiresAt', type: 'string' },
      { name: 'status', type: "'sent' | 'viewed' | 'completed' | 'declined'" },
    ],
    requiredIntegrations: ['DocuSign eSignature', 'MeridianLink LOS'],
    regulatoryTags: ['ESIGN Act', 'UETA'],
    version: '2.2.0',
    status: 'installed',
    avgRuntimeMs: 1200,
  },
  {
    id: 'skill-payment-posting',
    name: 'Payment Posting',
    description:
      'Posts a member-authorized payment to a loan or deposit account in real time via SymXchange. Supports ACH, debit, and internal transfer funding sources.',
    publisher: 'eltropy',
    category: 'servicing',
    inputs: [
      { name: 'accountId', type: 'string', required: true },
      { name: 'amount', type: 'number', required: true },
      { name: 'fundingSource', type: "'ach' | 'debit' | 'internal_transfer'", required: true },
      { name: 'effectiveDate', type: 'string', required: true },
      { name: 'memberAuthorizationToken', type: 'string', required: true },
    ],
    outputs: [
      { name: 'confirmationNumber', type: 'string' },
      { name: 'transactionId', type: 'string' },
      { name: 'newBalance', type: 'number' },
      { name: 'postedAt', type: 'string' },
    ],
    requiredIntegrations: ['Symitar SymXchange', 'Velera Payment Processing'],
    regulatoryTags: ['Reg E', 'NACHA', 'EFTA'],
    version: '1.9.4',
    status: 'installed',
    avgRuntimeMs: 780,
  },
  {
    id: 'skill-akuvo-delinquency',
    name: 'Early-Stage Delinquency Outreach',
    description:
      'Initiates proactive outreach to members with accounts 1–30 days past due using Akuvo\'s collections intelligence engine. Surfaces promise-to-pay outcomes and optimal next-contact timing.',
    publisher: 'akuvo',
    category: 'collections',
    inputs: [
      { name: 'accountId', type: 'string', required: true },
      { name: 'daysDelinquent', type: 'number', required: true },
      { name: 'amountPastDue', type: 'number', required: true },
      { name: 'preferredChannel', type: "'sms' | 'voice' | 'email'", required: true },
    ],
    outputs: [
      { name: 'outreachResult', type: "'promise_to_pay' | 'no_contact' | 'disputed' | 'paid'" },
      { name: 'promiseToPayDate', type: 'string | null' },
      { name: 'nextContactRecommendation', type: 'string' },
      { name: 'riskScore', type: 'number' },
    ],
    requiredIntegrations: ['Akuvo Collections Platform', 'Symitar SymXchange'],
    regulatoryTags: ['FDCPA', 'TCPA', 'CFPB Reg F'],
    version: '4.1.0',
    status: 'coming_soon',
    avgRuntimeMs: 2600,
  },
  {
    id: 'skill-meridianlink-mortgage-prequalification',
    name: 'Mortgage Pre-Qualification',
    description:
      'Runs a rapid mortgage pre-qualification check through MeridianLink Mortgage and Fannie Mae Desktop Underwriter, returning a preliminary max loan amount and rate estimate without a hard credit pull.',
    publisher: 'meridianlink',
    category: 'lending',
    inputs: [
      { name: 'memberId', type: 'string', required: true },
      { name: 'requestedLoanAmount', type: 'number', required: true },
      { name: 'estimatedPropertyValue', type: 'number', required: true },
      { name: 'propertyType', type: "'primary' | 'investment' | 'second_home'", required: true },
      { name: 'annualIncome', type: 'number', required: true },
    ],
    outputs: [
      { name: 'prequalified', type: 'boolean' },
      { name: 'maxLoanAmount', type: 'number' },
      { name: 'estimatedRate', type: 'number' },
      { name: 'ltvRatio', type: 'number' },
      { name: 'dtiRatio', type: 'number' },
      { name: 'rationale', type: 'string' },
    ],
    requiredIntegrations: ['MeridianLink Mortgage', 'Fannie Mae Desktop Underwriter'],
    regulatoryTags: ['Reg B', 'RESPA', 'TRID', 'HMDA'],
    version: '2.0.0',
    status: 'coming_soon',
    avgRuntimeMs: 4800,
  },
  {
    id: 'skill-velera-card-dispute',
    name: 'Card Dispute Initiation',
    description:
      'Initiates a Reg E or Reg Z card dispute directly against Velera\'s card processing platform. Issues provisional credit when eligible and returns an estimated resolution timeline.',
    publisher: 'velera',
    category: 'card',
    inputs: [
      { name: 'cardAccountId', type: 'string', required: true },
      { name: 'transactionId', type: 'string', required: true },
      { name: 'disputeReason', type: "'unauthorized' | 'not_received' | 'duplicate' | 'quality'", required: true },
      { name: 'disputeAmount', type: 'number', required: true },
      { name: 'memberStatementDate', type: 'string', required: false },
    ],
    outputs: [
      { name: 'disputeId', type: 'string' },
      { name: 'provisionalCreditAmount', type: 'number' },
      { name: 'provisionalCreditPostedAt', type: 'string | null' },
      { name: 'resolutionEtaDays', type: 'number' },
      { name: 'status', type: "'opened' | 'provisional_credit_issued' | 'denied'" },
    ],
    requiredIntegrations: ['Velera Card Processing'],
    regulatoryTags: ['Reg E', 'Reg Z', 'Visa/MC Chargeback Rules'],
    version: '1.2.1',
    status: 'coming_soon',
    avgRuntimeMs: 1500,
  },
  {
    id: 'skill-verafin-bsa-triage',
    name: 'BSA Alert Triage',
    description:
      'Applies Verafin\'s financial crime AI to an open BSA/AML alert, scoring risk and generating a structured narrative summary to support SAR filing decisions. Reduces analyst review time by surfacing corroborating transaction patterns.',
    publisher: 'verafin',
    category: 'compliance',
    inputs: [
      { name: 'alertId', type: 'string', required: true },
      { name: 'memberId', type: 'string', required: true },
      { name: 'lookbackDays', type: 'number', required: true },
      { name: 'memberRiskTier', type: "'low' | 'medium' | 'high'", required: true },
    ],
    outputs: [
      { name: 'recommendation', type: "'file_sar' | 'monitor' | 'dismiss'" },
      { name: 'riskScore', type: 'number' },
      { name: 'narrativeSummary', type: 'string' },
      { name: 'corroboratingAlertIds', type: 'string[]' },
      { name: 'triageCompletedAt', type: 'string' },
    ],
    requiredIntegrations: ['Verafin BSA/AML Platform', 'Symitar SymXchange'],
    regulatoryTags: ['BSA', 'FinCEN', 'SAR', 'AML'],
    version: '3.5.2',
    status: 'coming_soon',
    avgRuntimeMs: 6200,
  },
]
