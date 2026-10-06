import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Layout({ nav, children }: { nav?: ReactNode; children: ReactNode }) {
  return (
    <div className="wrap">
      <div className="top">
        <Link className="brand" to="/" style={{ textDecoration: "none" }}>Coding <b>Hacks</b> · DSA Patterns in Java</Link>
        <div className="nav">{nav}</div>
      </div>
      {children}
      <footer>Runs entirely in your browser — Java is translated to JavaScript, so very Java-specific behavior (int overflow, integer <code>/</code>) is not emulated.</footer>
    </div>
  );
}
