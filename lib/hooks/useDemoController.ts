// lib/hooks/useDemoController.ts
//
// React hook that wraps the demo reducer and bridges it to the orchestrator
// pipeline. UI components call sendTrigger() to fire a trigger event; the
// hook drives the workflow asynchronously and dispatches reducer actions
// for every audit-log event, skill state change, and human-in-the-loop
// pause.

"use client";

import { useReducer, useRef, useCallback } from "react";
import { demoReducer, initialDemoState } from "@/lib/demo-state";
import { handleTrigger } from "@/lib/orchestrator/trigger-handler";
import type { TriggerEvent, LoanOffer, DemoState } from "@/lib/types";

type ConfirmResolver = {
  resolve: () => void;
  reject: () => void;
};

export function useDemoController(): {
  state: DemoState;
  sendTrigger: (trigger: Omit<TriggerEvent, "ingestId" | "receivedAt">) => void;
  confirmOffer: () => void;
  modifyOffer: () => void;
  reset: () => void;
} {
  const [state, dispatch] = useReducer(demoReducer, initialDemoState);
  const confirmResolverRef = useRef<ConfirmResolver | null>(null);

  const sendTrigger = useCallback(
    (
      partial: Omit<TriggerEvent, "ingestId" | "receivedAt">,
    ) => {
      const trigger: TriggerEvent = {
        ...partial,
        ingestId: `ingest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        receivedAt: new Date().toISOString(),
      };
      const startedAt = performance.now();
      dispatch({ type: "TRIGGER_RECEIVED", trigger });

      handleTrigger(
        trigger,
        {
          onTriggerReceived: (_t, log) => dispatch({ type: "LOG_APPENDED", log }),
          onVoiceTranscribed: (_transcript, log) =>
            dispatch({ type: "LOG_APPENDED", log }),
          onMemberResolved: (member, log) =>
            dispatch({ type: "MEMBER_RESOLVED", member, log }),
          onIntentClassified: (intent, log) =>
            dispatch({ type: "INTENT_CLASSIFIED", intent, log }),
          onWorkflowRouted: (workflow, log) =>
            dispatch({
              type: "WORKFLOW_ROUTED",
              workflowId: workflow.id,
              workflowName: workflow.name,
              log,
            }),
          onUnresolved: (_reason, log) =>
            dispatch({ type: "LOG_APPENDED", log }),
          onLog: (log) => dispatch({ type: "LOG_APPENDED", log }),
          onSkillStart: (skillId) => {
            const startLog = {
              id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              timestamp: new Date().toISOString(),
              elapsedMs: Math.round(performance.now() - startedAt),
              level: "DEBUG" as const,
              component: "skill.dispatch",
              message: `skill.dispatch(${skillId}) — entering execution`,
            };
            dispatch({ type: "SKILL_STARTED", skillId, log: startLog });
          },
          onSkillComplete: (result) => {
            const completeLog = {
              id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              timestamp: new Date().toISOString(),
              elapsedMs: Math.round(performance.now() - startedAt),
              level: result.status === "completed"
                ? ("DEBUG" as const)
                : ("ERROR" as const),
              component: "skill.dispatch",
              message: `skill.dispatch(${result.skillId}) — exiting status=${result.status}`,
            };
            dispatch({ type: "SKILL_COMPLETED", result, log: completeLog });
          },
          awaitConfirm: (payload) =>
            new Promise<void>((resolve, reject) => {
              confirmResolverRef.current = { resolve, reject };
              const log = {
                id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                timestamp: new Date().toISOString(),
                elapsedMs: Math.round(performance.now() - startedAt),
                level: "INFO" as const,
                component: "workflow.pause",
                message: "workflow.pause(reason=awaiting_human_confirm)",
              };
              dispatch({
                type: "AWAIT_CONFIRM",
                payload: {
                  ...payload,
                  offer: payload.offer as LoanOffer,
                },
                log,
              });
            }),
          onComplete: () => {
            const log = {
              id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              timestamp: new Date().toISOString(),
              elapsedMs: Math.round(performance.now() - startedAt),
              level: "INFO" as const,
              component: "workflow.complete",
              message: "workflow.complete() — all events dispatched",
            };
            dispatch({ type: "WORKFLOW_COMPLETED", log });
          },
        },
        startedAt,
      ).catch((err) => {
        console.error("[demo-controller] orchestrator threw:", err);
      });
    },
    [],
  );

  const confirmOffer = useCallback(() => {
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      elapsedMs: 0,
      level: "INFO" as const,
      component: "human.confirm",
      message: "human.confirm() — officer approved offer dispatch",
    };
    dispatch({ type: "USER_CONFIRMED", log });
    confirmResolverRef.current?.resolve();
    confirmResolverRef.current = null;
  }, []);

  const modifyOffer = useCallback(() => {
    dispatch({ type: "USER_MODIFIED" });
    confirmResolverRef.current?.reject();
    confirmResolverRef.current = null;
  }, []);

  const reset = useCallback(() => {
    confirmResolverRef.current?.reject();
    confirmResolverRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  return { state, sendTrigger, confirmOffer, modifyOffer, reset };
}
