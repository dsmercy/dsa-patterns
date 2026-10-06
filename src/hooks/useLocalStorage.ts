import { useCallback, useState } from "react";

/** localStorage-backed state that never throws (private mode / blocked storage). */
export function useLocalStorage(key: string, initial: string): [string, (v: string) => void, () => void] {
  const [value, setValue] = useState(() => { try { return localStorage.getItem(key) ?? initial; } catch { return initial; } });
  const set = useCallback((v: string) => { setValue(v); try { localStorage.setItem(key, v); } catch { /* ignore */ } }, [key]);
  const reset = useCallback(() => { setValue(initial); try { localStorage.removeItem(key); } catch { /* ignore */ } }, [key, initial]);
  return [value, set, reset];
}
