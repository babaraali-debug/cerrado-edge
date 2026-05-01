/**
 * Cerrado Edge — Session 12
 * Track Record Storage Utility
 *
 * KEY CHANGES FROM SESSION 9:
 * - Hard stop loss: -3% from entry (closes trade as LOSS)
 * - Hard take profit: +5% from entry (closes trade as WIN)
 * - Maximum hold: 10 days (closes as WIN or LOSS based on return)
 * - Retroactive flagging of breached stop losses on existing signals
 * - Additional metrics: max drawdown, avg holding period, open P&L
 */

const STORAGE_KEY = 'cerrado_track_record';
const MAX_RECORDS = 500;

// ── Hard trading rules ────────────────────────────────────────────────────────
export const STOP_LOSS_PCT   = -3.0;  // -3% from entry → LOSS
export const TAKE_PROFIT_PCT = +5.0;  // +5% from entry → WIN
export const MAX_HOLD_DAYS   = 10;    // max 10 days → close at market

export function saveSignal({ ticker, pattern, grade, score, direction, entryPrice, stopLoss, target, winRate, edgeVsRandom, bestExitDay, category }) {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadAllSignals();
    const today = getTodayStr();
    const isDuplicate = existing.some(s => s.ticker === ticker && s.date === today && s.pattern === pattern);
    if (isDuplicate) return;

    // Compute hard stop and target based on rules — override tool's Kelly stop/target
    const entry = parseFloat(entryPrice);
    const hardStop   = parseFloat((entry * (1 + STOP_LOSS_PCT / 100)).toFixed(4));
    const hardTarget = parseFloat((entry * (1 + TAKE_PROFIT_PCT / 100)).toFixed(4));

    const newSignal = {
      id: `${ticker}-${pattern}-${today}-${Date.now()}`,
      ticker,
      pattern,
      grade,
      score,
      direction,
      entryPrice: entry,
      stopLoss: hardStop,        // hard -3% stop
      target: hardTarget,        // hard +5% target
      originalStopLoss: parseFloat(stopLoss),   // original Kelly stop for reference
      originalTarget: parseFloat(target),        // original Kelly target for reference
      winRate,
      edgeVsRandom,
      bestExitDay: Math.min(bestExitDay || 5, MAX_HOLD_DAYS),
      category: category || 'Unknown',
      date: today,
      timestamp: Date.now(),
      currentPrice: null,
      returnPct: null,
      outcome: null,
      holdingDays: null,
      lastUpdated: null,
      rulesApplied: true, // flag so we know this signal has hard rules
    };

    const updated = [newSignal, ...existing].slice(0, MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Track record save failed:', e);
  }
}

export function loadAllSignals() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function updateSignalPrices(updates) {
  if (typeof window === 'undefined') return;
  try {
    const signals = loadAllSignals();
    const map = {};
    updates.forEach(u => { map[u.id] = u.currentPrice; });

    const updated = signals.map(s => {
      if (!map[s.id]) return s;
      const currentPrice = map[s.id];
      const returnPct = ((currentPrice - s.entryPrice) / s.entryPrice * 100);
      const daysSince = getDaysSince(s.date);
      const holdingDays = daysSince;

      let outcome = 'OPEN';

      // Apply hard rules for signals with rulesApplied flag
      if (s.rulesApplied) {
        if (returnPct <= STOP_LOSS_PCT) {
          // Hit hard stop loss
          outcome = 'LOSS';
        } else if (returnPct >= TAKE_PROFIT_PCT) {
          // Hit hard take profit
          outcome = 'WIN';
        } else if (daysSince >= MAX_HOLD_DAYS) {
          // Max hold period reached — close at market
          outcome = returnPct >= 0 ? 'WIN' : 'LOSS';
        }
      } else {
        // Legacy signals without hard rules — use original logic
        if (currentPrice <= s.stopLoss) outcome = 'LOSS';
        else if (currentPrice >= s.target) outcome = 'WIN';
        else if (daysSince > (s.bestExitDay || 5)) outcome = returnPct >= 0 ? 'WIN' : 'LOSS';

        // Retroactively apply stop loss to legacy signals that have breached -3%
        if (outcome === 'OPEN' && returnPct <= STOP_LOSS_PCT) {
          outcome = 'LOSS';
        }
      }

      return {
        ...s,
        currentPrice,
        returnPct: parseFloat(returnPct.toFixed(2)),
        outcome,
        holdingDays,
        lastUpdated: getTodayStr()
      };
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return loadAllSignals();
  }
}

export function clearAllSignals() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getTrackStats(signals) {
  const closed = signals.filter(s => s.outcome === 'WIN' || s.outcome === 'LOSS');
  const wins   = closed.filter(s => s.outcome === 'WIN');
  const open   = signals.filter(s => s.outcome === 'OPEN' || s.outcome === null);

  const totalReturn    = closed.reduce((acc, s) => acc + (s.returnPct || 0), 0);
  const avgReturn      = closed.length > 0 ? totalReturn / closed.length : 0;
  const winRate        = closed.length > 0 ? Math.round(wins.length / closed.length * 100) : null;
  const avgPredictedWR = closed.length > 0 ? Math.round(closed.reduce((a, s) => a + s.winRate, 0) / closed.length) : null;

  // Max drawdown — worst single closed loss
  const losses = closed.filter(s => s.outcome === 'LOSS');
  const maxDrawdown = losses.length > 0
    ? Math.min(...losses.map(s => s.returnPct || 0))
    : null;

  // Best single trade
  const bestTrade = closed.length > 0
    ? Math.max(...closed.map(s => s.returnPct || 0))
    : null;

  // Average holding period
  const closedWithDays = closed.filter(s => s.holdingDays !== null && s.holdingDays !== undefined);
  const avgHoldingDays = closedWithDays.length > 0
    ? parseFloat((closedWithDays.reduce((a, s) => a + s.holdingDays, 0) / closedWithDays.length).toFixed(1))
    : null;

  // Open trade unrealised P&L
  const openWithPrices = open.filter(s => s.returnPct !== null);
  const openUnrealisedAvg = openWithPrices.length > 0
    ? parseFloat((openWithPrices.reduce((a, s) => a + (s.returnPct || 0), 0) / openWithPrices.length).toFixed(2))
    : null;
  const openPositive = openWithPrices.filter(s => (s.returnPct || 0) > 0).length;
  const openNegative = openWithPrices.filter(s => (s.returnPct || 0) < 0).length;

  // By grade
  const byGrade = {};
  ['A','B','C','D','F'].forEach(g => {
    const gs = closed.filter(s => s.grade === g);
    const gw = gs.filter(s => s.outcome === 'WIN');
    byGrade[g] = {
      total: gs.length,
      wins: gw.length,
      winRate: gs.length > 0 ? Math.round(gw.length / gs.length * 100) : null,
      avgReturn: gs.length > 0 ? parseFloat((gs.reduce((a, s) => a + (s.returnPct || 0), 0) / gs.length).toFixed(2)) : null,
    };
  });

  // By pattern
  const patterns = [...new Set(signals.map(s => s.pattern))];
  const byPattern = {};
  patterns.forEach(p => {
    const ps = closed.filter(s => s.pattern === p);
    const pw = ps.filter(s => s.outcome === 'WIN');
    byPattern[p] = {
      total: ps.length,
      wins: pw.length,
      winRate: ps.length > 0 ? Math.round(pw.length / ps.length * 100) : null,
      avgReturn: ps.length > 0 ? parseFloat((ps.reduce((a, s) => a + (s.returnPct || 0), 0) / ps.length).toFixed(2)) : null,
    };
  });

  return {
    total: signals.length,
    closed: closed.length,
    open: open.length,
    wins: wins.length,
    losses: closed.length - wins.length,
    winRate,
    avgReturn: parseFloat(avgReturn.toFixed(2)),
    avgPredictedWR,
    maxDrawdown,
    bestTrade,
    avgHoldingDays,
    openUnrealisedAvg,
    openPositive,
    openNegative,
    byGrade,
    byPattern,
  };
}

export function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export function getDaysSince(dateStr) {
  const then = new Date(dateStr);
  const now  = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
