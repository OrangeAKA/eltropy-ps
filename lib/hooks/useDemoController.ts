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
import type {
  TriggerEvent,
  DemoState,
  QueuedTransferItem,
  AuditLogEntry,
  DemoPhase,
} from "@/lib/types";
import type { VoiceLiveEvent } from "@/lib/twilio/live-events";

type ConfirmResolver = {
  resolve: () => void;
  reject: () => void;
};

export function useDemoController(): {
  state: DemoState;
  sendTrigger: (trigger: Omit<TriggerEvent, "ingestId" | "receivedAt">) => void;
  confirmOffer: () => void;
  modifyOffer: () => void;
  approveQueueItem: (itemId: string) => void;
  declineQueueItem: (itemId: string) => void;
  pushVoiceEvent: (event: VoiceLiveEvent) => void;
  reset: () => void;
} {
  const [state, dispatch] = useReducer(demoReducer, initialDemoState);
  const confirmResolverRef = useRef<ConfirmResolver | null>(null);
  const queueResolverRef = useRef<ConfirmResolver | null>(null);
  const startedAtRef = useRef<number | null>(null);

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
      startedAtRef.current = startedAt;
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
                payload,
                log,
              });
            }),
          awaitQueueAction: (item: QueuedTransferItem) =>
            new Promise<void>((resolve, reject) => {
              queueResolverRef.current = { resolve, reject };
              const log = {
                id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                timestamp: new Date().toISOString(),
                elapsedMs: Math.round(performance.now() - startedAt),
                level: "INFO" as const,
                component: "workflow.queue",
                message: `workflow.queue(id=${item.id}) — staged in officer queue`,
              };
              dispatch({ type: "QUEUED_FOR_OFFICER", item, log });
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
    const elapsedMs = startedAtRef.current
      ? Math.round(performance.now() - startedAtRef.current)
      : 0;
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      elapsedMs,
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

  const approveQueueItem = useCallback((itemId: string) => {
    const elapsedMs = startedAtRef.current
      ? Math.round(performance.now() - startedAtRef.current)
      : 0;
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      elapsedMs,
      level: "INFO" as const,
      component: "human.queue_approve",
      message: `human.queue_approve(id=${itemId}) — officer approved queued transfer`,
    };
    dispatch({ type: "OFFICER_QUEUE_ACTION", itemId, action: "approve", log });
    queueResolverRef.current?.resolve();
    queueResolverRef.current = null;
  }, []);

  const declineQueueItem = useCallback((itemId: string) => {
    const elapsedMs = startedAtRef.current
      ? Math.round(performance.now() - startedAtRef.current)
      : 0;
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      elapsedMs,
      level: "WARN" as const,
      component: "human.queue_decline",
      message: `human.queue_decline(id=${itemId}) — officer declined queued transfer`,
    };
    dispatch({ type: "OFFICER_QUEUE_ACTION", itemId, action: "decline", log });
    queueResolverRef.current?.reject();
    queueResolverRef.current = null;
  }, []);

  // Surface a voice live event into the demo state. Builds an audit
  // log entry from the event payload and asks the reducer to advance
  // the phase (forward-only — never regresses if the real workflow
  // has already moved past this point).
  const pushVoiceEvent = useCallback((event: VoiceLiveEvent) => {
    const baseLog: Omit<AuditLogEntry, "message" | "level" | "component"> = {
      id: `log_${event.timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(event.timestamp).toISOString(),
      elapsedMs: startedAtRef.current
        ? Math.round(performance.now() - startedAtRef.current)
        : 0,
    };

    let log: AuditLogEntry;
    let phaseHint: DemoPhase | undefined;

    switch (event.type) {
      case "member_identified":
        log = {
          ...baseLog,
          level: "INFO",
          component: "voice.live",
          message: `voice.member_identified(name="${event.memberName}", id=${event.memberId})`,
        };
        phaseHint = "resolving_member";
        break;
      case "intent_captured":
        log = {
          ...baseLog,
          level: "INFO",
          component: "voice.live",
          message: `voice.intent_captured(intent=${event.intent}, confidence=${event.confidence.toFixed(2)})`,
        };
        phaseHint = "classifying_intent";
        break;
      case "request_confirmed":
        log = {
          ...baseLog,
          level: "INFO",
          component: "voice.live",
          message: `voice.request_confirmed(intent=${event.intent.intent})`,
        };
        // No phase advance — the next event will be the real trigger
        // arriving via polling and starting the workflow.
        phaseHint = undefined;
        break;
    }

    if (startedAtRef.current == null) {
      startedAtRef.current = performance.now();
    }

    dispatch({ type: "VOICE_LIVE_EVENT", log, phaseHint });
  }, []);

  const reset = useCallback(() => {
    confirmResolverRef.current?.reject();
    confirmResolverRef.current = null;
    queueResolverRef.current?.reject();
    queueResolverRef.current = null;
    startedAtRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    sendTrigger,
    confirmOffer,
    modifyOffer,
    approveQueueItem,
    declineQueueItem,
    pushVoiceEvent,
    reset,
  };
}
