/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LiteratureAndMetricsSection } from './components/LiteratureAndMetricsSection';
import { ReferenceCodeAndBigOSection } from './components/ReferenceCodeAndBigOSection';
import { RootCauseSolutionsSection } from './components/RootCauseSolutionsSection';
import { CanadianToddlerSection } from './components/CanadianToddlerSection';
import { TaiwanGithubUploadSection } from './components/TaiwanGithubUploadSection';
import { LiveVoiceCoachModal } from './components/LiveVoiceCoachModal';
import { Mic, ArrowRight } from 'lucide-react';

export default function App() {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [voiceInitialPrompt, setVoiceInitialPrompt] = useState<string | undefined>(undefined);

  const handleOpenVoiceWithPrompt = (prompt?: string) => {
    setVoiceInitialPrompt(prompt);
    setIsVoiceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
          >
            Qisda Robotics Vision R&amp;D
          </a>

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav aria-label="Primary sections" className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
            <a
              href="#literature"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Literature
            </a>
            <a
              href="#reference-code"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Reference Code
            </a>
            <a
              href="#root-causes"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Root Causes
            </a>
            <a
              href="#canadian-guide"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Canadian Guide
            </a>
            <a
              href="#github-law"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              GitHub Law
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleOpenVoiceWithPrompt()}
              className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Live Voice Coach</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container (1440px desktop baseline, 1280px max-w-7xl) */}
      <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Overview */}
        <section className="py-10 border-b border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-500 mb-3">
                  <span>Qisda Corporation (BenQ-Qisda Group)</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>Machine Vision Product Center</span>
                  <span className="mx-2" aria-hidden="true">·</span>
                  <span>Guishan Industrial Park, Taoyuan, Taiwan</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
                  Autonomous Robotics Vision, Whole-Body Control &amp; Clean-Room Compliance Suite
                </h1>
                <p className="text-base text-slate-600 max-w-3xl leading-relaxed mb-6">
                  An end-to-end engineering workbench for the <strong>Robotics R&amp;D Engineer (Machine Vision Product Center)</strong> specification.
                  Built strictly from peer-reviewed CVPR, ICCV, ECCV, NeurIPS, and ICRA papers (2022–2025), official
                  PyTorch 2.4, TensorFlow 2.17, and OpenCV 4.10 reference patterns, Canadian English toddler analogies,
                  and Taiwan Trade Secrets Act (Art. 2, 10, 13-1) &amp; Copyright Act (Art. 10-1, 11) compliance checks.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#reference-code"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Inspect Official Python &amp; Big-O</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href="#canadian-guide"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Read Canadian Toddler Guide, eh!</span>
                </a>
                <a
                  href="#github-law"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Taiwan Law &amp; GitHub Uploader</span>
                </a>
              </div>
            </div>

            {/* Right: Summary Spec Card */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-3">
                  Hardware &amp; Software Integration Scope
                </h2>
                <dl className="space-y-2.5 text-xs border-t border-slate-100 pt-3">
                  <div>
                    <dt className="font-semibold text-slate-900">Optical &amp; SLAM Sensors</dt>
                    <dd className="text-slate-600 mt-0.5">
                      3D LiDAR · RGB Camera · Depth Camera · LWIR Thermal Camera · 6-Axis IMU
                    </dd>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <dt className="font-semibold text-slate-900">Mechanical &amp; Digital Twin</dt>
                    <dd className="text-slate-600 mt-0.5">
                      Pro/E (Creo) CAD · Pixar OpenUSD Standard · NVIDIA Isaac Lab Sim-to-Real
                    </dd>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <dt className="font-semibold text-slate-900">Electronic, Control &amp; Comms</dt>
                    <dd className="text-slate-600 mt-0.5">
                      NVIDIA Jetson AGX Orin · 1kHz EtherCAT · Integrated Joint · BMS Power/Thermal · Linux/ROS 2 (C++/Python)
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs text-slate-500 font-mono tabular-nums">
                <span className="whitespace-nowrap">6 Peer-Reviewed Papers</span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">3 Root-Cause Proofs</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 01: Peer-Reviewed Literature & De-Biased Evaluation Simulator */}
        <LiteratureAndMetricsSection />

        {/* Section 02: Official Reference Python Code & Big-O Complexity Profiler */}
        <ReferenceCodeAndBigOSection />

        {/* Section 03: Root Cause Identification & 3 Theoretically Grounded Solutions */}
        <RootCauseSolutionsSection />

        {/* Section 04: Canadian Toddler Explanation */}
        <CanadianToddlerSection onOpenVoiceWithPrompt={handleOpenVoiceWithPrompt} />

        {/* Section 05: Taiwan Law Compliance & Direct GitHub Upload */}
        <TaiwanGithubUploadSection />
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Qisda Robotics Vision &amp; Whole-Body Control R&amp;D Reference Workbench · Clean-Room Academic Implementation
          </div>
          <div className="flex items-center gap-4">
            <a href="#literature" className="hover:text-slate-900">Literature Matrix</a>
            <span aria-hidden="true">·</span>
            <a href="#reference-code" className="hover:text-slate-900">Python &amp; Big-O</a>
            <span aria-hidden="true">·</span>
            <a href="#github-law" className="hover:text-slate-900">Taiwan Legal Audit</a>
          </div>
        </div>
      </footer>

      {/* Gemini 3.8 Live Real-Time Voice Conversation Modal */}
      <LiveVoiceCoachModal
        isOpen={isVoiceModalOpen}
        initialPrompt={voiceInitialPrompt}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}
