// lib/demo-state.ts
//
// useReducer state machine for the demo controller. Pure: state + action → state.
// The hook in lib/hooks/useDemoController.ts wraps this and bridges to the
// orchestrator pipeline.

import type { DemoState, DemoAction } from "@/lib/types";

export const initialDemoState: DemoState = {
  phase: "idle",
  context: { skillResults: {} },
  auditLog: [],
  completedSkillIds: [],
  conversationMessages: [],
};

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "RESET":
      return initialDemoState;

    case "TRIGGER_RECEIVED":
      return {
        ...state,
        phase: "ingesting",
        startedAt: performance.now(),
        context: {
          trigger: action.trigger,
          skillResults: {},
        },
        auditLog: [],
        completedSkillIds: [],
        activeSkillId: undefined,
        awaitingConfirmFor: undefined,
        workflowId: undefined,
        workflowName: undefined,
        conversationMessages: [
          {
            id: `msg_${Date.now()}`,
            sender: "member",
            text: action.trigger.body,
            timestamp: Date.now(),
          },
        ],
      };

    case "MEMBER_RESOLVED":
      return {
        ...state,
        phase: "resolving_member",
        context: { ...state.context, member: action.member },
        auditLog: [...state.auditLog, action.log],
      };

    case "INTENT_CLASSIFIED": {
      // Seed transferDetails from the LLM-extracted entities so the
      // OfficerConfirmTransferCard + pending sections can render from
      // skill 1 onward.
      let transferDetails = state.context.transferDetails;
      if (action.intent.intent === "transfer_funds") {
        const entities = action.intent.entities;
        const amount = (entities.amount as number | undefined) ?? 0;
        const fromType =
          (entities.from_account_type as string | undefined) ?? "savings";
        const toType =
          (entities.to_account_type as string | undefined) ?? "checking";
        const member = state.context.member;
        const from = member?.products.find((p) => p.type === fromType);
        const to = member?.products.find((p) => p.type === toType);
        transferDetails = {
          amount,
          fromAccountType: fromType,
          toAccountType: toType,
          fromAccountId: from?.accountId,
          toAccountId: to?.accountId,
        };
      }
      return {
        ...state,
        phase: "classifying_intent",
        context: { ...state.context, intent: action.intent, transferDetails },
        auditLog: [...state.auditLog, action.log],
      };
    }

    case "WORKFLOW_ROUTED":
      return {
        ...state,
        phase: "routing_workflow",
        workflowId: action.workflowId,
        workflowName: action.workflowName,
        auditLog: [...state.auditLog, action.log],
      };

    case "SKILL_STARTED":
      return {
        ...state,
        phase: "executing_skill",
        activeSkillId: action.skillId,
        auditLog: [...state.auditLog, action.log],
      };

    case "SKILL_COMPLETED": {
      const completedIds = state.completedSkillIds.includes(action.result.skillId)
        ? state.completedSkillIds
        : [...state.completedSkillIds, action.result.skillId];
      const skillResults = {
        ...state.context.skillResults,
        [action.result.skillId]: action.result,
      };
      let loanOffer = state.context.loanOffer;
      let disputeDetails = state.context.disputeDetails;
      let accountSummary = state.context.accountSummary;
      let transferDetails = state.context.transferDetails;
      if (
        action.result.skillId === "skill-loan-decisioning" &&
        action.result.outputs
      ) {
        const o = action.result.outputs as {
          offer?: DemoState["context"]["loanOffer"];
        };
        if (o.offer) loanOffer = o.offer;
      }
      if (
        action.result.skillId === "skill-transaction-lookup" &&
        action.result.outputs
      ) {
        const o = action.result.outputs as {
          dispute?: DemoState["context"]["disputeDetails"];
        };
        if (o.dispute) disputeDetails = o.dispute;
      }
      if (
        action.result.skillId === "skill-account-summary" &&
        action.result.outputs
      ) {
        const o = action.result.outputs as {
          summary?: DemoState["context"]["accountSummary"];
        };
        if (o.summary) accountSummary = o.summary;
      }
      if (
        action.result.skillId === "skill-stepup-auth" &&
        action.result.outputs
      ) {
        const o = action.result.outputs as {
          stepUp?: NonNullable<
            DemoState["context"]["transferDetails"]
          >["stepUp"];
        };
        if (o.stepUp) {
          const base = transferDetails ?? {
            amount: 0,
            fromAccountType: "",
            toAccountType: "",
          };
          const escalated = !o.stepUp.approved;
          transferDetails = {
            ...base,
            stepUp: o.stepUp,
            escalated: escalated || base.escalated,
            escalationReason: escalated
              ? o.stepUp.rationale
              : base.escalationReason,
          };
        }
      }
      if (
        action.result.skillId === "skill-transfer-policy-check" &&
        action.result.outputs
      ) {
        const o = action.result.outputs as {
          decision?: NonNullable<
            DemoState["context"]["transferDetails"]
          >["policy"];
        };
        if (o.decision) {
          const base = transferDetails ?? {
            amount: o.decision.amount,
            fromAccountType: "",
            toAccountType: "",
          };
          const blocked = !o.decision.allowed;
          transferDetails = {
            ...base,
            policy: o.decision,
            fromAccountId: o.decision.fromAccountId || base.fromAccountId,
            toAccountId: o.decision.toAccountId || base.toAccountId,
            escalated: blocked || base.escalated,
            escalationReason: blocked
              ? o.decision.blocks.join("; ")
              : base.escalationReason,
          };
        }
      }
      if (
        action.result.skillId === "skill-transfer-execute" &&
        action.result.outputs
      ) {
        const o = action.result.outputs as {
          execution?: NonNullable<
            DemoState["context"]["transferDetails"]
          >["execution"];
        };
        if (o.execution) {
          const base = transferDetails ?? {
            amount: o.execution.amount,
            fromAccountType: "",
            toAccountType: "",
          };
          transferDetails = {
            ...base,
            execution: o.execution,
          };
        }
      }
      return {
        ...state,
        context: {
          ...state.context,
          skillResults,
          loanOffer,
          disputeDetails,
          accountSummary,
          transferDetails,
        },
        completedSkillIds: completedIds,
        activeSkillId: undefined,
        auditLog: [...state.auditLog, action.log],
      };
    }

    case "AWAIT_CONFIRM":
      return {
        ...state,
        phase: "awaiting_human_confirm",
        awaitingConfirmFor: {
          skillId: action.payload.skillId,
          title: action.payload.title,
          summary: action.payload.summary,
        },
        context: {
          ...state.context,
          loanOffer: action.payload.offer ?? state.context.loanOffer,
          disputeDetails:
            action.payload.dispute ?? state.context.disputeDetails,
        },
        auditLog: [...state.auditLog, action.log],
      };

    case "USER_CONFIRMED": {
      const awaitingSkill = state.awaitingConfirmFor?.skillId;
      const isDispute = awaitingSkill === "skill-dispute-file";
      const isTransfer = awaitingSkill === "skill-transfer-execute";
      const officerText = isDispute
        ? "Filing this with the network now. You'll see provisional credit on your account today if it's under our $2,500 threshold."
        : isTransfer
          ? "Posting that transfer now. You'll see the new balances on both accounts within a few seconds."
          : "Sending you a pre-qualified offer to review and e-sign now.";
      return {
        ...state,
        phase: "executing_post_confirm",
        awaitingConfirmFor: undefined,
        auditLog: [...state.auditLog, action.log],
        conversationMessages: [
          ...state.conversationMessages,
          {
            id: `msg_${Date.now()}`,
            sender: "officer",
            text: officerText,
            timestamp: Date.now(),
          },
        ],
      };
    }

    case "USER_MODIFIED":
      return {
        ...state,
        phase: "completed",
        awaitingConfirmFor: undefined,
      };

    case "WORKFLOW_COMPLETED": {
      const intent = state.context.intent?.intent;
      let systemText = "Workflow complete.";
      if (intent === "lending_inquiry" || intent === "refinance_inquiry") {
        const o = state.context.loanOffer;
        if (o && !o.approved) {
          systemText =
            "We weren't able to approve this today. A member services officer will reach out within one business day to walk through alternatives and next steps.";
        } else {
          systemText = "✓ E-sign link sent. Check your messages to review and sign the offer.";
        }
      } else if (intent === "card_dispute") {
        const d = state.context.disputeDetails;
        systemText = d?.provisionalCreditEligible
          ? `✓ Dispute filed. Provisional credit of $${d.amount.toFixed(2)} posted to your checking account.`
          : "✓ Dispute filed. Network investigation in progress; we'll text you status updates.";
      } else if (intent === "balance_inquiry") {
        const s = state.context.accountSummary;
        systemText = s
          ? `✓ Balances surfaced. Total deposits $${s.totalDeposits.toFixed(2)} across ${s.accounts.length} account${s.accounts.length === 1 ? "" : "s"}.`
          : "✓ Balances surfaced.";
      } else if (intent === "transfer_funds") {
        const t = state.context.transferDetails;
        if (t?.execution) {
          systemText = `✓ Transfer posted. $${t.execution.amount.toLocaleString()} moved. Confirmation ${t.execution.confirmationNumber}.`;
        } else if (t?.escalated) {
          systemText = `Held for review. ${t.escalationReason ?? "An officer will follow up shortly."}`;
        } else {
          systemText = "Transfer cancelled by officer.";
        }
      }
      return {
        ...state,
        phase: "completed",
        auditLog: [...state.auditLog, action.log],
        conversationMessages: [
          ...state.conversationMessages,
          {
            id: `msg_${Date.now()}`,
            sender: "system",
            text: systemText,
            timestamp: Date.now(),
          },
        ],
      };
    }

    case "MESSAGE_APPENDED":
      return {
        ...state,
        conversationMessages: [...state.conversationMessages, action.message],
      };

    case "LOG_APPENDED":
      return {
        ...state,
        auditLog: [...state.auditLog, action.log],
      };

    default:
      return state;
  }
}
