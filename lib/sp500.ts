export async function getSp500Symbols(): Promise<string[]> {
  const envCsv = process.env.SP500_SYMBOLS_CSV;
  if (envCsv) {
    return envCsv.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  }
  try {
    const list = (await import("@/data/sp500.json")).default as string[];
    return list;
  } catch {
    return [];
  }
}

