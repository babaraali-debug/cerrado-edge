import { useState } from 'react';
import Head from 'next/head';

const TABS = [
  { id: 'valuation', label: 'Valuation', icon: '◈' },
  { id: 'revenue', label: 'Revenue', icon: '◉' },
  { id: 'balance', label: 'Balance Sheet', icon: '◫' },
  { id: 'catalysts', label: 'Catalysts', icon: '◎' },
];

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
  return { closes, opens, highs, lows, volumes, changes, avgChange, avgAbsChange, maxGain, maxLoss, avgVol, avgIntraday, maxIntraday, stdDev, annualVol, buckets, dates, intradayRanges };
}

function analyzePatterns(stats) {
  const { closes, changes, volumes, avgVol, stdDev } = stats;
  const patterns = [];

  // Gap Down 3%+
  let w = 0, wArr = [], lArr = [], count = 0;
  for (let i = 1; i < changes.length - 1; i++) {
    if (changes[i] <= -3) { count++; const f = changes[i - 1]; if (f > 0) { w++; wArr.push(f); } else lArr.push(Math.abs(f)); }
  }
  if (count >= 3) {
    const wr = Math.round(w / count * 100);
    const aw = wArr.length ? (wArr.reduce((a, b) => a + b, 0) / wArr.length).toFixed(1) : '0';
    const al = lArr.length ? (lArr.reduce((a, b) => a + b, 0) / lArr.length).toFixed(1) : '0';
    const ev = ((wr / 100) * parseFloat(aw) - ((100 - wr) / 100) * parseFloat(al)).toFixed(2);
    patterns.push({ name: 'Gap Down 3%+', instances: count, winRate: wr, avgWin: '+' + aw + '%', avgLoss: '-' + al + '%', ev: parseFloat(ev), evStr: (ev >= 0 ? '+' : '') + ev + '%', signal: wr >= 60 ? 'green' : wr >= 50 ? 'yellow' : 'red', desc: 'Single-day drop of 3%+ — mean reversion over next 5 days' });
  }

  // 3 Red Days
  w = 0; wArr = []; lArr = []; count = 0;
  for (let i = 2; i < changes.length - 1; i++) {
    if (changes[i] < 0 && changes[i + 1] < 0 && changes[i + 2] < 0) { count++; const f = changes[i - 1]; if (f > 0) { w++; wArr.push(f); } else lArr.push(Math.abs(f)); }
  }
  if (count >= 3) {
    const wr = Math.round(w / count * 100);
    const aw = wArr.length ? (wArr.reduce((a, b) => a + b, 0) / wArr.length).toFixed(1) : '0';
    const al = lArr.length ? (lArr.reduce((a, b) => a + b, 0) / lArr.length).toFixed(1) : '0';
    const ev = ((wr / 100) * parseFloat(aw) - ((100 - wr) / 100) * parseFloat(al)).toFixed(2);
    patterns.push({ name: '3 Red Days Streak', instances: count, winRate: wr, avgWin: '+' + aw + '%', avgLoss: '-' + al + '%', ev: parseFloat(ev), evStr: (ev >= 0 ? '+' : '') + ev + '%', signal: wr >= 60 ? 'green' : wr >= 50 ? 'yellow' : 'red', desc: 'Three consecutive down days — oversold bounce probability' });
  }

  // Volume Spike No Move
  w = 0; wArr = []; lArr = []; count = 0;
  for (let i = 1; i < changes.length - 1; i++) {
    if (volumes[i] > avgVol * 1.8 && Math.abs(changes[i]) < 0.8) { count++; const f = changes[i - 1]; if (f > 0) { w++; wArr.push(f); } else lArr.push(Math.abs(f)); }
  }
  if (count >= 2) {
    const wr = Math.round(w / count * 100);
    const aw = wArr.length ? (wArr.reduce((a, b) => a + b, 0) / wArr.length).toFixed(1) : '0';
    const al = lArr.length ? (lArr.reduce((a, b) => a + b, 0) / lArr.length).toFixed(1) : '0';
    const ev = ((wr / 100) * parseFloat(aw) - ((100 - wr) / 100) * parseFloat(al)).toFixed(2);
    patterns.push({ name: 'Volume Spike No Move', instances: count, winRate: wr, avgWin: '+' + aw + '%', avgLoss: '-' + al + '%', ev: parseFloat(ev), evStr: (ev >= 0 ? '+' : '') + ev + '%', signal: wr >= 65 ? 'green' : wr >= 50 ? 'yellow' : 'red', desc: '2x+ volume with flat price — potential accumulation signal' });
  }

  // 3 Green Days
  w = 0; wArr = []; lArr = []; count = 0;
  for (let i = 2; i < changes.length - 1; i++) {
    if (changes[i] > 0 && changes[i + 1] > 0 && changes[i + 2] > 0) { count++; const f = changes[i - 1]; if (f > 0) { w++; wArr.push(f); } else lArr.push(Math.abs(f)); }
  }
  if (count >= 3) {
    const wr = Math.round(w / count * 100);
    const aw = wArr.length ? (wArr.reduce((a, b) => a + b, 0) / wArr.length).toFixed(1) : '0';
    const al = lArr.length ? (lArr.reduce((a, b) => a + b, 0) / lArr.length).toFixed(1) : '0';
    const ev = ((wr / 100) * parseFloat(aw) - ((100 - wr) / 100) * parseFloat(al)).toFixed(2);
    patterns.push({ name: '3 Green Days Streak', instances: count, winRate: wr, avgWin: '+' + aw + '%', avgLoss: '-' + al + '%', ev: parseFloat(ev), evStr: (ev >= 0 ? '+' : '') + ev + '%', signal: wr >= 55 ? 'yellow' : 'red', desc: 'Three consecutive up days — continuation vs exhaustion' });
  }

  patterns.sort((a, b) => b.ev - a.ev);

  // Active signal detection
  let activeSignal = null;
  const last3 = changes.slice(0, 3);
  const last1 = changes[0];
  const lastVol = volumes[0];
  const price = closes[0];

  if (last3.every(c => c < 0) && patterns.find(p => p.name === '3 Red Days Streak')) {
    const wr = patterns.find(p => p.name === '3 Red Days Streak').winRate;
    activeSignal = { pattern: '3 Red Days Streak', direction: 'BULLISH', confidence: wr, entry: price.toFixed(2), stopLoss: (price * (1 - stdDev / 100 * 1.5)).toFixed(2), target: (price * (1 + stdDev / 100 * 2)).toFixed(2), rr: '1:' + (stdDev * 2 / (stdDev * 1.5)).toFixed(1), maxAdverse: (-stdDev * 1.5).toFixed(1) + '%' };
  } else if (last1 <= -3 && patterns.find(p => p.name === 'Gap Down 3%+')) {
    const wr = patterns.find(p => p.name === 'Gap Down 3%+').winRate;
    activeSignal = { pattern: 'Gap Down 3%+', direction: 'BULLISH', confidence: wr, entry: price.toFixed(2), stopLoss: (price * 0.96).toFixed(2), target: (price * 1.04).toFixed(2), rr: '1:1.5', maxAdverse: '-4.0%' };
  } else if (lastVol > avgVol * 1.8 && Math.abs(last1) < 0.8 && patterns.find(p => p.name === 'Volume Spike No Move')) {
    const wr = patterns.find(p => p.name === 'Volume Spike No Move').winRate;
    activeSignal = { pattern: 'Volume Spike No Move', direction: 'WATCH', confidence: wr, entry: price.toFixed(2), stopLoss: (price * 0.97).toFixed(2), target: (price * 1.04).toFixed(2), rr: '1:1.8', maxAdverse: '-3.0%' };
  }

  return { patterns, activeSignal };
}

function fmtVol(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v.toFixed(0);
}

export default function Home() {
  const [page, setPage] = useState('movement');
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
      const { patterns, activeSignal } = analyzePatterns(stats);
      setResult({ stats, patterns, activeSignal });
    } catch (e) {
      setError(e.message || 'Failed. Check ticker and try again.');
    }
    setLoading(false);
  };

  const s = result?.stats;
  const sig = result?.activeSignal;
  const sigCol = sig?.direction === 'BULLISH' ? '#00ff87' : sig?.direction === 'BEARISH' ? '#ff4444' : '#ffd60a';

  return (
    <>
      <Head>
        <title>Cerrado Edge — Movement Analyzer</title>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        :root{--bg:#06060c;--bg2:#08080f;--bg3:#0c0c18;--border:#0f0f1e;--green:#00ff87;--red:#ff4444;--yellow:#ffd60a;--text:#e0e0e0;--muted:#555}
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);color:var(--text);font-family:'DM Mono',monospace;min-height:100vh}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
        @keyframes pulse{0%,100%{opacity:.15;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}
        @keyframes fadein{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .fade{animation:fadein 0.4s ease}
        input::placeholder{color:#1a1a28}
      `}</style>

      {/* NAV */}
      <nav style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#00ff87,#00cc6a)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#000', fontWeight: 800 }}>C</div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 17, fontWeight: 800, background: 'linear-gradient(120deg,#fff 40%,#00ff87)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cerrado Edge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 9, color: '#00ff87', border: '1px solid rgba(0,255,135,0.3)', padding: '3px 8px', borderRadius: 4, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff87', animation: 'blink 1.5s ease infinite' }} />LIVE DATA
          </div>
          <div style={{ background: 'linear-gradient(135deg,#00ff87,#00cc6a)', color: '#000', fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 20, letterSpacing: 1, fontFamily: 'Syne,sans-serif' }}>BETA</div>
        </div>
      </nav>

      <div style={{ maxWidth: 840, margin: '0 auto', padding: '28px 22px 80px' }}>
        {/* HERO */}
        <div style={{ textAlign: 'center', padding: '40px 20px 28px', maxWidth: 600, margin: '0 auto 28px' }}>
          <div style={{ display: 'inline-block', fontSize: 9, letterSpacing: 4, color: '#00ff87', marginBottom: 12, border: '1px solid rgba(0,255,135,0.3)', padding: '4px 12px', borderRadius: 20 }}>◎ REAL HISTORICAL DATA · PATTERN PROBABILITY</div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 34, fontWeight: 800, lineHeight: 1.1, marginBottom: 10, background: 'linear-gradient(135deg,#fff 50%,#00ff87)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Movement<br />Analyzer</h1>
          <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.8 }}>Real price history · Statistical pattern analysis<br />Conditional probabilities · Trade signals with defined risk</p>
        </div>

        {/* SEARCH */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="TICKER  (e.g. MSFT · AAPL · CNQ.TO · SU.TO)"
            style={{ flex: 1, minWidth: 180, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, padding: '12px 14px', color: 'var(--text)', fontSize: 13, fontFamily: "'DM Mono',monospace", letterSpacing: '1.5px', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#00ff87'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          <button onClick={run} disabled={loading || !ticker.trim()}
            style={{ background: loading ? 'var(--bg3)' : 'linear-gradient(135deg,#00ff87,#00cc6a)', border: 'none', borderRadius: 9, padding: '12px 24px', color: loading ? '#333' : '#000', fontSize: 12, fontWeight: 800, fontFamily: 'Syne,sans-serif', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 1, minWidth: 100, transition: 'all 0.2s' }}>
            {loading ? '···' : 'ANALYSE'}
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#161622', marginBottom: 6 }}>US stocks: MSFT · AAPL · TSLA &nbsp;|&nbsp; TSX: CNQ.TO · SU.TO · SHOP.TO</div>

        {/* TIMEFRAME */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 20 }}>
          {[{ label: '1000 Days', val: 1000 }, { label: '500 Days', val: 500 }, { label: '250 Days', val: 250 }, { label: '100 Days', val: 100 }].map(tf => (
            <button key={tf.val} onClick={() => setDays(tf.val)}
              style={{ background: days === tf.val ? 'rgba(0,255,135,0.1)' : 'var(--bg2)', border: `1px solid ${days === tf.val ? 'rgba(0,255,135,0.3)' : 'var(--border)'}`, borderRadius: 6, padding: '6px 14px', color: days === tf.val ? '#00ff87' : 'var(--muted)', fontSize: 10, fontFamily: "'DM Mono',monospace", cursor: 'pointer', transition: 'all 0.2s' }}>
              {tf.label}
            </button>
          ))}
        </div>

        {error && <div style={{ color: '#ff4444', fontSize: 11, padding: '9px 13px', background: 'rgba(255,68,68,0.06)', borderRadius: 7, border: '1px solid rgba(255,68,68,0.15)', marginBottom: 12 }}>{error}</div>}

        {/* LOADING */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 12 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#00ff87', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />)}
            </div>
            <div style={{ color: '#1a1a28', fontSize: 10, letterSpacing: 2 }}>FETCHING REAL DATA · {activeTicker}</div>
            <div style={{ color: '#111', fontSize: 9, letterSpacing: 1 }}>Downloading {days} days of price history...</div>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !result && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 8 }}>
            <div style={{ fontSize: 30, opacity: 0.05 }}>◎</div>
            <div style={{ color: '#0f0f1a', fontSize: 10, letterSpacing: 3 }}>ENTER TICKER · PRESS ANALYSE</div>
            <div style={{ color: '#0a0a14', fontSize: 9, marginTop: 6, letterSpacing: 1 }}>Powered by real historical price data via Alpha Vantage</div>
          </div>
        )}

        {/* RESULTS */}
        {!loading && result && s && (
          <div className="fade">
            {/* Price Banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'var(--bg2)', borderRadius: 11, border: '1px solid var(--border)', marginBottom: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#fff' }}>{activeTicker}</div>
                <div style={{ fontSize: 10, color: '#252535', marginTop: 2 }}>Last {s.changes.length} trading days analysed</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>${s.closes[0].toFixed(2)}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: s.changes[0] >= 0 ? '#00ff87' : '#ff4444' }}>{s.changes[0] >= 0 ? '+' : ''}{s.changes[0].toFixed(2)}%</span>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: '#1a1a28' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff87', animation: 'blink 1.5s ease infinite' }} />ALPHA VANTAGE · LIVE
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ fontSize: 10, color: '#252535', letterSpacing: 3, marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid var(--border)', fontFamily: 'Syne,sans-serif', textTransform: 'uppercase' }}>Movement Statistics — Real Data</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 22 }}>
              {[
                { label: 'Avg Daily Move', val: s.avgAbsChange.toFixed(2) + '%', sub: 'Directional: ' + (s.avgChange >= 0 ? '+' : '') + s.avgChange.toFixed(2) + '%', col: '#00ff87' },
                { label: 'Max Day Gain', val: '+' + s.maxGain.toFixed(2) + '%', sub: 'Historical max', col: '#00ff87' },
                { label: 'Max Day Loss', val: s.maxLoss.toFixed(2) + '%', sub: 'Historical max', col: '#ff4444' },
                { label: 'Daily Volatility', val: s.stdDev.toFixed(2) + '%', sub: 'Ann. vol: ' + s.annualVol.toFixed(1) + '%', col: '#ffd60a' },
                { label: 'Avg Intraday Range', val: s.avgIntraday.toFixed(2) + '%', sub: 'Max: ' + s.maxIntraday.toFixed(2) + '%', col: '#fff' },
                { label: 'Avg Daily Volume', val: fmtVol(s.avgVol), sub: 'Last: ' + fmtVol(s.volumes[0]), col: '#fff' },
              ].map((c, i) => (
                <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 8, color: '#252535', letterSpacing: 2, marginBottom: 7, textTransform: 'uppercase' }}>{c.label}</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: c.col }}>{c.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Distribution */}
            <div style={{ fontSize: 10, color: '#252535', letterSpacing: 3, marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid var(--border)', fontFamily: 'Syne,sans-serif', textTransform: 'uppercase' }}>Daily Move Distribution</div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              {Object.entries(s.buckets).map(([label, count]) => {
                const total = Object.values(s.buckets).reduce((a, b) => a + b, 0);
                const pct = (count / total * 100).toFixed(1);
                const col = label.includes('Down') ? '#ff4444' : label.includes('Up') ? '#00ff87' : '#ffd60a';
                return (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
                      <span>{label}</span><span style={{ color: col }}>{pct}% ({count} days)</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: col, borderRadius: 3, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Signal */}
            <div style={{ fontSize: 10, color: '#252535', letterSpacing: 3, marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid var(--border)', fontFamily: 'Syne,sans-serif', textTransform: 'uppercase' }}>Active Signal</div>
            {sig ? (
              <div style={{ background: 'var(--bg2)', border: `1px solid ${sigCol}33`, borderRadius: 11, padding: 18, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 800, color: '#fff' }}>◎ PATTERN DETECTED ON REAL DATA</div>
                    <div style={{ fontSize: 10, color: '#333', marginTop: 3 }}>{sig.pattern}</div>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, padding: '4px 12px', borderRadius: 20, letterSpacing: 1, background: sigCol + '18', color: sigCol, border: `1px solid ${sigCol}44` }}>{sig.direction}</div>
                </div>
                {[{ label: 'Win Probability', val: sig.confidence, col: sigCol }, { label: 'Loss Probability', val: 100 - sig.confidence, col: '#ff4444' }].map(pb => (
                  <div key={pb.label} style={{ margin: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 5 }}>
                      <span>{pb.label}</span><span style={{ color: pb.col }}>{pb.val}%</span>
                    </div>
                    <div style={{ height: 7, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pb.val + '%', background: pb.col, borderRadius: 4, transition: 'width 1s cubic-bezier(.4,0,.2,1)' }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
                  {[{ label: 'Entry', val: '$' + sig.entry, col: '#fff', sub: 'Current price' }, { label: 'Stop Loss', val: '$' + sig.stopLoss, col: '#ff4444', sub: 'Max loss: ' + sig.maxAdverse }, { label: 'Target', val: '$' + sig.target, col: '#00ff87', sub: 'R/R: ' + sig.rr }].map(tc => (
                    <div key={tc.label} style={{ background: '#06060c', border: '1px solid var(--border)', borderRadius: 8, padding: 11, textAlign: 'center' }}>
                      <div style={{ fontSize: 8, color: '#252535', letterSpacing: 2, marginBottom: 5, textTransform: 'uppercase' }}>{tc.label}</div>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 800, color: tc.col }}>{tc.val}</div>
                      <div style={{ fontSize: 8, color: '#222', marginTop: 3 }}>{tc.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 11, padding: 28, textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 22, opacity: 0.08, marginBottom: 8 }}>◎</div>
                <div style={{ color: '#1a1a28', fontSize: 10, letterSpacing: 2 }}>NO ACTIVE SIGNAL</div>
                <div style={{ color: '#0f0f1a', fontSize: 9, marginTop: 5 }}>No high-probability pattern forming right now</div>
              </div>
            )}

            {/* Patterns */}
            <div style={{ fontSize: 10, color: '#252535', letterSpacing: 3, marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid var(--border)', fontFamily: 'Syne,sans-serif', textTransform: 'uppercase' }}>Historical Patterns — Calculated From Real Data</div>
            <div style={{ fontSize: 9, color: '#161622', marginBottom: 10 }}>All win rates calculated from actual {activeTicker} price history · Sorted by expected value</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
              {result.patterns.map((p, i) => {
                const c = p.signal === 'green' ? '#00ff87' : p.signal === 'red' ? '#ff4444' : '#ffd60a';
                return (
                  <div key={i} style={{ padding: '12px 14px', background: '#06060c', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 12, color: '#aaa' }}>{p.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: c + '18', color: c, border: `1px solid ${c}44` }}>{p.winRate}% WIN RATE</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: '#555' }}>{p.instances} instances</span>
                      <span style={{ fontSize: 10, color: '#00ff87' }}>Avg Win: {p.avgWin}</span>
                      <span style={{ fontSize: 10, color: '#ff4444' }}>Avg Loss: {p.avgLoss}</span>
                      <span style={{ fontSize: 10, color: p.ev >= 0 ? '#00ff87' : '#ff4444', fontWeight: 600 }}>EV: {p.evStr}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#222', lineHeight: 1.5 }}>{p.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* EV Table */}
            <div style={{ fontSize: 10, color: '#252535', letterSpacing: 3, marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid var(--border)', fontFamily: 'Syne,sans-serif', textTransform: 'uppercase' }}>Expected Value Table</div>
            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>{['Pattern', 'Instances', 'Win Rate', 'Avg Win', 'Avg Loss', 'Exp. Value'].map(h => (
                    <th key={h} style={{ fontSize: 9, color: '#252535', letterSpacing: 2, textTransform: 'uppercase', padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {result.patterns.map((p, i) => (
                    <tr key={i}>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #0a0a14', color: '#aaa' }}>{p.name}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #0a0a14', color: '#555' }}>{p.instances}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #0a0a14', color: p.winRate >= 60 ? '#00ff87' : p.winRate >= 50 ? '#ffd60a' : '#ff4444' }}>{p.winRate}%</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #0a0a14', color: '#00ff87' }}>{p.avgWin}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #0a0a14', color: '#ff4444' }}>{p.avgLoss}</td>
                      <td style={{ padding: '9px 10px', borderBottom: '1px solid #0a0a14', color: p.ev >= 0 ? '#00ff87' : '#ff4444', fontWeight: 600 }}>{p.evStr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
