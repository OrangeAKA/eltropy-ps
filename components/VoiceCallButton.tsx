"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Device, type Call } from "@twilio/voice-sdk";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CallStatus =
  | "idle"
  | "fetching_token"
  | "registering"
  | "calling"
  | "in_call"
  | "ended"
  | "error";

type Props = {
  disabled?: boolean;
};

// Hero-style call button hosted inside the member's PhoneFrame. The
// member side is where the call originates; this component is the
// primary CTA. When a call is active it expands into a stacked control
// panel (status pill + DTMF keypad + hang up), all sized for the ~340px
// phone interior width.
export function VoiceCallButton({ disabled }: Props) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);

  // Cleanup on unmount. With the perspective toggle pattern, this
  // component stays mounted across view switches (both views render
  // and toggle visibility via CSS), so the call survives toggling.
  useEffect(() => {
    return () => {
      try {
        callRef.current?.disconnect();
      } catch {}
      try {
        deviceRef.current?.destroy();
      } catch {}
      deviceRef.current = null;
      callRef.current = null;
    };
  }, []);

  const startCall = useCallback(async () => {
    setErrorMsg(null);
    setStatus("fetching_token");
    try {
      const res = await fetch("/api/voice/token", { cache: "no-store" });
      if (!res.ok) {
        const errorBody: unknown = await res.json().catch(() => ({}));
        const msg =
          errorBody && typeof errorBody === "object" && "error" in errorBody
            ? String((errorBody as { error: unknown }).error)
            : `Token fetch failed: ${res.status}`;
        throw new Error(msg);
      }
      const { token } = (await res.json()) as { token: string };

      setStatus("registering");

      const device = new Device(token, {
        logLevel: "warn",
        edge: "ashburn",
      });
      deviceRef.current = device;

      device.on("error", (err) => {
        console.warn("[voice-call] device error:", err);
        setErrorMsg(err?.message ?? "Twilio device error");
        setStatus("error");
      });

      await device.register();

      setStatus("calling");
      const call = await device.connect({ params: {} });
      callRef.current = call;

      call.on("accept", () => setStatus("in_call"));
      call.on("disconnect", () => {
        setStatus("ended");
        callRef.current = null;
        try {
          deviceRef.current?.destroy();
        } catch {}
        deviceRef.current = null;
      });
      call.on("error", (err: unknown) => {
        console.warn("[voice-call] call error:", err);
        const errorObj = err as { message?: string };
        setErrorMsg(errorObj?.message ?? "Call error");
        setStatus("error");
      });
    } catch (err) {
      console.error("[voice-call] startCall failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, []);

  const endCall = useCallback(() => {
    try {
      callRef.current?.disconnect();
    } catch {}
    callRef.current = null;
    try {
      deviceRef.current?.destroy();
    } catch {}
    deviceRef.current = null;
    setStatus("ended");
  }, []);

  const sendDigit = useCallback((digit: string) => {
    try {
      callRef.current?.sendDigits(digit);
    } catch (err) {
      console.warn("[voice-call] sendDigits failed:", err);
    }
  }, []);

  const isLive = status === "in_call" || status === "calling";
  const isBusy = status === "fetching_token" || status === "registering";

  // ── Idle / busy ── primary CTA
  if (!isLive && status !== "ended" && status !== "error") {
    return (
      <Button
        onClick={startCall}
        disabled={disabled || isBusy}
        size="lg"
        className={cn(
          "h-12 w-full gap-2 rounded-2xl text-[14px] font-medium",
          "bg-[oklch(0.50_0.12_150)] hover:bg-[oklch(0.44_0.13_150)] text-white",
          "shadow-[0_6px_16px_-8px_color-mix(in_oklch,oklch(0.40_0.12_150)_60%,transparent)]",
        )}
      >
        {isBusy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Phone className="h-4 w-4" />
        )}
        {isBusy
          ? status === "fetching_token"
            ? "Connecting…"
            : "Registering…"
          : "Talk to Cyprus CU"}
      </Button>
    );
  }

  // ── Live call ── stacked control panel
  if (isLive) {
    return (
      <div className="flex flex-col gap-3">
        {/* Call status header */}
        <div className="flex items-center justify-between rounded-2xl border border-rule bg-[color:var(--color-member-card)] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{
                  background: "oklch(0.55 0.18 25)",
                  animation:
                    "memberWidgetPulse 1.4s cubic-bezier(0.22, 1, 0.36, 1) infinite",
                }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: "oklch(0.55 0.18 25)" }}
              />
            </span>
            <span className="text-[12px] font-medium text-foreground">
              {status === "in_call" ? "On call" : "Connecting"}
            </span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Cyprus CU
          </span>
        </div>

        {/* DTMF keypad */}
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Touch tone
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
              (d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => sendDigit(d)}
                  className={cn(
                    "h-9 rounded-lg border border-rule bg-[color:var(--color-member-card)]",
                    "font-mono text-[14px] text-foreground",
                    "transition-colors hover:bg-brand-50 active:bg-brand-100",
                  )}
                >
                  {d}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Hang up */}
        <Button
          onClick={endCall}
          size="sm"
          variant="outline"
          className="h-10 gap-1.5 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          Hang up
        </Button>
      </div>
    );
  }

  // ── Ended ── offer to call again
  if (status === "ended") {
    return (
      <Button
        onClick={startCall}
        disabled={disabled || isBusy}
        size="lg"
        variant="outline"
        className="h-12 w-full gap-2 rounded-2xl text-[14px]"
      >
        <Phone className="h-4 w-4" />
        Call again
      </Button>
    );
  }

  // ── Error ──
  if (status === "error" && errorMsg) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-rose-200 bg-rose-50/40 p-3">
        <p
          className="text-[11px] leading-relaxed text-rose-800 line-clamp-3"
          title={errorMsg}
        >
          {errorMsg}
        </p>
        <Button
          onClick={() => {
            setStatus("idle");
            setErrorMsg(null);
          }}
          size="sm"
          variant="outline"
          className="h-8 text-[11px]"
        >
          Retry
        </Button>
      </div>
    );
  }

  return null;
}
