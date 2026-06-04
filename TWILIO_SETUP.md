# Twilio Voice Setup

End-to-end setup to make the Cyprus CU number actually ring, IVR through to intent confirmation, and trigger Mission Control live.

## Prerequisites

You already have these from earlier setup:
- Twilio account (paid or trial with credit)
- US local Twilio number with **Voice + SMS** capability
- `.env.local` at the repo root with:
  ```
  TWILIO_ACCOUNT_SID=AC...
  TWILIO_AUTH_TOKEN=...
  TWILIO_PHONE_NUMBER=+1...
  TWILIO_API_KEY=SK...
  TWILIO_API_SECRET=...
  ```

You'll add one more env var (`TWILIO_TWIML_APP_SID`) in step 3 below.

## Step 1 — Deploy

This won't work on `localhost` because Twilio needs a public URL to send webhooks to.

Either:
- **Deploy to Vercel** (recommended). Push the branch, Vercel will give you a URL like `https://eltropy-ps-xxxx.vercel.app`. Add all the env vars from `.env.local` to the Vercel project's Environment Variables panel. Add `ANTHROPIC_API_KEY` too if it's not already there.
- **Or use ngrok locally**: `npx ngrok http 3000` → gives you a tunnel URL like `https://abc123.ngrok-free.app`. Use that wherever the steps below say "your base URL."

For the rest of this doc, the base URL is `https://<YOUR-URL>`.

## Step 2 — Point Your Twilio Number's Voice Webhook

This is what makes inbound PSTN calls (someone dialing the real number) run through the IVR.

1. Twilio Console → **Phone Numbers → Manage → Active numbers** → click your number.
2. Scroll to **Voice Configuration**.
3. Under **A call comes in**:
   - Set the dropdown to **Webhook**.
   - URL: `https://<YOUR-URL>/api/voice/incoming`
   - HTTP method: **POST**
4. Leave other fields default.
5. Click **Save configuration** at the bottom.

That's it for PSTN. You can call your Twilio number from any phone now and it'll hit the IVR.

## Step 3 — Create a TwiML App (for the Browser Call Button)

The browser Voice SDK needs a TwiML App that tells Twilio "when a browser client connects, run this same IVR." Without this, the "Call Cyprus CU" button in the app header won't work.

1. Twilio Console → **Voice → Manage → TwiML apps**.
2. Click **Create new TwiML App** (top right).
3. Fill in:
   - **Friendly name**: `eltropy-ps-browser`
   - **Voice Configuration → A call comes in**:
     - Set dropdown to **Webhook**.
     - URL: `https://<YOUR-URL>/api/voice/incoming`
     - HTTP method: **POST**
   - Leave everything else default.
4. Click **Create**.
5. On the next screen, copy the **TwiML App SID** (starts with `AP...`).
6. Add it to `.env.local` (and the Vercel env vars if deployed):
   ```
   TWILIO_TWIML_APP_SID=AP...
   ```
7. Redeploy (Vercel) or restart `next dev` to pick up the new env var.

## Step 4 — Test the Browser Call

1. Open `https://<YOUR-URL>` in Chrome (Firefox/Safari also fine).
2. Click **Call Cyprus CU** in the header.
3. Browser asks for microphone permission. Grant it.
4. You'll hear the greeting: "Thank you for calling Cyprus Credit Union..."
5. Press **1** on the DTMF keypad in the header (or your number row keys).
6. After "Thanks, Maria. Your call has been authenticated," the system prompts for your request.
7. Speak (your mic is live): "Move fifteen hundred dollars from my savings to my checking."
8. After a moment, the IVR reads back what it heard.
9. Press **1** to confirm.
10. The call hangs up. Within 2 seconds, **Mission Control lights up** with the trigger you just spoke. Watch the workflow run end-to-end.

## Step 5 — Test the Real Phone Call

From any phone in the US (or from India via Skype/Google Voice etc), dial your `TWILIO_PHONE_NUMBER`.

Same flow as Step 4, but you press digits on your physical phone keypad and the speech is captured by your phone's mic.

## Demo Roster

The IVR uses a fixed roster mapping digits to members. Edit `lib/twilio/demo-roster.ts` to change it.

| Digit | Member | Role in demo |
|-------|--------|--------------|
| 1 | Maria Santos | Autonomous tier — try "$1,500 savings to checking" |
| 2 | Robert Kim | Queue tier — try "$8,000 savings to checking" |
| 3 | Michael Tanaka | Synchronous tier — try "$10,000 savings to checking" |
| 4 | James Patterson | Balance inquiry — try "what's in my savings" |

## Cost

For browser calls from your machine, you pay only the Twilio inbound rate (~$0.0085/min). A 3-minute demo costs about $0.03. The Twilio number itself is $1.15/month.

If you also dial in from a US phone or your friends do, the same inbound rate applies. No international call charges if dialed from a US phone. From India, use the browser button — the WebRTC path has zero international call cost.

## Architecture (For Reference)

```
Caller (phone or browser)
   ↓
[Twilio Voice infrastructure]
   ↓ POST /api/voice/incoming → TwiML: greet + Gather digit
   ↓ POST /api/voice/member-select → TwiML: confirm member + Gather speech
   ↓ POST /api/voice/intent → classifyIntentServer() → TwiML: readback + Gather 1/2
   ↓ POST /api/voice/confirm (Digits=1) → pushPendingTrigger() → TwiML: hang up
                                            ↓
                                      [in-memory queue]
                                            ↓
Browser polls /api/voice/poll every 1.5s
   ↓ trigger received → sendTrigger()
   ↓ existing pipeline runs in browser (member-lookup → identity → step-up → etc.)
   ↓ Mission Control + Copilot update live
```

In-memory queue is a `Map` on `globalThis`. Survives within a warm serverless instance. For production-grade reliability across instances, swap `lib/twilio/call-state.ts` for Upstash Redis or Vercel KV — same interface.

## Troubleshooting

**"Token fetch failed: 503" in the browser button error.**
You haven't added `TWILIO_TWIML_APP_SID` yet, or one of the other Twilio env vars is missing. Check Vercel env vars or `.env.local`. Restart/redeploy after adding.

**Call connects, greeting plays, but pressing digits does nothing.**
Twilio's voice webhook URL is misconfigured. Check that **Phone Numbers → your number → A call comes in** is `https://<YOUR-URL>/api/voice/incoming` (not a typo, no trailing slash).

**Browser call connects but you don't hear anything.**
Browser permissions. Make sure the site has microphone access in your browser settings. Also check OS audio output.

**Mission Control doesn't light up after the call ends.**
The polling is firing every 1.5s. Open browser devtools → Network → look for `/api/voice/poll` requests. If they're 200 OK but `trigger: null`, the call didn't reach the confirm step (member didn't press 1, or there was a TwiML error). Check Vercel function logs or `next dev` console.

**Speech transcription returns garbage.**
Twilio Gather speech recognition. For better results: speak clearly, use simple sentences, name dollar amounts and account types explicitly. If you keep hitting low quality, see the original setup doc — Deepgram is the next-step upgrade.
