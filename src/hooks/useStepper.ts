import { useCallback, useEffect, useRef, useState } from "react";

/** Play/pause/step controller over `length` steps. */
export function useStepper(length: number, speedMs: number) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = Math.max(0, length - 1);
  const lastRef = useRef(last);
  lastRef.current = last;

  // new step list (new input / new problem) -> restart
  useEffect(() => { setIndex(0); setPlaying(false); }, [length]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setIndex((i) => {
      if (i >= lastRef.current) { setPlaying(false); return i; }
      return i + 1;
    }), speedMs);
    return () => clearInterval(t);
  }, [playing, speedMs]);

  const clamp = (i: number) => Math.max(0, Math.min(lastRef.current, i));
  return {
    index, playing,
    seek: useCallback((i: number) => { setPlaying(false); setIndex(clamp(i)); }, []),
    next: useCallback(() => { setPlaying(false); setIndex((i) => clamp(i + 1)); }, []),
    prev: useCallback(() => { setPlaying(false); setIndex((i) => clamp(i - 1)); }, []),
    toggle: useCallback(() => { setIndex((i) => (i >= lastRef.current ? 0 : i)); setPlaying((p) => !p); }, []),
    restartAndPlay: useCallback(() => { setIndex(0); setPlaying(true); }, []),
  };
}
