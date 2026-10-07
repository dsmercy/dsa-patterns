import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const MAX_TRIES = 5, LOCK_SECONDS = 30;

export function Login() {
  const { authed, login } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tries, setTries] = useState(0);
  const [lock, setLock] = useState(0);

  useEffect(() => { document.title = "Sign in · DSA Patterns in Java · Coding Hacks"; }, []);
  useEffect(() => {
    if (lock <= 0) return;
    const t = setTimeout(() => { setLock((s) => s - 1); if (lock === 1) setTries(0); }, 1000);
    return () => clearTimeout(t);
  }, [lock]);

  if (authed) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || lock > 0) return;
    if (!userId.trim() || !password) { setError("Enter your user ID and password."); return; }
    setBusy(true); setError("");
    const ok = await login(userId, password);
    setBusy(false);
    if (ok) { nav(from, { replace: true }); return; }
    const n = tries + 1; setTries(n); setPassword("");
    if (n >= MAX_TRIES) { setLock(LOCK_SECONDS); setError(`Too many attempts. Try again in ${LOCK_SECONDS} seconds.`); }
    else setError(`Wrong user ID or password. ${MAX_TRIES - n} attempt${MAX_TRIES - n === 1 ? "" : "s"} left.`);
  };

  return (
    <div className="wrap login-wrap">
      <form className="card login" onSubmit={submit} noValidate>
        <div className="brand" style={{ marginBottom: 6 }}>Coding <b>Hacks</b></div>
        <h1>Sign in</h1>
        <p className="sub">DSA Patterns in Java — visual walkthroughs and a runnable Java playground for every problem.</p>

        <label className="lbl" htmlFor="uid">User ID</label>
        <input id="uid" className="field" autoComplete="username" autoFocus spellCheck={false} autoCapitalize="off" value={userId} onChange={(e) => setUserId(e.target.value)} disabled={lock > 0} />

        <label className="lbl" htmlFor="pwd">Password</label>
        <div className="pw">
          <input id="pwd" className="field" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={lock > 0} />
          <button type="button" className="btn" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
        </div>

        <div className="login-err" role="alert" aria-live="polite">{lock > 0 ? `Too many attempts. Try again in ${lock}s.` : error}</div>
        <button className="btn primary login-go" type="submit" disabled={busy || lock > 0}>{busy ? "Checking…" : "Sign in"}</button>
      </form>
    </div>
  );
}
