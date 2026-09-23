/**
 * Section 14 - Security Scoring
 * Computes a 0-100 score from a list of scan findings, weighted by severity.
 * Info-level findings do not count against the score.
 */
const SEVERITY_WEIGHTS = {
  Critical: 20,
  High: 10,
  Medium: 5,
  Low: 2,
  Info: 0,
};

function computeSecurityScore(findings) {
  if (!Array.isArray(findings) || findings.length === 0) {
    return 100;
  }

  const totalDeduction = findings.reduce((sum, finding) => {
    const weight = SEVERITY_WEIGHTS[finding.severity] ?? 0;
    return sum + weight;
  }, 0);

  const score = Math.max(0, 100 - totalDeduction);
  return score;
}

function scoreToCategory(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  if (score >= 25) return 'High Risk';
  return 'Critical';
}

function summarizeSeverities(findings) {
  const summary = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
  for (const f of findings) {
    if (summary[f.severity] !== undefined) {
      summary[f.severity] += 1;
    }
  }
  return summary;
}

module.exports = { computeSecurityScore, scoreToCategory, summarizeSeverities, SEVERITY_WEIGHTS };
