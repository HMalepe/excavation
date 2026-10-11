import { DemoPart2 } from "@/components/client/DemoPart2";
import { itemIndex } from "@/lib/skills/content";

export const metadata = { title: "Demo · Part 2" };

export default function DemoPart2Page() {
  const it = itemIndex.get("M8a")!.item;
  // Stem and options only: the answer key never leaves the server.
  return <DemoPart2 check={{ id: it.id, stem: it.stem, options: it.options }} />;
}
