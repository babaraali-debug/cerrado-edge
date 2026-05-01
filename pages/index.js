import { useState, useMemo, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { computeConfidenceScore } from '../utils/confidenceScore';
import ConfidenceGauge from '../components/ConfidenceGauge';
import {
  saveSignal, loadAllSignals, updateSignalPrices, clearAllSignals,
  getTrackStats, formatDate, getDaysSince,
  STOP_LOSS_PCT, TAKE_PROFIT_PCT, MAX_HOLD_DAYS
} from '../utils/trackRecord';

const MIN_SAMPLE = 30;

const UNIVERSE = [
  { ticker: 'AAPL',    cat: 'Mega Cap' },
  { ticker: 'MSFT',    cat: 'Mega Cap' },
  { ticker: 'NVDA',    cat: 'Mega Cap' },
  { ticker: 'AMZN',    cat: 'Mega Cap' },
  { ticker: 'GOOGL',   cat: 'Mega Cap' },
  { ticker: 'GOOG',    cat: 'Mega Cap' },
  { ticker: 'META',    cat: 'Mega Cap' },
  { ticker: 'TSLA',    cat: 'Mega Cap' },
  { ticker: 'LLY',     cat: 'Mega Cap' },
  { ticker: 'V',       cat: 'Mega Cap' },
  { ticker: 'JPM',     cat: 'Mega Cap' },
  { ticker: 'XOM',     cat: 'Mega Cap' },
  { ticker: 'UNH',     cat: 'Mega Cap' },
  { ticker: 'MA',      cat: 'Mega Cap' },
  { ticker: 'AVGO',    cat: 'Mega Cap' },
  { ticker: 'JNJ',     cat: 'Mega Cap' },
  { ticker: 'PG',      cat: 'Mega Cap' },
  { ticker: 'HD',      cat: 'Mega Cap' },
  { ticker: 'MRK',     cat: 'Mega Cap' },
  { ticker: 'COST',    cat: 'Mega Cap' },
  { ticker: 'ABBV',    cat: 'Mega Cap' },
  { ticker: 'BAC',     cat: 'Mega Cap' },
  { ticker: 'KO',      cat: 'Mega Cap' },
  { ticker: 'PEP',     cat: 'Mega Cap' },
  { ticker: 'WMT',     cat: 'Mega Cap' },
  { ticker: 'CVX',     cat: 'Mega Cap' },
  { ticker: 'TMO',     cat: 'Mega Cap' },
  { ticker: 'ORCL',    cat: 'Mega Cap' },
  { ticker: 'MCD',     cat: 'Mega Cap' },
  { ticker: 'CRM',     cat: 'Mega Cap' },
  { ticker: 'AMD',     cat: 'Large Cap' },
  { ticker: 'NFLX',   cat: 'Large Cap' },
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
  { ticker: 'SNOW',   cat: 'Large Cap' },
  { ticker: 'PLTR',   cat: 'Large Cap' },
  { ticker: 'UBER',   cat: 'Large Cap' },
  { ticker: 'ABNB',   cat: 'Large Cap' },
  { ticker: 'SHOP',   cat: 'Large Cap' },
  { ticker: 'TTD',    cat: 'Large Cap' },
  { ticker: 'TEAM',   cat: 'Large Cap' },
  { ticker: 'ZS',     cat: 'Large Cap' },
  { ticker: 'OKTA',   cat: 'Large Cap' },
  { ticker: 'TWLO',   cat: 'Large Cap' },
  { ticker: 'DOCU',   cat: 'Large Cap' },
  { ticker: 'PINS',   cat: 'Large Cap' },
  { ticker: 'SNAP',   cat: 'Large Cap' },
  { ticker: 'RBLX',   cat: 'Large Cap' },
  { ticker: 'COIN',   cat: 'Large Cap' },
  { ticker: 'HOOD',   cat: 'Large Cap' },
  { ticker: 'ROKU',   cat: 'Large Cap' },
  { ticker: 'AMAT',   cat: 'Large Cap' },
  { ticker: 'LRCX',   cat: 'Large Cap' },
  { ticker: 'KLAC',   cat: 'Large Cap' },
  { ticker: 'MRVL',   cat: 'Large Cap' },
  { ticker: 'SMCI',   cat: 'Large Cap' },
  { ticker: 'HPE',    cat: 'Large Cap' },
  { ticker: 'DELL',   cat: 'Large Cap' },
  { ticker: 'HPQ',    cat: 'Large Cap' },
  { ticker: 'GS',     cat: 'Large Cap' },
  { ticker: 'MS',     cat: 'Large Cap' },
  { ticker: 'WFC',    cat: 'Large Cap' },
  { ticker: 'AXP',    cat: 'Large Cap' },
  { ticker: 'BLK',    cat: 'Large Cap' },
  { ticker: 'SCHW',   cat: 'Large Cap' },
  { ticker: 'COF',    cat: 'Large Cap' },
  { ticker: 'USB',    cat: 'Large Cap' },
  { ticker: 'PNC',    cat: 'Large Cap' },
  { ticker: 'PYPL',   cat: 'Large Cap' },
  { ticker: 'SQ',     cat: 'Large Cap' },
  { ticker: 'SOFI',   cat: 'Large Cap' },
  { ticker: 'AFRM',   cat: 'Large Cap' },
  { ticker: 'C',      cat: 'Large Cap' },
  { ticker: 'COP',    cat: 'Large Cap' },
  { ticker: 'EOG',    cat: 'Large Cap' },
  { ticker: 'SLB',    cat: 'Large Cap' },
  { ticker: 'OXY',    cat: 'Large Cap' },
  { ticker: 'MPC',    cat: 'Large Cap' },
  { ticker: 'PSX',    cat: 'Large Cap' },
  { ticker: 'VLO',    cat: 'Large Cap' },
  { ticker: 'HAL',    cat: 'Large Cap' },
  { ticker: 'DVN',    cat: 'Large Cap' },
  { ticker: 'PFE',    cat: 'Large Cap' },
  { ticker: 'BMY',    cat: 'Large Cap' },
  { ticker: 'GILD',   cat: 'Large Cap' },
  { ticker: 'REGN',   cat: 'Large Cap' },
  { ticker: 'VRTX',   cat: 'Large Cap' },
  { ticker: 'ISRG',   cat: 'Large Cap' },
  { ticker: 'DHR',    cat: 'Large Cap' },
  { ticker: 'SYK',    cat: 'Large Cap' },
  { ticker: 'BSX',    cat: 'Large Cap' },
  { ticker: 'MDT',    cat: 'Large Cap' },
  { ticker: 'MRNA',   cat: 'Large Cap' },
  { ticker: 'BIIB',   cat: 'Large Cap' },
  { ticker: 'CVS',    cat: 'Large Cap' },
  { ticker: 'CI',     cat: 'Large Cap' },
  { ticker: 'LOW',    cat: 'Large Cap' },
  { ticker: 'TGT',    cat: 'Large Cap' },
  { ticker: 'NKE',    cat: 'Large Cap' },
  { ticker: 'SBUX',   cat: 'Large Cap' },
  { ticker: 'DIS',    cat: 'Large Cap' },
  { ticker: 'BKNG',   cat: 'Large Cap' },
  { ticker: 'MAR',    cat: 'Large Cap' },
  { ticker: 'HLT',    cat: 'Large Cap' },
  { ticker: 'DKNG',   cat: 'Large Cap' },
  { ticker: 'DASH',   cat: 'Large Cap' },
  { ticker: 'LYFT',   cat: 'Large Cap' },
  { ticker: 'ETSY',   cat: 'Large Cap' },
  { ticker: 'EBAY',   cat: 'Large Cap' },
  { ticker: 'W',      cat: 'Large Cap' },
  { ticker: 'YUM',    cat: 'Large Cap' },
  { ticker: 'CMG',    cat: 'Large Cap' },
  { ticker: 'BA',     cat: 'Large Cap' },
  { ticker: 'CAT',    cat: 'Large Cap' },
  { ticker: 'GE',     cat: 'Large Cap' },
  { ticker: 'F',      cat: 'Large Cap' },
  { ticker: 'GM',     cat: 'Large Cap' },
  { ticker: 'RTX',    cat: 'Large Cap' },
  { ticker: 'LMT',    cat: 'Large Cap' },
  { ticker: 'NOC',    cat: 'Large Cap' },
  { ticker: 'HON',    cat: 'Large Cap' },
  { ticker: 'MMM',    cat: 'Large Cap' },
  { ticker: 'ETN',    cat: 'Large Cap' },
  { ticker: 'PH',     cat: 'Large Cap' },
  { ticker: 'AME',    cat: 'Large Cap' },
  { ticker: 'ITW',    cat: 'Large Cap' },
  { ticker: 'CARR',   cat: 'Large Cap' },
  { ticker: 'FCX',    cat: 'Large Cap' },
  { ticker: 'NEM',    cat: 'Large Cap' },
  { ticker: 'AA',     cat: 'Large Cap' },
  { ticker: 'CLF',    cat: 'Large Cap' },
  { ticker: 'NUE',    cat: 'Large Cap' },
  { ticker: 'ALB',    cat: 'Large Cap' },
  { ticker: 'MOS',    cat: 'Large Cap' },
  { ticker: 'DOCN',   cat: 'Mid Cap' },
  { ticker: 'MDB',    cat: 'Mid Cap' },
  { ticker: 'ZM',     cat: 'Mid Cap' },
  { ticker: 'UPST',   cat: 'Mid Cap' },
  { ticker: 'MARA',   cat: 'Mid Cap' },
  { ticker: 'RIOT',   cat: 'Mid Cap' },
  { ticker: 'CLSK',   cat: 'Mid Cap' },
  { ticker: 'HUT',    cat: 'Mid Cap' },
  { ticker: 'APP',    cat: 'Mid Cap' },
  { ticker: 'CELH',   cat: 'Mid Cap' },
  { ticker: 'ARWR',   cat: 'Mid Cap' },
  { ticker: 'CRSP',   cat: 'Mid Cap' },
  { ticker: 'TDOC',   cat: 'Mid Cap' },
  { ticker: 'ASAN',   cat: 'Mid Cap' },
  { ticker: 'BOX',    cat: 'Mid Cap' },
  { ticker: 'PSTG',   cat: 'Mid Cap' },
  { ticker: 'GTLB',   cat: 'Mid Cap' },
  { ticker: 'CFLT',   cat: 'Mid Cap' },
  { ticker: 'S',      cat: 'Mid Cap' },
  { ticker: 'CYBR',   cat: 'Mid Cap' },
  { ticker: 'TENB',   cat: 'Mid Cap' },
  { ticker: 'APPN',   cat: 'Mid Cap' },
  { ticker: 'DOMO',   cat: 'Mid Cap' },
  { ticker: 'ACMR',   cat: 'Mid Cap' },
  { ticker: 'SMTC',   cat: 'Mid Cap' },
  { ticker: 'GME',    cat: 'Speculative' },
  { ticker: 'AMC',    cat: 'Speculative' },
  { ticker: 'RIVN',   cat: 'Speculative' },
  { ticker: 'LCID',   cat: 'Speculative' },
  { ticker: 'NKLA',   cat: 'Speculative' },
  { ticker: 'SPCE',   cat: 'Speculative' },
  { ticker: 'JOBY',   cat: 'Speculative' },
  { ticker: 'CLOV',   cat: 'Speculative' },
  { ticker: 'BLNK',   cat: 'Speculative' },
  { ticker: 'CHPT',   cat: 'Speculative' },
  { ticker: 'PLUG',   cat: 'Speculative' },
  { ticker: 'FCEL',   cat: 'Speculative' },
  { ticker: 'RUN',    cat: 'Speculative' },
  { ticker: 'ARRY',   cat: 'Speculative' },
  { ticker: 'STEM',   cat: 'Speculative' },
  { ticker: 'IONQ',   cat: 'Speculative' },
  { ticker: 'SOUN',   cat: 'Speculative' },
  { ticker: 'BBAI',   cat: 'Speculative' },
  { ticker: 'OPEN',   cat: 'Speculative' },
  { ticker: 'HIMS',   cat: 'Speculative' },
  { ticker: 'ACHR',   cat: 'Speculative' },
  { ticker: 'XPEV',   cat: 'Speculative' },
  { ticker: 'NIO',    cat: 'Speculative' },
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
  { ticker: 'ATD.TO', cat: 'TSX' },
  { ticker: 'CP.TO',  cat: 'TSX' },
  { ticker: 'TRI.TO', cat: 'TSX' },
  { ticker: 'BCE.TO', cat: 'TSX' },
  { ticker: 'T.TO',   cat: 'TSX' },
  { ticker: 'POW.TO', cat: 'TSX' },
  { ticker: 'GWO.TO', cat: 'TSX' },
  { ticker: 'FFH.TO', cat: 'TSX' },
  { ticker: 'BAM.TO', cat: 'TSX' },
  { ticker: 'BN.TO',  cat: 'TSX' },
  { ticker: 'FTS.TO', cat: 'TSX' },
  { ticker: 'EMA.TO', cat: 'TSX' },
  { ticker: 'CSU.TO', cat: 'TSX' },
  { ticker: 'DSG.TO', cat: 'TSX' },
  { ticker: 'MG.TO',  cat: 'TSX' },
  { ticker: 'TFII.TO',cat: 'TSX' },
  { ticker: 'WSP.TO', cat: 'TSX' },
  { ticker: 'WCN.TO', cat: 'TSX' },
  { ticker: 'CCO.TO', cat: 'TSX' },
  { ticker: 'LUN.TO', cat: 'TSX' },
  { ticker: 'FM.TO',  cat: 'TSX' },
  { ticker: 'IVN.TO', cat: 'TSX' },
  { ticker: 'AGI.TO', cat: 'TSX' },
  { ticker: 'K.TO',   cat: 'TSX' },
  { ticker: 'EQX.TO', cat: 'TSX' },
  { ticker: 'OR.TO',  cat: 'TSX' },
  { ticker: 'MEG.TO', cat: 'TSX' },
  { ticker: 'VET.TO', cat: 'TSX' },
  { ticker: 'BTE.TO', cat: 'TSX' },
  { ticker: 'ARX.TO', cat: 'TSX' },
  { ticker: 'WCP.TO', cat: 'TSX' },
  { ticker: 'CPG.TO', cat: 'TSX' },
  { ticker: 'DOL.TO', cat: 'TSX' },
  { ticker: 'L.TO',   cat: 'TSX' },
  { ticker: 'MRU.TO', cat: 'TSX' },
  { ticker: 'ATZ.TO', cat: 'TSX' },
  { ticker: 'GOOS.TO',cat: 'TSX' },
  { ticker: 'QSR.TO', cat: 'TSX' },
  { ticker: 'MTY.TO', cat: 'TSX' },
  { ticker: 'TFII.TO',cat: 'TSX' },
  { ticker: 'NA.TO',  cat: 'TSX' },
  { ticker: 'EQB.TO', cat: 'TSX' },
  { ticker: 'IGM.TO', cat: 'TSX' },
  { ticker: 'ERO.TO', cat: 'TSX' },
  { ticker: 'LUN.TO', cat: 'TSX' },
  { ticker: 'OGC.TO', cat: 'TSX' },
  { ticker: 'MDA.TO', cat: 'TSX' },
  { ticker: 'LNR.TO', cat: 'TSX' },
  { ticker: 'ATD.TO', cat: 'TSX' },
  { ticker: 'LUCA.V', cat: 'TSX-V' },
  { ticker: 'ROXG.V', cat: 'TSX-V' },
  { ticker: 'FURY.V', cat: 'TSX-V' },
  { ticker: 'GCX.V',  cat: 'TSX-V' },
  { ticker: 'MAI.V',  cat: 'TSX-V' },
  { ticker: 'GGD.V',  cat: 'TSX-V' },
];

const CATEGORIES    = ['All','Mega Cap','Large Cap','Mid Cap','Speculative','TSX','TSX-V'];
const GRADES        = ['A','B','C','D','F'];
const TOP_N_OPTIONS = [5,10,20,50,999];
const CAT_COLORS    = {'Mega Cap':'#7c3aed','Large Cap':'#1d4ed8','Mid Cap':'#0369a1','Speculative':'#dc2626','TSX':'#b45309','TSX-V':'#166634'};
const GRADE_COLORS  = {A:'#00C896',B:'#7BD47A',C:'#F4C542',D:'#F4874B',F:'#E05252'};

const PATTERN_PLAIN = {
  'Gap Down 3%+':        'Stock dropped hard today — history says it often bounces back',
  '3 Red Days Streak':   'Fell 3 days in a row — could be oversold and due for a bounce',
  'Volume Spike No Move':'Huge trading activity, price barely moved — something is brewing',
  '3 Green Days Streak': 'Rose 3 days straight — watch for continuation or exhaustion',
  'Inside Day Breakout': 'Stock coiling tight — a big move is likely coming soon',
  'Intraday Reversal':   'Hit a high then sold off hard — potential reversal signal',
};

function signalExpiry(bestDay){if(!bestDay)return'unclear';if(bestDay.day===1)return'Exit tomorrow';return`Exit in ${bestDay.day} days`;}
function gradeOrder(g){return{A:0,B:1,C:2,D:3,F:4}[g]??5;}

async function fetchMarketContext(){
  try{
    const res=await fetch('/api/stock?ticker=SPY&days=30');
    const data=await res.json();
    if(!data['Time Series (Daily)'])return{regime:'NEUTRAL',spyChange:0};
    const dates=Object.keys(data['Time Series (Daily)']).sort((a,b)=>b.localeCompare(a));
    const closes=dates.slice(0,21).map(d=>parseFloat(data['Time Series (Daily)'][d]['4. close']));
    const current=closes[0],ma20=closes.reduce((a,b)=>a+b,0)/closes.length;
    const spyChange=((closes[0]-closes[1])/closes[1]*100);
    const diff=((current-ma20)/ma20)*100;
    let regime='NEUTRAL';
    if(diff>0.5)regime='BULLISH';
    if(diff<-0.5)regime='BEARISH';
    return{regime,spyChange:parseFloat(spyChange.toFixed(2))};
  }catch(e){return{regime:'NEUTRAL',spyChange:0};}
}

function calcStats(ts,numDays){
  const dates=Object.keys(ts).sort((a,b)=>b.localeCompare(a)).slice(0,numDays);
  if(dates.length<10)throw new Error('Not enough data');
  const closes=dates.map(d=>parseFloat(ts[d]['4. close']));
  const opens=dates.map(d=>parseFloat(ts[d]['1. open']));
  const highs=dates.map(d=>parseFloat(ts[d]['2. high']));
  const lows=dates.map(d=>parseFloat(ts[d]['3. low']));
  const volumes=dates.map(d=>parseFloat(ts[d]['5. volume']));
  const changes=[];
  for(let i=0;i<closes.length-1;i++)changes.push((closes[i]-closes[i+1])/closes[i+1]*100);
  const intradayRanges=opens.map((o,i)=>(highs[i]-lows[i])/o*100);
  const avgChange=changes.reduce((a,b)=>a+b,0)/changes.length;
  const avgAbsChange=changes.map(Math.abs).reduce((a,b)=>a+b,0)/changes.length;
  const maxGain=Math.max(...changes),maxLoss=Math.min(...changes);
  const avgVol=volumes.reduce((a,b)=>a+b,0)/volumes.length;
  const avgIntraday=intradayRanges.reduce((a,b)=>a+b,0)/intradayRanges.length;
  const maxIntraday=Math.max(...intradayRanges);
  const mean=avgChange,variance=changes.reduce((a,b)=>a+(b-mean)**2,0)/changes.length;
  const stdDev=Math.sqrt(variance),annualVol=stdDev*Math.sqrt(252);
  const buckets={'Down 3%+':0,'Down 1-3%':0,'Flat ±1%':0,'Up 1-3%':0,'Up 3%+':0};
  changes.forEach(c=>{if(c<=-3)buckets['Down 3%+']++;else if(c<=-1)buckets['Down 1-3%']++;else if(c<1)buckets['Flat ±1%']++;else if(c<3)buckets['Up 1-3%']++;else buckets['Up 3%+']++;});
  const randomWins=changes.slice(0,-1).filter(c=>c>0).length;
  const randomBaseline=Math.round(randomWins/(changes.length-1)*100);
  const vol20avg=volumes.slice(0,20).reduce((a,b)=>a+b,0)/Math.min(20,volumes.length);
  const relativeVolume=parseFloat((volumes[0]/vol20avg).toFixed(2));
  return{closes,opens,highs,lows,volumes,changes,avgChange,avgAbsChange,maxGain,maxLoss,avgVol,avgIntraday,maxIntraday,stdDev,annualVol,buckets,dates,intradayRanges,randomBaseline,relativeVolume};
}

function calcDecay(si,changes,horizons=[1,2,3,5,10]){
  return horizons.map(h=>{
    const valid=si.filter(i=>i-h>=0);
    if(valid.length<3)return{day:h,winRate:null,instances:0};
    const wins=valid.filter(i=>changes.slice(i-h,i).reduce((a,c)=>a+c,0)>0).length;
    return{day:h,winRate:Math.round(wins/valid.length*100),instances:valid.length};
  });
}

function calcKelly(wr,aw,al){const w=wr/100,l=1-w,ratio=Math.abs(parseFloat(aw))/Math.abs(parseFloat(al));return Math.max(0,Math.min(w-(l/ratio),0.25));}

function analyzePatterns(stats){
  const{closes,changes,volumes,avgVol,stdDev,highs,lows,randomBaseline}=stats;
  const patterns=[];
  function addPattern(name,si,wins,wA,lA,desc){
    const instances=si.length,reliable=instances>=MIN_SAMPLE;
    const wr=instances>0?Math.round(wins/instances*100):0;
    const aw=wA.length?(wA.reduce((a,b)=>a+b,0)/wA.length).toFixed(1):'0';
    const al=lA.length?(lA.reduce((a,b)=>a+b,0)/lA.length).toFixed(1):'0';
    const ev=((wr/100)*parseFloat(aw)-((100-wr)/100)*parseFloat(al)).toFixed(2);
    const edgeVsRandom=wr-randomBaseline,kelly=calcKelly(wr,aw,al);
    const decay=calcDecay(si,changes);
    const bestDay=decay.filter(d=>d.winRate!==null).reduce((best,d)=>d.winRate>(best?.winRate||0)?d:best,null);
    patterns.push({name,instances,winRate:wr,avgWin:'+'+aw+'%',avgLoss:'-'+al+'%',ev:parseFloat(ev),evStr:(ev>=0?'+':'')+ev+'%',signal:wr>=60?'green':wr>=50?'yellow':'red',desc,reliable,edgeVsRandom,kelly,rawAvgWin:aw,rawAvgLoss:al,decay,bestDay});
  }
  let si=[],w=0,wA=[],lA=[];
  for(let i=1;i<changes.length-1;i++)if(changes[i]<=-3){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}
  addPattern('Gap Down 3%+',si,w,wA,lA,'Single-day drop of 3%+');
  si=[];w=0;wA=[];lA=[];
  for(let i=2;i<changes.length-1;i++)if(changes[i]<0&&changes[i+1]<0&&changes[i+2]<0){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}
  addPattern('3 Red Days Streak',si,w,wA,lA,'Three consecutive down days');
  si=[];w=0;wA=[];lA=[];
  for(let i=1;i<changes.length-1;i++)if(volumes[i]>avgVol*1.8&&Math.abs(changes[i])<0.8){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}
  addPattern('Volume Spike No Move',si,w,wA,lA,'High volume flat price');
  si=[];w=0;wA=[];lA=[];
  for(let i=2;i<changes.length-1;i++)if(changes[i]>0&&changes[i+1]>0&&changes[i+2]>0){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}
  addPattern('3 Green Days Streak',si,w,wA,lA,'Three consecutive up days');
  si=[];w=0;wA=[];lA=[];
  for(let i=1;i<highs.length-1;i++)if(highs[i]<highs[i+1]&&lows[i]>lows[i+1]){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}
  addPattern('Inside Day Breakout',si,w,wA,lA,'Range inside prior day');
  si=[];w=0;wA=[];lA=[];
  for(let i=1;i<closes.length-1;i++){const drop=highs[i]>0?(highs[i]-closes[i])/highs[i]*100:0;if(drop>3&&changes[i]<0){si.push(i);const f=changes[i-1];f>0?(w++,wA.push(Math.abs(f))):lA.push(Math.abs(f));}}
  addPattern('Intraday Reversal',si,w,wA,lA,'Hit high then reversed 3%+');
  patterns.sort((a,b)=>b.ev-a.ev);
  let activeSignal=null;
  const last3=changes.slice(0,3),last1=changes[0],lastVol=volumes[0],price=closes[0];
  const isInsideDay=highs[0]<highs[1]&&lows[0]>lows[1];
  const rel=patterns.filter(p=>p.reliable);
  if(last3.every(c=>c<0)&&rel.find(p=>p.name==='3 Red Days Streak')){const pat=rel.find(p=>p.name==='3 Red Days Streak');activeSignal={...pat,direction:'BULLISH',entry:price.toFixed(2),stopLoss:(price*0.97).toFixed(2),target:(price*1.05).toFixed(2),rr:'1:1.67',maxAdverse:'-3.0%'};}
  else if(last1<=-3&&rel.find(p=>p.name==='Gap Down 3%+')){const pat=rel.find(p=>p.name==='Gap Down 3%+');activeSignal={...pat,direction:'BULLISH',entry:price.toFixed(2),stopLoss:(price*0.97).toFixed(2),target:(price*1.05).toFixed(2),rr:'1:1.67',maxAdverse:'-3.0%'};}
  else if(isInsideDay&&rel.find(p=>p.name==='Inside Day Breakout')){const pat=rel.find(p=>p.name==='Inside Day Breakout');activeSignal={...pat,direction:'WATCH',entry:price.toFixed(2),stopLoss:(price*0.97).toFixed(2),target:(price*1.05).toFixed(2),rr:'1:1.67',maxAdverse:'-3.0%'};}
  else if(lastVol>avgVol*1.8&&Math.abs(last1)<0.8&&rel.find(p=>p.name==='Volume Spike No Move')){const pat=rel.find(p=>p.name==='Volume Spike No Move');activeSignal={...pat,direction:'WATCH',entry:price.toFixed(2),stopLoss:(price*0.97).toFixed(2),target:(price*1.05).toFixed(2),rr:'1:1.67',maxAdverse:'-3.0%'};}
  return{patterns,activeSignal,randomBaseline};
}

function fmtVol(v){if(v>=1e9)return(v/1e9).toFixed(1)+'B';if(v>=1e6)return(v/1e6).toFixed(1)+'M';if(v>=1e3)return(v/1e3).toFixed(0)+'K';return v.toFixed(0);}
function fmtMoney(n){if(n>=1e6)return'$'+(n/1e6).toFixed(2)+'M';if(n>=1e3)return'$'+(n/1e3).toFixed(1)+'K';return'$'+n.toFixed(0);}

function getConfidence(wr,rb,inst,kelly,decay,marketRegime,earningsDays,relativeVolume,direction){
  const ds=decay&&decay.length>=2?(decay[decay.length-1].winRate-decay[0].winRate)/9:null;
  return computeConfidenceScore({winRate:wr/100,randomWinRate:rb/100,sampleSize:inst,kellyFraction:kelly,decaySlope:ds,marketRegime,earningsDays,relativeVolume,signalDirection:direction});
}

function RegimeBanner({regime,spyChange}){
  if(!regime)return null;
  const configs={BULLISH:{bg:'#f0fdf4',border:'#bbf7d0',color:'#16a34a',icon:'↑',text:'Market is bullish — mean reversion signals are stronger than usual'},BEARISH:{bg:'#fef2f2',border:'#fecaca',color:'#dc2626',icon:'↓',text:'Market is bearish — treat all bullish signals with extra caution'},NEUTRAL:{bg:'#fdf3d0',border:'#f5c84244',color:'#92400e',icon:'→',text:'Market is sideways — signals rely on stock-specific edge'}};
  const c=configs[regime]||configs.NEUTRAL;
  return(<div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:'10px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}><div style={{fontSize:20,color:c.color,fontWeight:800}}>{c.icon}</div><div><div style={{fontSize:11,fontWeight:700,color:c.color,marginBottom:2}}>MARKET REGIME: {regime}</div><div style={{fontSize:12,color:c.color}}>{c.text} &nbsp;·&nbsp; SPY {spyChange>=0?'+':''}{spyChange}% today</div></div></div>);
}

function DecayCurve({decay,randomBaseline}){
  const valid=decay.filter(d=>d.winRate!==null);
  const maxWR=Math.max(...valid.map(d=>d.winRate),randomBaseline+5);
  const minWR=Math.min(...valid.map(d=>d.winRate),randomBaseline-5);
  const range=maxWR-minWR||10;
  return(<div style={{marginTop:10}}><div style={{fontSize:10,color:'#6b7ab5',letterSpacing:1,marginBottom:8,fontWeight:500}}>SIGNAL STRENGTH BY DAY</div><div style={{display:'flex',gap:6,alignItems:'flex-end',height:60,marginBottom:6}}>{decay.map((d,i)=>{if(d.winRate===null)return(<div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}><div style={{fontSize:9,color:'#cbd5e0'}}>N/A</div><div style={{width:'100%',height:4,background:'#e2e8f0',borderRadius:2}}/><div style={{fontSize:9,color:'#a0aec0'}}>D{d.day}</div></div>);const pct=Math.max(0,Math.min(100,((d.winRate-minWR)/range)*100));const col=d.winRate>=60?'#16a34a':d.winRate>=50?'#d97706':'#dc2626';const isBest=valid.every(x=>d.winRate>=x.winRate);return(<div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}><div style={{fontSize:9,color:col,fontWeight:isBest?700:400}}>{d.winRate}%{isBest?'★':''}</div><div style={{width:'100%',background:'#f0f4ff',borderRadius:3,height:40,display:'flex',alignItems:'flex-end'}}><div style={{width:'100%',height:Math.max(4,pct*0.4)+'px',background:col,borderRadius:3,opacity:0.8}}/></div><div style={{fontSize:9,color:'#a0aec0'}}>D{d.day}</div></div>);})}<div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}><div style={{fontSize:9,color:'#94a3b8'}}>{randomBaseline}%</div><div style={{width:'100%',background:'#f0f4ff',borderRadius:3,height:40,display:'flex',alignItems:'flex-end'}}><div style={{width:'100%',height:Math.max(4,((randomBaseline-minWR)/range)*40)+'px',background:'#94a3b8',borderRadius:3,opacity:0.5}}/></div><div style={{fontSize:9,color:'#a0aec0'}}>RAND</div></div></div>{valid.length>0&&(()=>{const best=valid.reduce((b,d)=>d.winRate>b.winRate?d:b);const worst=valid.reduce((b,d)=>d.winRate<b.winRate?d:b);return(<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><div style={{fontSize:10,color:'#16a34a',background:'#f0fdf4',border:'1px solid #bbf7d0',padding:'3px 8px',borderRadius:6,fontWeight:600}}>★ Best exit: Day {best.day} ({best.winRate}% win rate)</div><div style={{fontSize:10,color:'#dc2626',background:'#fef2f2',border:'1px solid #fecaca',padding:'3px 8px',borderRadius:6}}>Weakest: Day {worst.day} ({worst.winRate}% win rate)</div></div>);})()}</div>);
}

function HeroSignal({r,rank,onDive}){
  const rankLabels=['#1 Best Setup Today','#2 Runner Up','#3 Worth Watching'];
  const rankColors=['#00C896','#7BD47A','#F4C542'];
  const col=rankColors[rank]||'#F4C542';
  const changePos=parseFloat(r.change)>=0;
  const positionPct=(r.activeSignal.kelly*50).toFixed(1);
  return(<div style={{background:'linear-gradient(135deg, #0f1117 0%, #161b27 100%)',border:`1px solid ${col}33`,borderRadius:16,padding:'20px 22px',boxShadow:`0 0 32px ${col}15`,flex:1,minWidth:240}}>
    <div style={{fontSize:10,color:col,fontWeight:700,letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>{rankLabels[rank]}</div>
    <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:4}}><span style={{fontFamily:'Syne,sans-serif',fontSize:24,fontWeight:800,color:'#fff'}}>{r.ticker}</span><span style={{fontSize:14,fontWeight:600,color:changePos?'#4ade80':'#f87171'}}>{changePos?'+':''}{r.change}%</span></div>
    <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:12}}>${r.price}</div>
    {r.confidence.contextNote&&(<div style={{fontSize:10,color:'rgba(255,255,255,0.55)',background:'rgba(255,255,255,0.06)',borderRadius:6,padding:'6px 10px',marginBottom:12,lineHeight:1.5}}>{r.confidence.contextNote}</div>)}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
      {[
        {label:'Win probability',val:r.activeSignal.winRate+'%',col:r.activeSignal.winRate>=60?'#4ade80':'#fbbf24'},
        {label:'Beats coin flip by',val:(r.activeSignal.edgeVsRandom>0?'+':'')+r.activeSignal.edgeVsRandom+'%',col:r.activeSignal.edgeVsRandom>0?'#4ade80':'#f87171'},
        {label:'Suggested position',val:positionPct+'% of portfolio',col:'#a5f3fc'},
        {label:'Stop loss / Target',val:`-${Math.abs(STOP_LOSS_PCT)}% / +${TAKE_PROFIT_PCT}%`,col:'#fcd34d'},
      ].map(item=>(<div key={item.label} style={{background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:9,color:'rgba(255,255,255,0.35)',letterSpacing:1,marginBottom:4,textTransform:'uppercase'}}>{item.label}</div><div style={{fontSize:13,fontWeight:700,color:item.col}}>{item.val}</div></div>))}
    </div>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
      <div style={{width:36,height:36,borderRadius:8,border:`2px solid ${r.confidence.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:r.confidence.color,fontFamily:'Syne,sans-serif'}}>{r.confidence.grade}</div>
      <div><div style={{fontSize:12,color:r.confidence.color,fontWeight:600}}>{r.confidence.label}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>{r.confidence.score}/100 confidence</div></div>
    </div>
    <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:14,borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:12}}>{PATTERN_PLAIN[r.activeSignal.name]||r.activeSignal.desc}</div>
    {/* Hard rules reminder */}
    <div style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'8px 12px',marginBottom:14,fontSize:10,color:'rgba(255,255,255,0.4)',lineHeight:1.6}}>
      Rules: Enter at market open · Stop loss -{Math.abs(STOP_LOSS_PCT)}% · Take profit +{TAKE_PROFIT_PCT}% · Max hold {MAX_HOLD_DAYS} days
    </div>
    <button onClick={()=>onDive(r.ticker)} style={{width:'100%',background:col,border:'none',borderRadius:10,padding:'10px',color:'#0f1f5c',fontSize:11,fontWeight:800,fontFamily:'Syne,sans-serif',cursor:'pointer',letterSpacing:1}}>↗ FULL ANALYSIS</button>
  </div>);
}

// ── Session 12: Enhanced Track Record Tab ─────────────────────────────────────
function TrackRecordTab({signals,onClear,updating}){
  const stats=getTrackStats(signals);
  const sorted=[...signals].sort((a,b)=>b.timestamp-a.timestamp);

  if(signals.length===0)return(<div style={{textAlign:'center',padding:'60px 20px'}}><div style={{fontSize:40,opacity:0.08,marginBottom:16}}>📊</div><div style={{fontSize:15,fontWeight:600,color:'#0a1540',marginBottom:8}}>No signals tracked yet</div><div style={{fontSize:12,color:'#6b7ab5',lineHeight:1.8,maxWidth:400,margin:'0 auto'}}>Run a scan and signals will be automatically saved here.<br/>Every trade has a -3% stop loss and +5% take profit applied automatically.</div></div>);

  return(<div className="fade">

    {/* Rules reminder */}
    <div style={{background:'#f0f4ff',border:'1px solid #dde3f5',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:12,color:'#0a1540'}}>
      <strong>Trading rules applied to every signal:</strong> Enter at market open · Stop loss -{Math.abs(STOP_LOSS_PCT)}% · Take profit +{TAKE_PROFIT_PCT}% · Maximum hold {MAX_HOLD_DAYS} days · Results are comparable and consistent.
    </div>

    {/* Summary stats — 8 metrics */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginBottom:20}}>
      {[
        {label:'Signals tracked',val:stats.total,sub:`${stats.open} still open`,col:'#0f1f5c'},
        {label:'Closed trades',val:stats.closed,sub:`${stats.wins}W · ${stats.losses}L`,col:'#0f1f5c'},
        {label:'Actual win rate',val:stats.winRate!==null?stats.winRate+'%':'—',sub:stats.avgPredictedWR?`Predicted: ${stats.avgPredictedWR}%`:'Not enough data',col:stats.winRate>=60?'#16a34a':stats.winRate>=50?'#d97706':'#dc2626'},
        {label:'Avg return',val:stats.avgReturn!==null?(stats.avgReturn>=0?'+':'')+stats.avgReturn+'%':'—',sub:'Per closed trade',col:stats.avgReturn>=0?'#16a34a':'#dc2626'},
        {label:'Max drawdown',val:stats.maxDrawdown!==null?stats.maxDrawdown.toFixed(1)+'%':'—',sub:'Worst single loss',col:'#dc2626'},
        {label:'Best trade',val:stats.bestTrade!==null?'+'+stats.bestTrade.toFixed(1)+'%':'—',sub:'Best single win',col:'#16a34a'},
        {label:'Avg holding',val:stats.avgHoldingDays!==null?stats.avgHoldingDays+'d':'—',sub:'Days per trade',col:'#0f1f5c'},
        {label:'Open P&L',val:stats.openUnrealisedAvg!==null?(stats.openUnrealisedAvg>=0?'+':'')+stats.openUnrealisedAvg+'%':'—',sub:`${stats.openPositive||0}↑ ${stats.openNegative||0}↓ unrealised`,col:stats.openUnrealisedAvg>=0?'#16a34a':'#dc2626'},
      ].map((c,i)=>(<div key={i} style={{background:'#fff',borderRadius:14,border:'1px solid #dde3f5',padding:'12px 14px'}}><div style={{fontSize:10,color:'#6b7ab5',marginBottom:5,fontWeight:500}}>{c.label}</div><div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,color:c.col}}>{c.val}</div><div style={{fontSize:9,color:'#6b7ab5',marginTop:2}}>{c.sub}</div></div>))}
    </div>

    {/* Performance by Grade */}
    {stats.closed>=3&&(
      <div style={{background:'#fff',borderRadius:14,border:'1px solid #dde3f5',padding:'18px 20px',marginBottom:16}}>
        <div style={{fontSize:11,color:'#6b7ab5',letterSpacing:2,textTransform:'uppercase',fontWeight:600,marginBottom:14}}>Performance by Grade</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {['A','B','C','D','F'].map(g=>{const gs=stats.byGrade[g];if(gs.total===0)return null;const col=GRADE_COLORS[g];return(<div key={g} style={{background:col+'12',border:`1px solid ${col}33`,borderRadius:10,padding:'12px 16px',minWidth:100,textAlign:'center'}}><div style={{fontSize:18,fontWeight:800,color:col,fontFamily:'Syne,sans-serif',marginBottom:4}}>{g}</div><div style={{fontSize:13,fontWeight:700,color:gs.winRate>=60?'#16a34a':gs.winRate>=50?'#d97706':'#dc2626'}}>{gs.winRate!==null?gs.winRate+'%':'—'}</div><div style={{fontSize:10,color:'#6b7ab5',marginTop:2}}>{gs.total} trade{gs.total!==1?'s':''}</div>{gs.avgReturn!==null&&<div style={{fontSize:10,fontWeight:600,color:gs.avgReturn>=0?'#16a34a':'#dc2626',marginTop:2}}>{gs.avgReturn>=0?'+':''}{gs.avgReturn}% avg</div>}</div>);})}
        </div>
      </div>
    )}

    {/* Performance by Pattern */}
    {stats.closed>=5&&(
      <div style={{background:'#fff',borderRadius:14,border:'1px solid #dde3f5',padding:'18px 20px',marginBottom:16}}>
        <div style={{fontSize:11,color:'#6b7ab5',letterSpacing:2,textTransform:'uppercase',fontWeight:600,marginBottom:14}}>Performance by Pattern</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr style={{borderBottom:'2px solid #f0f4ff'}}>{['Pattern','Trades','Win rate','Avg return'].map(h=>(<th key={h} style={{fontSize:9,color:'#6b7ab5',letterSpacing:1,textTransform:'uppercase',padding:'6px 10px',textAlign:'left',fontWeight:600}}>{h}</th>))}</tr></thead>
            <tbody>
              {Object.entries(stats.byPattern||{}).filter(([,v])=>v.total>0).sort((a,b)=>(b[1].winRate||0)-(a[1].winRate||0)).map(([pattern,v])=>(
                <tr key={pattern} style={{borderBottom:'1px solid #f0f4ff'}}>
                  <td style={{padding:'8px 10px',color:'#0a1540',fontWeight:500}}>{pattern}</td>
                  <td style={{padding:'8px 10px',color:'#6b7ab5'}}>{v.total}</td>
                  <td style={{padding:'8px 10px',color:v.winRate>=60?'#16a34a':v.winRate>=50?'#d97706':'#dc2626',fontWeight:600}}>{v.winRate!==null?v.winRate+'%':'—'}</td>
                  <td style={{padding:'8px 10px',color:v.avgReturn>=0?'#16a34a':'#dc2626',fontWeight:600}}>{v.avgReturn!==null?(v.avgReturn>=0?'+':'')+v.avgReturn+'%':'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Signal Log */}
    <div style={{fontSize:11,color:'#6b7ab5',letterSpacing:2,textTransform:'uppercase',fontWeight:500,marginBottom:10}}>
      Signal Log {updating&&<span style={{fontSize:10,color:'#f5c842',marginLeft:8,animation:'scanpulse 1.5s ease infinite'}}>● Updating prices...</span>}
    </div>
    <div style={{background:'#fff',borderRadius:14,border:'1px solid #dde3f5',overflowX:'auto',marginBottom:16}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{borderBottom:'2px solid #f0f4ff'}}>{['Date','Ticker','Pattern','Grade','Entry','Current','Return','Outcome','Days'].map(h=>(<th key={h} style={{fontSize:9,color:'#6b7ab5',letterSpacing:1,textTransform:'uppercase',padding:'10px 12px',textAlign:'left',fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>))}</tr></thead>
        <tbody>
          {sorted.map((s,i)=>{
            const outcomeCol=s.outcome==='WIN'?'#16a34a':s.outcome==='LOSS'?'#dc2626':'#d97706';
            const outcomeBg=s.outcome==='WIN'?'#f0fdf4':s.outcome==='LOSS'?'#fef2f2':'#fffbeb';
            const gradeCol=GRADE_COLORS[s.grade]||'#6b7ab5';
            const retCol=s.returnPct===null?'#6b7ab5':s.returnPct>=0?'#16a34a':'#dc2626';
            return(<tr key={s.id} style={{borderBottom:'1px solid #f0f4ff'}}>
              <td style={{padding:'10px 12px',color:'#6b7ab5',whiteSpace:'nowrap'}}>{formatDate(s.date)}</td>
              <td style={{padding:'10px 12px',fontWeight:700,color:'#0a1540',fontFamily:'Syne,sans-serif'}}>{s.ticker}</td>
              <td style={{padding:'10px 12px',color:'#6b7ab5',fontSize:11}}>{s.pattern}</td>
              <td style={{padding:'10px 12px'}}><span style={{fontSize:12,fontWeight:800,color:gradeCol,background:gradeCol+'18',border:`1px solid ${gradeCol}44`,borderRadius:6,padding:'2px 8px'}}>{s.grade}</span></td>
              <td style={{padding:'10px 12px',color:'#0a1540',fontWeight:500}}>${s.entryPrice?.toFixed(2)}</td>
              <td style={{padding:'10px 12px',color:'#0a1540'}}>{s.currentPrice?'$'+s.currentPrice.toFixed(2):'—'}</td>
              <td style={{padding:'10px 12px',fontWeight:700,color:retCol}}>{s.returnPct!==null?(s.returnPct>=0?'+':'')+s.returnPct+'%':'—'}</td>
              <td style={{padding:'10px 12px'}}><span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:10,background:outcomeBg,color:outcomeCol,border:`1px solid ${outcomeCol}33`}}>{s.outcome||'OPEN'}</span></td>
              <td style={{padding:'10px 12px',color:'#6b7ab5'}}>{getDaysSince(s.date)}d</td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>
    <div style={{display:'flex',justifyContent:'flex-end'}}>
      <button onClick={onClear} style={{background:'none',border:'1px solid #fecaca',borderRadius:8,padding:'6px 14px',color:'#dc2626',fontSize:11,cursor:'pointer'}}>Clear all records</button>
    </div>
  </div>);
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
  const [scanning,setScanning]=useState(false);
  const [scanProgress,setScanProgress]=useState(0);
  const [scanStatus,setScanStatus]=useState('');
  const [scanResults,setScanResults]=useState([]);
  const [expandedScan,setExpandedScan]=useState(null);
  const [filterGrades,setFilterGrades]=useState(['A','B','C']);
  const [filterDirection,setFilterDirection]=useState('All');
  const [filterCategory,setFilterCategory]=useState('All');
  const [filterTopN,setFilterTopN]=useState(5); // DEFAULT TO 5
  const [trackedSignals,setTrackedSignals]=useState([]);
  const [updatingPrices,setUpdatingPrices]=useState(false);
  const [marketContext,setMarketContext]=useState({regime:null,spyChange:0});
  const [contextLoaded,setContextLoaded]=useState(false);
  const [showAllSignals,setShowAllSignals]=useState(false);

  useEffect(()=>{
    const signals=loadAllSignals();
    setTrackedSignals(signals);
    if(signals.length>0)autoUpdatePrices(signals);
    fetchMarketContext().then(ctx=>{setMarketContext(ctx);setContextLoaded(true);});
  },[]);

  const autoUpdatePrices=useCallback(async(signals)=>{
    const openSignals=signals.filter(s=>s.outcome==='OPEN'||s.outcome===null);
    if(openSignals.length===0)return;
    setUpdatingPrices(true);
    const updates=[];
    const uniqueTickers=[...new Set(openSignals.map(s=>s.ticker))];
    for(const t of uniqueTickers){
      try{
        const res=await fetch(`/api/stock?ticker=${t}&days=5`);
        const data=await res.json();
        if(data['Time Series (Daily)']){
          const latestDate=Object.keys(data['Time Series (Daily)']).sort((a,b)=>b.localeCompare(a))[0];
          const currentPrice=parseFloat(data['Time Series (Daily)'][latestDate]['4. close']);
          openSignals.filter(s=>s.ticker===t).forEach(s=>{updates.push({id:s.id,currentPrice});});
        }
      }catch(e){}
      await new Promise(r=>setTimeout(r,80));
    }
    if(updates.length>0){const updated=updateSignalPrices(updates);setTrackedSignals(updated);}
    setUpdatingPrices(false);
  },[]);

  const top3=useMemo(()=>{
    if(scanResults.length===0)return[];
    return[...scanResults].sort((a,b)=>{const gd=gradeOrder(a.confidence.grade)-gradeOrder(b.confidence.grade);return gd!==0?gd:b.confidence.score-a.confidence.score;}).slice(0,3);
  },[scanResults]);

  const top5=useMemo(()=>{
    if(scanResults.length===0)return[];
    return[...scanResults].sort((a,b)=>{const gd=gradeOrder(a.confidence.grade)-gradeOrder(b.confidence.grade);return gd!==0?gd:b.confidence.score-a.confidence.score;}).slice(0,5);
  },[scanResults]);

  const filteredResults=useMemo(()=>{
    let res=[...scanResults];
    if(filterCategory!=='All')res=res.filter(r=>r.category===filterCategory);
    if(filterGrades.length>0)res=res.filter(r=>filterGrades.includes(r.confidence.grade));
    if(filterDirection!=='All')res=res.filter(r=>r.activeSignal.direction===filterDirection);
    res.sort((a,b)=>{const gd=gradeOrder(a.confidence.grade)-gradeOrder(b.confidence.grade);return gd!==0?gd:b.confidence.score-a.confidence.score;});
    return filterTopN===999?res:res.slice(0,filterTopN);
  },[scanResults,filterGrades,filterDirection,filterCategory,filterTopN]);

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

  const diveInto=(t)=>{setTicker(t);setMode('single');run(t);};

  const runScan=async()=>{
    setScanning(true);setScanResults([]);setScanProgress(0);setExpandedScan(null);setShowAllSignals(false);
    const ctx=await fetchMarketContext();
    setMarketContext(ctx);
    const hits=[];
    for(let i=0;i<UNIVERSE.length;i++){
      const{ticker:t,cat}=UNIVERSE[i];
      setScanStatus(`Scanning ${t}... (${i+1}/${UNIVERSE.length})`);
      setScanProgress(Math.round((i/UNIVERSE.length)*100));
      try{
        const res=await fetch(`/api/stock?ticker=${t}&days=500`);
        const data=await res.json();
        if(data.error||!data['Time Series (Daily)'])continue;
        const stats=calcStats(data['Time Series (Daily)'],500);
        const{patterns,activeSignal,randomBaseline}=analyzePatterns(stats);
        if(activeSignal){
          const confidence=getConfidence(activeSignal.winRate,randomBaseline,activeSignal.instances,activeSignal.kelly,activeSignal.decay,ctx.regime,null,stats.relativeVolume,activeSignal.direction);
          hits.push({ticker:t,category:cat,price:stats.closes[0].toFixed(2),change:stats.changes[0].toFixed(2),activeSignal,patterns,randomBaseline,stats,confidence,plainDesc:PATTERN_PLAIN[activeSignal.name]||activeSignal.desc,relativeVolume:stats.relativeVolume});
          saveSignal({ticker:t,pattern:activeSignal.name,grade:confidence.grade,score:confidence.score,direction:activeSignal.direction,entryPrice:activeSignal.entry,stopLoss:activeSignal.stopLoss,target:activeSignal.target,winRate:activeSignal.winRate,edgeVsRandom:activeSignal.edgeVsRandom,bestExitDay:activeSignal.bestDay?.day||5,category:cat});
        }
      }catch(e){}
      await new Promise(r=>setTimeout(r,100));
    }
    hits.sort((a,b)=>{const gd=gradeOrder(a.confidence.grade)-gradeOrder(b.confidence.grade);return gd!==0?gd:b.confidence.score-a.confidence.score;});
    setScanResults(hits);setScanProgress(100);setScanStatus('');setScanning(false);
    setTrackedSignals(loadAllSignals());
  };

  const handleClearRecords=()=>{if(window.confirm('Clear all tracked signals? This cannot be undone.')){clearAllSignals();setTrackedSignals([]);}};
  const toggleGrade=g=>setFilterGrades(prev=>prev.includes(g)?prev.filter(x=>x!==g):[...prev,g]);

  const portfolioVal=parseFloat(portfolio.replace(/[^0-9.]/g,''))||0;
  const s=result?.stats,sig=result?.activeSignal;
  const sigCol=sig?.direction==='BULLISH'?'#16a34a':sig?.direction==='BEARISH'?'#dc2626':'#d97706';
  const sigBg=sig?.direction==='BULLISH'?'#f0fdf4':sig?.direction==='BEARISH'?'#fef2f2':'#fffbeb';
  const kellyPct=sig?.kelly||0;
  const trackedCount=trackedSignals.length;

  const volBadge=(rv)=>{
    if(!rv)return null;
    if(rv>=1.5)return{text:`${rv.toFixed(1)}x volume`,col:'#16a34a',bg:'#f0fdf4',border:'#bbf7d0'};
    if(rv<0.7)return{text:'Low volume',col:'#d97706',bg:'#fffbeb',border:'#f5c84266'};
    return null;
  };

  // Signals to show in the list
  const displaySignals = showAllSignals ? filteredResults : top5;

  return(
    <>
      <Head>
        <title>Cerrado Edge — Daily Trade Ideas With Quantified Edge</title>
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
        .scan-card{cursor:pointer;transition:box-shadow 0.2s;}.scan-card:hover{box-shadow:0 4px 20px rgba(15,31,92,0.1);}
        .chip{border:none;border-radius:8px;padding:5px 12px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:'Inter',sans-serif;}
      `}</style>

      <nav style={{background:N,padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:60,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 20px rgba(15,31,92,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,background:G,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:N,fontWeight:800,fontFamily:'Syne,sans-serif'}}>C</div>
          <span style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,color:W}}>Cerrado Edge</span>
        </div>
        <div style={{display:'flex',gap:4}}>
          {[{id:'scanner',label:'◎ Scanner'},{id:'single',label:'↗ Deep Dive'},{id:'track',label:`📊 Track Record${trackedCount>0?' ('+trackedCount+')':''}`}].map(tab=>(<button key={tab.id} onClick={()=>setMode(tab.id)} style={{background:mode===tab.id?'rgba(245,200,66,0.15)':'none',border:'none',padding:'6px 14px',borderRadius:6,color:mode===tab.id?G:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:mode===tab.id?600:400,cursor:'pointer'}}>{tab.label}</button>))}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {contextLoaded&&marketContext.regime&&(<div style={{fontSize:9,fontWeight:700,padding:'3px 10px',borderRadius:10,background:marketContext.regime==='BULLISH'?'rgba(22,163,74,0.2)':marketContext.regime==='BEARISH'?'rgba(220,38,38,0.2)':'rgba(245,200,66,0.15)',color:marketContext.regime==='BULLISH'?'#4ade80':marketContext.regime==='BEARISH'?'#f87171':G,letterSpacing:1}}>SPY {marketContext.regime} {marketContext.spyChange>=0?'+':''}{marketContext.spyChange}%</div>)}
          <div style={{background:G,color:N,fontSize:9,fontWeight:800,padding:'4px 10px',borderRadius:12,letterSpacing:1,fontFamily:'Syne,sans-serif'}}>BETA</div>
        </div>
      </nav>

      <div style={{maxWidth:900,margin:'0 auto',padding:'32px 24px 80px'}}>

        {mode!=='track'&&(<div style={{textAlign:'center',padding:'40px 20px 32px',maxWidth:600,margin:'0 auto 32px'}}>
          <div style={{display:'inline-block',fontSize:10,letterSpacing:3,color:N,marginBottom:14,background:'#fdf3d0',padding:'5px 14px',borderRadius:20,fontWeight:600}}>◎ {UNIVERSE.length} STOCKS · 6 PATTERNS · HARD RULES · DAILY</div>
          <h1 style={{fontFamily:'Syne,sans-serif',fontSize:38,fontWeight:800,lineHeight:1.15,marginBottom:14,color:N}}>{mode==='scanner'?<>Today's top 5<br/>trade setups.</>:<>Deep analysis.<br/>Every stock.</>}</h1>
          <p style={{color:MUTED,fontSize:14,lineHeight:1.8}}>{mode==='scanner'?`Stop loss -${Math.abs(STOP_LOSS_PCT)}% · Take profit +${TAKE_PROFIT_PCT}% · Max hold ${MAX_HOLD_DAYS} days · Applied to every signal automatically.`:'Full quantitative breakdown — patterns, probabilities, market context, position sizing and signal timing.'}</p>
        </div>)}

        {/* TRACK RECORD */}
        {mode==='track'&&(<div className="fade">
          <div style={{textAlign:'center',padding:'32px 20px 24px',maxWidth:600,margin:'0 auto 24px'}}>
            <h1 style={{fontFamily:'Syne,sans-serif',fontSize:34,fontWeight:800,color:N,marginBottom:10}}>Track Record</h1>
            <p style={{color:MUTED,fontSize:13,lineHeight:1.8}}>Every signal tracked with consistent rules applied.<br/>Stop loss -{Math.abs(STOP_LOSS_PCT)}% · Take profit +{TAKE_PROFIT_PCT}% · Max hold {MAX_HOLD_DAYS} days.</p>
            {updatingPrices&&<div style={{fontSize:11,color:G,marginTop:10,animation:'scanpulse 1.5s ease infinite'}}>● Updating current prices...</div>}
          </div>
          <TrackRecordTab signals={trackedSignals} onClear={handleClearRecords} updating={updatingPrices}/>
        </div>)}

        {/* SCANNER */}
        {mode==='scanner'&&(<div className="fade">
          {contextLoaded&&<RegimeBanner regime={marketContext.regime} spyChange={marketContext.spyChange}/>}

          <div className="card" style={{marginBottom:20,padding:'24px 28px',textAlign:'center'}}>
            <div style={{fontSize:13,color:MUTED,marginBottom:6,lineHeight:1.8}}>
              Scans <strong style={{color:TEXT}}>{UNIVERSE.length} stocks</strong>. Shows only the <strong style={{color:TEXT}}>top 5 setups</strong> with the strongest edge.<br/>
              Every signal has a -{Math.abs(STOP_LOSS_PCT)}% stop loss and +{TAKE_PROFIT_PCT}% take profit applied automatically.
            </div>
            <div style={{fontSize:11,color:'#a0aec0',marginBottom:22}}>Takes 15–20 minutes · Signals saved to Track Record with consistent rules</div>
            <div style={{display:'flex',gap:10,justifyContent:'center',alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
              <div style={{fontSize:12,color:MUTED,fontWeight:500}}>My portfolio:</div>
              <input value={portfolio} onChange={e=>setPortfolio(e.target.value)} placeholder="e.g. 50000" style={{width:140,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:'8px 12px',color:TEXT,fontSize:13,outline:'none',textAlign:'center'}} onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BORDER}/>
              {portfolioVal>0&&<span style={{fontSize:11,color:'#16a34a',fontWeight:600}}>✓ {fmtMoney(portfolioVal)}</span>}
            </div>
            <button onClick={runScan} disabled={scanning} style={{background:scanning?'#e5e7eb':`linear-gradient(135deg,${G},#e8a800)`,border:'none',borderRadius:12,padding:'14px 56px',color:scanning?'#9ca3af':N,fontSize:15,fontWeight:800,fontFamily:'Syne,sans-serif',cursor:scanning?'not-allowed':'pointer',letterSpacing:1,boxShadow:scanning?'none':'0 4px 20px rgba(245,200,66,0.5)'}}>
              {scanning?'SCANNING MARKET...':'◎ SCAN MARKET'}
            </button>
            {scanning&&(<div style={{marginTop:20}}><div style={{height:6,background:BG,borderRadius:3,overflow:'hidden',marginBottom:8}}><div style={{height:'100%',width:scanProgress+'%',background:`linear-gradient(90deg,${G},#e8a800)`,borderRadius:3,transition:'width 0.4s ease'}}/></div><div style={{fontSize:11,color:MUTED,animation:'scanpulse 1.5s ease infinite'}}>{scanStatus} — {scanProgress}%</div></div>)}
          </div>

          {/* TOP 3 HERO */}
          {top3.length>0&&(<div className="fade" style={{marginBottom:24}}>
            <div style={{fontSize:11,color:MUTED,letterSpacing:2,textTransform:'uppercase',fontWeight:600,marginBottom:14,textAlign:'center'}}>★ Today's Best Setups</div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              {top3.map((r,i)=><HeroSignal key={r.ticker} r={r} rank={i} onDive={diveInto}/>)}
            </div>
            {portfolioVal===0&&<div style={{textAlign:'center',marginTop:12,fontSize:11,color:MUTED}}>💡 Enter your portfolio size above to see suggested position sizes in dollars</div>}
          </div>)}

          {/* TOP 5 LIST — default view */}
          {top5.length>0&&(<div className="fade">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div style={{fontSize:11,color:MUTED,letterSpacing:2,textTransform:'uppercase',fontWeight:500}}>
                {showAllSignals?`All ${filteredResults.length} Signals`:'Top 5 Signals Today'}
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {scanResults.length>5&&(
                  <button onClick={()=>setShowAllSignals(!showAllSignals)} style={{fontSize:11,color:N,background:W,border:`1px solid ${BORDER}`,borderRadius:8,padding:'4px 12px',cursor:'pointer',fontWeight:600}}>
                    {showAllSignals?'Show Top 5 Only':`Show All ${scanResults.length} Signals`}
                  </button>
                )}
                <div style={{fontSize:10,color:'#a0aec0'}}>{UNIVERSE.length} stocks scanned</div>
              </div>
            </div>

            {/* Filter bar — only shown when viewing all signals */}
            {showAllSignals&&(<div className="card" style={{marginBottom:16,padding:'16px 20px'}}>
              <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'flex-start'}}>
                <div><div style={{fontSize:10,color:MUTED,marginBottom:6,fontWeight:500}}>Grade</div><div style={{display:'flex',gap:5}}>{GRADES.map(g=>{const active=filterGrades.includes(g);const col=GRADE_COLORS[g];return(<button key={g} className="chip" onClick={()=>toggleGrade(g)} style={{background:active?col+'22':W,color:active?col:MUTED,border:`1px solid ${active?col+'66':BORDER}`}}>{g}</button>);})} <button className="chip" onClick={()=>setFilterGrades([...GRADES])} style={{background:BG,color:MUTED,border:`1px solid ${BORDER}`}}>All</button></div></div>
                <div><div style={{fontSize:10,color:MUTED,marginBottom:6,fontWeight:500}}>Direction</div><div style={{display:'flex',gap:5}}>{['All','BULLISH','WATCH'].map(d=>{const active=filterDirection===d;const col=d==='BULLISH'?'#16a34a':d==='WATCH'?'#d97706':N;return(<button key={d} className="chip" onClick={()=>setFilterDirection(d)} style={{background:active?col+'18':W,color:active?col:MUTED,border:`1px solid ${active?col+'44':BORDER}`}}>{d}</button>);})}</div></div>
                <div><div style={{fontSize:10,color:MUTED,marginBottom:6,fontWeight:500}}>Market Cap</div><div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{CATEGORIES.map(cat=>{const active=filterCategory===cat;const col=CAT_COLORS[cat]||N;return(<button key={cat} className="chip" onClick={()=>setFilterCategory(cat)} style={{background:active?col+'18':W,color:active?col:MUTED,border:`1px solid ${active?col+'55':BORDER}`}}>{cat}</button>);})}</div></div>
              </div>
            </div>)}

            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {displaySignals.map((r,i)=>{
                const isExp=expandedScan===i;
                const changePos=parseFloat(r.change)>=0;
                const dirCol=r.activeSignal.direction==='BULLISH'?'#16a34a':'#d97706';
                const catCol=CAT_COLORS[r.category]||N;
                const positionPct=(r.activeSignal.kelly*50).toFixed(1);
                const positionDollar=portfolioVal>0?fmtMoney(portfolioVal*r.activeSignal.kelly*0.5):null;
                const vb=volBadge(r.relativeVolume);
                return(<div key={i} className="card scan-card" style={{padding:'14px 18px'}} onClick={()=>setExpandedScan(isExp?null:i)}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:36,height:36,borderRadius:8,border:`2px solid ${r.confidence.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:r.confidence.color,fontFamily:'Syne,sans-serif',flexShrink:0}}>{r.confidence.grade}</div>
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                          <span style={{fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:800,color:TEXT}}>{r.ticker}</span>
                          <span style={{fontSize:12,fontWeight:600,color:changePos?'#16a34a':'#dc2626'}}>{changePos?'+':''}{r.change}%</span>
                          <span style={{fontSize:10,padding:'2px 7px',borderRadius:8,background:catCol+'18',color:catCol,border:`1px solid ${catCol}33`,fontWeight:600}}>{r.category}</span>
                          {vb&&<span style={{fontSize:10,padding:'2px 7px',borderRadius:8,background:vb.bg,color:vb.col,border:`1px solid ${vb.border}`,fontWeight:600}}>{vb.text}</span>}
                        </div>
                        <div style={{fontSize:11,color:MUTED,marginTop:3}}>
                          Win: <strong style={{color:r.activeSignal.winRate>=60?'#16a34a':'#d97706'}}>{r.activeSignal.winRate}%</strong>
                          &nbsp;·&nbsp;Beats coin flip: <strong style={{color:r.activeSignal.edgeVsRandom>0?'#16a34a':'#dc2626'}}>{r.activeSignal.edgeVsRandom>0?'+':''}{r.activeSignal.edgeVsRandom}%</strong>
                          &nbsp;·&nbsp;Position: <strong style={{color:TEXT}}>{positionPct}%{positionDollar?' ('+positionDollar+')':''}</strong>
                          &nbsp;·&nbsp;Stop: <strong style={{color:'#dc2626'}}>-{Math.abs(STOP_LOSS_PCT)}%</strong>
                          &nbsp;·&nbsp;Target: <strong style={{color:'#16a34a'}}>+{TAKE_PROFIT_PCT}%</strong>
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{textAlign:'right'}}><div style={{fontSize:20,fontWeight:800,color:r.confidence.color,fontFamily:'Syne,sans-serif',lineHeight:1}}>{r.confidence.score}</div><div style={{fontSize:9,color:MUTED}}>/ 100</div></div>
                      <div style={{fontSize:10,fontWeight:700,padding:'4px 12px',borderRadius:14,background:dirCol,color:W,letterSpacing:1,fontFamily:'Syne,sans-serif'}}>{r.activeSignal.direction}</div>
                      <span style={{fontSize:11,color:MUTED}}>{isExp?'▲':'▼'}</span>
                    </div>
                  </div>
                  <div style={{marginTop:10,fontSize:11,color:MUTED,lineHeight:1.5,paddingLeft:48}}>
                    {r.plainDesc}
                    {r.confidence.contextNote&&<span style={{marginLeft:8,fontSize:10,color:'#6b7ab5',fontStyle:'italic'}}>— {r.confidence.contextNote}</span>}
                    {!r.activeSignal.reliable&&<span style={{marginLeft:8,fontSize:10,color:'#d97706',background:'#fffbeb',border:'1px solid #f5c842',padding:'1px 6px',borderRadius:6,fontWeight:600}}>⚠️ Small sample</span>}
                  </div>
                  {isExp&&(<div style={{marginTop:16,borderTop:`1px solid ${BORDER}`,paddingTop:16}}>
                    <ConfidenceGauge score={r.confidence.score} grade={r.confidence.grade} label={r.confidence.label} color={r.confidence.color} components={r.confidence.components} patternName={r.activeSignal.name}/>
                    {/* Hard rules box */}
                    <div style={{background:'#f8f9ff',border:`1px solid ${BORDER}`,borderRadius:10,padding:'12px 16px',marginBottom:14}}>
                      <div style={{fontSize:10,color:MUTED,fontWeight:600,letterSpacing:1,textTransform:'uppercase',marginBottom:8}}>Trading Rules — Applied Automatically</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                        {[{label:'Enter',val:'Market open',sub:'Next trading day'},{label:'Stop loss',val:`-${Math.abs(STOP_LOSS_PCT)}%`,sub:'Exit immediately if hit'},{label:'Take profit',val:`+${TAKE_PROFIT_PCT}%`,sub:'Exit immediately if hit'},{label:'Max hold',val:`${MAX_HOLD_DAYS} days`,sub:'Close at market'},{label:'Position size',val:`${positionPct}%${positionDollar?' ('+positionDollar+')':''}`,sub:'Half Kelly recommended'},{label:'Pattern',val:r.activeSignal.name,sub:r.activeSignal.direction}].map(tc=>(<div key={tc.label} style={{textAlign:'center'}}><div style={{fontSize:9,color:MUTED,marginBottom:3,textTransform:'uppercase',fontWeight:500}}>{tc.label}</div><div style={{fontSize:13,fontWeight:700,color:TEXT}}>{tc.val}</div><div style={{fontSize:9,color:MUTED}}>{tc.sub}</div></div>))}
                      </div>
                    </div>
                    {r.activeSignal.decay&&<div style={{background:BG,borderRadius:10,padding:'14px 16px',marginBottom:14}}><DecayCurve decay={r.activeSignal.decay} randomBaseline={r.randomBaseline}/></div>}
                    <button onClick={(e)=>{e.stopPropagation();diveInto(r.ticker);}} style={{width:'100%',background:N,border:'none',borderRadius:10,padding:'13px',color:G,fontSize:12,fontWeight:800,fontFamily:'Syne,sans-serif',cursor:'pointer',letterSpacing:1}}>↗ FULL DEEP DIVE — {r.ticker}</button>
                  </div>)}
                </div>);
              })}
            </div>
          </div>)}

          {!scanning&&scanProgress===0&&(<div style={{display:'flex',flexDirection:'column',alignItems:'center',minHeight:160,justifyContent:'center',gap:10}}><div style={{fontSize:40,opacity:0.07}}>◎</div><div style={{color:'#cbd5e0',fontSize:11,letterSpacing:2}}>HIT SCAN MARKET TO FIND TODAY'S TOP 5 OPPORTUNITIES</div></div>)}
          {!scanning&&scanProgress===100&&scanResults.length===0&&(<div className="card" style={{textAlign:'center',padding:40}}><div style={{fontSize:28,opacity:0.1,marginBottom:10}}>◎</div><div style={{color:MUTED,fontSize:13,fontWeight:500}}>No signals found today</div><div style={{color:'#cbd5e0',fontSize:11,marginTop:5}}>The market is quiet — no patterns forming right now</div></div>)}
        </div>)}

        {/* DEEP DIVE */}
        {mode==='single'&&(<div className="fade">
          {contextLoaded&&<RegimeBanner regime={marketContext.regime} spyChange={marketContext.spyChange}/>}
          <div className="card" style={{marginBottom:24,padding:'24px 28px'}}>
            <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
              <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&run()} placeholder="TICKER  (e.g. MSFT · AAPL · CNQ.TO)" style={{flex:1,minWidth:180,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:10,padding:'12px 16px',color:TEXT,fontSize:13,outline:'none'}} onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BORDER}/>
              <button onClick={()=>run()} disabled={loading||!ticker.trim()} style={{background:loading?'#e5e7eb':`linear-gradient(135deg,${G},#e8a800)`,border:'none',borderRadius:10,padding:'12px 28px',color:loading?'#9ca3af':N,fontSize:13,fontWeight:700,fontFamily:'Syne,sans-serif',cursor:loading?'not-allowed':'pointer',letterSpacing:1,minWidth:110,boxShadow:loading?'none':'0 4px 14px rgba(245,200,66,0.4)'}}>{loading?'···':'ANALYSE'}</button>
            </div>
            <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
              <div style={{fontSize:11,color:MUTED,fontWeight:500}}>Portfolio size:</div>
              <input value={portfolio} onChange={e=>setPortfolio(e.target.value)} placeholder="e.g. 200000" style={{width:160,background:BG,border:`1.5px solid ${BORDER}`,borderRadius:8,padding:'8px 12px',color:TEXT,fontSize:13,outline:'none'}} onFocus={e=>e.target.style.borderColor=G} onBlur={e=>e.target.style.borderColor=BORDER}/>
              {portfolioVal>0&&<span style={{fontSize:11,color:'#16a34a',fontWeight:600}}>✓ {fmtMoney(portfolioVal)} set</span>}
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
              {[{label:'1000 Days ★',val:1000},{label:'750 Days',val:750},{label:'500 Days',val:500}].map(tf=>(<button key={tf.val} onClick={()=>setDays(tf.val)} style={{background:days===tf.val?N:W,border:`1px solid ${days===tf.val?N:BORDER}`,borderRadius:6,padding:'6px 14px',color:days===tf.val?G:MUTED,fontSize:11,fontWeight:days===tf.val?600:400,cursor:'pointer'}}>{tf.label}</button>))}
              <span style={{fontSize:10,color:'#a0aec0',marginLeft:4}}>Min 500 days for reliability</span>
            </div>
          </div>

          {error&&<div style={{color:'#dc2626',fontSize:12,padding:'10px 16px',background:'#fef2f2',borderRadius:10,border:'1px solid #fecaca',marginBottom:16}}>{error}</div>}
          {loading&&(<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:280,gap:14}}><div style={{display:'flex',gap:6}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:G,animation:`pulse 1.2s ease ${i*0.2}s infinite`}}/>)}</div><div style={{color:MUTED,fontSize:11,letterSpacing:2}}>FETCHING REAL DATA · {activeTicker}</div></div>)}
          {!loading&&!result&&!error&&(<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:260,gap:10}}><div style={{fontSize:40,opacity:0.1}}>◎</div><div style={{color:'#cbd5e0',fontSize:11,letterSpacing:2}}>ENTER TICKER · SET PORTFOLIO · PRESS ANALYSE</div></div>)}

          {!loading&&result&&s&&(<div className="fade">
            <div className="card" style={{marginBottom:16,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',background:N}}>
              <div><div style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800,color:W}}>{activeTicker}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:2}}>{s.changes.length} trading days analysed</div></div>
              <div style={{display:'flex',alignItems:'baseline',gap:8}}><span style={{fontSize:26,fontWeight:700,color:W}}>${s.closes[0].toFixed(2)}</span><span style={{fontSize:13,fontWeight:600,color:s.changes[0]>=0?'#4ade80':'#f87171'}}>{s.changes[0]>=0?'+':''}{s.changes[0].toFixed(2)}%</span></div>
              <div style={{marginLeft:'auto',background:'rgba(255,255,255,0.08)',borderRadius:8,padding:'8px 14px',textAlign:'center'}}><div style={{fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:1,marginBottom:3}}>COIN FLIP BASELINE</div><div style={{fontSize:18,fontWeight:700,color:G}}>{result.randomBaseline}%</div><div style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>Random buy win rate</div></div>
            </div>
            <div style={{background:'#fdf3d0',border:'1px solid #f5c84244',borderRadius:10,padding:'10px 16px',marginBottom:20,fontSize:12,color:'#92400e'}}><strong>Coin flip baseline: {result.randomBaseline}%</strong> — Any pattern above this is beating random buying.</div>

            <div style={{fontSize:11,color:MUTED,letterSpacing:2,marginBottom:10,textTransform:'uppercase',fontWeight:500}}>Price Behaviour</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10,marginBottom:24}}>{[{label:'Avg daily move',val:s.avgAbsChange.toFixed(2)+'%',sub:'Directional: '+(s.avgChange>=0?'+':'')+s.avgChange.toFixed(2)+'%',col:'#16a34a'},{label:'Biggest single day gain',val:'+'+s.maxGain.toFixed(2)+'%',sub:'Historical max',col:'#16a34a'},{label:'Biggest single day drop',val:s.maxLoss.toFixed(2)+'%',sub:'Historical max',col:'#dc2626'},{label:'Daily volatility',val:s.stdDev.toFixed(2)+'%',sub:'Annual: '+s.annualVol.toFixed(1)+'%',col:N},{label:'Avg intraday range',val:s.avgIntraday.toFixed(2)+'%',sub:'Max: '+s.maxIntraday.toFixed(2)+'%',col:N},{label:'Avg daily volume',val:fmtVol(s.avgVol),sub:'Last: '+fmtVol(s.volumes[0]),col:N}].map((c,i)=>(<div key={i} className="card" style={{padding:'14px 16px'}}><div style={{fontSize:10,color:MUTED,marginBottom:6,fontWeight:500}}>{c.label}</div><div style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800,color:c.col}}>{c.val}</div><div style={{fontSize:10,color:MUTED,marginTop:3}}>{c.sub}</div></div>))}</div>

            <div style={{fontSize:11,color:MUTED,letterSpacing:2,marginBottom:10,textTransform:'uppercase',fontWeight:500}}>How This Stock Moves</div>
            <div className="card" style={{marginBottom:24}}>{Object.entries(s.buckets).map(([label,count])=>{const total=Object.values(s.buckets).reduce((a,b)=>a+b,0);const pct=(count/total*100).toFixed(1);const col=label.includes('Down')?'#dc2626':label.includes('Up')?'#16a34a':'#d97706';return(<div key={label} style={{marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:TEXT,marginBottom:5,fontWeight:500}}><span>{label}</span><span style={{color:col}}>{pct}% · {count} days</span></div><div style={{height:8,background:BG,borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:pct+'%',background:col,borderRadius:4,transition:'width 0.8s cubic-bezier(.4,0,.2,1)',opacity:0.8}}/></div></div>);})}</div>

            <div style={{fontSize:11,color:MUTED,letterSpacing:2,marginBottom:10,textTransform:'uppercase',fontWeight:500}}>Today's Signal</div>
            {sig?(
              <div style={{background:sigBg,border:`2px solid ${sigCol}33`,borderRadius:14,padding:22,marginBottom:24}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                  <div><div style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:800,color:TEXT}}>◎ Pattern active today</div><div style={{fontSize:11,color:MUTED,marginTop:3}}>{sig.name} — {PATTERN_PLAIN[sig.name]||sig.desc}</div></div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>{!sig.reliable&&<div style={{fontSize:10,color:'#d97706',background:'#fffbeb',border:'1px solid #f5c842',padding:'3px 10px',borderRadius:12,fontWeight:600}}>⚠️ Small sample</div>}<div style={{fontSize:11,fontWeight:700,padding:'5px 14px',borderRadius:20,background:sigCol,color:W,letterSpacing:1,fontFamily:'Syne,sans-serif'}}>{sig.direction}</div></div>
                </div>
                {(()=>{const c=getConfidence(sig.winRate,result.randomBaseline,sig.instances,sig.kelly,sig.decay,marketContext.regime,null,s.relativeVolume,sig.direction);return(<>{c.contextNote&&<div style={{background:'#f0f4ff',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:12,color:MUTED,lineHeight:1.6}}>💡 {c.contextNote}</div>}<ConfidenceGauge score={c.score} grade={c.grade} label={c.label} color={c.color} components={c.components} patternName={sig.name}/></>);})()}
                {[{label:'Win probability',val:sig.winRate,col:sigCol},{label:'Loss probability',val:100-sig.winRate,col:'#94a3b8'}].map(pb=>(<div key={pb.label} style={{margin:'10px 0'}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:MUTED,marginBottom:5,fontWeight:500}}><span>{pb.label}</span><span style={{color:pb.col,fontWeight:700}}>{pb.val}%</span></div><div style={{height:8,background:W,borderRadius:4,overflow:'hidden',border:`1px solid ${BORDER}`}}><div style={{height:'100%',width:pb.val+'%',background:pb.col,borderRadius:4,transition:'width 1s cubic-bezier(.4,0,.2,1)',opacity:0.85}}/></div></div>))}

                {/* Hard rules box in deep dive */}
                <div style={{background:'#f8f9ff',border:`1px solid ${BORDER}`,borderRadius:10,padding:'14px 16px',marginTop:16,marginBottom:4}}>
                  <div style={{fontSize:10,color:MUTED,fontWeight:600,letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>How To Trade This Signal</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                    {[
                      {label:'Entry price',val:'$'+sig.entry,col:TEXT,sub:'Buy at market open tomorrow'},
                      {label:'Stop loss',val:'$'+(sig.entry*(1+STOP_LOSS_PCT/100)).toFixed(2),col:'#dc2626',sub:`Exit if falls ${Math.abs(STOP_LOSS_PCT)}% from entry`},
                      {label:'Take profit',val:'$'+(sig.entry*(1+TAKE_PROFIT_PCT/100)).toFixed(2),col:'#16a34a',sub:`Exit if rises ${TAKE_PROFIT_PCT}% from entry`},
                    ].map(tc=>(<div key={tc.label} style={{background:W,border:`1px solid ${BORDER}`,borderRadius:10,padding:'12px 14px',textAlign:'center'}}><div style={{fontSize:9,color:MUTED,letterSpacing:1,marginBottom:5,textTransform:'uppercase',fontWeight:500}}>{tc.label}</div><div style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:800,color:tc.col}}>{tc.val}</div><div style={{fontSize:9,color:MUTED,marginTop:3}}>{tc.sub}</div></div>))}
                  </div>
                  <div style={{marginTop:10,fontSize:11,color:MUTED,textAlign:'center'}}>Maximum hold: {MAX_HOLD_DAYS} days · Risk/Reward: 1:{(TAKE_PROFIT_PCT/Math.abs(STOP_LOSS_PCT)).toFixed(1)}</div>
                </div>

                {sig.decay&&<div style={{background:W,border:`1px solid ${BORDER}`,borderRadius:10,padding:'14px 16px',marginTop:14}}><DecayCurve decay={sig.decay} randomBaseline={result.randomBaseline}/></div>}
                <div style={{marginTop:14,background:N,borderRadius:12,padding:'18px 20px'}}>
                  <div style={{fontSize:11,color:G,fontWeight:700,letterSpacing:1,marginBottom:14}}>◈ SUGGESTED POSITION SIZE</div>
                  {portfolioVal>0?(
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                      {[{label:'Aggressive',pct:(kellyPct*100).toFixed(1),dollar:portfolioVal*kellyPct,desc:'Maximum edge',col:G},{label:'Recommended',pct:(kellyPct*50).toFixed(1),dollar:portfolioVal*kellyPct*0.5,desc:'★ Best balance',col:'#4ade80'},{label:'Conservative',pct:(kellyPct*25).toFixed(1),dollar:portfolioVal*kellyPct*0.25,desc:'Lower risk',col:'#86efac'}].map(k=>(<div key={k.label} style={{background:'rgba(255,255,255,0.06)',borderRadius:10,padding:'12px 14px',textAlign:'center',border:k.label==='Recommended'?`1px solid ${k.col}44`:'1px solid rgba(255,255,255,0.08)'}}><div style={{fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:1,marginBottom:6,textTransform:'uppercase'}}>{k.label}</div><div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,color:k.col}}>{fmtMoney(k.dollar)}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.5)',marginTop:3}}>{k.pct}% of portfolio</div><div style={{fontSize:9,color:k.col,marginTop:4,fontWeight:600}}>{k.desc}</div></div>))}
                    </div>
                  ):(<div style={{textAlign:'center',color:'rgba(255,255,255,0.4)',fontSize:12}}>Enter your portfolio size above to see suggested amounts</div>)}
                </div>
                <div style={{background:W,border:`1px solid ${BORDER}`,borderRadius:10,padding:'12px 16px',marginTop:14}}>
                  <div style={{fontSize:10,color:MUTED,letterSpacing:1,marginBottom:5,fontWeight:500,textTransform:'uppercase'}}>How much does this beat random buying?</div>
                  <div style={{fontSize:12,color:TEXT,lineHeight:1.7}}>Based on <strong>{sig.instances} historical trades</strong>. Wins <strong>{sig.winRate}%</strong> of the time vs <strong>{result.randomBaseline}%</strong> for random buying. Real edge: <strong style={{color:sig.winRate>result.randomBaseline?'#16a34a':'#dc2626',fontSize:14}}>{sig.winRate>result.randomBaseline?'+':''}{sig.winRate-result.randomBaseline}%</strong></div>
                </div>
              </div>
            ):(<div className="card" style={{textAlign:'center',padding:32,marginBottom:24}}><div style={{fontSize:28,opacity:0.1,marginBottom:10}}>◎</div><div style={{color:MUTED,fontSize:12,fontWeight:500}}>No signal today for {activeTicker}</div><div style={{color:'#cbd5e0',fontSize:11,marginTop:5}}>None of the 6 patterns are forming right now — no action needed</div></div>)}

            <div style={{fontSize:11,color:MUTED,letterSpacing:2,marginBottom:6,textTransform:'uppercase',fontWeight:500}}>All 6 Patterns — Historical Performance</div>
            <div style={{fontSize:10,color:'#a0aec0',marginBottom:12}}>Coin flip baseline: {result.randomBaseline}% · Need 30+ trades to be reliable · Sorted by expected value</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>{result.patterns.map((p,i)=>{const col=p.signal==='green'?'#16a34a':p.signal==='red'?'#dc2626':'#d97706';const bg=p.signal==='green'?'#f0fdf4':p.signal==='red'?'#fef2f2':'#fffbeb';const edgeCol=p.edgeVsRandom>5?'#16a34a':p.edgeVsRandom<-5?'#dc2626':'#d97706';const isExpanded=expandedPattern===i;return(<div key={i} className="card pat-card" style={{padding:'14px 16px',opacity:p.reliable?1:0.7}} onClick={()=>setExpandedPattern(isExpanded?null:i)}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6,flexWrap:'wrap',gap:6}}><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:13,color:TEXT,fontWeight:600}}>{p.name}</span>{!p.reliable&&<span style={{fontSize:9,color:'#d97706',background:'#fffbeb',border:'1px solid #f5c84266',padding:'2px 7px',borderRadius:10,fontWeight:600}}>⚠️ LOW SAMPLE ({p.instances})</span>}</div><div style={{display:'flex',gap:6,alignItems:'center'}}><span style={{fontSize:10,color:edgeCol,fontWeight:600}}>Beats coin flip: {p.edgeVsRandom>0?'+':''}{p.edgeVsRandom}%</span><span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:12,background:bg,color:col,border:`1px solid ${col}33`}}>{p.winRate}% win rate</span><span style={{fontSize:10,color:MUTED}}>{isExpanded?'▲':'▼'}</span></div></div><div style={{fontSize:11,color:MUTED,marginBottom:6}}>{p.instances} historical trades &nbsp;·&nbsp; Avg win: <strong style={{color:'#16a34a'}}>{p.avgWin}</strong> &nbsp;·&nbsp; Avg loss: <strong style={{color:'#dc2626'}}>{p.avgLoss}</strong> &nbsp;·&nbsp; Expected value: <strong style={{color:p.ev>=0?'#16a34a':'#dc2626'}}>{p.evStr}</strong>{p.reliable&&p.kelly>0&&<>&nbsp;·&nbsp;Suggested position: <strong style={{color:N}}>{(p.kelly*50).toFixed(1)}%{portfolioVal>0?' ('+fmtMoney(portfolioVal*p.kelly*0.5)+')':''}</strong></>}</div>{(()=>{const c=getConfidence(p.winRate,result.randomBaseline,p.instances,p.kelly,p.decay,marketContext.regime,null,s.relativeVolume,p.signal==='green'?'BULLISH':'WATCH');return<ConfidenceGauge score={c.score} grade={c.grade} label={c.label} color={c.color} components={c.components} patternName={p.name}/>;})()}{isExpanded&&<div style={{borderTop:`1px solid ${BORDER}`,paddingTop:12,marginTop:4}}><DecayCurve decay={p.decay} randomBaseline={result.randomBaseline}/></div>}</div>);})}</div>

            <div style={{fontSize:11,color:MUTED,letterSpacing:2,marginBottom:10,textTransform:'uppercase',fontWeight:500}}>Summary Table</div>
            <div className="card" style={{overflowX:'auto',marginBottom:24}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{borderBottom:`2px solid ${BG}`}}>{['Pattern','Trades','Win rate','Beats random','Avg win','Avg loss','Expected value','Position size','Best exit','Reliable'].map(h=>(<th key={h} style={{fontSize:9,color:MUTED,letterSpacing:1,textTransform:'uppercase',padding:'8px 12px',textAlign:'left',fontWeight:600}}>{h}</th>))}</tr></thead><tbody>{result.patterns.map((p,i)=>(<tr key={i} style={{borderBottom:`1px solid ${BG}`}}><td style={{padding:'10px 12px',color:TEXT,fontWeight:500}}>{p.name}</td><td style={{padding:'10px 12px',color:MUTED}}>{p.instances}</td><td style={{padding:'10px 12px',color:p.winRate>=60?'#16a34a':p.winRate>=50?'#d97706':'#dc2626',fontWeight:600}}>{p.winRate}%</td><td style={{padding:'10px 12px',color:p.edgeVsRandom>5?'#16a34a':p.edgeVsRandom<-5?'#dc2626':'#d97706',fontWeight:600}}>{p.edgeVsRandom>0?'+':''}{p.edgeVsRandom}%</td><td style={{padding:'10px 12px',color:'#16a34a',fontWeight:500}}>{p.avgWin}</td><td style={{padding:'10px 12px',color:'#dc2626',fontWeight:500}}>{p.avgLoss}</td><td style={{padding:'10px 12px',color:p.ev>=0?'#16a34a':'#dc2626',fontWeight:700}}>{p.evStr}</td><td style={{padding:'10px 12px',color:N,fontWeight:600}}>{(p.kelly*50).toFixed(1)}%{portfolioVal>0?' ('+fmtMoney(portfolioVal*p.kelly*0.5)+')':''}</td><td style={{padding:'10px 12px',color:'#16a34a',fontWeight:600}}>{p.bestDay?`Day ${p.bestDay.day} (${p.bestDay.winRate}%)`:'N/A'}</td><td style={{padding:'10px 12px'}}><span style={{fontSize:10,fontWeight:600,color:p.reliable?'#16a34a':'#d97706'}}>{p.reliable?'✓ Yes':'⚠️ No'}</span></td></tr>))}</tbody></table></div>
          </div>)}
        </div>)}
      </div>

      <footer style={{background:N,padding:'24px 32px',textAlign:'center',marginTop:40}}>
        <div style={{fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:800,color:W,marginBottom:6}}>Cerrado Edge</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Data from Yahoo Finance · Not financial advice · Past patterns do not guarantee future results</div>
      </footer>
    </>
  );
}
