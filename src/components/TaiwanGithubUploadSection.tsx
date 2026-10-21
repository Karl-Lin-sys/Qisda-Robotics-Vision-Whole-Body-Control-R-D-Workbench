import React, { useState, useMemo } from 'react';
import { TAIWAN_LAW_STATUTES, CODE_MODULES } from '../data/roboticsBenchmarkData';
import { auditTaiwanLegalCompliance } from '../utils/roboticsMath';
import { Scale, UploadCloud, CheckCircle2, AlertTriangle, Download, FileCode } from 'lucide-react';

export const TaiwanGithubUploadSection: React.FC = () => {
  // Taiwan Legal Compliance Audit Controls
  const [usedCompanyEquipment, setUsedCompanyEquipment] = useState<boolean>(false);
  const [containsInternalParams, setContainsInternalParams] = useState<boolean>(false);
  const [taiwanComplianceConfirmed, setTaiwanComplianceConfirmed] = useState<boolean>(true);
  const [licenseType, setLicenseType] = useState<'Apache-2.0' | 'MIT' | 'BSD-3-Clause'>('Apache-2.0');

  // GitHub Upload Form State
  const [repoName, setRepoName] = useState<string>('qisda-robotics-vision-wbc-cleanroom');
  const [githubToken, setGithubToken] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [uploadedRepoUrl, setUploadedRepoUrl] = useState<string>('');
  const [bundleDownloaded, setBundleDownloaded] = useState<boolean>(false);

  const combinedCodeForAudit = useMemo(() => {
    return CODE_MODULES.map((m) => m.cleanCode).join('\n\n');
  }, []);

  const legalAudit = useMemo(() => {
    return auditTaiwanLegalCompliance({
      codeText: combinedCodeForAudit,
      usedCompanyEquipment,
      containsInternalParams,
      licenseType,
    });
  }, [combinedCodeForAudit, usedCompanyEquipment, containsInternalParams, licenseType]);

  const repositoryFiles = useMemo(() => {
    const readmeContent = `# Clean-Room Robotics Vision & Whole-Body Control Suite
**Taiwan Legal Compliance Attestation (Taiwan Trade Secrets Act Art. 2 & Copyright Act Art. 10-1 / Art. 11)**
- **Provenance**: 100% Independent Clean-Room Implementation derived strictly from peer-reviewed papers (CVPR, ICCV, ECCV, NeurIPS, ICRA, RSS) and official PyTorch 2.4 / TensorFlow 2.17 / OpenCV 4.10 documentation.
- **Zero Trade Secrets**: Contains zero proprietary Qisda Corporation calibration parameters, CAD/USD files, or internal datasets.
- **License**: ${licenseType}

## Included Reference Modules
1. \`src/bev_fusion.py\`: Lock-Free PyTorch 2.4 + OpenCV 4.10 Multi-Modal (LiDAR + RGB + LWIR) Sparse BEV Fusion (\`O(N*C + G*C)\`).
2. \`src/whole_body_mpc.py\`: Damped Cholesky SE(3) Inverse Kinematics & Riccati Whole-Body Control with Thermal/BMS Torque Envelope (\`O(T*dx^3)\`).
3. \`src/leak_free_eval.py\`: Spatio-Temporal Quarantine Splitter & Streaming Matthews Correlation Coefficient (MCC) + Logit-Adjusted Focal Loss (\`O(C^2)\` constant memory).
`;

    return [
      { path: 'README.md', content: readmeContent },
      { path: 'src/bev_fusion.py', content: CODE_MODULES[0].cleanCode },
      { path: 'src/whole_body_mpc.py', content: CODE_MODULES[1].cleanCode },
      { path: 'src/leak_free_eval.py', content: CODE_MODULES[2].cleanCode },
    ];
  }, [licenseType]);

  const handleDirectGithubUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalAudit.isCompliant) {
      setUploadStatus('error');
      setUploadMessage(
        'Upload blocked by Taiwan Legal Compliance Gate: Resolve critical Trade Secrets Act / Copyright Act violations first.'
      );
      return;
    }
    if (!taiwanComplianceConfirmed) {
      setUploadStatus('error');
      setUploadMessage('Please check the Taiwan Clean-Room Legal Attestation box before uploading.');
      return;
    }
    if (!repoName.trim()) {
      setUploadStatus('error');
      setUploadMessage('Repository name is required.');
      return;
    }
    if (!githubToken.trim()) {
      setUploadStatus('error');
      setUploadMessage(
        'Please enter a GitHub Personal Access Token (with repo scope) for live GitHub REST API push, or click "Export Clean-Room Git Push Bundle (.sh)" to push from your terminal.'
      );
      return;
    }

    setUploadStatus('uploading');
    setUploadMessage('');
    try {
      const resp = await fetch('/api/github/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken,
          repoName,
          isPrivate,
          taiwanComplianceConfirmed,
          files: repositoryFiles,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || 'GitHub upload failed.');
      }
      setUploadStatus('success');
      setUploadedRepoUrl(data.repoUrl);
      setUploadMessage(
        `Successfully uploaded ${data.uploadedFiles.length} clean-room files to ${data.repoUrl} in full compliance with Taiwan law.`
      );
    } catch (err: any) {
      setUploadStatus('error');
      setUploadMessage(err?.message || 'Failed to upload to GitHub.');
    }
  };

  const handleExportGitScript = () => {
    const scriptLines = [
      '#!/usr/bin/env bash',
      '# Clean-Room GitHub Repository Initializer (Taiwan Trade Secrets Act & Copyright Act Compliant)',
      'set -e',
      `mkdir -p ${repoName}/src`,
      `cd ${repoName}`,
      'git init',
      ...repositoryFiles.map(
        (f) => `cat << 'EOF' > ${f.path}\n${f.content}\nEOF`
      ),
      'git add README.md src/bev_fusion.py src/whole_body_mpc.py src/leak_free_eval.py',
      'git commit -m "feat: initial clean-room robotics vision & whole-body control reference suite"',
      `echo "Repository initialized cleanly in ./${repoName}. Run: gh repo create ${repoName} --public --source=. --push"`,
    ].join('\n');

    const blob = new Blob([scriptLines], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoName}-cleanroom-init.sh`;
    a.click();
    URL.revokeObjectURL(url);
    setBundleDownloaded(true);
    setTimeout(() => setBundleDownloaded(false), 3000);
  };

  return (
    <section id="github-law" className="py-10">
      <div className="mb-8">
        <div className="text-xs font-medium text-slate-500 mb-2">
          <span>Republic of China (Taiwan) Statutory Compliance</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>Trade Secrets Act · Copyright Act · PDPA · Labor Standards Act</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
          05. Taiwan Law Compliance Audit &amp; Direct GitHub Repository Uploader
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Publishing robotics and machine vision source code in Taiwan while applying to or working in the R&amp;D
          sector requires strict adherence to the Taiwan Trade Secrets Act (Art. 2, 10, 13-1) and Copyright Act (Art. 10-1, 11).
          This workbench audits code provenance in real time and uploads only 100% clean-room academic implementations.
        </p>
      </div>

      {/* Statutory Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {TAIWAN_LAW_STATUTES.map((law) => (
          <div key={law.lawName} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-500 font-mono mb-1">{law.articles}</div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{law.lawName}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">{law.summary}</p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-emerald-900">
              <span className="font-semibold">Clean-Room Engineering Protocol: </span>
              {law.complianceRule}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Pre-Flight Legal Audit & GitHub Upload Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Interactive Taiwan Legal Provenance Auditor */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Scale className="w-4 h-4 text-blue-700" />
                <span>Pre-Flight Taiwan Legal Provenance Audit</span>
              </div>
              <span
                className={`text-xs font-mono tabular-nums font-semibold ${
                  legalAudit.isCompliant ? 'text-emerald-800' : 'text-rose-700'
                }`}
              >
                Compliance Score: {legalAudit.score}/100 ({legalAudit.isCompliant ? 'PASS' : 'BLOCKED'})
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={usedCompanyEquipment}
                  onChange={(e) => setUsedCompanyEquipment(e.target.checked)}
                  className="mt-0.5 accent-rose-600"
                />
                <span>
                  <strong>Simulate Violation (Copyright Act Art. 11):</strong> Code was written during employer work hours
                  or on company-owned Jetson/workstation hardware. (Leave unchecked for lawful clean-room ownership)
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={containsInternalParams}
                  onChange={(e) => setContainsInternalParams(e.target.checked)}
                  className="mt-0.5 accent-rose-600"
                />
                <span>
                  <strong>Simulate Violation (Trade Secrets Act Art. 2 / Art. 13-1):</strong> Repository includes internal factory
                  camera/LWIR calibration matrices or private CAD tolerances. (Leave unchecked for lawful upload)
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <input
                  type="checkbox"
                  checked={taiwanComplianceConfirmed}
                  onChange={(e) => setTaiwanComplianceConfirmed(e.target.checked)}
                  className="mt-0.5 accent-emerald-700"
                />
                <span className="text-slate-800">
                  <strong>Mandatory Clean-Room Attestation:</strong> I certify under Republic of China (Taiwan)
                  Copyright Act Art. 10-1 &amp; Trade Secrets Act Art. 2 that this code is an independent implementation
                  derived exclusively from public CVPR/ICCV/NeurIPS papers and official PyTorch/OpenCV documentation.
                </span>
              </label>
            </div>

            {legalAudit.violations.length > 0 ? (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>Statutory Violations Detected — GitHub Upload Blocked</span>
                </div>
                {legalAudit.violations.map((v, idx) => (
                  <div key={idx} className="text-xs text-rose-800 pt-2 border-t border-rose-200/60">
                    <div className="font-semibold">
                      {v.statute} ({v.article})
                    </div>
                    <div>{v.reason}</div>
                    <div className="text-emerald-950 font-medium mt-0.5">Fix: {v.remediation}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">100% Lawful under Taiwan Trade Secrets Act &amp; Copyright Act</div>
                  <div className="mt-0.5 leading-relaxed">
                    Zero proprietary identifiers, internal IP addresses, or personal data detected. Mathematical
                    algorithms and official API patterns are protected public expression under Copyright Act Art. 10-1.
                  </div>
                </div>
              </div>
            )}

            {/* Staged Clean-Room Files */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-slate-600" />
                <span>Staged Clean-Room Repository Files (4 Files Ready)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-700">
                {repositoryFiles.map((f) => (
                  <div key={f.path} className="p-2 bg-slate-50 border border-slate-200 rounded">
                    {f.path} ({f.content.length.toLocaleString()} B)
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Direct GitHub REST API Uploader & Script Exporter */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-xl p-5">
            <form onSubmit={handleDirectGithubUpload} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="text-sm font-bold text-slate-900">
                  GitHub Repository Configuration
                </div>
                <span className="text-xs text-slate-500 font-mono">GitHub REST API v2022-11-28</span>
              </div>

              <div>
                <label htmlFor="github-repo-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Target GitHub Repository Name
                </label>
                <input
                  id="github-repo-name"
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="osi-license-select" className="block text-xs font-semibold text-slate-700 mb-1">
                    Open-Source License
                  </label>
                  <select
                    id="osi-license-select"
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Apache-2.0">Apache-2.0 (Patent-Safe)</option>
                    <option value="MIT">MIT License</option>
                    <option value="BSD-3-Clause">BSD 3-Clause</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="repo-visibility-select" className="block text-xs font-semibold text-slate-700 mb-1">
                    Repository Visibility
                  </label>
                  <select
                    id="repo-visibility-select"
                    value={isPrivate ? 'private' : 'public'}
                    onChange={(e) => setIsPrivate(e.target.value === 'private')}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="public">Public Portfolio Repository</option>
                    <option value="private">Private Repository</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="github-pat-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub Personal Access Token (Optional for Local Bundle Export)
                </label>
                <input
                  id="github-pat-input"
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Used strictly one-time over HTTPS to push the 4 clean-room files to your GitHub account, or export a
                  self-contained shell bundle below without entering a token.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploadStatus === 'uploading'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>
                    {uploadStatus === 'uploading'
                      ? 'Uploading to GitHub...'
                      : 'Upload Clean-Room Repo to GitHub'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportGitScript}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {bundleDownloaded
                      ? 'Downloaded Git Bundle (.sh)'
                      : 'Export Clean-Room Git Push Bundle (.sh)'}
                  </span>
                </button>
              </div>
            </form>

            {uploadMessage && (
              <div
                role="status"
                className={`mt-4 p-3.5 rounded-lg text-xs border ${
                  uploadStatus === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div>{uploadMessage}</div>
                {uploadedRepoUrl && (
                  <a
                    href={uploadedRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 font-mono font-semibold underline"
                  >
                    Open {uploadedRepoUrl}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
