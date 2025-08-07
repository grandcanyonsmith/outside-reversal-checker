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
  const [onlyRecent, setOnlyRecent] = useState<boolean>(true);

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
    const cutoff = Date.now() - 30 * 60_000; // show last 30min if onlyRecent
    return reversals
      .filter(r => (onlyRecent ? new Date(r.time).getTime() >= cutoff : true))
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [reversals, onlyRecent]);

  return (
    <div className="container">
      <div className="toolbar">
        <h1>Outside Reversal Checker</h1>
        <div className="pill mono">{isLoading ? "Refreshing…" : `Last updated: ${lastUpdated || "—"}`}</div>
      </div>
      <div className="toolbar">
        <div className="muted">S&P 500 • 15m timeframe • auto-refresh 60s</div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={onlyRecent} onChange={e => setOnlyRecent(e.target.checked)} />
          Only show last 30 minutes
        </label>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Direction</th>
              <th>Time</th>
              <th>OHLC</th>
              <th>Timeframe</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.symbol}-${r.time}`}>
                <td className="mono">{r.symbol}</td>
                <td>
                  <span className={`badge ${r.direction === "bullish" ? "success" : "danger"}`}>
                    {r.direction}
                  </span>
                </td>
                <td className="mono">{new Date(r.time).toLocaleString()}</td>
                <td className="mono">o {r.ohlc.o.toFixed(2)} h {r.ohlc.h.toFixed(2)} l {r.ohlc.l.toFixed(2)} c {r.ohlc.c.toFixed(2)}</td>
                <td>15m</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">No outside reversals detected in the selected window.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

