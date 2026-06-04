// lib/twilio/demo-roster.ts
//
// Maps DTMF digits to demo members for the IVR member-select step.
// Stand-in for ANI-based lookup since the demo caller's phone won't be in
// the members table.

import { members } from "@/data/members";

export type RosterEntry = {
  digit: string;
  memberId: string;
  fullName: string;
  phone: string;
};

export const DEMO_ROSTER: RosterEntry[] = [
  { digit: "1", memberId: "2947561", fullName: "Maria Santos", phone: "+14155559283" },
  { digit: "2", memberId: "6104823", fullName: "Robert Kim", phone: "+12135558761" },
  { digit: "3", memberId: "8842914", fullName: "Michael Tanaka", phone: "+12065554823" },
  { digit: "4", memberId: "5064731", fullName: "James Patterson", phone: "+15095554412" },
];

export function rosterByDigit(digit: string): RosterEntry | undefined {
  return DEMO_ROSTER.find((r) => r.digit === digit);
}

export function memberById(memberId: string) {
  return members.find((m) => m.id === memberId);
}
