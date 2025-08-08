"use client";

import { useEffect, useMemo, useState } from "react";

type Reversal = {
  symbol: string;
  timeframe: string;
  direction: "bullish" | "bearish";
  time: string; // ISO
  ohlc: { o: number; h: number; l: number; c: number };
};

export default function HomePage() {
  const [reversals, setReversals] = useState<Reversal[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [onlyToday, setOnlyToday] = useState<boolean>(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/scan", { cache: "no-store" });
      const data = await res.json();
      setReversals(data.reversals ?? []);
      setLastUpdated(new Date().toISOString());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    return reversals
      .filter(r => (onlyToday ? new Date(r.time).getTime() >= startOfToday.getTime() : true))
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [reversals, onlyToday]);

  return (
    <div className="container">
      <div className="ticker">john pfernder</div>
      <div className="toolbar">
        <h1 className="bloomberg-title">Outside Reversal Checker</h1>
        <div className="pill mono">{isLoading ? "Refreshing…" : `Last updated: ${lastUpdated || "—"}`}</div>
      </div>
      <div className="toolbar">
        <div className="muted">S&P 500 • 2D timeframe • auto-refresh 60s (shows yesterday+today)</div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={onlyToday} onChange={e => setOnlyToday(e.target.checked)} />
          Only show today
        </label>
      </div>

      <div className="terminal">
        <table className="terminal-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Dir</th>
              <th>Time (2D close)</th>
              <th>Open</th>
              <th>High</th>
              <th>Low</th>
              <th>Close</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.symbol}-${r.time}`}>
                <td className="mono yellow">{r.symbol}</td>
                <td className={r.direction === "bullish" ? "green" : "red"}>{r.direction === "bullish" ? "▲" : "▼"}</td>
                <td className="mono muted">{new Date(r.time).toLocaleDateString()}</td>
                <td className="mono">{r.ohlc.o.toFixed(2)}</td>
                <td className="mono">{r.ohlc.h.toFixed(2)}</td>
                <td className="mono">{r.ohlc.l.toFixed(2)}</td>
                <td className="mono">{r.ohlc.c.toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">No 2D outside reversals detected in the selected window.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

