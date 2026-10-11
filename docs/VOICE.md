# Voice and copy guide

For 15–16-year-olds in South African schools. Applies to every screen, email, PDF and AI prompt.

## Who we sound like
A sharp older cousin who's good at school and tells you the truth. Warm, direct, a bit dry. Never cute, never a teacher, never an app trying to be your friend.

## Rules
1. **Plain words.** Grade 7 reading level. Average sentence about 12 words, none over 25. If a 14-year-old would reread it, rewrite it.
2. **Say what happens next.** Every screen answers "what is this" and "what do I do". Buttons are verbs, three words or fewer.
3. **Be specific, not reassuring.** "Nothing here is marked" beats "Don't worry!". Reassure with a fact, never with an adjective.
4. **Be honest about privacy and about the AI.** Say it once, plainly, before it matters. No fine print.
5. **No hype, no therapy-speak.** Banned: journey, unlock, potential (as a noun about them), "you've got this", amazing, awesome, "Oops", "Whoops", "Great job", "well done", "congratulations", "your true self", "the universe", "reflect on", "self-discovery". No exclamation marks. No emoji.
6. **Never judge the person.** Answers are never right, wrong, good or bad. Describe what happened, not what they are.
7. **Errors:** what happened, then what to do. Never blame, never "invalid", never "error".
8. **Sentence case everywhere.** South African English: organised, programme, matric, LO teacher, Rand with a space (R9 300).
9. **Numbers:** no percentages in anything a learner sees about their own progress or results. Named stages only. Marks they typed in can be shown as typed.
10. **The dig metaphor is the brand's, so use it sparingly:** the five stages (Surface, Wading in, Deep water, The trench, The floor) carry it. Don't add "dig deeper", "excavate" or "uncover" to copy that doesn't need them.

## Words we use
- "The Guide" (an AI, always said plainly). "Your report". "Part 1" and "Part 2". "Check" (maths, science, reading) and "taster" (a short slice of real work).
- "Subject options", "doors" (what a subject combination keeps open or closes).
- "Reviewer" for the person who reads every report before release.

## Instrument items are frozen
The wording of the questionnaire items and response labels (`spec/config/question_bank.json`, instrument 1.0.0) is not edited here: changing an item's wording changes what it measures and breaks norming. Everything around the items (titles, instructions, notes, transitions) is fair game.

## AI voice
`src/lib/ai/prompts.ts` carries the same rules for The Guide and the report writer, plus a short craft block (specific over general, one idea per sentence, their words back to them, no stock phrases).
