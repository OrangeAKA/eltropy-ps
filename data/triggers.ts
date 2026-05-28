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
  {
    id: 'trigger-003',
    label: 'Voice Call from James Patterson',
    channel: 'voice',
    fromPhone: '+15095554412',
    body: "Hi, this is James. I just wanted to check in and see what's in my savings account and my money market right now. Do you have that handy?",
    expectedIntent: 'balance_inquiry',
  },
  {
    id: 'trigger-004',
    label: 'SMS from Aisha Williams',
    channel: 'sms',
    fromPhone: '+17135557261',
    body: "I'm seeing a $487 charge from 'TICKETLY*GHOST' on my card from last Tuesday that I definitely didn't make. I need to dispute this charge.",
    expectedIntent: 'card_dispute',
  },
  {
    id: 'trigger-005',
    label: 'Chat from Tom Chen',
    channel: 'chat',
    fromPhone: '+18015552847',
    body: "yo can i get a personal loan for like 3k to fix my car? need it asap",
    expectedIntent: 'lending_inquiry',
  },
  {
    id: 'trigger-006',
    label: 'Voice Call from Linda Rodriguez',
    channel: 'voice',
    fromPhone: '+13035556094',
    body: "Hi, I'm calling about my business auto loan. Rates have come down quite a bit since we financed it, and I was wondering if it's worth refinancing the F-150 we did about two years ago — I think it was at seven and a half percent. Just want to see if the numbers make sense.",
    expectedIntent: 'refinance_inquiry',
  },
]
