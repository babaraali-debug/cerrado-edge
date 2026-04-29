/**
 * Cerrado Edge — Session 9
 * Track Record Storage Utility
 * Saves signals to localStorage, retrieves and updates with current prices
 */

const STORAGE_KEY = 'cerrado_track_record';
const MAX_RECORDS = 200; // keep last 200 signals

export function saveSignal({ ticker, pattern, grade, score, direction, entryPrice, stopLoss, target, winRate, edgeVsRandom, bestExitDay, category }) {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadAllSignals();
    // Avoid duplicates — same ticker + same date
    const today = getTodayStr();
    const isDuplicate = existing.some(s => s.ticker === ticker && s.date === today && s.pattern === pattern);
    if (isDuplicate) return;

    const newSignal = {
      id: `${ticker}-${pattern}-${today}-${Date.now()}`,
      ticker,
      pattern,
      grade,
      score,
      direction,
      entryPrice: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      target: parseFloat(target),
      winRate,
      edgeVsRandom,
      bestExitDay,
      category: category || 'Unknown',
      date: today,
      timestamp: Date.now(),
      // outcome filled in later
      currentPrice: null,
      returnPct: null,
      outcome: null, // 'WIN' | 'LOSS' | 'OPEN'
      lastUpdated: null,
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
  // updates: [{ id, currentPrice }]
  if (typeof window === 'undefined') return;
  try {
    const signals = loadAllSignals();
    const map = {};
    updates.forEach(u => { map[u.id] = u.currentPrice; });
    const updated = signals.map(s => {
      if (!map[s.id]) return s;
      const currentPrice = map[s.id];
      const returnPct = ((currentPrice - s.entryPrice) / s.entryPrice * 100);
      let outcome = 'OPEN';
      if (currentPrice <= s.stopLoss) outcome = 'LOSS';
      else if (currentPrice >= s.target) outcome = 'WIN';
      else if (getDaysSince(s.date) > (s.bestExitDay || 5)) outcome = returnPct >= 0 ? 'WIN' : 'LOSS';
      return { ...s, currentPrice, returnPct: parseFloat(returnPct.toFixed(2)), outcome, lastUpdated: getTodayStr() };
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
  const totalReturn = closed.reduce((acc, s) => acc + (s.returnPct || 0), 0);
  const avgReturn   = closed.length > 0 ? totalReturn / closed.length : 0;
  const winRate     = closed.length > 0 ? Math.round(wins.length / closed.length * 100) : null;
  const avgPredictedWR = closed.length > 0 ? Math.round(closed.reduce((a, s) => a + s.winRate, 0) / closed.length) : null;

  // By grade
  const byGrade = {};
  ['A','B','C','D','F'].forEach(g => {
    const gs = closed.filter(s => s.grade === g);
    const gw = gs.filter(s => s.outcome === 'WIN');
    byGrade[g] = { total: gs.length, wins: gw.length, winRate: gs.length > 0 ? Math.round(gw.length/gs.length*100) : null, avgReturn: gs.length > 0 ? parseFloat((gs.reduce((a,s)=>a+(s.returnPct||0),0)/gs.length).toFixed(2)) : null };
  });

  return { total: signals.length, closed: closed.length, open: open.length, wins: wins.length, losses: closed.length - wins.length, winRate, avgReturn: parseFloat(avgReturn.toFixed(2)), avgPredictedWR, byGrade };
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
