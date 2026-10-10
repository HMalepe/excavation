import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { HttpError } from "@/lib/auth/guards";
import { userDb } from "@/lib/db/server";
import { adminDb } from "@/lib/db/admin";

const Body = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });

const HOME: Record<string, string> = {
  teacher: "/school/teacher", school_admin: "/school/admin", safeguarding_contact: "/school/safeguarding", excavation_staff: "/staff",
};

export const POST = handle(async (req: Request) => {
  const { email, password } = Body.parse(await req.json());
  const db = await userDb();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new HttpError(401, "Email or password is wrong.");
  const { data: profile } = await adminDb().from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!profile || profile.role === "learner") {
    await db.auth.signOut();
    throw new HttpError(403, "This login is for school and Excavation staff.");
  }
  return ok({ next: HOME[profile.role] ?? "/" });
});
