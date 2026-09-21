'use client';

import React from 'react';
import { Bell, Link2, FileText, BarChart2 } from 'lucide-react';

const reliabilityFeatures = [
  {
    icon: Bell,
    title: 'Reliable Notifications',
    desc: 'Keep buyers, dispatchers and technicians aligned.'
  },
  {
    icon: Link2,
    title: 'Operational Traceability',
    desc: 'Every job action stays connected to the work order.'
  },
  {
    icon: FileText,
    title: 'Consistent Financial Records',
    desc: 'Approvals, invoices and payout records stay reconciled.'
  },
  {
    icon: BarChart2,
    title: 'Platform Monitoring',
    desc: 'Operational visibility for serious field programs.'
  }
];

export const EnterpriseReliability: React.FC = () => {
  return (
    <section className="relative mx-auto my-20 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8DB] bg-white px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#17212B] shadow-xs">
          <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
          Enterprise Reliability
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.1] text-[#09130F]">
          Built for operations that cannot
          <br />
          lose track of work.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reliabilityFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.title}
              className="rounded-3xl border border-[#DCE8DB] bg-white p-7 shadow-[0_10px_30px_rgba(9,20,15,0.03)] transition duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7E2] text-[#22C55E]">
                <Icon className="h-6 w-6 stroke-[2]" />
              </div>
              <h4 className="text-base font-black text-[#09130F]">{feat.title}</h4>
              <p className="mt-2 text-xs leading-relaxed text-[#5A6874]">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
