"use client";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** POST JSON to our own API. Error messages from the server are written for learners. */
export async function post<T = Record<string, unknown>>(url: string, body: unknown = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "No connection. Your answers so far are saved — try again in a moment.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? "Something went wrong.");
  return data as T;
}

export const learn = <T = Record<string, unknown>>(action: string, body: unknown = {}) => post<T>(`/api/learn/${action}`, body);
