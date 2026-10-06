import type { ReactNode } from "react";

export const Card = ({ title, small, children, id, className = "" }: { title?: string; small?: string; children: ReactNode; id?: string; className?: string }) => (
  <section className={`card ${className}`} id={id}>
    {title && <h2>{title}{small && <small>{small}</small>}</h2>}
    {children}
  </section>
);

export const Pill = ({ tone, children }: { tone: "time" | "space" | "cat"; children: ReactNode }) => <span className={`pill ${tone}`}>{children}</span>;

export const Complexity = ({ time, space }: { time: string; space: string }) => (
  <><Pill tone="time">TIME {time}</Pill> <Pill tone="space">SPACE {space}</Pill></>
);
