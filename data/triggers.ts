// data/triggers.ts

export type TriggerScenario = {
  id: string
  label: string
  channel: 'sms' | 'voice' | 'chat'
  fromPhone: string
  body: string
  expectedIntent: string
}

export const triggers: TriggerScenario[] = [
  {
    id: 'trigger-001',
    label: 'SMS from Michael Tanaka',
    channel: 'sms',
    fromPhone: '+12065554823',
    body: "Hi, I'm looking to finance a 2024 Honda CR-V I found at a dealership here in Seattle. I'd need around $25,000. Can you tell me what rates I'd qualify for and how I can get started?",
    expectedIntent: 'lending_inquiry',
  },
  {
    id: 'trigger-002',
    label: 'Voice Call from Maria Vega',
    channel: 'voice',
    fromPhone: '+17135558934',
    body: "Hey, hi — yeah, so I have an auto loan with you guys right now, and, uh, I've been seeing that rates have dropped a little since I took it out. I was just wondering if there's a way to maybe refinance it? I think my balance is somewhere around eighteen thousand dollars. I'm just trying to see if I can get a lower monthly payment or something.",
    expectedIntent: 'refinance_inquiry',
  },
]
