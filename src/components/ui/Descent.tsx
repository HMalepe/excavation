import { Stepper } from "./Brand";
import type { Descent as D } from "@/lib/flow/stages";

/** The five-stage descent (spec 02 §3.7): named stages as ordered marks, never a percentage. */
export function Descent({ at }: { at: D }) {
  return <Stepper at={at} />;
}
