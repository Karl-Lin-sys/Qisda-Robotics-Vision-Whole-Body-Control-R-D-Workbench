import React, { useState, useMemo } from 'react';
import { CODE_MODULES, CodeModuleSpec } from '../data/roboticsBenchmarkData';
import { computeComplexityProfile } from '../utils/roboticsMath';
import { Copy, Check, Cpu, Code2, ShieldAlert } from 'lucide-react';

export const ReferenceCodeAndBigOSection: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(CODE_MODULES[0].id);
  const [showAntiPatternDiff, setShowAntiPatternDiff] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Interactive Big-O & Memory Leak Profiler State
  const [numLidarPoints, setNumLidarPoints] = useState<number>(120000);
  const [bevGridCells, setBevGridCells] = useState<number>(65536); // 256 x 256
  const [mpcHorizon, setMpcHorizon] = useState<number>(40);
  const [inferenceCycles, setInferenceCycles] = useState<number>(600);

  const activeModule: CodeModuleSpec = useMemo(() => {
    return CODE_MODULES.find((m) => m.id === selectedModuleId) || CODE_MODULES[0];
  }, [selectedModuleId]);

  const complexityProfile = useMemo(() => {
    return computeComplexityProfile({
      numLidarPoints,
      bevGridSize: bevGridCells,
      featureDim: 64,
      mpcHorizon,
      stateDim: 36,
      controlDim: 18,
      inferenceIterations: inferenceCycles,
    });
  }, [numLidarPoints, bevGridCells, mpcHorizon, inferenceCycles]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(
        showAntiPatternDiff ? activeModule.antiPatternDiffCode : activeModule.cleanCode
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback if clipboard blocked in headless iframe
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <section id="reference-code" className="py-10 border-b border-slate-200">
      <div className="mb-8">
        <div className="text-xs font-medium text-slate-500 mb-2">
          <span>Official Documentation Reference</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>PyTorch 2.4 · TensorFlow 2.17 · OpenCV 4.10 · Pinocchio SE(3)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
          02. Zero-Leak Official Reference Python Code &amp; Big-O Complexity Analysis
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Constructed exclusively from official PyTorch, TensorFlow, and OpenCV documentation and reference
          implementations. Eliminates autograd graph retention leaks, synchronous CUDA host-device stalls
          (<code className="font-mono text-xs">.item()</code> inside control loops), unpinned DMA transfers,
          and unstable explicit matrix inversions.
        </p>
      </div>

      {/* Module Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div
          role="tablist"
          aria-label="Select Python reference implementation module"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
        >
          {CODE_MODULES.map((mod, idx) => {
            const isSelected = mod.id === activeModule.id;
            return (
              <button
                key={mod.id}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => setSelectedModuleId(mod.id)}
                className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {idx + 1}. {mod.framework}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAntiPatternDiff((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              showAntiPatternDiff
                ? 'bg-amber-900 text-white border-amber-900'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{showAntiPatternDiff ? 'Viewing Anti-Pattern Diff' : 'Compare Eliminated Bad Practices'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Python' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Code & Complexity Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
        {/* Header Metadata Bar */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{activeModule.title}</h3>
            <div className="text-xs text-slate-600 mt-1">
              <span>Target: {activeModule.targetRequirement}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span className="font-mono">Time: {activeModule.timeComplexity}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span className="font-mono">Space: {activeModule.spaceComplexity}</span>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {activeModule.officialDocRefs.join(' · ')}
          </div>
        </div>

        {/* Code Viewer */}
        <div className="bg-slate-950 text-slate-100 p-5 overflow-x-auto">
          <pre className="text-xs leading-relaxed font-mono">
            <code>{showAntiPatternDiff ? activeModule.antiPatternDiffCode : activeModule.cleanCode}</code>
          </pre>
        </div>

        {/* Function-Level Big-O Breakdown & Anti-Pattern Remediation Table */}
        <div className="divide-y divide-slate-200">
          {/* Top: Full-Width Function Big-O Table */}
          <div className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-3">
              <Code2 className="w-4 h-4 text-blue-700" />
              <span>Function-by-Function Asymptotic Complexity Analysis (Big-O)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-4 font-medium w-1/4">Function</th>
                    <th className="py-2.5 px-4 font-medium font-mono w-1/6">Time Complexity</th>
                    <th className="py-2.5 px-4 font-medium font-mono w-1/6">Space Complexity</th>
                    <th className="py-2.5 pl-4 font-medium">Derivation &amp; Vectorization Mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeModule.functionComplexities.map((fn) => (
                    <tr key={fn.funcName}>
                      <td className="py-3 pr-4 font-mono font-semibold text-slate-900 whitespace-nowrap align-top">
                        {fn.funcName}
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-800 whitespace-nowrap align-top">
                        {fn.timeBigO}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-800 whitespace-nowrap align-top">
                        {fn.spaceBigO}
                      </td>
                      <td className="py-3 pl-4 text-slate-600 leading-relaxed align-top">
                        {fn.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom: Eliminated Memory Leaks & Bad Practices */}
          <div className="p-5 bg-slate-50/60">
            <div className="text-xs font-semibold text-slate-900 mb-3">
              Eliminated Bad Practices &amp; Memory Leaks
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeModule.antiPatternsEliminated.map((ap, i) => (
                <div key={i} className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs flex flex-col justify-between">
                  <div>
                    <div className="font-semibold text-rose-800">
                      Eliminated: {ap.badPractice}
                    </div>
                    <div className="text-slate-600 mt-1.5">
                      <span className="font-medium text-slate-800">Failure Mode: </span>
                      {ap.symptom}
                    </div>
                  </div>
                  <div className="text-emerald-900 mt-2 pt-2 border-t border-slate-100">
                    <span className="font-semibold">Official Fix: </span>
                    {ap.officialFix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Asymptotic Operation & VRAM Leak Calculator */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1">
          <Cpu className="w-4 h-4 text-blue-700" />
          <span>Interactive Big-O Operation Counter &amp; PyTorch Autograd VRAM Leak Profiler</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mb-6">
          Adjust LiDAR scan density, BEV resolution, MPC horizon, and ROS2 runtime cycles to compare
          official sparse/Riccati algorithms against naive implementations and autograd graph memory leaks.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="input-lidar-pts">3D LiDAR Points per Scan (N)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {numLidarPoints.toLocaleString()} pts
                </span>
              </div>
              <input
                id="input-lidar-pts"
                type="range"
                min="20000"
                max="240000"
                step="10000"
                value={numLidarPoints}
                onChange={(e) => setNumLidarPoints(parseInt(e.target.value, 10))}
                className="w-full accent-blue-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="input-bev-cells">BEV Grid Cells (G = Gx × Gy)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {bevGridCells.toLocaleString()} cells
                </span>
              </div>
              <input
                id="input-bev-cells"
                type="range"
                min="10000"
                max="100000"
                step="5000"
                value={bevGridCells}
                onChange={(e) => setBevGridCells(parseInt(e.target.value, 10))}
                className="w-full accent-blue-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="input-mpc-horizon">Whole-Body MPC Horizon (T steps @ 1kHz)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {mpcHorizon} steps
                </span>
              </div>
              <input
                id="input-mpc-horizon"
                type="range"
                min="10"
                max="80"
                step="5"
                value={mpcHorizon}
                onChange={(e) => setMpcHorizon(parseInt(e.target.value, 10))}
                className="w-full accent-blue-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="input-cycles">Continuous Control Cycles (K)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {inferenceCycles.toLocaleString()} cycles
                </span>
              </div>
              <input
                id="input-cycles"
                type="range"
                min="100"
                max="2000"
                step="100"
                value={inferenceCycles}
                onChange={(e) => setInferenceCycles(parseInt(e.target.value, 10))}
                className="w-full accent-blue-700"
              />
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-500">BEV Fusion Speedup</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-blue-900 mt-1">
                  {Math.round(complexityProfile.speedupFactor).toLocaleString()}×
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  Sparse Scatter <code className="font-mono">O(N·C + G·C)</code> vs Dense Attention{' '}
                  <code className="font-mono">O(N·G·C)</code>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200 text-xs font-mono tabular-nums text-slate-500">
                Ops: {(complexityProfile.sparseBevOps / 1e6).toFixed(1)}M vs{' '}
                {(complexityProfile.naiveCrossAttentionOps / 1e9).toFixed(1)}B
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-500">Riccati Whole-Body MPC Speedup</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-800 mt-1">
                  {Math.round(complexityProfile.mpcSpeedupFactor).toLocaleString()}×
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  Riccati Recursion <code className="font-mono">O(T·dx³)</code> vs Dense Batch KKT{' '}
                  <code className="font-mono">O(T³·dx³)</code>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200 text-xs font-mono tabular-nums text-slate-500">
                Ops: {(complexityProfile.riccatiMpcOps / 1e6).toFixed(2)}M vs{' '}
                {(complexityProfile.naiveBatchQpOps / 1e9).toFixed(2)}B
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-500">Jetson VRAM Footprint (@ {inferenceCycles} steps)</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {complexityProfile.zeroCopyVramMb} MB
                </div>
                <div className="text-xs text-emerald-800 font-medium mt-1">
                  Constant O(1) w/ @torch.inference_mode
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200 text-xs font-mono tabular-nums text-rose-700">
                Un-detached Leak: {complexityProfile.leakedGraphVramMb.toLocaleString()} MB (OOM!)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
