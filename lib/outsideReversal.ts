import type { Candle } from "./yahoo";

export type OutsideReversal = {
  index: number;
  time: number;
  direction: "bullish" | "bearish";
  o: number; h: number; l: number; c: number;
};

// Outside bar definition: current bar high > prior high and current low < prior low.
// Reversal flavor: direction inferred by close vs open (bullish if c > o, bearish if c < o).
export function detectOutsideReversals(candles: Candle[]): OutsideReversal[] {
  const out: OutsideReversal[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];
    if (cur.h > prev.h && cur.l < prev.l) {
      const direction = cur.c >= cur.o ? "bullish" : "bearish";
      out.push({ index: i, time: cur.t, direction, o: cur.o, h: cur.h, l: cur.l, c: cur.c });
    }
  }
  return out;
}

export function aggregateTwoDay(candles: Candle[]): Candle[] {
  // Sliding 2-day windows: [0,1], [1,2], [2,3], ..., so latest always covers yesterday+today
  const agg: Candle[] = [];
  for (let i = 0; i < candles.length - 1; i++) {
    const first = candles[i];
    const second = candles[i + 1];
    agg.push({
      t: second.t,
      o: first.o,
      h: Math.max(first.h, second.h),
      l: Math.min(first.l, second.l),
      c: second.c,
      v: (first.v || 0) + (second.v || 0),
    });
  }
  return agg;
}

