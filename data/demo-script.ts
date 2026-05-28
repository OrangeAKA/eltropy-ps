export type LogLevel = "INFO" | "DEBUG" | "WARN" | "ERROR";

export interface DemoEvent {
  timestamp: string;
  level: LogLevel;
  eventType: string;
  auditLogMessage: string;
  copilotMessage: string;
}

export const demoScript: DemoEvent[] = [
  {
    timestamp: "00:00:00.142",
    level: "INFO",
    eventType: "trigger.receive",
    auditLogMessage:
      "[00:00:00.142] [INFO]  trigger.receive() — channel=sms, from=+15551234567, body_len=64, ingest_id=ingest_7f3a9c11",
    copilotMessage: "Incoming SMS received. Analyzing message.",
  },
  {
    timestamp: "00:00:00.891",
    level: "INFO",
    eventType: "member.resolve",
    auditLogMessage:
      "[00:00:00.891] [INFO]  member.resolve() — phone=+15551234567 → member_id=8842914, name=\"Michael Tanaka\", status=active, lookup_ms=312",
    copilotMessage: "Member identified: Michael Tanaka (ID 8842914).",
  },
  {
    timestamp: "00:00:01.334",
    level: "INFO",
    eventType: "intent.classify",
    auditLogMessage:
      "[00:00:01.334] [INFO]  intent.classify() — intent=lending_inquiry, entities={product=auto_loan, amount=25000, collateral=\"2024 Honda CR-V\"}, confidence=0.97",
    copilotMessage: "Intent: auto loan inquiry — $25K, 2024 Honda CR-V.",
  },
  {
    timestamp: "00:00:01.721",
    level: "INFO",
    eventType: "workflow.route",
    auditLogMessage:
      "[00:00:01.721] [INFO]  workflow.route() — intent=lending_inquiry → workflow=OneCallLending, version=v2.4.1, match_rule=product_type_auto",
    copilotMessage: "Routing to OneCallLending workflow.",
  },
  {
    timestamp: "00:00:01.983",
    level: "INFO",
    eventType: "workflow.start",
    auditLogMessage:
      "[00:00:01.983] [INFO]  workflow.start() — workflow=OneCallLending, member_id=8842914, session_id=sess_4d82ef1a, context=member_resolved",
    copilotMessage: "OneCallLending workflow started. Running member context pull.",
  },
  {
    timestamp: "00:00:02.541",
    level: "INFO",
    eventType: "skill.member_lookup",
    auditLogMessage:
      "[00:00:02.541] [INFO]  skill.member_lookup() — adapter=Symitar, member_id=8842914, fico=758, tenure_yrs=8.2, tier=prime, products=[checking, savings, auto_loan_2021], latency_ms=558",
    copilotMessage: "Member profile loaded. FICO 758, 8.2-yr tenure, prime tier.",
  },
  {
    timestamp: "00:00:03.812",
    level: "INFO",
    eventType: "skill.identity_verify",
    auditLogMessage:
      "[00:00:03.812] [INFO]  skill.identity_verify() — method=voice_biometric, member_id=8842914, verified=true, confidence=0.94, latency_ms=1247",
    copilotMessage: "Identity verified ✓",
  },
  {
    timestamp: "00:00:05.103",
    level: "INFO",
    eventType: "skill.credit_pull",
    auditLogMessage:
      "[00:00:05.103] [INFO]  skill.credit_pull() — adapter=MeridianLink, pull_type=soft, member_id=8842914, fico=758, utilization=0.18, derogatory_marks=0, latency_ms=891",
    copilotMessage: "Soft credit pull complete. FICO 758, utilization 18%, no derogatory marks.",
  },
  {
    timestamp: "00:00:06.447",
    level: "INFO",
    eventType: "skill.loan_decision",
    auditLogMessage:
      "[00:00:06.447] [INFO]  skill.loan_decision() — decision=approved, amount=25000, apr=0.0599, monthly_payment=483.21, term_months=60, rationale=\"fico_band=prime; tenure_multiplier=1.08; within_product_cap=true\"",
    copilotMessage: "Decision: Approved — $25K at 5.99% APR, $483.21/mo for 60 months.",
  },
  {
    timestamp: "00:00:06.891",
    level: "INFO",
    eventType: "guardrail.check",
    auditLogMessage:
      "[00:00:06.891] [INFO]  guardrail.check() — rule=amount_threshold, amount=25000, threshold=50000, result=pass, escalation_required=false",
    copilotMessage: "Guardrail check passed. Amount within auto-approval threshold.",
  },
  {
    timestamp: "00:00:07.214",
    level: "WARN",
    eventType: "workflow.pause",
    auditLogMessage:
      "[00:00:07.214] [WARN]  workflow.pause() — reason=awaiting_human_confirmation, step=offer_dispatch, session_id=sess_4d82ef1a, timeout_sec=120",
    copilotMessage: "Awaiting your confirmation to dispatch offer to Michael.",
  },
  {
    timestamp: "00:00:11.632",
    level: "INFO",
    eventType: "skill.esign_dispatch",
    auditLogMessage:
      "[00:00:11.632] [INFO]  skill.esign_dispatch() — channel=sms, to=+15551234567, doc=loan_offer_8842914_v1.pdf, link_id=esign_9c3f7b2d, status=sent, confirmed_by=sarah.operator",
    copilotMessage: "Offer dispatched ✓ E-sign link sent to Michael's mobile.",
  },
];
