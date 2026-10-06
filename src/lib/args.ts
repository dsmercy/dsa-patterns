import type { Args } from "../problems/types";

/** Default input parser: comma separated JSON values -> argument list. `[1,2,3], 4` => [[1,2,3], 4] */
export function parseArgs(text: string): Args {
  let v: unknown;
  try { v = JSON.parse(`[${text}]`); } catch { throw new Error("Enter valid JSON values separated by commas, e.g. [1,2,3], 4"); }
  return v as Args;
}

export const show = (args: Args) => (args.length === 1 ? JSON.stringify(args[0]) : args.map((a) => JSON.stringify(a)).join(", "));
export const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export interface IntRange { min?: number; max?: number }
/** Validates a user-typed integer array for the visualizer (keeps animations readable). */
export function intArray(v: unknown, { minLen = 1, maxLen = 12, min = -9, max = 99 }: IntRange & { minLen?: number; maxLen?: number } = {}): number[] {
  const msg = `Enter ${minLen}–${maxLen} integers between ${min} and ${max}, e.g. [1,2,3]`;
  if (!Array.isArray(v) || v.length < minLen || v.length > maxLen || v.some((x) => !Number.isInteger(x) || x < min || x > max)) throw new Error(msg);
  return v as number[];
}
export function intValue(v: unknown, name: string, { min = 0, max = 20 }: IntRange = {}): number {
  if (!Number.isInteger(v) || (v as number) < min || (v as number) > max) throw new Error(`${name} must be an integer from ${min} to ${max}`);
  return v as number;
}
