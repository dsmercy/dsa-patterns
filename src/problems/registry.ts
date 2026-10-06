import type { Problem } from "./types";

/**
 * Auto-registers every `src/problems/<slug>/problem.ts`. Adding a problem = adding that file
 * (see `npm run scaffold`). No other file needs editing.
 */
const modules = import.meta.glob<{ default: Problem }>("./*/problem.ts", { eager: true });

export const problems: Problem[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.number - b.number);

export const bySlug = (slug: string | undefined) => problems.find((p) => p.slug === slug);

export function neighbours(p: Problem) {
  const i = problems.findIndex((x) => x.slug === p.slug);
  return { prev: problems[i - 1], next: problems[i + 1] };
}

export function byCategory(): [string, Problem[]][] {
  const map = new Map<string, Problem[]>();
  for (const p of problems) map.set(p.category, [...(map.get(p.category) ?? []), p]);
  return [...map];
}
