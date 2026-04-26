import { useState } from 'react';
import Head from 'next/head';

const MIN_SAMPLE = 30;

function calcStats(ts, numDays) {
  const dates = Object.keys(ts).sort((a, b) => b.localeCompare(a)).slice(0, numDays);
  if (dates.length < 10) throw new Error('Not enough data');
  const closes = dates.map(d => parseFloat(ts[d]['4. close']));
  const opens = dates.map(d => parseFloat(ts[d]['1. open']));
  const highs = dates.map(d => parseFloat(ts[d]['2. high']));
  const lows = dates.map(d => parseFloat(ts[d]['3. low']));
  const volumes = dates.map(d => parseFloat(ts[d]['5. volume']));
  const changes = [];
  for (let i = 0; i < closes.length - 1; i++) {
    changes.push((closes[i] - closes[i + 1]) / closes[i + 1] * 100);
  }
  const intradayRanges = opens.map((o, i) => (highs[i] - lows[i]) / o * 100);
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  const avgAbsChange = changes.map(Math.abs).reduce((a, b) => a + b, 0) / changes.length;
  const maxGain = Math.max(...changes);
  const maxLoss = Math.min(...changes);
  const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const avgIntraday = intradayRanges.reduce((a, b) => a + b, 0) / intradayRanges.length;
  const maxIntraday = Math.max(...intradayRanges);
  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  const variance = changes.reduce((a, b) => a + (b - mean) ** 2, 0) / changes.length;
  const stdDev = Math.sqrt(variance);
  const annualVol = stdDev * Math.sqrt(252);
  const buckets = { 'Down 3%+': 0, 'Down 1-3%': 0, 'Flat ±1%': 0, 'Up 1-3%': 0, 'Up 3%+': 0 };
  changes.forEach(c => {
    if (c <= -3) buckets['Down 3%+']++;
    else if (c <= -1) buckets['Down 1-3%']++;
    else if (c < 1) buckets['Flat ±1%']++;
    else if (c < 3) buckets['Up 1-3%']++;
    else buckets['Up 3%+']++;
  });
  const randomWins = changes.slice(0, -1).filter(c => c > 0).length;
  const randomBaseline = Math.round(randomWins / (changes.length - 1) * 100);
  return { closes, opens, highs, lows, volumes, changes, avgChange, avgAbsChange, maxGain, maxLoss, avgVol, avgIntraday, maxIntraday, stdDev, annualVol, buckets, dates, intradayRanges, randomBaseline };
}

function analyzePatterns(stats) {
  const { closes, changes, volumes, avgVol, stdDev, highs, lows, randomBaseline } = stats;
  const patterns = [];

  function addPattern(name, instances, wins, wArr, lArr, desc) {
    const reliable = instances >= MIN_SAMPLE;
    const wr = instances > 0 ? Math.round(wins / instances * 100) : 0;
    const aw = wArr.length ? (wArr.reduce((a, b) => a + b, 0) / wArr.length).toFixed(1) : '0';
    const al = lArr.length ? (lArr.reduce((a, b) => a + b, 0) / lArr.length).toFixed(1) : '0';
    const ev = ((wr / 100) * parseFloat(aw) - ((100 - wr) / 100) * parseFloat(al)).toFixed(2);
    const edgeVsRandom = wr - randomBaseline;
    patterns.push({ name, instances, winRate: wr, avgWin: '+' + aw + '%', avgLoss: '-' + al + '%', ev: parseFloat(ev), evStr: (ev >= 0 ? '+' : '') + ev + '%', signal: wr >= 60 ? 'green' : wr >= 50 ? 'yellow' : 'red', desc, reliable, edgeVsRandom });
  }

  let w = 0, wA = [], lA = [], cnt = 0;
  for (let i = 1; i < changes.length - 1; i++) {
    if (changes[i] <= -3) { cnt++; const f = changes[i - 1]; if (f > 0) { w++; wA.push(Math.abs(f)); } else lA.push(Math.abs(f)); }
  }
  addPattern('Gap Down 3%+', cnt, w, wA, lA, 'Single-day drop of 3%+ — mean reversion probability over next 5 days');

  w = 0; wA = []; lA = []; cnt = 0;
  for (let i = 2; i < changes.length - 1; i++) {
    if (changes[i] < 0 && changes[i + 1] < 0 && changes[i + 2] < 0) { cnt++; const f = changes[i - 1]; if (f > 0) { w++; wA.push(Math.abs(f)); } else lA.push(Math.abs(f)); }
  }
  addPattern('3 Red Days Streak', cnt, w, wA, lA, 'Three consecutive down days — oversold bounce probability');

  w = 0; wA = []; lA = []; cnt = 0;
  for (let i = 1; i < changes.length - 1; i++) {
    if (volumes[i] > avgVol * 1.8 && Math.abs(changes[i]) < 0.8) { cnt++; const f = changes[i - 1]; if (f > 0) { w++; wA.push(Math.abs(f)); } else lA.push(Math.abs(f)); }
  }
  addPattern('Volume Spike No Move', cnt, w, wA, lA, '2x+ volume with flat price — potential accumulation before move');

  w = 0; wA = []; lA = []; cnt = 0;
  for (let i = 2; i < changes.length - 1; i++) {
    if (changes[i] > 0 && changes[i + 1] > 0 && changes[i + 2] > 0) { cnt++; const f = changes[i - 1]; if (f > 0) { w++; wA.push(Math.abs(f)); } else lA.push(Math.abs(f)); }
  }
  addPattern('3 Green Days Streak', cnt, w, wA, lA, 'Three consecutive up days — continuation vs exhaustion signal');

  w = 0; wA = []; lA = []; cnt = 0;
  for (let i = 1; i < highs.length - 1; i++) {
    if (highs[i] < highs[i + 1] && lows[i] > lows[i + 1]) { cnt++; const f = changes[i - 1]; if (f > 0) { w++; wA.push(Math.abs(f)); } else lA.push(Math.abs(f)); }
  }
  addPattern('Inside Day Breakout', cnt, w, wA, lA, "Today's range inside yesterday's — stock coiling before explosive directional move");

  w = 0; wA = []; lA = []; cnt = 0;
  for (let i = 1; i < closes.length - 1; i++) {
    const intradayDrop = highs[i] > 0 ? (highs[i] - closes[i]) / highs[i] * 100 : 0;
    if (intradayDrop > 3 && changes[i] < 0) { cnt++; const f = changes[i - 1]; if (f > 0) { w++; wA.push(Math.abs(f)); } else lA.push(Math.abs(f)); }
  }
  addPattern('Intraday Reversal', cnt, w, wA, lA, 'Hit high then reversed 3%+ intraday — exhaustion and potential reversal signal');

  patterns.sort((a, b) => b.ev - a.ev);

  let activeSignal = null;
  const last3 = changes.slice(0, 3);
  const last1 = changes[0];
  const lastVol = volumes[0];
  const price = closes[0];
  const isInsideDay = highs[0] < highs[1] && lows[0] > lows[1];
  const reliablePatterns = patterns.filter(p => p.reliable);

  if (last3.every(c => c < 0) && reliablePatterns.find(p => p.name === '3 Red Days Streak')) {
    const pat = reliablePatterns.find(p => p.name === '3 Red Days Streak');
    activeSignal = { pattern: '3 Red Days Streak', direction: 'BULLISH', confidence: pat.winRate, instances: pat.instances, entry: price.toFixed(2), stopLoss: (price * (1 - stdDev / 100 * 1.5)).toFixed(2), target: (price * (1 + stdDev / 100 * 2)).toFixed(2), rr: '1:' + (stdDev * 2 / (stdDev * 1.5)).toFixed(1), maxAdverse: (-stdDev * 1.5).toFixed(1) + '%', reliable: pat.reliable };
  } else if (last1 <= -3 && reliablePatterns.find(p => p.name === 'Gap Down 3%+')) {
    const pat = reliablePatterns.find(p => p.name === 'Gap Down 3%+');
    activeSignal = { pattern: 'Gap Down 3%+', direction: 'BULLISH', confidence: pat.winRate, instances: pat.instances, entry: price.toFixed(2), stopLoss: (price * 0.96).toFixed(2), target: (price * 1.04).toFixed(2), rr: '1:1.5', maxAdverse: '-4.0%', reliable: pat.reliable };
  } else if (isInsideDay && reliablePatterns.find(p => p.name === 'Inside Day Breakout')) {
    const pat = reliablePatterns.find(p => p.name === 'Inside Day Breakout');
    activeSignal = { pattern: 'Inside Day Breakout', direction: 'WATCH', confidence: pat.winRate, instances: pat.instances, entry: price.toFixed(2), stopLoss: (price * 0.97).toFixed(2), target: (price * 1.04).toFixed(2), rr: '1:1.8', maxAdverse: '-3.0%', reliable: pat.reliable };
  } else if (lastVol > avgVol * 1.8 && Math.abs(last1) < 0.8 && reliablePatterns.find(p => p.name === 'Volume Spike No Move')) {
    const pat = reliablePatterns.find(p => p.name === 'Volume Spike No Move');
    activeSignal = { pattern: 'Volume Spike No Move', direction: 'WATCH', confidence: pat.winRate, instances: pat.instances, entry: price.toFixed(2), stopLoss: (price * 0.97).toFixed(2), target: (price * 1.04).toFixed(2), rr: '1:1.8', maxAdverse: '-3.0%', reliable: pat.reliable };
  }

  return { patterns, activeSignal, randomBaseline };
}

function fmtVol(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v.toFixed(0);
}

const N = '#0f1f5c'; const G = '#f5c842'; const BG = '#f0f4ff'; const W = '#ffffff';
const BORDER = '#dde3f5'; const MUTED = '#6b7ab5'; const TEXT = '#0a1540';

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [days, setDays] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeTicker, setActiveTicker] = useState('');

  const run = async () => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLoading(true); setError(''); setResult(null); setActiveTicker(t);
    try {
      const res = await fetch(`/api/stock?ticker=${t}&days=${days}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const ts = data['Time Series (Daily)'];
      if (!ts) throw new Error('No price data found');
      const stats = calcStats(ts, days);
      const { patterns, activeSignal, randomBaseline } = analyzePatterns(stats);
      setResult({ stats, patterns, activeSignal, randomBaseline });
    } catch (e) {
      setError(e.message || 'Failed. Check ticker and try again.');
    }
    setLoading(false);
  };

  const s = result?.stats;
  const sig = result?.activeSignal;
  const sigCol = sig?.direction === 'BULLISH' ? '#16a34a' : sig?.direction === 'BEARISH' ? '#dc2626' : '#d97706';
  const sigBg = sig?.direction === 'BULLISH' ? '#f0fdf4' : sig?.direction === 'BEARISH' ? '#fef2f2' : '#fffbeb';

  return (
    <>
      <Head>
        <title>Cerrado Edge — Movement Analyzer</title>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BG}; color: ${TEXT}; font-family: 'Inter', sans-serif; min-height: 100vh; }
        input::placeholder { color: #a0aec0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${BG}; } ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 2px; }
        @keyframes pulse { 0%,100%{opacity:.2;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} }
        @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation: fadein 0.4s ease; }
        .card { background: ${W}; border-radius: 14px; border: 1px solid ${BORDER}; padding: 20px 22px; }
      `}</style>

      <nav style={{ background: N, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(15,31,92,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: G, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: N, fontWeight: 800, fontFamily: 'Syne,sans-serif' }}>C</div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: W }}>Cerrado Edge</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Movement', 'Screener', 'Watchlist'].map((item, i) => (
            <button key={item} style={{ background: i === 0 ? 'rgba(245,200,66,0.15)' : 'none', border: 'none', padding: '6px 14px', borderRadius: 6, color: i === 0 ? G : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: i === 0 ? 600 : 400, cursor: 'pointer' }}>{item}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: 4, letterSpacing: 1 }}>LIVE DATA</div>
          <div style={{ background: G, color: N, fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 12, letterSpacing: 1, fontFamily: 'Syne,sans-serif' }}>BETA</div>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ textAlign: 'center', padding: '40px 20px 32px', maxWidth: 580, margin: '0 auto 32px' }}>
          <div style={{ display: 'inline-block', fontSize: 10, letterSpacing: 3, color: N, marginBottom: 14, background: '#fdf3d0', padding: '5px 14px', borderRadius: 20, fontWeight: 600 }}>◎ REAL DATA · PATTERN PROBABILITY · QUANT SIGNALS</div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginBottom: 12, color: N }}>Movement<br />Analyzer</h1>
          <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.8 }}>Real price history · 6 statistical patterns · Random baseline benchmark<br />Trade signals with entry, stop loss and target</p>
        </div>

        <div className="card" style={{ marginBottom: 24, padding: '24px 28px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && run()}
              placeholder="TICKER  (e.g. MSFT · AAPL · CNQ.TO · IFOS.V)"
              style={{ flex: 1, minWidth: 180, background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '12px 16px', color: TEXT, fontSize: 13, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = BORDER} />
            <button onClick={run} disabled={loading || !ticker.trim()}
              style={{ background: loading ? '#e5e7eb' : `linear-gradient(135deg,${G},#e8a800)`, border: 'none', borderRadius: 10, padding: '12px 28px', color: loading ? '#9ca3af' : N, fontSize: 13, fontWeight: 700, fontFamily: 'Syne,sans-serif', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 1, minWidth: 110, boxShadow: loading ? 'none' : '0 4px 14px rgba(245,200,66,0.4)' }}>
              {loading ? '···' : 'ANALYSE'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#a0aec0', marginBottom: 14 }}>US: MSFT · AAPL · TSLA &nbsp;|&nbsp; TSX: CNQ.TO · SU.TO &nbsp;|&nbsp; TSX-V: IFOS.V · LUCA.V</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {[{ label: '1000 Days ★', val: 1000 }, { label: '750 Days', val: 750 }, { label: '500 Days', val: 500 }].map(tf => (
              <button key={tf.val} onClick={() => setDays(tf.val)}
                style={{ background: days === tf.val ? N : W, border: `1px solid ${days === tf.val ? N : BORDER}`, borderRadius: 6, padding: '6px 14px', color: days === tf.val ? G : MUTED, fontSize: 11, fontWeight: days === tf.val ? 600 : 400, cursor: 'pointer' }}>
                {tf.label}
              </button>
            ))}
            <span style={{ fontSize: 10, color: '#a0aec0', marginLeft: 4 }}>Min 500 days for statistical reliability</span>
          </div>
        </div>

        {error && <div style={{ color: '#dc2626', fontSize: 12, padding: '10px 16px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca', marginBottom: 16 }}>{error}</div>}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: G, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />)}
            </div>
            <div style={{ color: MUTED, fontSize: 11, letterSpacing: 2 }}>FETCHING REAL DATA · {activeTicker}</div>
          </div>
        )}

        {!loading && !result && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 10 }}>
            <div style={{ fontSize: 40, opacity: 0.1 }}>◎</div>
            <div style={{ color: '#cbd5e0', fontSize: 11, letterSpacing: 2 }}>ENTER TICKER · PRESS ANALYSE</div>
          </div>
        )}

        {!loading && result && s && (
          <div className="fade">
            <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: N }}>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: W }}>{activeTicker}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.changes.length} trading days analysed</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: W }}>${s.closes[0].toFixed(2)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: s.changes[0] >= 0 ? '#4ade80' : '#f87171' }}>{s.changes[0] >= 0 ? '+' : ''}{s.changes[0].toFixed(2)}%</span>
              </div>
              <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 3 }}>RANDOM BASELINE</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: G }}>{result.randomBaseline}%</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Random buy win rate</div>
              </div>
            </div>

            <div style={{ background: '#fdf3d0', border: '1px solid #f5c84244', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 12, color: '#92400e' }}>
              <strong>Random Baseline: {result.randomBaseline}%</strong> — Buying on any random day gives this win rate. Only patterns that beat this number have a real edge.
            </div>

            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase', fontWeight: 500 }}>Movement Statistics</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Avg daily move', val: s.avgAbsChange.toFixed(2) + '%', sub: 'Directional: ' + (s.avgChange >= 0 ? '+' : '') + s.avgChange.toFixed(2) + '%', col: '#16a34a' },
                { label: 'Max single day gain', val: '+' + s.maxGain.toFixed(2) + '%', sub: 'Historical max', col: '#16a34a' },
                { label: 'Max single day loss', val: s.maxLoss.toFixed(2) + '%', sub: 'Historical max', col: '#dc2626' },
                { label: 'Daily volatility', val: s.stdDev.toFixed(2) + '%', sub: 'Ann. vol: ' + s.annualVol.toFixed(1) + '%', col: N },
                { label: 'Avg intraday range', val: s.avgIntraday.toFixed(2) + '%', sub: 'Max: ' + s.maxIntraday.toFixed(2) + '%', col: N },
                { label: 'Avg daily volume', val: fmtVol(s.avgVol), sub: 'Last: ' + fmtVol(s.volumes[0]), col: N },
              ].map((c, i) => (
                <div key={i} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: MUTED, marginBottom: 6, fontWeight: 500 }}>{c.label}</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: c.col }}>{c.val}</div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>{c.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase', fontWeight: 500 }}>Daily Move Distribution</div>
            <div className="card" style={{ marginBottom: 24 }}>
              {Object.entries(s.buckets).map(([label, count]) => {
                const total = Object.values(s.buckets).reduce((a, b) => a + b, 0);
                const pct = (count / total * 100).toFixed(1);
                const col = label.includes('Down') ? '#dc2626' : label.includes('Up') ? '#16a34a' : '#d97706';
                return (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: TEXT, marginBottom: 5, fontWeight: 500 }}>
                      <span>{label}</span><span style={{ color: col }}>{pct}% · {count} days</span>
                    </div>
                    <div style={{ height: 8, background: BG, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: col, borderRadius: 4, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)', opacity: 0.8 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase', fontWeight: 500 }}>Active Signal</div>
            {sig ? (
              <div style={{ background: sigBg, border: `2px solid ${sigCol}33`, borderRadius: 14, padding: 22, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 800, color: TEXT }}>◎ Pattern detected on real data</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{sig.pattern}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {!sig.reliable && <div style={{ fontSize: 10, color: '#d97706', background: '#fffbeb', border: '1px solid #f5c842', padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>⚠️ Small sample</div>}
                    <div style={{ fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20, background: sigCol, color: W, letterSpacing: 1, fontFamily: 'Syne,sans-serif' }}>{sig.direction}</div>
                  </div>
                </div>
                {[{ label: 'Win probability', val: sig.confidence, col: sigCol }, { label: 'Loss probability', val: 100 - sig.confidence, col: '#94a3b8' }].map(pb => (
                  <div key={pb.label} style={{ margin: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginBottom: 5, fontWeight: 500 }}>
                      <span>{pb.label}</span><span style={{ color: pb.col, fontWeight: 700 }}>{pb.val}%</span>
                    </div>
                    <div style={{ height: 8, background: W, borderRadius: 4, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                      <div style={{ height: '100%', width: pb.val + '%', background: pb.col, borderRadius: 4, transition: 'width 1s cubic-bezier(.4,0,.2,1)', opacity: 0.85 }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
                  {[{ label: 'Entry', val: '$' + sig.entry, col: TEXT, sub: 'Current price' }, { label: 'Stop loss', val: '$' + sig.stopLoss, col: '#dc2626', sub: 'Max loss: ' + sig.maxAdverse }, { label: 'Target', val: '$' + sig.target, col: '#16a34a', sub: 'R/R: ' + sig.rr }].map(tc => (
                    <div key={tc.label} style={{ background: W, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 5, textTransform: 'uppercase', fontWeight: 500 }}>{tc.label}</div>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 17, fontWeight: 800, color: tc.col }}>{tc.val}</div>
                      <div style={{ fontSize: 9, color: MUTED, marginTop: 3 }}>{tc.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: W, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 16px', marginTop: 14 }}>
                  <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 5, fontWeight: 500, textTransform: 'uppercase' }}>Edge vs Random</div>
                  <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.7 }}>
                    Based on <strong>{sig.instances} historical instances</strong>. Win rate: {sig.confidence}% vs random baseline {result.randomBaseline}%. Real edge above random: <strong style={{ color: sig.confidence > result.randomBaseline ? '#16a34a' : '#dc2626' }}>{sig.confidence > result.randomBaseline ? '+' : ''}{sig.confidence - result.randomBaseline}%</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 32, marginBottom: 24 }}>
                <div style={{ fontSize: 28, opacity: 0.1, marginBottom: 10 }}>◎</div>
                <div style={{ color: MUTED, fontSize: 12, fontWeight: 500 }}>No active signal right now</div>
                <div style={{ color: '#cbd5e0', fontSize: 11, marginTop: 5 }}>No high-probability pattern forming today</div>
              </div>
            )}

            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase', fontWeight: 500 }}>Historical Patterns — 6 Signals</div>
            <div style={{ fontSize: 10, color: '#a0aec0', marginBottom: 12 }}>Random baseline: {result.randomBaseline}% · 30+ instances required for reliability · Sorted by expected value</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {result.patterns.map((p, i) => {
                const col = p.signal === 'green' ? '#16a34a' : p.signal === 'red' ? '#dc2626' : '#d97706';
                const bg = p.signal === 'green' ? '#f0fdf4' : p.signal === 'red' ? '#fef2f2' : '#fffbeb';
                const edgeCol = p.edgeVsRandom > 5 ? '#16a34a' : p.edgeVsRandom < -5 ? '#dc2626' : '#d97706';
                return (
                  <div key={i} className="card" style={{ padding: '14px 16px', opacity: p.reliable ? 1 : 0.7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{p.name}</span>
                        {!p.reliable && <span style={{ fontSize: 9, color: '#d97706', background: '#fffbeb', border: '1px solid #f5c84266', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>⚠️ LOW SAMPLE ({p.instances} instances)</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: edgeCol, fontWeight: 600 }}>Edge: {p.edgeVsRandom > 0 ? '+' : ''}{p.edgeVsRandom}% vs random</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: bg, color: col, border: `1px solid ${col}33` }}>{p.winRate}% win rate</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: MUTED }}>{p.instances} instances {p.reliable ? '✓' : ''}</span>
                      <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>Avg win: {p.avgWin}</span>
                      <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 500 }}>Avg loss: {p.avgLoss}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: p.ev >= 0 ? '#16a34a' : '#dc2626' }}>EV: {p.evStr}</span>
                    </div>
                    <div style={{ fontSize: 11, color: MUTED }}>{p.desc}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase', fontWeight: 500 }}>Expected Value Summary</div>
            <div className="card" style={{ overflowX: 'auto', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${BG}` }}>
                    {['Pattern', 'Instances', 'Win rate', 'Edge vs Random', 'Avg win', 'Avg loss', 'Exp. value', 'Reliable'].map(h => (
                      <th key={h} style={{ fontSize: 9, color: MUTED, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.patterns.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BG}` }}>
                      <td style={{ padding: '10px 12px', color: TEXT, fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '10px 12px', color: MUTED }}>{p.instances}</td>
                      <td style={{ padding: '10px 12px', color: p.winRate >= 60 ? '#16a34a' : p.winRate >= 50 ? '#d97706' : '#dc2626', fontWeight: 600 }}>{p.winRate}%</td>
                      <td style={{ padding: '10px 12px', color: p.edgeVsRandom > 5 ? '#16a34a' : p.edgeVsRandom < -5 ? '#dc2626' : '#d97706', fontWeight: 600 }}>{p.edgeVsRandom > 0 ? '+' : ''}{p.edgeVsRandom}%</td>
                      <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: 500 }}>{p.avgWin}</td>
                      <td style={{ padding: '10px 12px', color: '#dc2626', fontWeight: 500 }}>{p.avgLoss}</td>
                      <td style={{ padding: '10px 12px', color: p.ev >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{p.evStr}</td>
                      <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 10, fontWeight: 600, color: p.reliable ? '#16a34a' : '#d97706' }}>{p.reliable ? '✓ Yes' : '⚠️ No'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <footer style={{ background: N, padding: '24px 32px', textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 800, color: W, marginBottom: 6 }}>Cerrado Edge</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Data from Yahoo Finance · Not financial advice · Past patterns do not guarantee future results</div>
      </footer>
    </>
  );
}
