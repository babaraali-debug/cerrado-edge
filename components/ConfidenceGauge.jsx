'use client';

import { useState } from 'react';

export default function ConfidenceGauge({
  score, grade, label, color, components, patternName,
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const R = 54; const CX = 70; const CY = 74;
  const STROKE = 10;
  const ARC_DEGREES = 200;
  const START_ANGLE = 180 + (180 - ARC_DEGREES) / 2;
  const END_ANGLE = START_ANGLE + ARC_DEGREES;

  function polarToXY(angleDeg, r) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  }

  function arcPath(startDeg, endDeg, r) {
    const s = polarToXY(startDeg, r);
    const e = polarToXY(endDeg, r);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const filledEnd = START_ANGLE + (score / 100) * ARC_DEGREES;

  const breakdown = [
    { key: 'Win Rate',    val: components.winRate, weight: '25%' },
    { key: 'Edge vs Rnd', val: components.edge,    weight: '30%' },
    { key: 'Sample Size', val: components.sample,  weight: '20%' },
    { key: 'Kelly Size',  val: components.kelly,   weight: '15%' },
    { key: 'Decay',       val: components.decay,   weight: '10%' },
  ];

  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace",
      background: 'linear-gradient(135deg, #0f1117 0%, #161b27 100%)',
      border: `1px solid ${color}33`,
      borderRadius: '12px',
      padding: '20px 24px 16px',
      marginBottom: '20px',
      boxShadow: `0 0 24px ${color}22`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#5a6a82', textTransform: 'uppercase' }}>
          Signal Confidence
        </span>
        <button onClick={() => setShowBreakdown(v => !v)} style={{
          background: 'none', border: `1px solid ${color}55`, borderRadius: '4px',
          color: color, fontSize: '10px', padding: '2px 8px', cursor: 'pointer', textTransform: 'uppercase',
        }}>
          {showBreakdown ? 'Hide' : 'Breakdown'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <svg width="140" height="90" viewBox="0 0 140 90" style={{ flexShrink: 0 }}>
          <defs>
            <linearGradient id={`grad-${grade}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.5" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d={arcPath(START_ANGLE, END_ANGLE, R)} fill="none"
            stroke="#ffffff" strokeOpacity="0.15" strokeWidth={STROKE} strokeLinecap="round" />
          {score > 0 && (
            <path d={arcPath(START_ANGLE, filledEnd, R)} fill="none"
              stroke={`url(#grad-${grade})`} strokeWidth={STROKE} strokeLinecap="round" />
          )}
          <text x={CX} y={CY - 8} textAnchor="middle" fill={color}
            fontSize="26" fontWeight="700" fontFamily="'IBM Plex Mono', monospace">
            {score}
          </text>
          <text x={CX} y={CY + 8} textAnchor="middle" fill="#5a6a82"
            fontSize="9" fontFamily="'IBM Plex Mono', monospace">
            / 100
          </text>
        </svg>

        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '8px',
            border: `2px solid ${color}`, color: color,
            fontSize: '22px', fontWeight: '800', marginBottom: '8px',
          }}>{grade}</div>
          <div style={{ color: color, fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{label}</div>
          {patternName && (
            <div style={{ color: '#3d4f66', fontSize: '10px', textTransform: 'uppercase' }}>{patternName}</div>
          )}
        </div>
      </div>

      {showBreakdown && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #1e2a3a', paddingTop: '14px' }}>
          {breakdown.map(({ key, val, weight }) => (
            <div key={key} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '11px', color: '#8a9ab5' }}>{key}</span>
                <span style={{ fontSize: '11px', color: '#5a6a82' }}>
                  <span style={{ color: val >= 65 ? color : val >= 40 ? '#F4C542' : '#E05252' }}>{val}</span>
                  <span style={{ color: '#3d4f66' }}>/100 · wt {weight}</span>
                </span>
              </div>
              <div style={{ height: '3px', background: '#1e2a3a', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${val}%`,
                  background: val >= 65 ? color : val >= 40 ? '#F4C542' : '#E05252',
                  borderRadius: '2px' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '10px', fontSize: '9px', color: '#2d3d52' }}>
            SCORE = WR·25% + EDGE·30% + SAMPLE·20% + KELLY·15% + DECAY·10%
          </div>
        </div>
      )}
    </div>
  );
}
