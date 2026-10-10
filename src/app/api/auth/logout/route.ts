import { handle, ok } from "@/lib/http";
import { userDb } from "@/lib/db/server";

export const POST = handle(async () => {
  const db = await userDb();
  await db.auth.signOut();
  return ok({ next: "/" });
});
