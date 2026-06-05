// lib/types.ts
// Central type definitions for the orchestrator, state machine, and UI.
// Data-file types live in data/*.ts and are re-exported here for convenience.

export type { Member, Product } from "@/data/members";
export type { TriggerScenario } from "@/data/triggers";
export type { Skill, SkillInput, SkillOutput } from "@/data/skills";
export type { Workflow, WorkflowStep } from "@/data/workflows";
export type { DemoEvent, LogLevel } from "@/data/demo-script";

// ────────────────────────────────────────────────────────────────────────────
// Trigger and intent
// ────────────────────────────────────────────────────────────────────────────

export type TriggerChannel = "sms" | "voice" | "chat";

export type TriggerEvent = {
  ingestId: string;
  channel: TriggerChannel;
  fromPhone: string;
  body: string;
  receivedAt: string;
};

export type IntentName =
  | "lending_inquiry"
  | "refinance_inquiry"
  | "card_dispute"
  | "balance_inquiry"
  | "transfer_funds"
  | "general_handoff";

export type IntentEntities = Record<string, string | number | boolean>;

export type IntentClassification = {
  intent: IntentName;
  confidence: number;
  entities: IntentEntities;
  classifier: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Skill execution
// ────────────────────────────────────────────────────────────────────────────

export type SkillExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "blocked_by_guardrail";

export type SkillExecutionResult<TOutput = Record<string, unknown>> = {
  skillId: string;
  status: SkillExecutionStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  inputs: Record<string, unknown>;
  outputs?: TOutput;
  adapter?: string;
  rationale?: string;
  error?: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Audit log
// ────────────────────────────────────────────────────────────────────────────

export type AuditLogLevel = "INFO" | "DEBUG" | "WARN" | "ERROR";

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  elapsedMs: number;
  level: AuditLogLevel;
  component: string;
  message: string;
  payload?: Record<string, unknown>;
};

// ────────────────────────────────────────────────────────────────────────────
// Loan-specific (used by loan-decisioning skill)
// ────────────────────────────────────────────────────────────────────────────

export type LoanOffer = {
  approved: boolean;
  amount: number;
  termMonths: number;
  apr: number;
  monthlyPayment: number;
  rateBand: "prime" | "near-prime" | "standard" | "sub-prime" | "declined";
  rationale: string;
  disclosure: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Card dispute (used by transaction-lookup + dispute-file skills)
// ────────────────────────────────────────────────────────────────────────────

export type DisputeDetails = {
  transactionId: string;
  amount: number;
  merchant: string;
  transactionDate: string;
  cardLast4: string;
  reportedAt: string;
  regEDaysRemaining: number;
  provisionalCreditEligible: boolean;
  liabilityCapUsd: number;
  rationale: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Transfer (used by stepup-auth + transfer-policy + transfer-execute skills)
// ────────────────────────────────────────────────────────────────────────────

// Dollar thresholds that gate the three-tier transfer routing model.
// Below AUTONOMOUS: executes without officer involvement (same risk as online banking).
// Below QUEUE: stages for async officer queue; member waits for SMS confirmation.
// At or above QUEUE: requires synchronous officer confirm before posting.
export const TRANSFER_AUTONOMOUS_THRESHOLD_USD = 2_500;
export const TRANSFER_QUEUE_THRESHOLD_USD = 25_000;

export type TransferTier = "autonomous" | "queued" | "synchronous";

export type QueuedTransferItem = {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  fromAccountType: string;
  toAccountType: string;
  fromAccountId?: string;
  toAccountId?: string;
  authMethod: StepUpAuthResult["method"];
  policyDecision: TransferPolicyDecision;
  queuedAt: number;
  status: "pending" | "approved" | "declined";
};

export type StepUpAuthResult = {
  method: "verbal_on_voice" | "push_approval" | "sms_otp" | "secure_link";
  approved: boolean;
  promptedAt: string;
  respondedAt?: string;
  channel: TriggerChannel;
  deviceLabel?: string;
  rationale: string;
};

export type TransferPolicyDecision = {
  allowed: boolean;
  amount: number;
  fromAccountId: string;
  toAccountId: string;
  dailyLimitUsd: number;
  dailyUsedUsd: number;
  blocks: string[];
  citations: string[];
  rationale: string;
};

export type TransferExecutionResult = {
  confirmationNumber: string;
  postedAt: string;
  fromAccountId: string;
  fromNewBalance: number;
  toAccountId: string;
  toNewBalance: number;
  amount: number;
};

export type TransferDetails = {
  amount: number;
  fromAccountType: string;
  toAccountType: string;
  fromAccountId?: string;
  toAccountId?: string;
  stepUp?: StepUpAuthResult;
  policy?: TransferPolicyDecision;
  execution?: TransferExecutionResult;
  escalated?: boolean;
  escalationReason?: string;
  transferTier?: TransferTier;
  queueItemId?: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Balance inquiry (used by account-summary skill)
// ────────────────────────────────────────────────────────────────────────────

export type AccountSummary = {
  asOf: string;
  accounts: Array<{
    type: string;
    accountId: string;
    balance: number;
    lastActivity?: string;
  }>;
  totalDeposits: number;
  totalCredit: number;
  recentTransactions: Array<{
    date: string;
    description: string;
    amount: number;
    accountId: string;
  }>;
  rationale: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Workflow execution context
// ────────────────────────────────────────────────────────────────────────────

import type { Member } from "@/data/members";

export type WorkflowContext = {
  member?: Member;
  intent?: IntentClassification;
  trigger?: TriggerEvent;
  skillResults: Record<string, SkillExecutionResult>;
  loanOffer?: LoanOffer;
  disputeDetails?: DisputeDetails;
  accountSummary?: AccountSummary;
  transferDetails?: TransferDetails;
};

// ────────────────────────────────────────────────────────────────────────────
// Demo state machine
// ────────────────────────────────────────────────────────────────────────────

export type DemoPhase =
  | "idle"
  | "ingesting"
  | "resolving_member"
  | "classifying_intent"
  | "routing_workflow"
  | "executing_skill"
  | "awaiting_human_confirm"
  | "pending_officer_queue"
  | "executing_post_confirm"
  | "completed";

export type DemoState = {
  phase: DemoPhase;
  startedAt?: number;
  context: WorkflowContext;
  auditLog: AuditLogEntry[];
  activeSkillId?: string;
  completedSkillIds: string[];
  awaitingConfirmFor?: {
    skillId: string;
    title: string;
    summary: string;
  };
  queuedTransferItems: QueuedTransferItem[];
  workflowId?: string;
  workflowName?: string;
  conversationMessages: ConversationMessage[];
};

export type ConversationMessage = {
  id: string;
  sender: "member" | "system" | "officer";
  text: string;
  timestamp: number;
};

export type DemoAction =
  | { type: "RESET" }
  | { type: "TRIGGER_RECEIVED"; trigger: TriggerEvent }
  | { type: "MEMBER_RESOLVED"; member: Member; log: AuditLogEntry }
  | { type: "INTENT_CLASSIFIED"; intent: IntentClassification; log: AuditLogEntry }
  | { type: "WORKFLOW_ROUTED"; workflowId: string; workflowName: string; log: AuditLogEntry }
  | { type: "SKILL_STARTED"; skillId: string; log: AuditLogEntry }
  | { type: "SKILL_COMPLETED"; result: SkillExecutionResult; log: AuditLogEntry }
  | {
      type: "AWAIT_CONFIRM";
      payload: {
        skillId: string;
        title: string;
        summary: string;
        offer?: LoanOffer;
        dispute?: DisputeDetails;
      };
      log: AuditLogEntry;
    }
  | { type: "QUEUED_FOR_OFFICER"; item: QueuedTransferItem; log: AuditLogEntry }
  | {
      type: "OFFICER_QUEUE_ACTION";
      itemId: string;
      action: "approve" | "decline";
      log: AuditLogEntry;
    }
  | { type: "USER_CONFIRMED"; log: AuditLogEntry }
  | { type: "USER_MODIFIED" }
  | { type: "WORKFLOW_COMPLETED"; log: AuditLogEntry }
  | { type: "MESSAGE_APPENDED"; message: ConversationMessage }
  | { type: "LOG_APPENDED"; log: AuditLogEntry }
  | { type: "VOICE_LIVE_EVENT"; log: AuditLogEntry; phaseHint?: DemoPhase };
