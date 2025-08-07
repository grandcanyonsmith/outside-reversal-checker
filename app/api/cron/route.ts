import { NextResponse } from "next/server";
export const maxDuration = 800; // capped by Vercel platform limit
import { getSp500Symbols } from "@/lib/sp500";
import { fetchYahooIntraday15m } from "@/lib/yahoo";
import { detectOutsideReversals } from "@/lib/outsideReversal";

async function notify(symbol: string, direction: "bullish" | "bearish", timeISO: string) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;
  const text = `Outside reversal (${direction}) detected for ${symbol} on 15m at ${timeISO}`;
  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export async function GET() {
  const symbols = await getSp500Symbols();
  const concurrency = Number(process.env.SCAN_CONCURRENCY || 10);
  const queue = [...symbols];
  const nowMinus20m = Date.now() - 20 * 60_000; // ensure we're within recent window for notifications

  async function worker() {
    while (queue.length) {
      const sym = queue.shift();
      if (!sym) break;
      try {
        const candles = await fetchYahooIntraday15m(sym);
        const outs = detectOutsideReversals(candles);
        const latest = outs.length ? outs[outs.length - 1] : undefined;
        if (latest && latest.time >= nowMinus20m) {
          await notify(sym, latest.direction, new Date(latest.time).toISOString());
        }
      } catch {
        // continue
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));

  return NextResponse.json({ ok: true });
}

