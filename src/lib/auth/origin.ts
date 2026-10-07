/*
|----------------------------------------------------------------------------------------------------
| isSameOrigin
|----------------------------------------------------------------------------------------------------
| CSRF guard for cookie-authenticated route handlers (server actions already get Next's own check).
| A request that carries an Origin header must come from this app's own host.
*/
export function isSameOrigin(req: { headers: Headers }): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients and same-site navigations omit it

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}
