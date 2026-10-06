import type { Args } from "../problems/types";

/** Default input parser: comma separated JSON values -> argument list. `[1,2,3], 4` => [[1,2,3], 4] */
export function parseArgs(text: string): Args {
  let v: unknown;
  try { v = JSON.parse(`[${text}]`); } catch { throw new Error("Enter valid JSON values separated by commas, e.g. [1,2,3], 4"); }
  return v as Args;
}

export const show = (args: Args) => (args.length === 1 ? JSON.stringify(args[0]) : args.map((a) => JSON.stringify(a)).join(", "));
export const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
