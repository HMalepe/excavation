import { DemoPart1 } from "@/components/client/DemoPart1";
import { itemById, valueCards } from "@/lib/config/questionBank";

export const metadata = { title: "Demo · Part 1" };

const PICKS: { id: string; sec: string; label: string }[] = [
  { id: "IR1", sec: "interests", label: "What you enjoy" },
  { id: "IA1", sec: "interests", label: "What you enjoy" },
  { id: "PO1", sec: "personality", label: "How you are" },
];

export default function DemoPart1Page() {
  const questions = PICKS.map((p) => { const it = itemById.get(p.id)!; return { ...p, text: it.text, points: it.response.points as [number, string][] }; });
  return <DemoPart1 questions={questions} cards={valueCards.slice(0, 6).map((c) => ({ id: c.id, text: c.text }))} />;
}
