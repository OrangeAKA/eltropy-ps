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
        context: { ...state.context, trigger: action.trigger, skillResults: {} },
        auditLog: [],
        completedSkillIds: [],
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

    case "INTENT_CLASSIFIED":
      return {
        ...state,
        phase: "classifying_intent",
        context: { ...state.context, intent: action.intent },
        auditLog: [...state.auditLog, action.log],
      };

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
      if (
        action.result.skillId === "skill-loan-decisioning" &&
        action.result.outputs
      ) {
        const offerOutputs = action.result.outputs as {
          offer?: DemoState["context"]["loanOffer"];
        };
        if (offerOutputs.offer) loanOffer = offerOutputs.offer;
      }
      return {
        ...state,
        context: { ...state.context, skillResults, loanOffer },
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
        context: { ...state.context, loanOffer: action.payload.offer },
        auditLog: [...state.auditLog, action.log],
      };

    case "USER_CONFIRMED":
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
            text: "Sending you a pre-qualified offer to review and e-sign now.",
            timestamp: Date.now(),
          },
        ],
      };

    case "USER_MODIFIED":
      return {
        ...state,
        phase: "completed",
        awaitingConfirmFor: undefined,
      };

    case "WORKFLOW_COMPLETED":
      return {
        ...state,
        phase: "completed",
        auditLog: [...state.auditLog, action.log],
        conversationMessages: [
          ...state.conversationMessages,
          {
            id: `msg_${Date.now()}`,
            sender: "system",
            text: "✓ E-sign link sent. Check your messages for the offer.",
            timestamp: Date.now(),
          },
        ],
      };

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
