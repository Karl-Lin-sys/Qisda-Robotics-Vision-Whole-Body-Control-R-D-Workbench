import React, { useState, useMemo } from 'react';
import { CONFERENCE_PAPERS, QISDA_JOB_SUMMARY, ConferencePaper } from '../data/roboticsBenchmarkData';
import { computeBiasFreeMetrics } from '../utils/roboticsMath';
import { CheckCircle2, AlertTriangle, ExternalLink, Sliders } from 'lucide-react';

export const LiteratureAndMetricsSection: React.FC = () => {
  const [selectedSubsystem, setSelectedSubsystem] = useState<'all' | 'perception' | 'control' | 'hardware'>('all');
  const [selectedPaperId, setSelectedPaperId] = useState<string>(CONFERENCE_PAPERS[0].id);

  // Interactive Bias-Free & Leakage Simulator State
  const [prevalencePercent, setPrevalencePercent] = useState<number>(1.0); // 1% rare safety hazard
  const [cleanTprPercent, setCleanTprPercent] = useState<number>(62.0);
  const [cleanTnrPercent, setCleanTnrPercent] = useState<number>(99.2);
  const [leakagePercent, setLeakagePercent] = useState<number>(0.0); // 0% = strict block split

  const filteredPapers = useMemo(() => {
    if (selectedSubsystem === 'all') return CONFERENCE_PAPERS;
    return CONFERENCE_PAPERS.filter((p) => p.subsystem === selectedSubsystem);
  }, [selectedSubsystem]);

  const activePaper: ConferencePaper = useMemo(() => {
    return (
      filteredPapers.find((p) => p.id === selectedPaperId) ||
      filteredPapers[0] ||
      CONFERENCE_PAPERS[0]
    );
  }, [filteredPapers, selectedPaperId]);

  const metrics = useMemo(() => {
    return computeBiasFreeMetrics({
      totalSamples: 20000,
      positivePrevalence: prevalencePercent / 100,
      truePositiveRate: cleanTprPercent / 100,
      trueNegativeRate: cleanTnrPercent / 100,
      leakageFactor: leakagePercent / 100,
    });
  }, [prevalencePercent, cleanTprPercent, cleanTnrPercent, leakagePercent]);

  return (
    <section id="literature" className="py-10 border-b border-slate-200">
      {/* Job Spec Mapping Header */}
      <div className="mb-8">
        <div className="text-xs font-medium text-slate-500 mb-2">
          <span>Target Specification</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>{QISDA_JOB_SUMMARY.company}</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>{QISDA_JOB_SUMMARY.location}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
          01. Peer-Reviewed Technology Selection &amp; Bias-Free Evaluation Matrix
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Grounded exclusively in peer-reviewed papers from top-tier conferences within the past 3 years
          (CVPR, ICCV, ECCV, NeurIPS, ICRA, RSS) and high-reproducibility open-source repositories.
          All architectures are evaluated under strict spatio-temporal block partitioning and class-imbalance-aware
          Matthews Correlation Coefficient (MCC) and Precision-Recall AUC (PR-AUC).
        </p>
      </div>

      {/* 3 Core Engineering Pillars mapped from Qisda Job Description */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {QISDA_JOB_SUMMARY.pillars.map((pillar) => (
          <div
            key={pillar.id}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{pillar.name}</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {pillar.targetIndustries}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900">Required Stack: </span>
              {pillar.sensors.join(' · ')}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Subsystem Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div
          role="group"
          aria-label="Filter papers by robotics subsystem"
          className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
        >
          {(
            [
              { id: 'all', label: 'All Subsystems (6)' },
              { id: 'perception', label: 'Perception & SLAM (3)' },
              { id: 'control', label: 'Motion & Whole-Body Control (2)' },
              { id: 'hardware', label: 'USD Digital Twin & Hardware (1)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedSubsystem(tab.id);
                const firstMatch =
                  tab.id === 'all'
                    ? CONFERENCE_PAPERS[0]
                    : CONFERENCE_PAPERS.find((p) => p.subsystem === tab.id);
                if (firstMatch) setSelectedPaperId(firstMatch.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedSubsystem === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-mono tabular-nums">
          Evaluation Standard: Disjoint Sequence Split · MCC &amp; PR-AUC · Jetson AGX Orin FP16 Latency
        </div>
      </div>

      {/* High-Density Peer-Reviewed Literature Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Subsystem &amp; Architecture</th>
                <th className="py-3 px-4">Venue &amp; Year</th>
                <th className="py-3 px-4">Official GitHub &amp; Reproducibility</th>
                <th className="py-3 px-4">Qisda Hardware / Sensor Mapping</th>
                <th className="py-3 px-4 text-right font-mono tabular-nums">OOD MCC</th>
                <th className="py-3 px-4 text-right font-mono tabular-nums">PR-AUC</th>
                <th className="py-3 px-4 text-right font-mono tabular-nums">Orin Latency</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {filteredPapers.map((paper) => {
                const isSelected = paper.id === activePaper.id;
                return (
                  <tr
                    key={paper.id}
                    onClick={() => setSelectedPaperId(paper.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{paper.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{paper.subsystemLabel}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-700">
                      <span>{paper.venue}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{paper.year}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-mono text-slate-800">{paper.githubRepo}</div>
                      <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                        {paper.githubStars} · Verified Official
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {paper.qisdaSensorsOrTech.join(' · ')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {paper.mccScore.toFixed(3)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {paper.prAucScore.toFixed(3)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {paper.latencyMsJetsonOrin.toFixed(1)} ms
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPaperId(paper.id);
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Details'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Paper Architectural Rationale & Leakage Defense */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <div className="text-xs text-slate-500 mb-1">
              <span>Selected Architecture Deep-Dive</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span className="font-mono">{activePaper.githubRepo}</span>
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">{activePaper.title}</h4>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">{activePaper.whySelected}</p>
            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
              <div>
                <span className="font-semibold text-slate-900">Data Leakage Defense: </span>
                {activePaper.leakageDefense}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Imbalance-Unbiased Metric: </span>
                {activePaper.imbalanceMetric}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-lg p-4">
            <div>
              <div className="text-xs font-semibold text-slate-900 mb-1">
                Canadian Toddler Translation, eh!
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                “{activePaper.canadianToddlerSummary}”
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono tabular-nums">
                Jetson Orin Budget: {activePaper.latencyMsJetsonOrin}ms / 33.3ms (30Hz)
              </span>
              <a
                href={`https://github.com/${activePaper.githubRepo.split(' ')[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0"
              >
                <span>GitHub Reference</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Bias-Free Evaluation & Spatio-Temporal Leakage Simulator */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1">
              <Sliders className="w-4 h-4 text-blue-700" />
              <span>Interactive De-Biased Evaluation Laboratory (Eliminating Accuracy Illusions &amp; ROSbag Leakage)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
              Test how rare obstacle class imbalance (e.g., 1% thermal human hazard or forklift tine in factory BEV)
              creates a false &gt;98% Naive Accuracy illusion, and how random 30Hz ROSbag frame splitting artificially
              inflates validation scores compared to strict spatio-temporal quarantine splitting.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPrevalencePercent(0.8);
                setCleanTprPercent(55.0);
                setCleanTnrPercent(99.4);
                setLeakagePercent(0.0);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Preset: Rare LWIR Obstacle (0.8%)
            </button>
            <button
              type="button"
              onClick={() => {
                setPrevalencePercent(1.0);
                setCleanTprPercent(62.0);
                setCleanTnrPercent(99.2);
                setLeakagePercent(65.0);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Simulate 65% ROSbag Frame Leakage
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          {/* Sliders */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="slider-prevalence">Target Hazard Class Prevalence (π)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {prevalencePercent.toFixed(1)}% ({Math.round(20000 * (prevalencePercent / 100))} / 20,000 frames)
                </span>
              </div>
              <input
                id="slider-prevalence"
                type="range"
                min="0.2"
                max="25.0"
                step="0.2"
                value={prevalencePercent}
                onChange={(e) => setPrevalencePercent(parseFloat(e.target.value))}
                className="w-full accent-blue-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="slider-tpr">True OOD Obstacle Recall / Sensitivity (TPR)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {cleanTprPercent.toFixed(1)}%
                </span>
              </div>
              <input
                id="slider-tpr"
                type="range"
                min="10.0"
                max="99.5"
                step="0.5"
                value={cleanTprPercent}
                onChange={(e) => setCleanTprPercent(parseFloat(e.target.value))}
                className="w-full accent-blue-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="slider-tnr">True Background Specificity (TNR)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {cleanTnrPercent.toFixed(1)}%
                </span>
              </div>
              <input
                id="slider-tnr"
                type="range"
                min="85.0"
                max="99.9"
                step="0.1"
                value={cleanTnrPercent}
                onChange={(e) => setCleanTnrPercent(parseFloat(e.target.value))}
                className="w-full accent-blue-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="slider-leakage">Spatio-Temporal Frame Leakage Factor (λ)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {leakagePercent.toFixed(0)}% {leakagePercent === 0 ? '(Strict Quarantine Split)' : '(Leaked Random Split)'}
                </span>
              </div>
              <input
                id="slider-leakage"
                type="range"
                min="0"
                max="90"
                step="5"
                value={leakagePercent}
                onChange={(e) => setLeakagePercent(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>
          </div>

          {/* Computed Metrics & Diagnostic Verdict */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Naive Accuracy (Biased)</div>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {(metrics.naiveAccuracy * 100).toFixed(2)}%
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  Swamped by {metrics.tn.toLocaleString()} TNs
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200">
                <div className="text-xs font-semibold text-blue-950">Matthews Corr. (MCC)</div>
                <div className="text-xl font-bold font-mono tabular-nums text-blue-900 mt-1">
                  {metrics.mcc.toFixed(3)}
                </div>
                <div className="text-xs text-blue-800 mt-1">
                  Unbiased [-1, +1] Gate
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">PR-AUC (Rare Class)</div>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {metrics.prAucApprox.toFixed(3)}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Precision: {(metrics.precision * 100).toFixed(1)}%
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Illusion Gap (Acc − MCC)</div>
                <div className="text-xl font-bold font-mono tabular-nums text-rose-700 mt-1">
                  +{(metrics.illusionGap * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  FN Missed: {metrics.fn} hazards
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center justify-between font-mono tabular-nums border-b border-slate-200 pb-2">
                <span>Confusion Matrix (N = 20,000):</span>
                <span>
                  TP: <strong>{metrics.tp}</strong> · FP: <strong>{metrics.fp}</strong> · TN:{' '}
                  <strong>{metrics.tn}</strong> · FN: <strong>{metrics.fn}</strong>
                </span>
              </div>
              {leakagePercent > 0 ? (
                <div className="flex items-start gap-2 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Data Leakage Warning:</strong> Random frame splitting at {leakagePercent}% temporal
                    correlation artificially inflates MCC by{' '}
                    <span className="font-mono tabular-nums font-bold">
                      +{metrics.leakageInflationDeltaMcc.toFixed(3)}
                    </span>
                    . Enforce <code className="font-mono">spatio_temporal_quarantine_split(quarantine_buffer_sec=10.0)</code>.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Zero Spatio-Temporal Leakage Verified:</strong> Validation uses strict block-disjoint
                    sequences. Notice how Naive Accuracy reads {(metrics.naiveAccuracy * 100).toFixed(2)}% while
                    MCC exposes the true detection quality ({metrics.mcc.toFixed(3)}).
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
