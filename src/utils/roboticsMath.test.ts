import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBiasFreeMetrics,
  calculateMcc,
  computeComplexityProfile,
  auditTaiwanLegalCompliance,
} from './roboticsMath';

test('calculateMcc returns 1 for perfect predictions and 0 for degenerate classifiers', () => {
  assert.equal(calculateMcc(100, 0, 900, 0), 1);
  assert.equal(calculateMcc(0, 0, 900, 100), 0);
});

test('computeBiasFreeMetrics exposes naive accuracy illusion under extreme class imbalance', () => {
  const res = computeBiasFreeMetrics({
    totalSamples: 10000,
    positivePrevalence: 0.01, // 1% rare obstacle class
    truePositiveRate: 0.5,    // misses half of obstacles
    trueNegativeRate: 0.99,   // high background specificity
    leakageFactor: 0,
  });

  // Naive accuracy is > 98%, yet MCC is much lower (< 0.5), proving why MCC is required
  assert.ok(res.naiveAccuracy > 0.98);
  assert.ok(res.mcc < 0.5);
  assert.ok(res.illusionGap > 0.5);
  assert.equal(res.leakageInflationDeltaMcc, 0);
});

test('computeBiasFreeMetrics quantifies spatio-temporal leakage inflation', () => {
  const leaked = computeBiasFreeMetrics({
    totalSamples: 10000,
    positivePrevalence: 0.02,
    truePositiveRate: 0.75,
    trueNegativeRate: 0.98,
    leakageFactor: 0.6, // 60% adjacent frame leakage
  });

  assert.ok(leaked.leakageInflationDeltaMcc > 0.05);
});

test('computeComplexityProfile verifies O(N*C + G*C) sparse BEV speedup over naive cross-attention', () => {
  const profile = computeComplexityProfile({
    numLidarPoints: 100000,
    bevGridSize: 40000,
    featureDim: 64,
    mpcHorizon: 30,
    stateDim: 24,
    controlDim: 12,
    inferenceIterations: 500,
  });

  assert.ok(profile.speedupFactor > 1000);
  assert.ok(profile.mpcSpeedupFactor > 100);
  assert.ok(profile.leakedGraphVramMb > profile.zeroCopyVramMb * 5);
});

test('auditTaiwanLegalCompliance flags company equipment and scrubs internal identifiers', () => {
  const failAudit = auditTaiwanLegalCompliance({
    codeText: 'host = "192.168.10.45"\ncalib = "qisda_secret_extrinsics"',
    usedCompanyEquipment: true,
    containsInternalParams: false,
    licenseType: 'Apache-2.0',
  });

  assert.equal(failAudit.isCompliant, false);
  assert.ok(failAudit.sanitizedCode.includes('127.0.0.1'));
  assert.ok(failAudit.sanitizedCode.includes('open_robotics_reference'));

  const cleanAudit = auditTaiwanLegalCompliance({
    codeText: 'import torch\n# Clean-room implementation based on CVPR 2024',
    usedCompanyEquipment: false,
    containsInternalParams: false,
    licenseType: 'Apache-2.0',
  });

  assert.equal(cleanAudit.isCompliant, true);
  assert.equal(cleanAudit.score, 100);
});
