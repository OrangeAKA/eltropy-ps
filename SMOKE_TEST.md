# Smoke Test

Run this manually before deploy (or after any structural change). ~3 minutes.

## Setup
- [ ] `npm install` succeeds without errors
- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] `npm run dev` starts on port 3000 without errors

## Static rendering
- [ ] Open http://localhost:3000 in Chrome
- [ ] Header shows "Eltropy Mission Control · Cyprus Credit Union · Production"
- [ ] Four connection-status dots visible (Symitar, MeridianLink, Velera, Eltropy Voice AI)
- [ ] "Send trigger" button visible top-right
- [ ] Left pane shows three tabs: Catalog, Composer, Runtime
- [ ] Composer tab is selected by default and shows the One-Conversation Lending workflow with 5 skill nodes
- [ ] Right pane shows empty member context, idle Copilot sidebar
- [ ] Footer shows synthetic-data disclaimer and a live clock

## Catalog tab
- [ ] Click Catalog tab
- [ ] Six installed Eltropy skills render as cards
- [ ] Four marketplace placeholders render (Akuvo, MeridianLink, Velera, Verafin) with dashed borders and lock icons
- [ ] Click any installed skill → detail modal opens with description, inputs, outputs, regulatory tags
- [ ] Click any marketplace skill → modal shows "Coming v1.1" and a pricing line
- [ ] Close modal returns cleanly

## Trigger via preset
- [ ] Click "Send trigger"
- [ ] Modal opens with two member cards (Michael Tanaka, Maria Vega)
- [ ] Michael selected by default
- [ ] Click "Use preset sms" → textarea populates with the auto loan inquiry
- [ ] Click "Send to Mission Control"
- [ ] Modal closes
- [ ] Left pane auto-switches to Runtime tab
- [ ] Audit log streams entries: trigger.receive, member.resolve, intent.classify, workflow.route, then each skill execution
- [ ] Each Composer skill card pulses while running, then check-marks on completion
- [ ] Right pane member context card populates with Michael's data (FICO 758, prime, 4 products)
- [ ] Conversation thread shows Michael's message
- [ ] Copilot sidebar shows intent classification (lending_inquiry, ~95% confidence)
- [ ] Demo pauses at "Awaiting your approval"
- [ ] Copilot shows structured offer: $25K / 60mo / 5.99% APR / monthly payment / rationale / Truth-in-Lending disclosure

## Confirm path
- [ ] Click "Confirm & send"
- [ ] E-sign skill fires
- [ ] Demo completes with "Loan funded" card showing total time + audit event count
- [ ] Conversation thread shows confirmation message
- [ ] Click "Reset" → all panes return to idle state

## Modify path
- [ ] Send trigger again
- [ ] At the confirm gate, click "Modify"
- [ ] Demo halts cleanly, no error
- [ ] Reset returns to idle

## Trigger via speech (Chrome / Edge only)
- [ ] Open "Send trigger" modal
- [ ] Click "Speak as Michael" → browser asks for mic permission, grant it
- [ ] Speak something like "I'd like to finance a Honda for around twenty-five thousand"
- [ ] Transcript appears live in the textarea as you speak
- [ ] Click stop, then "Send to Mission Control"
- [ ] Channel badge shows "voice"
- [ ] Audit log includes a `voice.transcribe` entry with the transcript
- [ ] Rest of flow runs identically to preset

## Trigger as Maria Vega
- [ ] Send trigger, pick Maria, use preset (refinance inquiry)
- [ ] Intent classifies as `refinance_inquiry`
- [ ] Routes to `AutoRefinanceFlow` workflow (different than Michael's)
- [ ] Demo runs through with Maria's lower FICO (692) producing a different APR band
- [ ] Confirms adaptation: same workflow shape, different decisioning output based on member attributes

## Build + deploy
- [ ] `npm run build` succeeds
- [ ] `vercel deploy --prod` succeeds
- [ ] Deployed URL returns HTTP 200
- [ ] Open deployed URL in Chrome → full flow works

## Mobile fallback
- [ ] Resize browser window to <1024px width
- [ ] Page shows "designed for desktop viewing" message
- [ ] Resize back to full width → split-screen returns
