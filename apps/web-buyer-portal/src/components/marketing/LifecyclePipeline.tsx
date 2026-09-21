'use client';

import React from 'react';
import {
  FileText,
  Users,
  Send,
  Settings,
  CheckCircle2,
  ClipboardCheck,
  Wallet,
  Network,
  Layers,
  ArrowRight
} from 'lucide-react';

const pipelineStages = [
  { num: '01', title: 'CREATE', desc: 'Define work', icon: FileText, active: false },
  { num: '02', title: 'MATCH', desc: 'Find talent', icon: Users, active: false },
  { num: '03', title: 'DISPATCH', desc: 'Send tech', icon: Send, active: true },
  { num: '04', title: 'EXECUTE', desc: 'Capture data', icon: Settings, active: false },
  { num: '05', title: 'VERIFY', desc: 'Confirm proof', icon: CheckCircle2, active: false },
  { num: '06', title: 'APPROVE', desc: 'Buyer sign-off', icon: ClipboardCheck, active: false },
  { num: '07', title: 'PAY', desc: 'Release payout', icon: Wallet, active: false }
];

export const LifecyclePipeline: React.FC = () => {
  return (
    <section className="relative mx-auto my-16 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      {/* Top Header Row with Metrics */}
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        {/* Left Copy */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8DB] bg-white px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#17212B] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
            Lifecycle
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.1] text-[#09130F]">
            One platform.
            <br />
            Every step of the job.
          </h2>
          <p className="text-base sm:text-lg text-[#5A6874] leading-relaxed max-w-xl">
            From the first work order to verified completion and payout, FieldForge keeps every
            handoff visible, accountable and ready for action.
          </p>
        </div>

        {/* Right 2 Metric Cards */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-24 w-56 items-center justify-between rounded-2xl border border-[#DCE8DB] bg-white p-5 shadow-[0_8px_24px_rgba(9,20,15,0.03)]">
            <div>
              <span className="block text-3xl font-black tracking-tight text-[#09130F]">07</span>
              <span className="text-xs font-semibold text-[#5A6874]">active workflow stages</span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF7E2] text-[#22C55E]">
              <Network className="h-6 w-6 stroke-[2]" />
            </div>
          </div>

          <div className="flex h-24 w-56 items-center justify-between rounded-2xl border border-[#DCE8DB] bg-white p-5 shadow-[0_8px_24px_rgba(9,20,15,0.03)]">
            <div>
              <span className="block text-3xl font-black tracking-tight text-[#09130F]">1</span>
              <span className="text-xs font-semibold text-[#5A6874]">
                single operational thread
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF7E2] text-[#22C55E]">
              <Layers className="h-6 w-6 stroke-[2]" />
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal 7 Pipeline Stages */}
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 lg:gap-2.5">
        {pipelineStages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div key={stage.num} className="relative flex items-center">
              <div
                className={`flex w-full flex-col justify-between rounded-2xl p-4 transition-all duration-200 ${
                  stage.active
                    ? 'border-2 border-[#85EB32] bg-[#A8F22D] text-[#08120D] shadow-[0_12px_32px_rgba(168,242,45,0.32)] ring-4 ring-[#A8F22D]/20'
                    : 'border border-[#DCE8DB] bg-white text-[#17212B] shadow-[0_6px_20px_rgba(9,20,15,0.03)] hover:border-[#C3EBC2]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      stage.active ? 'text-[#08120D]/70' : 'text-[#7D8791]'
                    }`}
                  >
                    {stage.num}
                  </span>
                  <Icon
                    className={`h-5 w-5 ${
                      stage.active ? 'text-[#08120D] stroke-[2.5]' : 'text-[#17212B] stroke-[2]'
                    }`}
                  />
                </div>

                <div className="mt-6">
                  <h4
                    className={`text-sm font-black tracking-tight uppercase ${
                      stage.active ? 'text-[#08120D]' : 'text-[#09130F]'
                    }`}
                  >
                    {stage.title}
                  </h4>
                  <p
                    className={`mt-0.5 text-[11px] font-medium ${
                      stage.active ? 'text-[#08120D]/80 font-semibold' : 'text-[#5A6874]'
                    }`}
                  >
                    {stage.desc}
                  </p>
                </div>
              </div>

              {/* Connecting Arrow between items (hidden on last item) */}
              {idx < pipelineStages.length - 1 && (
                <div className="pointer-events-none absolute -right-2 z-10 hidden lg:block">
                  <ArrowRight className="h-3.5 w-3.5 text-[#A0AEC0]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
