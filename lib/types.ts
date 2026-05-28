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
// Workflow execution context
// ────────────────────────────────────────────────────────────────────────────

import type { Member } from "@/data/members";

export type WorkflowContext = {
  member?: Member;
  intent?: IntentClassification;
  trigger?: TriggerEvent;
  skillResults: Record<string, SkillExecutionResult>;
  loanOffer?: LoanOffer;
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
      payload: { skillId: string; title: string; summary: string; offer: LoanOffer };
      log: AuditLogEntry;
    }
  | { type: "USER_CONFIRMED"; log: AuditLogEntry }
  | { type: "USER_MODIFIED" }
  | { type: "WORKFLOW_COMPLETED"; log: AuditLogEntry }
  | { type: "MESSAGE_APPENDED"; message: ConversationMessage }
  | { type: "LOG_APPENDED"; log: AuditLogEntry };
