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

export function VoiceCallButton({ disabled }: Props) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);

  // Cleanup on unmount
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

  return (
    <div className="flex items-center gap-1.5">
      {!isLive && status !== "ended" && (
        <Button
          onClick={startCall}
          disabled={disabled || isBusy}
          size="sm"
          className={cn(
            "h-8 gap-1.5",
            "bg-[oklch(0.62_0.16_150)] hover:bg-[oklch(0.55_0.18_150)] text-white",
          )}
          title="Place a browser call to the Cyprus CU demo line"
        >
          {isBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Phone className="h-3.5 w-3.5" />
          )}
          {isBusy
            ? status === "fetching_token"
              ? "Connecting…"
              : "Registering…"
            : "Call Cyprus CU"}
        </Button>
      )}

      {isLive && (
        <>
          <div className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-800">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-600" />
            </span>
            {status === "in_call" ? "On call" : "Dialing"}
          </div>

          <div className="flex items-center gap-0.5 rounded-md border border-rule bg-white px-1 py-0.5">
            {["1", "2", "3", "4"].map((d) => (
              <button
                key={d}
                onClick={() => sendDigit(d)}
                className="h-6 w-6 rounded text-[11px] font-mono text-neutral-700 hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100"
                title={`Press ${d}`}
              >
                {d}
              </button>
            ))}
          </div>

          <Button
            onClick={endCall}
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            Hang up
          </Button>
        </>
      )}

      {status === "ended" && (
        <Button
          onClick={startCall}
          disabled={disabled || isBusy}
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
        >
          <Phone className="h-3.5 w-3.5" />
          Call again
        </Button>
      )}

      {status === "error" && errorMsg && (
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] text-rose-700 max-w-[460px] line-clamp-2 leading-tight"
            title={errorMsg}
          >
            {errorMsg}
          </span>
          <Button
            onClick={() => {
              setStatus("idle");
              setErrorMsg(null);
            }}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[10px]"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
