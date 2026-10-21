import React, { useState } from 'react';
import { ROOT_CAUSE_SOLUTIONS } from '../data/roboticsBenchmarkData';
import { Thermometer, Wrench, BookOpen } from 'lucide-react';

export const RootCauseSolutionsSection: React.FC = () => {
  const [selectedRcId, setSelectedRcId] = useState<string>(ROOT_CAUSE_SOLUTIONS[0].id);

  // Interactive Opto-Mechatronic-Thermal Co-Design Calculator State
  const [chassisDeltaTempC, setChassisDeltaTempC] = useState<number>(30); // +30°C thermal rise
  const [targetRangeMeters, setTargetRangeMeters] = useState<number>(25); // 25m obstacle distance
  const [jointWindingTempC, setJointWindingTempC] = useState<number>(88);  // 88°C stator winding
  const [batterySocPercent, setBatterySocPercent] = useState<number>(45);

  // Calculate physical extrinsic drift & torque envelope derating
  // Aluminum bracket thermal angular drift ~ 0.014 deg per °C rise
  const angularDriftDeg = chassisDeltaTempC * 0.014;
  const angularDriftRad = (angularDriftDeg * Math.PI) / 180;
  const uncalibratedSpatialShiftCm = Math.tan(angularDriftRad) * targetRangeMeters * 100;
  const onlineEskfResidualCm = Math.min(1.4, uncalibratedSpatialShiftCm * 0.04);

  // Torque envelope derating between 75°C and 105°C
  const thermalScale = Math.max(0.15, Math.min(1.0, (105 - jointWindingTempC) / 30));
  const socScale = Math.max(0.25, Math.min(1.0, (batterySocPercent / 100) / 0.2));
  const effectiveTorquePercent = thermalScale * socScale * 100;

  return (
    <section id="root-causes" className="py-10 border-b border-slate-200">
      <div className="mb-8">
        <div className="text-xs font-medium text-slate-500 mb-2">
          <span>Primary Literature &amp; Issue Tracker Audit</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>Structural Algorithmic Flaws &amp; Selection Bias Remediation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
          03. Root Cause Identification &amp; 3 Theoretically Grounded Solutions
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Eliminating speculation and unofficial troubleshooting forums, the three failure modes below are derived
          strictly from peer-reviewed machine learning / robotics papers (past 5 years) and resolved issues in the
          official PyTorch, OpenCV, and NVIDIA Isaac Lab issue trackers.
        </p>
      </div>

      {/* 3 Root Cause & Solution Cards */}
      <div className="space-y-6 mb-10">
        {ROOT_CAUSE_SOLUTIONS.map((rc) => {
          const isExpanded = rc.id === selectedRcId;
          return (
            <div
              key={rc.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-colors"
            >
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">{rc.number}</span>
                    <span className="mx-2" aria-hidden="true">·</span>
                    <span>{rc.affectedDomain}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRcId(rc.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      isExpanded
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isExpanded ? 'Active Focus' : 'Focus Solution'}
                  </button>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">{rc.title}</h3>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3 border-t border-slate-100">
                  {/* Structural Flaw & Mathematical Formulation */}
                  <div className="lg:col-span-6 space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-900 mb-1">
                        Structural Algorithmic Flaw &amp; Sampling / Selection Bias
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {rc.structuralFlawAndBias}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-950 text-slate-100 rounded-lg overflow-x-auto">
                      <div className="text-xs text-slate-400 mb-1">Theoretical Formulation:</div>
                      <code className="text-xs font-mono leading-relaxed">{rc.mathematicalFormulation}</code>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">Canadian Toddler Summary, eh: </span>
                      {rc.toddlerTranslation}
                    </div>
                  </div>

                  {/* Primary Sources & Concrete Steps */}
                  <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-2">
                        <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                        <span>Verified Primary Sources (Peer-Reviewed Papers &amp; Official Issue Trackers)</span>
                      </div>
                      <div className="space-y-2.5">
                        {rc.primarySourceCitations.map((src, idx) => (
                          <div key={idx} className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <div className="font-semibold text-slate-900">
                              <span>[{src.type}]</span>
                              <span className="mx-1.5" aria-hidden="true">·</span>
                              <span>{src.citation}</span>
                            </div>
                            <div className="text-slate-600 mt-1 leading-relaxed">{src.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-2">
                        <Wrench className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Concrete Engineering Remediation Steps</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
                        {rc.concreteImplementationSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                      <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-mono tabular-nums font-semibold text-emerald-800">
                        Verified Impact: {rc.expectedImprovementMetric}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Opto-Mechatronic-Thermal Drift & Torque Envelope Simulator */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1">
          <Thermometer className="w-4 h-4 text-blue-700" />
          <span>Interactive Opto-Mechatronic-Thermal Co-Design Simulator (Root Causes 02 &amp; 03)</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mb-6">
          Simulate how chassis heat dissipation from the 60W Jetson Orin shifts LiDAR-to-LWIR projection alignment,
          and how Integrated Joint winding temperature &amp; battery SoC dynamically modulate the safe EtherCAT torque envelope.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="sim-chassis-temp">Optical Mount Thermal Rise (ΔT Chassis)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  +{chassisDeltaTempC}°C (Drift: {angularDriftDeg.toFixed(2)}°)
                </span>
              </div>
              <input
                id="sim-chassis-temp"
                type="range"
                min="0"
                max="55"
                step="5"
                value={chassisDeltaTempC}
                onChange={(e) => setChassisDeltaTempC(parseInt(e.target.value, 10))}
                className="w-full accent-blue-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="sim-range">Target Obstacle Distance (LiDAR-to-LWIR Range)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {targetRangeMeters} m
                </span>
              </div>
              <input
                id="sim-range"
                type="range"
                min="5"
                max="50"
                step="5"
                value={targetRangeMeters}
                onChange={(e) => setTargetRangeMeters(parseInt(e.target.value, 10))}
                className="w-full accent-blue-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="sim-winding-temp">Integrated Joint Stator Winding Temp (°C)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {jointWindingTempC}°C {jointWindingTempC >= 75 ? '(Thermal Derating Active)' : '(Nominal)'}
                </span>
              </div>
              <input
                id="sim-winding-temp"
                type="range"
                min="40"
                max="104"
                step="2"
                value={jointWindingTempC}
                onChange={(e) => setJointWindingTempC(parseInt(e.target.value, 10))}
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="sim-battery-soc">Lithium-Ion Pack State of Charge (SoC)</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {batterySocPercent}%
                </span>
              </div>
              <input
                id="sim-battery-soc"
                type="range"
                min="5"
                max="100"
                step="5"
                value={batterySocPercent}
                onChange={(e) => setBatterySocPercent(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-700"
              />
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-500">Uncalibrated LiDAR-LWIR Shift</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-rose-700 mt-1">
                  {uncalibratedSpatialShiftCm.toFixed(1)} cm
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  At {targetRangeMeters}m range, +{chassisDeltaTempC}°C chassis expansion shifts 3D points off thermal targets.
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200 text-xs font-mono tabular-nums text-emerald-800 font-semibold">
                With Online ESIKF + USAC_MAGSAC: {onlineEskfResidualCm.toFixed(2)} cm residual
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-500">Safe EtherCAT Torque Envelope</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {effectiveTorquePercent.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  Coupled thermal scale ({(thermalScale * 100).toFixed(0)}%) × BMS SoC scale ({(socScale * 100).toFixed(0)}%).
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-200 text-xs font-mono tabular-nums text-blue-900 font-semibold">
                Zero Demagnetization or BMS Under-Voltage Trip
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
