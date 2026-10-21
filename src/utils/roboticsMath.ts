/**
 * Pure mathematical and algorithmic utilities for:
 * 1. Bias-free evaluation under class imbalance and spatio-temporal data leakage
 * 2. Big-O computational complexity and PyTorch VRAM footprint estimation
 * 3. Taiwan Legal Compliance (Trade Secrets Act, Copyright Act, PDPA) sanitization & audit
 */

export interface EvaluationMetricsInput {
  totalSamples: number;
  positivePrevalence: number; // e.g. 0.01 (1% rare safety-critical obstacle / thermal anomaly)
  truePositiveRate: number;   // Sensitivity on clean spatio-temporal split (0..1)
  trueNegativeRate: number;   // Specificity on clean spatio-temporal split (0..1)
  leakageFactor: number;      // 0 = strict spatio-temporal block split, >0 = random frame split leakage (0..1)
}

export interface EvaluationMetricsResult {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  naiveAccuracy: number;
  balancedAccuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mcc: number;
  prAucApprox: number;
  leakageInflationDeltaMcc: number;
  illusionGap: number; // Naive Accuracy minus MCC (shows how misleading accuracy is under imbalance)
}

/**
 * Computes confusion matrix and bias-free metrics (MCC, Balanced Accuracy, F1, PR-AUC)
 * and quantifies the evaluation bias introduced by spatio-temporal frame leakage.
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export function computeBiasFreeMetrics(input: EvaluationMetricsInput): EvaluationMetricsResult {
  const N = Math.max(100, Math.round(input.totalSamples));
  const pi = Math.min(0.999, Math.max(0.0005, input.positivePrevalence));
  const cleanTpr = Math.min(0.999, Math.max(0.01, input.truePositiveRate));
  const cleanTnr = Math.min(0.999, Math.max(0.01, input.trueNegativeRate));
  const leak = Math.min(1.0, Math.max(0.0, input.leakageFactor));

  const P = Math.max(1, Math.round(N * pi));
  const Neg = Math.max(1, N - P);

  // Clean evaluation (strict sequence/session-level split)
  const cleanTp = P * cleanTpr;
  const cleanFn = P - cleanTp;
  const cleanTn = Neg * cleanTnr;
  const cleanFp = Neg - cleanTn;

  const cleanMcc = calculateMcc(cleanTp, cleanFp, cleanTn, cleanFn);

  // Observed evaluation (if random frame-level split leaks adjacent ROS2 bag frames at 30Hz)
  const effTpr = cleanTpr + leak * (0.998 - cleanTpr);
  const effTnr = cleanTnr + leak * (0.999 - cleanTnr);

  const tp = Math.round(P * effTpr);
  const fn = Math.max(0, P - tp);
  const tn = Math.round(Neg * effTnr);
  const fp = Math.max(0, Neg - tn);

  const naiveAccuracy = (tp + tn) / (tp + fp + tn + fn);
  const recall = tp / Math.max(1, tp + fn);
  const specificity = tn / Math.max(1, tn + fp);
  const balancedAccuracy = 0.5 * (recall + specificity);
  const precision = tp / Math.max(1, tp + fp);
  const f1Score =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const mcc = calculateMcc(tp, fp, tn, fn);

  // Approximate PR-AUC under binormal/beta threshold integration
  const prAucApprox = Math.min(1, Math.max(0, 0.5 * (precision + recall) * (0.85 + 0.15 * specificity)));

  return {
    tp,
    fp,
    tn,
    fn,
    naiveAccuracy,
    balancedAccuracy,
    precision,
    recall,
    f1Score,
    mcc,
    prAucApprox,
    leakageInflationDeltaMcc: Math.max(0, mcc - cleanMcc),
    illusionGap: naiveAccuracy - mcc,
  };
}

export function calculateMcc(tp: number, fp: number, tn: number, fn: number): number {
  const num = tp * tn - fp * fn;
  const den = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  if (den === 0) return 0;
  return num / den;
}

export interface ComplexityProfileInput {
  numLidarPoints: number;     // N, e.g. 120,000 points per scan
  bevGridSize: number;        // G = G_x * G_y, e.g. 200 * 200 = 40,000 cells
  featureDim: number;         // C, e.g. 128 channels
  mpcHorizon: number;         // T, e.g. 40 steps
  stateDim: number;           // d_x, e.g. 36 (18-DoF robot pos + vel)
  controlDim: number;         // d_u, e.g. 18 joint torques
  inferenceIterations: number;// K, e.g. 1,000 control cycles
}

export interface ComplexityProfileResult {
  sparseBevOps: number;
  naiveCrossAttentionOps: number;
  speedupFactor: number;
  riccatiMpcOps: number;
  naiveBatchQpOps: number;
  mpcSpeedupFactor: number;
  zeroCopyVramMb: number;
  leakedGraphVramMb: number;
}

/**
 * Computes asymptotic operation counts and VRAM footprint comparing official
 * vectorised/zero-copy implementations against common anti-patterns.
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export function computeComplexityProfile(input: ComplexityProfileInput): ComplexityProfileResult {
  const N = Math.max(1000, input.numLidarPoints);
  const G = Math.max(100, input.bevGridSize);
  const C = Math.max(16, input.featureDim);
  const T = Math.max(5, input.mpcHorizon);
  const dx = Math.max(6, input.stateDim);
  const du = Math.max(6, input.controlDim);
  const K = Math.max(1, input.inferenceIterations);

  // Official Sparse Pillar Scatter + Deformable BEV Fusion: O(N * C + G * C * K_deform) where K_deform = 8
  const sparseBevOps = N * C + G * C * 8;
  // Anti-pattern: Naive dense point-to-BEV pairwise attention: O(N * G * C)
  const naiveCrossAttentionOps = N * G * C;
  const speedupFactor = naiveCrossAttentionOps / Math.max(1, sparseBevOps);

  // Official Riccati recursion for Whole-Body MPC (Crocoddyl / Pinocchio / PyTorch LQR): O(T * (dx^3 + dx^2 * du))
  const riccatiMpcOps = T * (Math.pow(dx, 3) + Math.pow(dx, 2) * du);
  // Anti-pattern: Unrolled dense KKT matrix inversion over full horizon: O((T * (dx + du))^3)
  const naiveBatchQpOps = Math.pow(T * (dx + du), 3);
  const mpcSpeedupFactor = naiveBatchQpOps / Math.max(1, riccatiMpcOps);

  // Memory footprint in FP16/FP32 (bytes -> MB)
  const singleStepActivationMb = ((N * C + G * C) * 4) / (1024 * 1024);
  const zeroCopyVramMb = Math.round((singleStepActivationMb + 48) * 10) / 10; // Constant O(1) temporal memory with torch.inference_mode()
  // Anti-pattern: appending tensors with grad_fn to a Python list without .detach() or torch.inference_mode() -> O(K) growth
  const leakedGraphVramMb = Math.round((48 + singleStepActivationMb * K * 0.35) * 10) / 10;

  return {
    sparseBevOps,
    naiveCrossAttentionOps,
    speedupFactor,
    riccatiMpcOps,
    naiveBatchQpOps,
    mpcSpeedupFactor,
    zeroCopyVramMb,
    leakedGraphVramMb,
  };
}

export interface LegalAuditInput {
  codeText: string;
  usedCompanyEquipment: boolean;
  containsInternalParams: boolean;
  licenseType: 'Apache-2.0' | 'MIT' | 'BSD-3-Clause';
}

export interface LegalViolation {
  statute: string;
  article: string;
  severity: 'CRITICAL' | 'WARNING';
  reason: string;
  remediation: string;
}

export interface LegalAuditResult {
  isCompliant: boolean;
  score: number;
  violations: LegalViolation[];
  sanitizedCode: string;
}

const PROPRIETARY_PATTERNS: Array<{ regex: RegExp; replacement: string; label: string }> = [
  {
    regex: /qisda[_\-\.]?(internal|secret|calib|proprietary|key)/gi,
    replacement: 'open_robotics_reference',
    label: 'Proprietary Qisda namespace / calibration identifier',
  },
  {
    regex: /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: '127.0.0.1',
    label: 'Internal corporate intranet IPv4 address (10.x.x.x)',
  },
  {
    regex: /\b192\.168\.\d{1,3}\.\d{1,3}\b/g,
    replacement: '127.0.0.1',
    label: 'Internal lab subnet IPv4 address (192.168.x.x)',
  },
  {
    regex: /[A-Z]\d{9}\b/g,
    replacement: 'REDACTED_ID',
    label: 'Taiwan National ID format (Personal Data Protection Act Art. 2)',
  },
];

/**
 * Audits source code and development provenance against Taiwan laws:
 * - Trade Secrets Act (營業秘密法 §§ 2, 10, 13-1)
 * - Copyright Act (著作權法 §§ 10-1, 11)
 * - Personal Data Protection Act (個人資料保護法 §§ 2, 19, 20)
 */
export function auditTaiwanLegalCompliance(input: LegalAuditInput): LegalAuditResult {
  const violations: LegalViolation[] = [];
  let sanitizedCode = input.codeText;

  if (input.usedCompanyEquipment) {
    violations.push({
      statute: 'Taiwan Copyright Act & Trade Secrets Act',
      article: 'Copyright Act Art. 11 / Trade Secrets Act Art. 3',
      severity: 'CRITICAL',
      reason:
        'Work created within scope of employment or using employer R&D resources defaults to employer economic copyright/trade secret ownership unless otherwise agreed in writing.',
      remediation:
        'Develop clean-room educational implementations strictly on personal hardware outside working hours using public datasets (KITTI, nuScenes, M2DGR).',
    });
  }

  if (input.containsInternalParams) {
    violations.push({
      statute: 'Taiwan Trade Secrets Act (R.O.C.)',
      article: 'Articles 2, 10, 13-1 (Criminal Liability)',
      severity: 'CRITICAL',
      reason:
        'Uploading factory-calibrated extrinsic matrices, unpublished CAD/USD tolerances, or private ROS2 bag logs violates secrecy and economic value protections.',
      remediation:
        'Replace all physical sensor intrinsics/extrinsics with synthetic SE(3) identity/nominal transforms and cite public CVPR/ICRA benchmarks.',
    });
  }

  for (const pat of PROPRIETARY_PATTERNS) {
    if (pat.regex.test(sanitizedCode)) {
      violations.push({
        statute: 'Taiwan Trade Secrets Act Art. 2 / PDPA Art. 2',
        article: 'Automated Pattern Detection',
        severity: 'WARNING',
        reason: `Detected restricted pattern: ${pat.label}`,
        remediation: `Automatically scrubbed and replaced with "${pat.replacement}".`,
      });
      sanitizedCode = sanitizedCode.replace(pat.regex, pat.replacement);
    }
  }

  const criticalCount = violations.filter((v) => v.severity === 'CRITICAL').length;
  const warningCount = violations.filter((v) => v.severity === 'WARNING').length;
  const score = Math.max(0, 100 - criticalCount * 45 - warningCount * 15);

  return {
    isCompliant: criticalCount === 0,
    score,
    violations,
    sanitizedCode,
  };
}
