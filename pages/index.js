import { useState, useMemo } from 'react';
import Head from 'next/head';
import { computeConfidenceScore } from '../utils/confidenceScore';
import ConfidenceGauge from '../components/ConfidenceGauge';

const MIN_SAMPLE = 30;

// ── Session 7: 200-stock universe with market cap categories ─────────────────
const UNIVERSE = [
  // MEGA CAP ($500B+)
  { ticker: 'AAPL',    cat: 'Mega Cap' },
  { ticker: 'MSFT',    cat: 'Mega Cap' },
  { ticker: 'NVDA',    cat: 'Mega Cap' },
  { ticker: 'AMZN',    cat: 'Mega Cap' },
  { ticker: 'GOOGL',   cat: 'Mega Cap' },
  { ticker: 'META',    cat: 'Mega Cap' },
  { ticker: 'TSLA',    cat: 'Mega Cap' },
  { ticker: 'BRK-B',   cat: 'Mega Cap' },
  { ticker: 'LLY',     cat: 'Mega Cap' },
  { ticker: 'V',       cat: 'Mega Cap' },
  { ticker: 'JPM',     cat: 'Mega Cap' },
  { ticker: 'XOM',     cat: 'Mega Cap' },
  { ticker: 'UNH',     cat: 'Mega Cap' },
  { ticker: 'MA',      cat: 'Mega Cap' },
  { ticker: 'AVGO',    cat: 'Mega Cap' },

  // LARGE CAP ($50B–$500B)
  { ticker: 'AMD',     cat: 'Large Cap' },
  { ticker: 'NFLX',   cat: 'Large Cap' },
  { ticker: 'CRM',    cat: 'Large Cap' },
  { ticker: 'ORCL',   cat: 'Large Cap' },
  { ticker: 'INTC',   cat: 'Large Cap' },
  { ticker: 'QCOM',   cat: 'Large Cap' },
  { ticker: 'MU',     cat: 'Large Cap' },
  { ticker: 'IBM',    cat: 'Large Cap' },
  { ticker: 'CSCO',   cat: 'Large Cap' },
  { ticker: 'ADBE',   cat: 'Large Cap' },
  { ticker: 'NOW',    cat: 'Large Cap' },
  { ticker: 'PANW',   cat: 'Large Cap' },
  { ticker: 'CRWD',   cat: 'Large Cap' },
  { ticker: 'NET',    cat: 'Large Cap' },
  { ticker: 'DDOG',   cat: 'Large Cap' },
  { ticker: 'BAC',    cat: 'Large Cap' },
  { ticker: 'GS',     cat: 'Large Cap' },
  { ticker: 'MS',     cat: 'Large Cap' },
  { ticker: 'WFC',    cat: 'Large Cap' },
  { ticker: 'AXP',    cat: 'Large Cap' },
  { ticker: 'BLK',    cat: 'Large Cap' },
  { ticker: 'SCHW',   cat: 'Large Cap' },
  { ticker: 'COF',    cat: 'Large Cap' },
  { ticker: 'CVX',    cat: 'Large Cap' },
  { ticker: 'COP',    cat: 'Large Cap' },
  { ticker: 'EOG',    cat: 'Large Cap' },
  { ticker: 'SLB',    cat: 'Large Cap' },
  { ticker: 'OXY',    cat: 'Large Cap' },
  { ticker: 'MPC',    cat: 'Large Cap' },
  { ticker: 'PSX',    cat: 'Large Cap' },
  { ticker: 'JNJ',    cat: 'Large Cap' },
  { ticker: 'PFE',    cat: 'Large Cap' },
  { ticker: 'ABBV',   cat: 'Large Cap' },
  { ticker: 'MRK',    cat: 'Large Cap' },
  { ticker: 'BMY',    cat: 'Large Cap' },
  { ticker: 'GILD',   cat: 'Large Cap' },
  { ticker: 'REGN',   cat: 'Large Cap' },
  { ticker: 'VRTX',   cat: 'Large Cap' },
  { ticker: 'ISRG',   cat: 'Large Cap' },
  { ticker: 'DHR',    cat: 'Large Cap' },
  { ticker: 'TMO',    cat: 'Large Cap' },
  { ticker: 'WMT',    cat: 'Large Cap' },
  { ticker: 'HD',     cat: 'Large Cap' },
  { ticker: 'LOW',    cat: 'Large Cap' },
  { ticker: 'TGT',    cat: 'Large Cap' },
  { ticker: 'COST',   cat: 'Large Cap' },
  { ticker: 'NKE',    cat: 'Large Cap' },
  { ticker: 'MCD',    cat: 'Large Cap' },
  { ticker: 'SBUX',   cat: 'Large Cap' },
  { ticker: 'DIS',    cat: 'Large Cap' },
  { ticker: 'BKNG',   cat: 'Large Cap' },
  { ticker: 'BA',     cat: 'Large Cap' },
  { ticker: 'CAT',    cat: 'Large Cap' },
  { ticker: 'GE',     cat: 'Large Cap' },
  { ticker: 'F',      cat: 'Large Cap' },
  { ticker: 'GM',     cat: 'Large Cap' },
  { ticker: 'UBER',   cat: 'Large Cap' },
  { ticker: 'ABNB',   cat: 'Large Cap' },

  // MID CAP ($10B–$50B)
  { ticker: 'PLTR',   cat: 'Mid Cap' },
  { ticker: 'SNOW',   cat: 'Mid Cap' },
  { ticker: 'LYFT',   cat: 'Mid Cap' },
  { ticker: 'COIN',   cat: 'Mid Cap' },
  { ticker: 'RBLX',   cat: 'Mid Cap' },
  { ticker: 'SNAP',   cat: 'Mid Cap' },
  { ticker: 'PINS',   cat: 'Mid Cap' },
  { ticker: 'ROKU',   cat: 'Mid Cap' },
  { ticker: 'TTD',    cat: 'Mid Cap' },
  { ticker: 'DOCN',   cat: 'Mid Cap' },
  { ticker: 'MDB',    cat: 'Mid Cap' },
  { ticker: 'ZM',     cat: 'Mid Cap' },
  { ticker: 'DKNG',   cat: 'Mid Cap' },
  { ticker: 'AFRM',   cat: 'Mid Cap' },
  { ticker: 'UPST',   cat: 'Mid Cap' },
  { ticker: 'ETSY',   cat: 'Mid Cap' },
  { ticker: 'DASH',   cat: 'Mid Cap' },
  { ticker: 'PYPL',   cat: 'Mid Cap' },
  { ticker: 'SQ',     cat: 'Mid Cap' },
  { ticker: 'SOFI',   cat: 'Mid Cap' },
  { ticker: 'USB',    cat: 'Mid Cap' },
  { ticker: 'PNC',    cat: 'Mid Cap' },
  { ticker: 'HAL',    cat: 'Mid Cap' },
  { ticker: 'DVN',    cat: 'Mid Cap' },
  { ticker: 'VLO',    cat: 'Mid Cap' },
  { ticker: 'MRNA',   cat: 'Mid Cap' },
  { ticker: 'HOOD',   cat: 'Mid Cap' },
  { ticker: 'MARA',   cat: 'Mid Cap' },
  { ticker: 'PTON',   cat: 'Mid Cap' },
  { ticker: 'W',      cat: 'Mid Cap' },

  // SPECULATIVE (under $10B — high volatility retail favourites)
  { ticker: 'GME',    cat: 'Speculative' },
  { ticker: 'AMC',    cat: 'Speculative' },
  { ticker: 'RIVN',   cat: 'Speculative' },
  { ticker: 'LCID',   cat: 'Speculative' },
  { ticker: 'NKLA',   cat: 'Speculative' },
  { ticker: 'SPCE',   cat: 'Speculative' },
  { ticker: 'JOBY',   cat: 'Speculative' },
  { ticker: 'OPEN',   cat: 'Speculative' },
  { ticker: 'CLOV',   cat: 'Speculative' },
  { ticker: 'WOLF',   cat: 'Speculative' },
  { ticker: 'SHOP',   cat: 'Speculative' },
  { ticker: 'DELL',   cat: 'Speculative' },
  { ticker: 'HPQ',    cat: 'Speculative' },
  { ticker: 'RH',     cat: 'Speculative' },
  { ticker: 'FANG',   cat: 'Speculative' },

  // TSX BLUE CHIPS
  { ticker: 'CNQ.TO', cat: 'TSX' },
  { ticker: 'SU.TO',  cat: 'TSX' },
  { ticker: 'RY.TO',  cat: 'TSX' },
  { ticker: 'TD.TO',  cat: 'TSX' },
  { ticker: 'BNS.TO', cat: 'TSX' },
  { ticker: 'BMO.TO', cat: 'TSX' },
  { ticker: 'CM.TO',  cat: 'TSX' },
  { ticker: 'SHOP.TO',cat: 'TSX' },
  { ticker: 'ABX.TO', cat: 'TSX' },
  { ticker: 'CNR.TO', cat: 'TSX' },
  { ticker: 'TRP.TO', cat: 'TSX' },
  { ticker: 'ENB.TO', cat: 'TSX' },
  { ticker: 'MFC.TO', cat: 'TSX' },
  { ticker: 'SLF.TO', cat: 'TSX' },
  { ticker: 'WPM.TO', cat: 'TSX' },
  { ticker: 'AEM.TO', cat: 'TSX' },
  { ticker: 'FNV.TO', cat: 'TSX' },
  { ticker: 'IMO.TO', cat: 'TSX' },
  { ticker: 'CVE.TO', cat: 'TSX' },
  { ticker: 'NTR.TO', cat: 'TSX' },

  // TSX-V / JUNIOR MINERS
  { ticker: 'LUCA.V', cat: 'TSX-V' },
  { ticker: 'IFOS.V', cat: 'TSX-V' },
  { ticker: 'ROXG.V', cat: 'TSX-V' },
  { ticker: 'FURY.V', cat: 'TSX-V' },
  { ticker: 'GCX.V',  cat: 'TSX-V' },
];

const CATEGORIES = ['All', 'Mega Cap', 'Large Cap', 'Mid Cap', 'Speculative', 'TSX', 'TSX-V'];
const GRADES     = ['A', 'B', 'C', 'D', 'F'];
const TOP_N_OPTIONS = [5, 10, 20, 50, 999];

const PATTERN_PLAIN = {
  'Gap Down 3%+':        'Stock dropped hard today — history says it often bounces back',
  '3 Red Days Streak':   'Fell 3 days in a row — could be oversold and due for a bounce',
  'Volume Spike No Move':'Huge trading activity but price barely moved — something is brewing',
  '3 Green Days Streak': 'Rose 3 days straight — watch for continuation or exhaustion',
  'Inside Day Breakout': 'Stock coiling tight — a big move is likely coming soon',
  'Intraday Reversal':   'Peaked then sold off hard today — potential reversal signal',
};

function gradeOrder(g) { return { A:0, B:1, C:2, D:3, F:4 }[g] ?? 5; }

// ── Core maths ────────────────────────────────────────────────────────────────
function calcStats(ts, numDays) {
  const dates   = Object.keys(ts).sort((a,b) => b.localeCompare(a)).slice(0, numDays);
  if (dates.length < 10) throw new Error('Not enough data');
  const closes  = dates.map(d => parseFloat(ts[d]['4. close']));
  const opens   = dates.map(d => parseFloat(ts[d]['1. open']));
  const highs   = dates.map(d => parseFloat(ts[d]['2. high']));
  const lows    = dates.map(d => parseFloat(ts[d]['3. low']));
  const volumes = dates.map(d => parseFloat(ts[d]['5. volume']));
  const changes = [];
  for (let i = 0; i < closes.length - 1; i++)
    changes.push((closes[i] - closes[i+1]) / closes[i+1] * 100);
  const intradayRanges = opens.map((o,i) => (highs[i]-lows[i])/o*100);
  const avgChange    = changes.reduce((a,b)=>a+b,0)/changes.length;
  const avgAbsChange = changes.map(Math.abs).reduce((a,b)=>a+b,0)/changes.length;
  const maxGain      = Math.max(...changes);
  const maxLoss      = Math.min(...changes);
  const avgVol       = volumes.reduce((a,b)=>a+b,0)/volumes.length;
  const avgIntraday  = intradayRanges.reduce((a,b)=>a+b,0)/intradayRanges.length;
  const maxIntraday  = Math.max(...intradayRanges);
  const mean         = avgChange;
  const variance     = changes.reduce((a,b)=>a+(b-mean)**2,0)/changes.length;
  const stdDev       = Math.sqrt(variance);
  const annualVol    = stdDev*Math.sqrt(252);
  const buckets = {'Down 3%+':0,'Down 1-3%':0,'Flat ±1%':0,'Up 1-3%':0,'Up 3%+':0};
  changes.forEach(c=>{
    if(c<=-3) buckets['Down 3%+']++;
    else if(c<=-1) buckets['Down 1-3%']++;
    else if(c<1)   buckets['Flat ±1%']++;
    else if(c<3)   buckets['Up 1-3%']++;
    else           buckets['Up 3%+']++;
  });
  const randomWins     = changes.slice(0,-1).filter(c=>c>0).length;
  const randomBaseline = Math.round(randomWins/(changes.length-1)*100);
  return { closes,opens,highs,lows,volumes,changes,avgChange,avgAbsChange,maxGain,maxLoss,avgVol,avgIntraday,maxIntraday,stdDev,annualVol,buckets,dates,intradayRanges,randomBaseline };
}

function calcDecay(signalIndices, changes, horizons=[1,2,3,5,10]) {
  return horizons.map(h=>{
    const valid = signalIndices.filter(i=>i-h>=0);
    if (valid.length<3) return {day:h,winRate:null,instances:0};
    const wins = valid.filter(i=>{
      const fwd = changes.slice(i-h,i).reduce((acc,c)=>acc+c,0);
      return fwd>0;
    }).length;
    return {day:h,winRate:Math.round(wins/valid.length*100),instances:valid.length};
  });
}

function calcKelly(winRate,avgWin,avgLoss) {
  const w=winRate/100, l=1-w;
  const ratio=Math.abs(parseFloat(avgWin))/Math.abs(parseFloat(avgLoss));
  return Math.max(0,Math.min(w-(l/ratio),0.25));
}

function analyzePatterns(stats) {
  const {closes,changes,volumes,avgVol,stdDev,highs,lows,randomBaseline}=stats;
  const patterns=[];

  function addPattern(name,signalIndices,wins,wArr,lArr,desc) {
    const instances=signalIndices.length;
    const reliable=instances>=MIN_SAMPLE;
    const wr=instances>0?Math.round(wins/instances*100):0;
    const aw=wArr.length?(wArr.reduce((a,b)=>a+b,0)/wArr.length).toFixed(1):'0';
    const al=lArr.length?(lArr.reduce((a,b)=>a+b,0)/lArr.length).toFixed(1):'0';
    const ev=((wr/100)*parseFloat(aw)-((100-wr)/100)*parseFloat(al)).toFixed(2);
    const edgeVsRandom=wr-randomBaseline;
    const kelly=calcKelly(wr,aw,al);
    const decay=calcDecay(signalIndices,changes);
    const bestDay=decay.filter(d=>d.winRate!==null).reduce((best,d)=>d.winRate>(best?.winRate||0)?d:best,null);
    patterns.push({name,instances,winRate:wr,avgWin:'+'+aw+'%',avgLoss:'-'+al+'%',ev:parseFloat(ev),evStr:(ev>=0?'+':'')+ev+'%',signal:wr>=60?'green':wr>=50?'yellow':'red',desc,reliable,edgeVsRandom,kelly,rawAvgWin:aw,rawAvgLoss:al,decay,bestDay});
  }

  let si=[],w=0,wA=[],lA=[];
  for(let i=1;i<changes.length-1;i++) if(changes[i]<=-3){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}
  addPattern('Gap Down 3%+',si,w,wA,lA,'Single-day drop of 3%+ — mean reversion probability over next 5 days');

  si=[];w=0;wA=[];lA=[];
  for(let i=2;i<changes.length-1;i++) if(changes[i]<0&&changes[i+1]<0&&changes[i+2]<0){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}
  addPattern('3 Red Days Streak',si,w,wA,lA,'Three consecutive down days — oversold bounce probability');

  si=[];w=0;wA=[];lA=[];
  for(let i=1;i<changes.length-1;i++) if(volumes[i]>avgVol*1.8&&Math.abs(changes[i])<0.8){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}
  addPattern('Volume Spike No Move',si,w,wA,lA,'2x+ volume with flat price — potential accumulation before move');

  si=[];w=0;wA=[];lA=[];
  for(let i=2;i<changes.length-1;i++) if(changes[i]>0&&changes[i+1]>0&&changes[i+2]>0){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}
  addPattern('3 Green Days Streak',si,w,wA,lA,'Three consecutive up days — continuation vs exhaustion signal');

  si=[];w=0;wA=[];lA=[];
  for(let i=1;i<highs.length-1;i++) if(highs[i]<highs[i+1]&&lows[i]>lows[i+1]){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}
  addPattern('Inside Day Breakout',si,w,wA,lA,"Today's range inside yesterday's — stock coiling before explosive directional move");

  si=[];w=0;wA=[];lA=[];
  for(let i=1;i<closes.length-1;i++){
    const drop=highs[i]>0?(highs[i]-closes[i])/highs[i]*100:0;
    if(drop>3&&changes[i]<0){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}
  }
  addPattern('Intraday Reversal',si,w,wA,lA,'Hit high then reversed 3%+ intraday — exhaustion and potential reversal signal');

  patterns.sort((a,b)=>b.ev-a.ev);

  let activeSignal=null;
  const last3=changes.slice(0,3),last1=changes[0],lastVol=volumes[0],price=closes[0];
  const isInsideDay=highs[0]<highs[1]&&lows[0]>lows[1];
  const rel=patterns.filter(p=>p.reliable);

  if(last3.every(c=>c<0)&&rel.find(p=>p.name==='3 Red Days Streak')){
    const pat=rel.find(p=>p.name==='3 Red Days Streak');
    activeSignal={...pat,direction:'BULLISH',entry:price.toFixed(2),stopLoss:(price*(1-stdDev/100*1.5)).toFixed(2),target:(price*(1+stdDev/100*2)).toFixed(2),rr:'1:'+(stdDev*2/(stdDev*1.5)).toFixed(1),maxAdverse:(-stdDev*1.5).toFixed(1)+'%'};
  } else if(last1<=-3&&rel.find(p=>p.name==='Gap Down 3%+')){
    const pat=rel.find(p=>p.name==='Gap Down 3%+');
    activeSignal={...pat,direction:'BULLISH',entry:price.toFixed(2),stopLoss:(price*0.96).toFixed(2),target:(price*1.04).toFixed(2),rr:'1:1.5',maxAdverse:'-4.0%'};
  } else if(isInsideDay&&rel.find(p=>p.name==='Inside Day Breakout')){
    const pat=rel.find(p=>p.name==='Inside Day Breakout');
    activeSignal={...pat,direction:'WATCH',entry:price.toFixed(2),stopLoss:(price*0.97).toFixed(2),target:(price*1.04).toFixed(2),rr:'1:1.8',maxAdverse:'-3.0%'};
  } else if(lastVol>avgVol*1.8&&Math.abs(last1)<0.8&&rel.find(p=>p.name==='Volume Spike No Move')){
    const pat=rel.find(p=>p.name==='Volume Spike No Move');
    activeSignal={...pat,direction:'WATCH',entry:price.toFixed(2),stopLoss:(price*0.97).toFixed(2),target:(price*1.04).toFixed(2),rr:'1:1.8',maxAdverse:'-3.0%'};
  }

  return {patterns,activeSignal,randomBaseline};
}

function fmtVol(v){if(v>=1e9)return(v/1e9).toFixed(1)+'B';if(v>=1e6)return(v/1e6).toFixed(1)+'M';if(v>=1e3)return(v/1e3).toFixed(0)+'K';return v.toFixed(0);}
function fmtMoney(n){if(n>=1e6)return'$'+(n/1e6).toFixed(2)+'M';if(n>=1e3)return'$'+(n/1e3).toFixed(1)+'K';return'$'+n.toFixed(0);}

function getConfidence(winRate,randomBaseline,instances,kelly,decay){
  const decaySlope=decay&&decay.length>=2?(decay[decay.length-1].winRate-decay[0].winRate)/9:null;
  return computeConfidenceScore({winRate:winRate/100,randomWinRate:randomBaseline/100,sampleSize:instances,kellyFraction:kelly,decaySlope});
}

function DecayCurve({decay,randomBaseline}){
  const valid=decay.filter(d=>d.winRate!==null);
  const maxWR=Math.max(...valid.map(d=>d.winRate),randomBaseline+5);
  const minWR=Math.min(...valid.map(d=>d.winRate),randomBaseline-5);
  const range=maxWR-minWR||10;
  return(
    <div style={{marginTop:10}}>
      <div style={{fontSize:10,color:'#6b7ab5',letterSpacing:1,marginBottom:8,fontWeight:500}}>EDGE DECAY — WIN RATE BY DAY AFTER SIGNAL</div>
      <div style={{display:'flex',gap:6,alignItems:'flex-end',height:60,marginBottom:6}}>
        {decay.map((d,i)=>{
          if(d.winRate===null)return(<div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}><div style={{fontSize:9,color:'#cbd5e0'}}>N/A</div><div style={{width:'100%',height:4,background:'#e2e8f0',borderRadius:2}}/><div style={{fontSize:9,color:'#a0aec0'}}>D{d.day}</div></div>);
          const pct=Math.max(0,Math.min(100,((d.winRate-minWR)/range)*100));
          const col=d.winRate>=60?'#16a34a':d.winRate>=50?'#d97706':'#dc2626';
          const isBest=valid.every(x=>d.winRate>=x.winRate);
          return(<div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}><div style={{fontSize:9,color:col,fontWeight:isBest?700:400}}>{d.winRate}%{isBest?'★':''}</div><div style={{width:'100%',background:'#f0f4ff',borderRadius:3,height:40,display:'flex',alignItems:'flex-end'}}><div style={{width:'100%',height:Math.max(4,pct*0.4)+'px',background:col,borderRadius:3,opacity:0.8}}/></div><div style={{fontSize:9,color:'#a0aec0'}}>D{d.day}</div></div>);
        })}
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
          <div style={{fontSize:9,color:'#94a3b8'}}>{randomBaseline}%</div>
          <div style={{width:'100%',background:'#f0f4ff',borderRadius:3,height:40,display:'flex',alignItems:'flex-end'}}><div style={{width:'100%',height:Math.max(4,((randomBaseline-minWR)/range)*40)+'px',background:'#94a3b8',borderRadius:3,opacity:0.5}}/></div>
          <div style={{fontSize:9,color:'#a0aec0'}}>RAND</div>
        </div>
      </div>
      {valid.length>0&&(()=>{
        const best=valid.reduce((b,d)=>d.winRate>b.winRate?d:b);
        const worst=valid.reduce((b,d)=>d.winRate<b.winRate?d:b);
        return(<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><div style={{fontSize:10,color:'#16a34a',background:'#f0fdf4',border:'1px solid #bbf7d0',padding:'3px 8px',borderRadius:6,fontWeight:600}}>★ Best exit: Day {best.day} ({best.winRate}% win rate)</div><div style={{fontSize:10,color:'#dc2626',background:'#fef2f2',border:'1px solid #fecaca',padding:'3px 8px',borderRadius:6}}>Weakest: Day {worst.day} ({worst.winRate}% win rate)</div></div>);
      })()}
    </div>
  );
}

const N='#0f1f5c';const G='#f5c842';const BG='#f0f4ff';const W='#ffffff';
const BORDER='#dde3f5';const MUTED='#6b7ab5';const TEXT='#0a1540';

export default function Home(){
  const [mode,setMode]=useState('scanner');
  const [ticker,setTicker]=useState('');
  const [days,setDays]=useState(1000);
  const [portfolio,setPortfolio]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [result,setResult]=useState(null);
  const [activeTicker,setActiveTicker]=useState('');
  const [expandedPattern,setExpandedPattern]=useState(null);

  // Scanner state
  const [scanning,setScanning]=useState(false);
  const [scanProgress,setScanProgress]=useState(0);
  const [scanStatus,setScanStatus]=useState('');
  const [scanResults,setScanResults]=useState([]);
  const [expandedScan,setExpandedScan]=useState(null);

  // Filter state
  const [filterGrades,setFilterGrades]=useState(['A','B']);
  const [filterDirection,setFilterDirection]=useState('All');
  const [filterCategory,setFilterCategory]=useState('All');
  const [filterTopN,setFilterTopN]=useState(10);

  // ── Filtered results (instant, no rescan needed) ──────────────────────────
  const filteredResults = useMemo(()=>{
    let res=[...scanResults];
    if(filterCategory!=='All') res=res.filter(r=>r.category===filterCategory);
    if(filterGrades.length>0) res=res.filter(r=>filterGrades.includes(r.confidence.grade));
    if(filterDirection!=='All') res=res.filter(r=>r.activeSignal.direction===filterDirection);
    res.sort((a,b)=>{
      const gd=gradeOrder(a.confidence.grade)-gradeOrder(b.confidence.grade);
      return gd!==0?gd:b.confidence.score-a.confidence.score;
    });
    return filterTopN===999?res:res.slice(0,filterTopN);
  },[scanResults,filterGrades,filterDirection,filterCategory,filterTopN]);

  // ── Single ticker ─────────────────────────────────────────────────────────
  const run=async(overrideTicker)=>{
    const t=(overrideTicker||ticker).trim().toUpperCase();
    if(!t)return;
    setLoading(true);setError('');setResult(null);setActiveTicker(t);setExpandedPattern(null);
    try{
      const res=await fetch(`/api/stock?ticker=${t}&days=${days}`);
      const data=await res.json();
      if(data.error)throw new Error(data.error);
      const ts=data['Time Series (Daily)'];
      if(!ts)throw new Error('No price data found');
      const stats=calcStats(ts,days);
      const{patterns,activeSignal,randomBaseline}=analyzePatterns(stats);
      setResult({stats,patterns,activeSignal,randomBaseline});
    }catch(e){setError(e.message||'Failed. Check ticker and try again.');}
    setLoading(false);
  };

  // ── Scanner ───────────────────────────────────────────────────────────────
  const runScan=async()=>{
    setScanning(true);setScanResults([]);setScanProgress(0);setExpandedScan(null);
    const hits=[];
    for(let i=0;i<UNIVERSE.length;i++){
      const{ticker:t,cat}=UNIVERSE[i];
      setScanStatus(`Scanning ${t}...`);
      setScanProgress(Math.round((i/UNIVERSE.length)*100));
      try{
        const res=await fetch(`/api/stock?ticker=${t}&days=500`);
        const data=await res.json();
        if(data.error||!data['Time Series (Daily)'])continue;
        const stats=calcStats(data['Time Series (Daily)'],500);
        const{patterns,activeSignal,randomBaseline}=analyzePatterns(stats);
        if(activeSignal){
          const confidence=getConfidence(activeSignal.winRate,randomBaseline,activeSignal.instances,activeSignal.kelly,activeSignal.decay);
          hits.push({ticker:t,category:cat,price:stats.closes[0].toFixed(2),change:stats.changes[0].toFixed(2),activeSignal,patterns,randomBaseline,stats,confidence,plainDesc:PATTERN_PLAIN[activeSignal.name]||activeSignal.desc});
        }
      }catch(e){}
      await new Promise(r=>setTimeout(r,100));
    }
    hits.sort((a,b)=>{const gd=gradeOrder(a.confidence.grade)-gradeOrder(b.confidence.grade);return gd!==0?gd:b.confidence.score-a.confidence.score;});
    setScanResults(hits);
    setScanProgress(100);setScanStatus('');setScanning(false);
  };

  const toggleGrade=g=>setFilterGrades(prev=>prev.includes(g)?prev.filter(x=>x!==g):[...prev,g]);

  const portfolioVal=parseFloat(portfolio.replace(/[^0-9.]/g,''))||0;
  const s=result?.stats;
  const sig=result?.activeSignal;
  const sigCol=sig?.direction==='BULLISH'?'#16a34a':sig?.direction==='BEARISH'?'#dc2626':'#d97706';
  const sigBg=sig?.direction==='BULLISH'?'#f0fdf4':sig?.direction==='BEARISH'?'#fef2f2':'#fffbeb';
  const kellyPct=sig?.kelly||0;
  const fullKellyDollar=portfolioVal*kellyPct;
  const halfKellyDollar=portfolioVal*kellyPct*0.5;
  const quarterKellyDollar=portfolioVal*kellyPct*0.25;

  const CAT_COLORS={'Mega Cap':'#7c3aed','Large Cap':'#1d4ed8','Mid Cap':'#0369a1','Speculative':'#dc2626','TSX':'#b45309','TSX-V':'#166534'};

  return(
    <>
      <Head>
        <title>Cerrado Edge — Movement Analyzer</title>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${BG};color:${TEXT};font-family:'Inter',sans-serif;min-height:100vh;}
        input::placeholder{color:#a0aec0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:${BG};}::-webkit-scrollbar-thumb{background:${BORDER};border-radius:2px;}
        @keyframes pulse{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanpulse{0%,100%{opacity:.4}50%{opacity:1}}
        .fade{animation:fadein 0.4s ease;}
        .card{background:${W};border-radius:14px;border:1px solid ${BORDER};padding:20px 22px;}
        .pat-card{cursor:pointer;transition:box-shadow 0.2s;}.pat-card:hover{box-shadow:0 4px 20px rgba(15,31,92,0.08);}
        .filter-chip{border:none;border-radius:8px;padding:5px 12px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:'Inter',sans-serif;}
        .scan-card{cursor:pointer;transition:box-shadow 0.2s;}.scan-card:hover{box-shadow:0 4px 20px rgba(15,31,92,0.1);}
      `}</style>

      {/* NAV */}
      <nav style={{background:N,padding:'0 32px',display:'flex',alignItems:'center',justifyContent:'space-between',height:60,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 20px rgba(15,31,92,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,background:G,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:N,fontWeight:800,fontFamily:'Syne,sans-serif'}}>C</div>
          <span style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,color:W}}>Cerrado Edge</span>
        </div>
        <div style={{display:'flex',gap:4}}>
          <button onClick={()=>setMode('scanner')} style={{background:mode==='scanner'?'rgba(245,200,66,0.15)':'none',border:'none',padding:'6px 14px',borderRadius:6,color:mode==='scanner'?G:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:mode==='scanner'?600:400,cursor:'pointer'}}>◎ Scanner</button>
          <button onClick={()=>setMode('single')}  style={{background:mode==='single'?'rgba(245,200,66,0.15)':'none',border:'none',padding:'6px 14px',borderRadius:6,color:mode==='single'?G:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:mode==='single'?600:400,cursor:'pointer'}}>↗ Deep Dive</button>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.2)',padding:'3px 8px',borderRadius:4,letterSpacing:1}}>LIVE DATA</div>
          <div style={{background:G,color:N,fontSize:9,fontWeight:800,padding:'4px 10px',borderRadius:12,letterSpacing:1,fontFamily:'Syne,sans-serif'}}>BETA</div>
        </div>
      </nav>

      <div style={{maxWidth:860,margin:'0 auto',padding:'32px 24px 80px'}}>

        <div style={{textAlign:'center',padding:'40px 20px 32px',maxWidth:580,margin:'0 auto 32px'}}>
          <div style={{display:'inline-block',fontSize:10,letterSpacing:3,color:N,marginBottom:14,background:'#fdf3d0',padding:'5px 14px',borderRadius:20,fontWeight:600}}>◎ REAL DATA · PATTERN PROBABILITY · KELLY SIZING · EDGE DECAY</div>
          <h1 style={{fontFamily:'Syne,sans-serif',fontSize:40,fontWeight:800,lineHeight:1.1,marginBottom:12,color:N}}>{mode==='scanner'?<>Morning<br/>Scanner</>:<>Movement<br/>Analyzer</>}</h1>
          <p style={{color:MUTED,fontSize:13,lineHeight:1.8}}>{mode==='scanner'?`Scans ${UNIVERSE.length} stocks across 6 categories · Filter instantly · Ranked by confidence`:'Real price history · 6 patterns · Random baseline · Kelly sizing · Edge decay curves'}</p>
        </div>

        {/* ══════════════ SCANNER MODE ══════════════ */}
        {mode==='scanner'&&(
          <div className="fade">

            {/* Scan button card */}
            <div className="card" style={{marginBottom:20,padding:'24px 28px',textAlign:'center'}}>
              <div style={{fontSize:13,color:MUTED,marginBottom:6,lineHeight:1.8}}>
                No ticker needed. Scans <strong style={{color:TEXT}}>{UNIVERSE.length} stocks</strong> across Mega Cap, Large Cap, Mid Cap, Speculative, TSX &amp; TSX-V.<br/>
                Finds patterns triggering <strong style={{color:TEXT}}>today</strong> — filter the results instantly without rescanning.
              </div>
              <div style={{fontSize:11,color:'#a0aec0',marginBottom:22}}>Takes 3–4 minutes to scan all {UNIVERSE.length} stocks · Set your filters below before or after scanning</div>
              <button onClick={runScan} disabled={scanning}
                style={{background:scanning?'#e5e7eb':`linear-gradient(135deg,${G},#e8a800)`,border:'none',borderRadius:12,padding:'14px 48px',color:scanning?'#9ca3af':N,fontSize:15,fontWeight:800,fontFamily:'Syne,sans-serif',cursor:scanning?'not-allowed':'pointer',letterSpacing:1,boxShadow:scanning?'none':'0 4px 20px rgba(245,200,66,0.5)',transition:'all 0.2s'}}>
                {scanning?'SCANNING MARKET...':'◎ SCAN MARKET'}
              </button>
              {scanning&&(
                <div style={{marginTop:20}}>
                  <div style={{height:6,background:BG,borderRadius:3,overflow:'hidden',marginBottom:8}}>
                    <div style={{height:'100%',width:scanProgress+'%',background:`linear-gradient(90deg,${G},#e8a800)`,borderRadius:3,transition:'width 0.4s ease'}}/>
                  </div>
                  <div style={{fontSize:11,color:MUTED,animation:'scanpulse 1.5s ease infinite'}}>{scanStatus} — {scanProgress}% complete ({UNIVERSE.length} stocks)</div>
                </div>
              )}
            </div>

            {/* ── FILTER BAR ── */}
            <div className="card" style={{marginBottom:20,padding:'18px 22px'}}>
              <div style={{fontSize:10,color:MUTED,letterSpacing:2,textTransform:'uppercase',fontWeight:600,marginBottom:14}}>Filter Results</div>

              {/* Row 1: Grade + Direction + Top N */}
              <div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:14,alignItems:'flex-start'}}>

                {/* Grade filter */}
                <div>
                  <div style={{fontSize:10,color:MUTED,marginBottom:6,fontWeight:500}}>Grade</div>
                  <div style={{display:'flex',gap:5}}>
                    {GRADES.map(g=>{
                      const cols={A:'#00C896',B:'#7BD47A',C:'#F4C542',D:'#F4874B',F:'#E05252'};
                      const active=filterGrades.includes(g);
                      return(<button key={g} className="filter-chip" onClick={()=>toggleGrade(g)}
                        style={{background:active?cols[g]+'22':W,color:active?cols[g]:MUTED,border:`1px solid ${active?cols[g]+'66':BORDER}`}}>
                        {g}
                      </button>);
                    })}
                    <button className="filter-chip" onClick={()=>setFilterGrades([...GRADES])} style={{background:BG,color:MUTED,border:`1px solid ${BORDER}`}}>All</button>
                    <button className="filter-chip" onClick={()=>setFilterGrades([])} style={{background:BG,color:MUTED,border:`1px solid ${BORDER}`}}>None</button>
                  </div>
                </div>

                {/* Direction filter */}
                <div>
                  <div style={{fontSize:10,color:MUTED,marginBottom:6,fontWeight:500}}>Direction</div>
                  <div style={{display:'flex',gap:5}}>
                    {['All','BULLISH','WATCH'].map(d=>{
                      const active=filterDirection===d;
                      const col=d==='BULLISH'?'#16a34a':d==='WATCH'?'#d97706':N;
                      return(<button key={d} className="filter-chip" onClick={()=>setFilterDirection(d)}
                        style={{background:active?col+'18':W,color:active?col:MUTED,border:`1px solid ${active?col+'44':BORDER}`}}>
                        {d}
                      </button>);
                    })}
                  </div>
                </div>

                {/* Top N filter */}
                <div>
                  <div style={{fontSize:10,color:MUTED,marginBottom:6,fontWeight:500}}>Show top</div>
                  <div style={{display:'flex',gap:5}}>
                    {TOP_N_OPTIONS.map(n=>{
                      const active=filterTopN===n;
                      return(<button key={n} className="filter-chip" onClick={()=>setFilterTopN(n)}
                        style={{background:active?N:W,color:active?G:MUTED,border:`1px solid ${active?N:BORDER}`}}>
                        {n===999?'All':n}
                      </button>);
                    })}
                  </div>
                </div>
              </div>

              {/* Row 2: Category filter */}
              <div>
                <div style={{fontSize:10,color:MUTED,marginBottom:6,fontWeight:500}}>Market Cap Category</div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  {CATEGORIES.map(cat=>{
                    const active=filterCategory===cat;
                    const col=CAT_COLORS[cat]||N;
                    return(<button key={cat} className="filter-chip" onClick={()=>setFilterCategory(cat)}
                      style={{background:active?col+'18':W,color:active?col:MUTED,border:`1px solid ${active?col+'55':BORDER}`}}>
                      {cat}
                    </button>);
                  })}
                </div>
              </div>

              {/* Active filter summary */}
              {scanResults.length>0&&(
                <div style={{marginTop:12,fontSize:11,color:MUTED,borderTop:`1px solid ${BORDER}`,paddingTop:10}}>
                  Showing <strong style={{color:TEXT}}>{filteredResults.length}</strong> of <strong style={{color:TEXT}}>{scanResults.length}</strong> signals found · {UNIVERSE.length} stocks scanned
                </div>
              )}
            </div>

            {/* Idle */}
            {!scanning&&scanProgress===0&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',minHeight:180,justifyContent:'center',gap:10}}>
                <div style={{fontSize:40,opacity:0.07}}>◎</div>
                <div style={{color:'#cbd5e0',fontSize:11,letterSpacing:2}}>HIT SCAN MARKET TO FIND TODAY'S OPPORTUNITIES</div>
              </div>
            )}

            {/* No results */}
            {!scanning&&scanProgress===100&&filteredResults.length===0&&(
              <div className="card" style={{textAlign:'center',padding:40}}>
                <div style={{fontSize:28,opacity:0.1,marginBottom:10}}>◎</div>
                <div style={{color:MUTED,fontSize:13,fontWeight:500}}>{scanResults.length===0?'No active signals found today':'No signals match your current filters'}</div>
                <div style={{color:'#cbd5e0',fontSize:11,marginTop:5}}>{scanResults.length>0?'Try adding more grades or changing the category filter':'The market is quiet — no patterns forming right now'}</div>
              </div>
            )}

            {/* Results */}
            {filteredResults.length>0&&(
              <div className="fade">
                {/* Grade legend */}
                <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
                  {[['A','#00C896','Strong Edge'],['B','#7BD47A','Moderate'],['C','#F4C542','Weak Edge'],['D','#F4874B','Marginal'],['F','#E05252','No Edge']].map(([g,c,l])=>(
                    <div key={g} style={{fontSize:10,padding:'3px 10px',borderRadius:10,background:c+'18',border:`1px solid ${c}44`,color:c,fontWeight:600}}>{g} — {l}</div>
                  ))}
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {filteredResults.map((r,i)=>{
                    const isExp=expandedScan===i;
                    const changePos=parseFloat(r.change)>=0;
                    const dirCol=r.activeSignal.direction==='BULLISH'?'#16a34a':'#d97706';
                    const catCol=CAT_COLORS[r.category]||N;
                    return(
                      <div key={i} className="card scan-card" style={{padding:'18px 20px'}} onClick={()=>setExpandedScan(isExp?null:i)}>

                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                          <div style={{display:'flex',alignItems:'center',gap:14}}>
                            <div style={{width:40,height:40,borderRadius:10,border:`2px solid ${r.confidence.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:r.confidence.color,fontFamily:'Syne,sans-serif',flexShrink:0,boxShadow:`0 0 12px ${r.confidence.color}33`}}>
                              {r.confidence.grade}
                            </div>
                            <div>
                              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                                <span style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:800,color:TEXT}}>{r.ticker}</span>
                                <span style={{fontSize:13,fontWeight:600,color:changePos?'#16a34a':'#dc2626'}}>{changePos?'+':''}{r.change}%</span>
                                <span style={{fontSize:12,color:MUTED}}>${r.price}</span>
                                {/* Category badge */}
                                <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:8,background:catCol+'18',color:catCol,border:`1px solid ${catCol}44`,letterSpacing:0.5}}>{r.category}</span>
                              </div>
                              <div style={{fontSize:11,color:MUTED,marginTop:2}}>{r.activeSignal.name}</div>
                            </div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:12}}>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontSize:24,fontWeight:800,color:r.confidence.color,fontFamily:'Syne,sans-serif',lineHeight:1}}>{r.confidence.score}</div>
                              <div style={{fontSize:9,color:MUTED,letterSpacing:1}}>/ 100</div>
                            </div>
                            <div style={{fontSize:10,fontWeight:700,padding:'5px 14px',borderRadius:16,background:dirCol,color:W,letterSpacing:1,fontFamily:'Syne,sans-serif'}}>{r.activeSignal.direction}</div>
                            <span style={{fontSize:11,color:MUTED}}>{isExp?'▲':'▼'}</span>
                          </div>
                        </div>

                        <div style={{marginTop:12,fontSize:12,color:TEXT,background:BG,borderRadius:8,padding:'9px 14px',lineHeight:1.6}}>{r.plainDesc}</div>

                        <div style={{display:'flex',gap:16,marginTop:10,flexWrap:'wrap'}}>
                          <span style={{fontSize:11,color:MUTED}}>Win rate: <strong style={{color:TEXT}}>{r.activeSignal.winRate}%</strong></span>
                          <span style={{fontSize:11,color:MUTED}}>Beats random by: <strong style={{color:r.activeSignal.edgeVsRandom>0?'#16a34a':'#dc2626'}}>{r.activeSignal.edgeVsRandom>0?'+':''}{r.activeSignal.edgeVsRandom}%</strong></span>
                          <span style={{fontSize:11,color:MUTED}}>Best exit: <strong style={{color:TEXT}}>{r.activeSignal.bestDay?`Day ${r.activeSignal.bestDay.day}`:'N/A'}</strong></span>
                          {!r.activeSignal.reliable&&<span style={{fontSize:10,color:'#d97706',background:'#fffbeb',border:'1px solid #f5c842',padding:'2px 8px',borderRadius:8,fontWeight:600}}>⚠️ Small sample</span>}
                        </div>

                        {isExp&&(
                          <div style={{marginTop:18,borderTop:`1px solid ${BORDER}`,paddingTop:18}}>
                            <ConfidenceGauge score={r.confidence.score} grade={r.confidence.grade} label={r.confidence.label} color={r.confidence.color} components={r.confidence.components} patternName={r.activeSignal.name}/>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
                              {[{label:'Entry',val:'$'+r.activeSignal.entry,col:TEXT,sub:'Current price'},{label:'Stop Loss',val:'$'+r.activeSignal.stopLoss,col:'#dc2626',sub:'Max loss: '+r.activeSignal.maxAdverse},{label:'Target',val:'$'+r.activeSignal.target,col:'#16a34a',sub:'R/R: '+r.activeSignal.rr}].map(tc=>(
                                <div key={tc.label} style={{background:BG,borderRadius:10,padding:'12px 14px',textAlign:'center'}}>
                                  <div style={{fontSize:9,color:MUTED,letterSpacing:1,marginBottom:5,textTransform:'uppercase',fontWeight:500}}>{tc.label}</div>
                                  <div style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:800,color:tc.col}}>{tc.val}</div>
                                  <div style={{fontSize:9,color:MUTED,marginTop:3}}>{tc.sub}</div>
                                </div>
                              ))}
                            </div>
                            {r.activeSignal.decay&&<div style={{background:BG,borderRadius:10,padding:'14px 16px',marginBottom:14}}><DecayCurve decay={r.activeSignal.decay} randomBaseline={r.randomBaseline}/></div>}
                            <button onClick={(e)=>{e.stopPropagation();setTicker(r.ticker);setMode('single');run(r.ticker);}}
                              style={{width:'100%',background:N,border:'none',borderRadius:10,padding:'13px',color:G,fontSize:12,fontWeight:800,fontFamily:'Syne,sans-serif',cursor:'pointer',letterSpacing:1}}>
                              ↗ FULL DEEP DIVE — {r.ticker}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ DEEP DIVE MODE ══════════════ */}
        {mode==='single'&&(
          <div className="fade">
            <div className="card" style={{marginBottom:24,padding:'24px 28px'}}>
              <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
                <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&run()}
                  placeholder="TICKER  (e.g. MSFT · AAPL · CNQ.TO · IFOS.V)"
                  style={{flex:1,minWidth:180,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:'12px 16px',color:TEXT,fontSize:13,outline:'none'}}
                  onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BORDER}/>
                <button onClick={()=>run()} disabled={loading||!ticker.trim()}
                  style={{background:loading?'#e5e7eb':`linear-gradient(135deg,${G},#e8a800)`,border:'none',borderRadius:10,padding:'12px 28px',color:loading?'#9ca3af':N,fontSize:13,fontWeight:700,fontFamily:'Syne,sans-serif',cursor:loading?'not-allowed':'pointer',letterSpacing:1,minWidth:110,boxShadow:loading?'none':'0 4px 14px rgba(245,200,66,0.4)'}}>
                  {loading?'···':'ANALYSE'}
                </button>
              </div>
              <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
                <div style={{fontSize:11,color:MUTED,fontWeight:500,whiteSpace:'nowrap'}}>Portfolio size:</div>
                <input value={portfolio} onChange={e=>setPortfolio(e.target.value)} placeholder="e.g. 200000"
                  style={{width:160,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:'8px 12px',color:TEXT,fontSize:13,outline:'none'}}
                  onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BORDER}/>
                {portfolioVal>0&&<span style={{fontSize:11,color:'#16a34a',fontWeight:600}}>✓ {fmtMoney(portfolioVal)} set</span>}
              </div>
              <div style={{fontSize:10,color:'#a0aec0',marginBottom:14}}>US: MSFT · AAPL · TSLA &nbsp;|&nbsp; TSX: CNQ.TO · SU.TO &nbsp;|&nbsp; TSX-V: IFOS.V · LUCA.V</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                {[{label:'1000 Days ★',val:1000},{label:'750 Days',val:750},{label:'500 Days',val:500}].map(tf=>(
                  <button key={tf.val} onClick={()=>setDays(tf.val)}
                    style={{background:days===tf.val?N:W,border:`1px solid ${days===tf.val?N:BORDER}`,borderRadius:6,padding:'6px 14px',color:days===tf.val?G:MUTED,fontSize:11,fontWeight:days===tf.val?600:400,cursor:'pointer'}}>
                    {tf.label}
                  </button>
                ))}
                <span style={{fontSize:10,color:'#a0aec0',marginLeft:4}}>Min 500 days for reliability</span>
              </div>
            </div>

            {error&&<div style={{color:'#dc2626',fontSize:12,padding:'10px 16px',background:'#fef2f2',borderRadius:10,border:'1px solid #fecaca',marginBottom:16}}>{error}</div>}

            {loading&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:280,gap:14}}>
                <div style={{display:'flex',gap:6}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:G,animation:`pulse 1.2s ease ${i*0.2}s infinite`}}/>)}</div>
                <div style={{color:MUTED,fontSize:11,letterSpacing:2}}>FETCHING REAL DATA · {activeTicker}</div>
              </div>
            )}

            {!loading&&!result&&!error&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:260,gap:10}}>
                <div style={{fontSize:40,opacity:0.1}}>◎</div>
                <div style={{color:'#cbd5e0',fontSize:11,letterSpacing:2}}>ENTER TICKER · SET PORTFOLIO · PRESS ANALYSE</div>
              </div>
            )}

            {!loading&&result&&s&&(
              <div className="fade">
                <div className="card" style={{marginBottom:16,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',background:N}}>
                  <div>
                    <div style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800,color:W}}>{activeTicker}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:2}}>{s.changes.length} trading days analysed</div>
                  </div>
                  <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                    <span style={{fontSize:26,fontWeight:700,color:W}}>${s.closes[0].toFixed(2)}</span>
                    <span style={{fontSize:13,fontWeight:600,color:s.changes[0]>=0?'#4ade80':'#f87171'}}>{s.changes[0]>=0?'+':''}{s.changes[0].toFixed(2)}%</span>
                  </div>
                  <div style={{marginLeft:'auto',background:'rgba(255,255,255,0.08)',borderRadius:8,padding:'8px 14px',textAlign:'center'}}>
                    <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:1,marginBottom:3}}>RANDOM BASELINE</div>
                    <div style={{fontSize:18,fontWeight:700,color:G}}>{result.randomBaseline}%</div>
                    <div style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>Random buy win rate</div>
                  </div>
                </div>

                <div style={{background:'#fdf3d0',border:'1px solid #f5c84244',borderRadius:10,padding:'10px 16px',marginBottom:20,fontSize:12,color:'#92400e'}}>
                  <strong>Random Baseline: {result.randomBaseline}%</strong> — Only patterns that beat this number have a real trading edge.
                </div>

                <div style={{fontSize:11,color:MUTED,letterSpacing:2,marginBottom:10,textTransform:'uppercase',fontWeight:500}}>Movement Statistics</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10,marginBottom:24}}>
                  {[
                    {label:'Avg daily move',val:s.avgAbsChange.toFixed(2)+'%',sub:'Directional: '+(s.avgChange>=0?'+':'')+s.avgChange.toFixed(2)+'%',col:'#16a34a'},
                    {label:'Max single day gain',val:'+'+s.maxGain.toFixed(2)+'%',sub:'Historical max',col:'#16a34a'},
                    {label:'Max single day loss',val:s.maxLoss.toFixed(2)+'%',sub:'Historical max',col:'#dc2626'},
                    {label:'Daily volatility',val:s.stdDev.toFixed(2)+'%',sub:'Ann. vol: '+s.annualVol.toFixed(1)+'%',col:N},
                    {label:'Avg intraday range',val:s.avgIntraday.toFixed(2)+'%',sub:'Max: '+s.maxIntraday.toFixed(2)+'%',col:N},
                    {label:'Avg daily volume',val:fmtVol(s.avgVol),sub:'Last: '+fmtVol(s.volumes[0]),col:N},
                  ].map((c,i)=>(
                    <div key={i} className="card" style={{padding:'14px 16px'}}>
                      <div style={{fontSize:10,color:MUTED,marginBottom:6,fontWeight:500}}>{c.label}</div>
                      <div style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800,color:c.col}}>{c.val}</div>
                      <div style={{fontSize:10,color:MUTED,marginTop:3}}>{c.sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{fontSize:11,color:MUTED,letterSpacing:2,marginBottom:10,textTransform:'uppercase',fontWeight:500}}>Daily Move Distribution</div>
                <div className="card" style={{marginBottom:24}}>
                  {Object.entries(s.buckets).map(([label,count])=>{
                    const total=Object.values(s.buckets).reduce((a,b)=>a+b,0);
                    const pct=(count/total*100).toFixed(1);
                    const col=label.includes('Down')?'#dc2626':label.includes('Up')?'#16a34a':'#d97706';
                    return(<div key={label} style={{marginBottom:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:TEXT,marginBottom:5,fontWeight:500}}><span>{label}</span><span style={{color:col}}>{pct}% · {count} days</span></div>
                      <div style={{height:8,background:BG,borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:pct+'%',background:col,borderRadius:4,transition:'width 0.8s cubic-bezier(.4,0,.2,1)',opacity:0.8}}/></div>
                    </div>);
                  })}
                </div>

                <div style={{fontSize:11,color:MUTED,letterSpacing:2,marginBottom:10,textTransform:'uppercase',fontWeight:500}}>Active Signal</div>
                {sig?(
                  <div style={{background:sigBg,border:`2px solid ${sigCol}33`,borderRadius:14,padding:22,marginBottom:24}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                      <div>
                        <div style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:800,color:TEXT}}>◎ Pattern detected on real data</div>
                        <div style={{fontSize:11,color:MUTED,marginTop:3}}>{sig.pattern}</div>
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        {!sig.reliable&&<div style={{fontSize:10,color:'#d97706',background:'#fffbeb',border:'1px solid #f5c842',padding:'3px 10px',borderRadius:12,fontWeight:600}}>⚠️ Small sample</div>}
                        <div style={{fontSize:11,fontWeight:700,padding:'5px 14px',borderRadius:20,background:sigCol,color:W,letterSpacing:1,fontFamily:'Syne,sans-serif'}}>{sig.direction}</div>
                      </div>
                    </div>
                    {(()=>{const c=getConfidence(sig.winRate,result.randomBaseline,sig.instances,sig.kelly,sig.decay);return<ConfidenceGauge score={c.score} grade={c.grade} label={c.label} color={c.color} components={c.components} patternName={sig.name}/>;})()}
                    {[{label:'Win probability',val:sig.winRate,col:sigCol},{label:'Loss probability',val:100-sig.winRate,col:'#94a3b8'}].map(pb=>(
                      <div key={pb.label} style={{margin:'10px 0'}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:MUTED,marginBottom:5,fontWeight:500}}><span>{pb.label}</span><span style={{color:pb.col,fontWeight:700}}>{pb.val}%</span></div>
                        <div style={{height:8,background:W,borderRadius:4,overflow:'hidden',border:`1px solid ${BORDER}`}}><div style={{height:'100%',width:pb.val+'%',background:pb.col,borderRadius:4,transition:'width 1s cubic-bezier(.4,0,.2,1)',opacity:0.85}}/></div>
                      </div>
                    ))}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:16}}>
                      {[{label:'Entry',val:'$'+sig.entry,col:TEXT,sub:'Current price'},{label:'Stop loss',val:'$'+sig.stopLoss,col:'#dc2626',sub:'Max loss: '+sig.maxAdverse},{label:'Target',val:'$'+sig.target,col:'#16a34a',sub:'R/R: '+sig.rr}].map(tc=>(
                        <div key={tc.label} style={{background:W,border:`1px solid ${BORDER}`,borderRadius:10,padding:'12px 14px',textAlign:'center'}}>
                          <div style={{fontSize:9,color:MUTED,letterSpacing:1,marginBottom:5,textTransform:'uppercase',fontWeight:500}}>{tc.label}</div>
                          <div style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:800,color:tc.col}}>{tc.val}</div>
                          <div style={{fontSize:9,color:MUTED,marginTop:3}}>{tc.sub}</div>
                        </div>
                      ))}
                    </div>
                    {sig.decay&&<div style={{background:W,border:`1px solid ${BORDER}`,borderRadius:10,padding:'14px 16px',marginTop:14}}><DecayCurve decay={sig.decay} randomBaseline={result.randomBaseline}/></div>}
                    <div style={{marginTop:14,background:N,borderRadius:12,padding:'18px 20px'}}>
                      <div style={{fontSize:11,color:G,fontWeight:700,letterSpacing:1,marginBottom:14}}>◈ KELLY POSITION SIZING</div>
                      {portfolioVal>0?(
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                          {[{label:'Full Kelly',pct:(kellyPct*100).toFixed(1),dollar:fullKellyDollar,desc:'Mathematically optimal',col:G},{label:'Half Kelly',pct:(kellyPct*50).toFixed(1),dollar:halfKellyDollar,desc:'★ Recommended',col:'#4ade80'},{label:'Quarter Kelly',pct:(kellyPct*25).toFixed(1),dollar:quarterKellyDollar,desc:'Conservative',col:'#86efac'}].map(k=>(
                            <div key={k.label} style={{background:'rgba(255,255,255,0.06)',borderRadius:10,padding:'12px 14px',textAlign:'center',border:k.label==='Half Kelly'?`1px solid ${k.col}44`:'1px solid rgba(255,255,255,0.08)'}}>
                              <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>{k.label}</div>
                              <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,color:k.col}}>{fmtMoney(k.dollar)}</div>
                              <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',marginTop:3}}>{k.pct}% of portfolio</div>
                              <div style={{fontSize:9,color:k.col,marginTop:4,fontWeight:600}}>{k.desc}</div>
                            </div>
                          ))}
                        </div>
                      ):(
                        <div style={{textAlign:'center',color:'rgba(255,255,255,0.4)',fontSize:12}}>Enter portfolio size above to see dollar amounts</div>
                      )}
                    </div>
                    <div style={{background:W,border:`1px solid ${BORDER}`,borderRadius:10,padding:'12px 16px',marginTop:14}}>
                      <div style={{fontSize:10,color:MUTED,letterSpacing:1,marginBottom:5,fontWeight:500,textTransform:'uppercase'}}>Edge vs Random</div>
                      <div style={{fontSize:12,color:TEXT,lineHeight:1.7}}>
                        Based on <strong>{sig.instances} historical instances</strong>. Win rate: {sig.winRate}% vs random {result.randomBaseline}%. Real edge: <strong style={{color:sig.winRate>result.randomBaseline?'#16a34a':'#dc2626'}}>{sig.winRate>result.randomBaseline?'+':''}{sig.winRate-result.randomBaseline}%</strong>
                      </div>
                    </div>
                  </div>
                ):(
                  <div className="card" style={{textAlign:'center',padding:32,marginBottom:24}}>
                    <div style={{fontSize:28,opacity:0.1,marginBottom:10}}>◎</div>
                    <div style={{color:MUTED,fontSize:12,fontWeight:500}}>No active signal right now</div>
                    <div style={{color:'#cbd5e0',fontSize:11,marginTop:5}}>No high-probability pattern forming today</div>
                  </div>
                )}

                <div style={{fontSize:11,color:MUTED,letterSpacing:2,marginBottom:6,textTransform:'uppercase',fontWeight:500}}>Historical Patterns — Click to expand</div>
                <div style={{fontSize:10,color:'#a0aec0',marginBottom:12}}>Random baseline: {result.randomBaseline}% · 30+ instances required · Sorted by expected value</div>
                <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
                  {result.patterns.map((p,i)=>{
                    const col=p.signal==='green'?'#16a34a':p.signal==='red'?'#dc2626':'#d97706';
                    const bg=p.signal==='green'?'#f0fdf4':p.signal==='red'?'#fef2f2':'#fffbeb';
                    const edgeCol=p.edgeVsRandom>5?'#16a34a':p.edgeVsRandom<-5?'#dc2626':'#d97706';
                    const isExpanded=expandedPattern===i;
                    return(
                      <div key={i} className="card pat-card" style={{padding:'14px 16px',opacity:p.reliable?1:0.7}} onClick={()=>setExpandedPattern(isExpanded?null:i)}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,flexWrap:'wrap',gap:6}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:13,color:TEXT,fontWeight:600}}>{p.name}</span>
                            {!p.reliable&&<span style={{fontSize:9,color:'#d97706',background:'#fffbeb',border:'1px solid #f5c84266',padding:'2px 7px',borderRadius:10,fontWeight:600}}>⚠️ LOW SAMPLE ({p.instances})</span>}
                          </div>
                          <div style={{display:'flex',gap:6,alignItems:'center'}}>
                            <span style={{fontSize:10,color:edgeCol,fontWeight:600}}>Edge: {p.edgeVsRandom>0?'+':''}{p.edgeVsRandom}% vs random</span>
                            <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:12,background:bg,color:col,border:`1px solid ${col}33`}}>{p.winRate}% win rate</span>
                            <span style={{fontSize:10,color:MUTED}}>{isExpanded?'▲':'▼'}</span>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:6}}>
                          <span style={{fontSize:11,color:MUTED}}>{p.instances} instances {p.reliable?'✓':''}</span>
                          <span style={{fontSize:11,color:'#16a34a',fontWeight:500}}>Avg win: {p.avgWin}</span>
                          <span style={{fontSize:11,color:'#dc2626',fontWeight:500}}>Avg loss: {p.avgLoss}</span>
                          <span style={{fontSize:11,fontWeight:700,color:p.ev>=0?'#16a34a':'#dc2626'}}>EV: {p.evStr}</span>
                          {p.reliable&&p.kelly>0&&<span style={{fontSize:11,color:N,fontWeight:600}}>Half Kelly: {(p.kelly*50).toFixed(1)}%</span>}
                        </div>
                        {(()=>{const c=getConfidence(p.winRate,result.randomBaseline,p.instances,p.kelly,p.decay);return<ConfidenceGauge score={c.score} grade={c.grade} label={c.label} color={c.color} components={c.components} patternName={p.name}/>;})()}
                        <div style={{fontSize:11,color:MUTED,marginBottom:isExpanded?12:0}}>{p.desc}</div>
                        {isExpanded&&<div style={{borderTop:`1px solid ${BORDER}`,paddingTop:12,marginTop:4}}><DecayCurve decay={p.decay} randomBaseline={result.randomBaseline}/></div>}
                      </div>
                    );
                  })}
                </div>

                <div style={{fontSize:11,color:MUTED,letterSpacing:2,marginBottom:10,textTransform:'uppercase',fontWeight:500}}>Expected Value Summary</div>
                <div className="card" style={{overflowX:'auto',marginBottom:24}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead>
                      <tr style={{borderBottom:`2px solid ${BG}`}}>
                        {['Pattern','Instances','Win rate','Edge vs Random','Avg win','Avg loss','Exp. value','Half Kelly','Best Exit Day','Reliable'].map(h=>(
                          <th key={h} style={{fontSize:9,color:MUTED,letterSpacing:1,textTransform:'uppercase',padding:'8px 12px',textAlign:'left',fontWeight:600}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.patterns.map((p,i)=>(
                        <tr key={i} style={{borderBottom:`1px solid ${BG}`}}>
                          <td style={{padding:'10px 12px',color:TEXT,fontWeight:500}}>{p.name}</td>
                          <td style={{padding:'10px 12px',color:MUTED}}>{p.instances}</td>
                          <td style={{padding:'10px 12px',color:p.winRate>=60?'#16a34a':p.winRate>=50?'#d97706':'#dc2626',fontWeight:600}}>{p.winRate}%</td>
                          <td style={{padding:'10px 12px',color:p.edgeVsRandom>5?'#16a34a':p.edgeVsRandom<-5?'#dc2626':'#d97706',fontWeight:600}}>{p.edgeVsRandom>0?'+':''}{p.edgeVsRandom}%</td>
                          <td style={{padding:'10px 12px',color:'#16a34a',fontWeight:500}}>{p.avgWin}</td>
                          <td style={{padding:'10px 12px',color:'#dc2626',fontWeight:500}}>{p.avgLoss}</td>
                          <td style={{padding:'10px 12px',color:p.ev>=0?'#16a34a':'#dc2626',fontWeight:700}}>{p.evStr}</td>
                          <td style={{padding:'10px 12px',color:N,fontWeight:600}}>{(p.kelly*50).toFixed(1)}%</td>
                          <td style={{padding:'10px 12px',color:'#16a34a',fontWeight:600}}>{p.bestDay?`Day ${p.bestDay.day} (${p.bestDay.winRate}%)`:'N/A'}</td>
                          <td style={{padding:'10px 12px'}}><span style={{fontSize:10,fontWeight:600,color:p.reliable?'#16a34a':'#d97706'}}>{p.reliable?'✓ Yes':'⚠️ No'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer style={{background:N,padding:'24px 32px',textAlign:'center',marginTop:40}}>
        <div style={{fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:800,color:W,marginBottom:6}}>Cerrado Edge</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Data from Yahoo Finance · Not financial advice · Past patterns do not guarantee future results</div>
      </footer>
    </>
  );
}
