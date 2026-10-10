import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { loginLearner } from "@/lib/auth/learnerLogin";

const Body = z.object({ schoolCode: z.string().min(2).max(32), loginCode: z.string().min(2).max(32) });

export const POST = handle(async (req: Request) => {
  const body = Body.parse(await req.json());
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  await loginLearner(body.schoolCode, body.loginCode, ip);
  return ok({ next: "/learn" });
});
