/**
 * Light, import-free demo copy: safe for client components. (Never import sample.ts from the browser: it pulls in
 * the scoring engine and with it the readiness-check answer keys.)
 */
export const DEMO_NAME = "Lerato";

export const DEMO_STEPS = [
  { href: "/demo/part-1", n: 1, title: "Part 1 · Know yourself", min: "1½ min" },
  { href: "/demo/part-2", n: 2, title: "Part 2 · Try it, then talk", min: "2 min" },
  { href: "/demo/results", n: 3, title: "Final results", min: "1½ min" },
] as const;

/** The scripted Guide exchange. Written in the Guide's real voice; the demo plays it, no AI is called. */
export const GUIDE_SCRIPT = {
  opening: `Hey ${DEMO_NAME}. Thanks for getting through the questions.\n\nNow I'll ask a few things, one at a time. Short answers are fine. First one's easy: think of a time recently when you lost track of time. What were you doing?`,
  turns: [
    [
      { say: "Making beats on my phone. I started at 8 and it was suddenly 11.", reply: "Three hours gone. That's a good sign. What was it about making the beat that pulled you in: the sound itself, or figuring out how to build it?" },
      { say: "Helping my cousin fix his bike. We got it going and I didn't notice dinner.", reply: "Dinner forgotten for a bike. I like that. What was it about fixing it that pulled you in: the problem itself, or helping him?" },
    ],
    [
      { say: "Honestly the figuring out. It's like a puzzle that makes a sound at the end.", reply: "That's useful. You like working out how something is put together, and then making something real from it. A lot of subjects ask for exactly that. One more: which subject at school feels like that, even a bit?" },
      { say: "Mostly the figuring out. I like when it finally works.", reply: "That's useful. You like working out how something is put together, and then making something real from it. A lot of subjects ask for exactly that. One more: which subject at school feels like that, even a bit?" },
    ],
    [
      { say: "Natural Sciences. Maths when I get it. Not Accounting.", reply: `That's everything I needed, ${DEMO_NAME}. Thank you. You were honest, and that's what makes your report worth reading.\n\nIt's being put together now. It will show how you're wired, which subject combinations fit you best, which ones to be careful with, and one thing to do this week.` },
      { say: "Natural Sciences. Creative Arts too. Accounting feels like a chore.", reply: `That's everything I needed, ${DEMO_NAME}. Thank you. You were honest, and that's what makes your report worth reading.\n\nIt's being put together now. It will show how you're wired, which subject combinations fit you best, which ones to be careful with, and one thing to do this week.` },
    ],
  ],
} as const;
