/**
 * Cerrado Edge — Session 4
 * Signal Confidence Score: 0–100 composite
 *
 * Inputs (all sourced from existing pattern analysis output):
 *   winRate        {number}  0–1   pattern win rate
 *   randomWinRate  {number}  0–1   random baseline win rate
 *   sampleSize     {number}  integer count of historical instances
 *   kellyFraction  {number}  0–1   full Kelly fraction
 *   decaySlope     {number}  negative = edge decays; positive = edge grows
 *                            computed as (Day10Edge - Day1Edge) / 9
 *
 * Returns { score, grade, components } where:
 *   score      {number}  0–100 rounded integer
 *   grade      {string}  'A' | 'B' | 'C' | 'D' | 'F'
 *   label      {string}  human-readable label
 *   color      {string}  hex color for gauge
 *   components {object}  breakdown of each sub-score (0–100 each)
 */

export function computeConfidenceScore({
  winRate,
  randomWinRate,
  sampleSize,
  kellyFraction,
  decaySlope, // optional — pass null if decay data unavailable
}) {
  // ── 1. Win Rate Score (0–100) ─────────────────────────────────────────────
  // 50% win rate = 0 points (coin flip), 75%+ = 100 points
  const winRateScore = clamp((winRate - 0.5) / 0.25, 0, 1) * 100;

  // ── 2. Edge vs Random Score (0–100) ──────────────────────────────────────
  // Edge = winRate - randomWinRate
  // 0pp edge = 0, 20pp+ edge = 100
  const edge = winRate - randomWinRate;
  const edgeScore = clamp(edge / 0.2, 0, 1) * 100;

  // ── 3. Sample Size Reliability Score (0–100) ─────────────────────────────
  // <30 = low confidence (already warned in UI), 30=40pts, 100=80pts, 200+=100pts
  // Logarithmic ramp
  const sampleScore =
    sampleSize < 30
      ? clamp((sampleSize / 30) * 40, 0, 40)
      : clamp(40 + (Math.log(sampleSize / 30) / Math.log(200 / 30)) * 60, 0, 100);

  // ── 4. Kelly Size Score (0–100) ───────────────────────────────────────────
  // Full Kelly ≥ 0.25 (25% of bankroll) = strong signal → 100
  // Kelly 0 = 0, scales linearly up to 0.25
  const kellyScore = clamp(kellyFraction / 0.25, 0, 1) * 100;

  // ── 5. Decay Strength Score (0–100) ──────────────────────────────────────
  // Persistent edge (flat or growing) = high score
  // decaySlope: 0 = flat (good), negative = decaying (penalise), positive = growing (bonus)
  // Range: slope of -0.05/day → 0 pts, 0 → 50 pts, +0.05/day → 100 pts
  let decayScore = 50; // neutral default if no decay data
  if (decaySlope !== null && decaySlope !== undefined) {
    decayScore = clamp(((decaySlope + 0.05) / 0.1) * 100, 0, 100);
  }

  // ── Weighted Composite ────────────────────────────────────────────────────
  // Weights reflect importance to a quant trader:
  const weights = {
    winRate: 0.25,
    edge: 0.30,
    sample: 0.20,
    kelly: 0.15,
    decay: 0.10,
  };

  const score = Math.round(
    winRateScore * weights.winRate +
    edgeScore    * weights.edge    +
    sampleScore  * weights.sample  +
    kellyScore   * weights.kelly   +
    decayScore   * weights.decay
  );

  return {
    score,
    ...gradeFromScore(score),
    components: {
      winRate:  Math.round(winRateScore),
      edge:     Math.round(edgeScore),
      sample:   Math.round(sampleScore),
      kelly:    Math.round(kellyScore),
      decay:    Math.round(decayScore),
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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
