'use client';

import React from 'react';
import { Zap, Eye, ShieldCheck } from 'lucide-react';

export const RealWorkSection: React.FC = () => {
  return (
    <section className="relative mx-auto my-16 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      {/* Outer Card Container */}
      <div className="relative overflow-hidden rounded-3xl border border-[#DCE8DB] bg-white p-8 sm:p-12 shadow-[0_16px_50px_rgba(9,20,15,0.04)]">
        {/* Top Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8DB] bg-[#F2F8EE] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#17212B]">
            <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
            Real Work. All Industries.
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight leading-[1.12] text-[#09130F]">
            Create work, match talent, dispatch quickly, verify proof and release payment without
            losing the thread.
          </h2>
          <p className="text-base sm:text-lg text-[#5A6874] leading-relaxed max-w-2xl">
            FieldForge connects businesses with qualified field technicians across industries — from
            POS and IT hardware to networking, security, AV and more.
          </p>
        </div>

        {/* Content Body: Split Left Value Bullets & Right Visual Scene */}
        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left 3 Value Prop Bullets */}
          <div className="space-y-6 lg:col-span-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF7E2] text-[#22C55E] shadow-xs">
                <Zap className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#09130F]">Faster resolution</h4>
                <p className="mt-0.5 text-sm text-[#5A6874]">Get the right tech, sooner</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF7E2] text-[#22C55E] shadow-xs">
                <Eye className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#09130F]">Full visibility</h4>
                <p className="mt-0.5 text-sm text-[#5A6874]">Track every step in real time</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF7E2] text-[#22C55E] shadow-xs">
                <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#09130F]">Trusted &amp; compliant</h4>
                <p className="mt-0.5 text-sm text-[#5A6874]">
                  Verified professionals, secure payments
                </p>
              </div>
            </div>
          </div>

          {/* Right Visual Composition */}
          <div className="relative lg:col-span-8">
            <div className="relative overflow-hidden rounded-3xl border border-[#DCE8DB] bg-[#F2F8EE] p-2 sm:p-3 shadow-xs">
              <div className="relative h-[420px] w-full overflow-hidden rounded-2xl">
                <img
                  src="/marketing/real-work-technician.png"
                  alt="Technician working on field site with active jobs and industry categories"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
