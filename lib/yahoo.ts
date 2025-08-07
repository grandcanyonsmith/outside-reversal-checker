export type Candle = { t: number; o: number; h: number; l: number; c: number; v?: number };

// Fetch 15m candles for the last ~2 days to detect patterns reliably
export async function fetchYahooIntraday15m(symbol: string): Promise<Candle[]> {
  const nowSec = Math.floor(Date.now() / 1000);
  const period2 = nowSec + 5 * 60; // slight future padding per Yahoo behavior
  const period1 = nowSec - 2 * 24 * 60 * 60; // 2 days back
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=15m&period1=${period1}&period2=${period2}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Yahoo fetch failed ${symbol}: ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result || !result.timestamp) return [];
  const timestamps: number[] = result.timestamp;
  const q = result.indicators?.quote?.[0];
  if (!q) return [];
  const candles: Candle[] = timestamps.map((t: number, i: number) => ({
    t: t * 1000,
    o: q.open?.[i] ?? 0,
    h: q.high?.[i] ?? 0,
    l: q.low?.[i] ?? 0,
    c: q.close?.[i] ?? 0,
    v: q.volume?.[i] ?? 0,
  })).filter(c => Number.isFinite(c.o) && Number.isFinite(c.h) && Number.isFinite(c.l) && Number.isFinite(c.c));
  return candles;
}

// Fetch 1d candles for the last ~120 calendar days
export async function fetchYahooDaily(symbol: string, days: number = 120): Promise<Candle[]> {
  const nowSec = Math.floor(Date.now() / 1000);
  const period2 = nowSec + 5 * 60;
  const period1 = nowSec - days * 24 * 60 * 60;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Yahoo fetch failed ${symbol}: ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result || !result.timestamp) return [];
  const timestamps: number[] = result.timestamp;
  const q = result.indicators?.quote?.[0];
  if (!q) return [];
  const candles: Candle[] = timestamps.map((t: number, i: number) => ({
    t: t * 1000,
    o: q.open?.[i] ?? 0,
    h: q.high?.[i] ?? 0,
    l: q.low?.[i] ?? 0,
    c: q.close?.[i] ?? 0,
    v: q.volume?.[i] ?? 0,
  })).filter(c => Number.isFinite(c.o) && Number.isFinite(c.h) && Number.isFinite(c.l) && Number.isFinite(c.c));
  return candles;
}

