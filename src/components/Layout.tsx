import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** `homeLink={false}` makes the brand plain text (problem pages when SHOW_PROBLEM_NAV is off). */
export function Layout({ nav, children, homeLink = true }: { nav?: ReactNode; children: ReactNode; homeLink?: boolean }) {
  const { authed, logout } = useAuth();
  const brand = <>Coding <b>Hacks</b> · DSA Patterns in Java</>;
  return (
    <div className="wrap">
      <div className="top">
        {homeLink ? <Link className="brand" to="/" style={{ textDecoration: "none" }}>{brand}</Link> : <span className="brand">{brand}</span>}
        <div className="nav">
          {nav}
          {authed && <button className="btn" onClick={logout}>Sign out</button>}
        </div>
      </div>
      {children}
      <footer>Runs entirely in your browser — Java is translated to JavaScript, so very Java-specific behavior (int overflow, integer <code>/</code>) is not emulated.</footer>
    </div>
  );
}
