/**
 * Cerrado Edge — Session 10
 * Signal Confidence Score: 0–100 composite
 * Now includes market regime, earnings proximity, and relative volume adjustments
 */

export function computeConfidenceScore({
  winRate,
  randomWinRate,
  sampleSize,
  kellyFraction,
  decaySlope,
  // Session 10 additions
  marketRegime,    // 'BULLISH' | 'BEARISH' | 'NEUTRAL' | null
  earningsDays,    // number of days until next earnings, null if unknown
  relativeVolume,  // today's volume / 20-day avg volume, null if unknown
  signalDirection, // 'BULLISH' | 'BEARISH' | 'WATCH'
}) {
  // ── 1. Win Rate Score (0–100) ─────────────────────────────────────────────
  const winRateScore = clamp((winRate - 0.5) / 0.25, 0, 1) * 100;

  // ── 2. Edge vs Random Score (0–100) ──────────────────────────────────────
  const edge = winRate - randomWinRate;
  const edgeScore = clamp(edge / 0.2, 0, 1) * 100;

  // ── 3. Sample Size Reliability Score (0–100) ─────────────────────────────
  const sampleScore =
    sampleSize < 30
      ? clamp((sampleSize / 30) * 40, 0, 40)
      : clamp(40 + (Math.log(sampleSize / 30) / Math.log(200 / 30)) * 60, 0, 100);

  // ── 4. Kelly Size Score (0–100) ───────────────────────────────────────────
  const kellyScore = clamp(kellyFraction / 0.25, 0, 1) * 100;

  // ── 5. Decay Strength Score (0–100) ──────────────────────────────────────
  let decayScore = 50;
  if (decaySlope !== null && decaySlope !== undefined) {
    decayScore = clamp(((decaySlope + 0.05) / 0.1) * 100, 0, 100);
  }

  // ── Weighted Base Score ───────────────────────────────────────────────────
  const weights = { winRate: 0.25, edge: 0.30, sample: 0.20, kelly: 0.15, decay: 0.10 };
  let score = Math.round(
    winRateScore * weights.winRate +
    edgeScore    * weights.edge    +
    sampleScore  * weights.sample  +
    kellyScore   * weights.kelly   +
    decayScore   * weights.decay
  );

  // ── Session 10: Context Adjustments ──────────────────────────────────────
  let contextNote = null;
  let regimeAdjust = 0, earningsAdjust = 0, volumeAdjust = 0;

  // Market Regime adjustment
  if (marketRegime && signalDirection) {
    if (marketRegime === 'BULLISH' && signalDirection === 'BULLISH') {
      regimeAdjust = +6;
      contextNote = 'Market is in a bullish trend — this signal is stronger than usual';
    } else if (marketRegime === 'BEARISH' && signalDirection === 'BULLISH') {
      regimeAdjust = -10;
      contextNote = 'Market is in a bearish trend — treat this bullish signal with caution';
    } else if (marketRegime === 'BEARISH' && signalDirection === 'WATCH') {
      regimeAdjust = -5;
      contextNote = 'Market is falling — wait for confirmation before acting';
    } else if (marketRegime === 'BULLISH' && signalDirection === 'WATCH') {
      regimeAdjust = +3;
      contextNote = 'Market conditions are supportive';
    } else if (marketRegime === 'NEUTRAL') {
      contextNote = 'Market is moving sideways — signal relies on stock-specific edge';
    }
  }

  // Earnings Proximity adjustment
  if (earningsDays !== null && earningsDays !== undefined) {
    if (earningsDays <= 2) {
      earningsAdjust = -20;
      contextNote = `⚠️ Earnings in ${earningsDays} day${earningsDays === 1 ? '' : 's'} — signal is unreliable until after the announcement`;
    } else if (earningsDays <= 7) {
      earningsAdjust = -10;
      contextNote = `⚠️ Earnings in ${earningsDays} days — treat this signal with extra caution`;
    }
    // Earnings adjustment overrides regime note if closer than 7 days
  }

  // Relative Volume adjustment
  if (relativeVolume !== null && relativeVolume !== undefined) {
    if (relativeVolume >= 1.5) {
      volumeAdjust = +5;
      if (!contextNote || (earningsDays === null || earningsDays > 7)) {
        contextNote = contextNote
          ? contextNote + ` · Volume is ${relativeVolume.toFixed(1)}x normal — strong confirmation`
          : `Volume is ${relativeVolume.toFixed(1)}x normal today — pattern has stronger confirmation`;
      }
    } else if (relativeVolume < 0.7) {
      volumeAdjust = -8;
      if (!contextNote || (earningsDays === null || earningsDays > 7)) {
        contextNote = contextNote
          ? contextNote + ' · Low volume today — signal is weaker than usual'
          : 'Low volume today — signal is weaker than usual, wait for volume to pick up';
      }
    }
  }

  // Apply all adjustments and clamp to 0-100
  score = clamp(score + regimeAdjust + earningsAdjust + volumeAdjust, 0, 100);

  return {
    score,
    ...gradeFromScore(score),
    contextNote,
    adjustments: { regime: regimeAdjust, earnings: earningsAdjust, volume: volumeAdjust },
    components: {
      winRate:  Math.round(winRateScore),
      edge:     Math.round(edgeScore),
      sample:   Math.round(sampleScore),
      kelly:    Math.round(kellyScore),
      decay:    Math.round(decayScore),
    },
  };
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function gradeFromScore(score) {
  if (score >= 80) return { grade: 'A', label: 'Strong Edge',    color: '#00C896' };
  if (score >= 65) return { grade: 'B', label: 'Moderate Edge',  color: '#7BD47A' };
  if (score >= 50) return { grade: 'C', label: 'Weak Edge',      color: '#F4C542' };
  if (score >= 35) return { grade: 'D', label: 'Marginal',       color: '#F4874B' };
  return               { grade: 'F', label: 'No Edge',        color: '#E05252' };
}
