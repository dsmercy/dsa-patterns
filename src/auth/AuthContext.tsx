import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { credentialHash } from "./sha256";
import { CREDENTIAL_HASH, ROUNDS, SALT } from "./credentials";

/*
 * Static single-user login. IMPORTANT: this runs in the browser of a static site, so it is a *gate*, not real security —
 * the lessons themselves are still part of the downloaded JavaScript. It keeps casual visitors out and never stores the
 * password (only a salted hash is shipped). For real protection put the site behind a server-side login (see README).
 */
const KEY = "ch:session";

interface Auth { authed: boolean; login: (userId: string, password: string) => Promise<boolean>; logout: () => void }
const Ctx = createContext<Auth>({ authed: false, login: async () => false, logout: () => {} });
export const useAuth = () => useContext(Ctx);

const read = () => { try { return sessionStorage.getItem(KEY) === CREDENTIAL_HASH; } catch { return false; } };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(read);
  const login = useCallback(async (userId: string, password: string) => {
    await new Promise((r) => setTimeout(r, 30)); // let the "checking…" state paint before the ~100 ms hash
    const ok = credentialHash(SALT, ROUNDS, userId.trim(), password) === CREDENTIAL_HASH;
    if (ok) { try { sessionStorage.setItem(KEY, CREDENTIAL_HASH); } catch { /* private mode: stay signed in for this tab only */ } setAuthed(true); }
    return ok;
  }, []);
  const logout = useCallback(() => { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } setAuthed(false); }, []);
  const value = useMemo(() => ({ authed, login, logout }), [authed, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Wrap routes that need a signed-in user; others are redirected to /login and returned here afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authed } = useAuth();
  const loc = useLocation();
  if (!authed) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}
