import { NextResponse } from "next/server";
import { getSp500Symbols } from "@/lib/sp500";
import { fetchYahooIntraday15m } from "@/lib/yahoo";
import { detectOutsideReversals } from "@/lib/outsideReversal";

export const revalidate = 0;
export const maxDuration = 800; // capped by Vercel platform limit

let cache: { reversals: any[]; at: number } | null = null;

export async function GET() {
  // cache for 60 seconds to reduce upstream traffic
  if (cache && Date.now() - cache.at < 60_000) {
    return NextResponse.json({ reversals: cache.reversals, cached: true });
  }
  const symbols = await getSp500Symbols();

  // Limit concurrent fetches to avoid rate limiting
  const concurrency = Number(process.env.SCAN_CONCURRENCY || 10);
  const queue = [...symbols];
  const reversals: Array<{
    symbol: string;
    timeframe: string;
    direction: "bullish" | "bearish";
    time: string;
    ohlc: { o: number; h: number; l: number; c: number };
  }> = [];

  async function worker() {
    while (queue.length) {
      const sym = queue.shift();
      if (!sym) break;
      try {
        const candles = await fetchYahooIntraday15m(sym);
        const outs = detectOutsideReversals(candles);
        const latest = outs.length ? outs[outs.length - 1] : undefined;
        if (latest) {
          reversals.push({
            symbol: sym,
            timeframe: "15m",
            direction: latest.direction,
            time: new Date(latest.time).toISOString(),
            ohlc: { o: latest.o, h: latest.h, l: latest.l, c: latest.c },
          });
        }
      } catch (e) {
        // Swallow per-symbol errors to keep overall scan stable
        continue;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));

  cache = { reversals, at: Date.now() };
  return NextResponse.json({ reversals, cached: false });
}

