import { confirmEvent } from "@/lib/safeguarding/notify";

/** The confirmation link in the alert (spec 10 Step 7): records school_confirmed_at. No login needed. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ok = await confirmEvent(url.searchParams.get("e") ?? "", url.searchParams.get("t") ?? "").catch(() => false);
  const body = ok
    ? "<h1>Thank you — receipt confirmed.</h1><p>The Excavation safeguarding lead can see that you have this. Please follow your school's safeguarding procedure.</p>"
    : "<h1>This link isn't valid.</h1><p>Please confirm from your Excavation safeguarding page, or reply to the alert email.</p>";
  return new Response(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Safeguarding confirmation</title><body style="font-family:system-ui;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.5">${body}</body>`, {
    status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
