'use client';

import React from 'react';
import Link from 'next/link';
import {
  FilePlus,
  Users,
  BarChart2,
  CreditCard,
  User,
  Search,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const businessSteps = [
  { num: '01', title: 'Create Work', desc: 'Post your project in minutes.', icon: FilePlus },
  { num: '02', title: 'Find Talent', desc: 'Get matched with qualified techs.', icon: Users },
  { num: '03', title: 'Track Execution', desc: 'Monitor progress in real time.', icon: BarChart2 },
  { num: '04', title: 'Approve & Pay', desc: 'Review work and release payment.', icon: CreditCard }
];

const technicianSteps = [
  { num: '01', title: 'Create Profile', desc: 'Showcase your skills and experience.', icon: User },
  { num: '02', title: 'Find Jobs', desc: 'Browse opportunities near you.', icon: Search },
  { num: '03', title: 'Complete Work', desc: 'Do what you do best.', icon: CheckCircle2 },
  { num: '04', title: 'Get Paid', desc: 'Fast, secure payments.', icon: CreditCard }
];

export const TwoSidedAudience: React.FC = () => {
  return (
    <section className="relative mx-auto my-16 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Card: For Businesses */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#DCE8DB] bg-white p-8 sm:p-10 shadow-[0_16px_40px_rgba(9,20,15,0.03)]">
          <div className="space-y-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5EA824]">
              For Businesses
            </span>

            <h3 className="text-3xl font-black tracking-tight text-[#09130F]">
              Get the work done with confidence.
            </h3>

            <p className="text-sm text-[#5A6874] leading-relaxed">
              Post work, find qualified technicians, track progress, and approve payment — all in
              one place.
            </p>

            <div className="pt-2">
              <Link
                href="/create-wo"
                className="inline-flex h-12 items-center gap-3 rounded-xl bg-[#111C22] px-6 text-sm font-bold text-white transition hover:bg-[#1A2E35]"
              >
                Get Started
                <ArrowRight className="h-4 w-4 text-[#85EB32]" />
              </Link>
            </div>
          </div>

          <div className="mt-8 space-y-4 border-t border-[#EBEFE9] pt-6">
            {businessSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex items-center gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF8E9] font-mono text-xs font-bold text-[#18852E]">
                    {step.num}
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8FAF7] text-[#09130F]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-[#09130F]">{step.title}</h5>
                    <p className="text-[11px] text-[#7D8791]">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: For Technicians */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#DCE8DB] bg-white p-8 sm:p-10 shadow-[0_16px_40px_rgba(9,20,15,0.03)]">
          <div className="space-y-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5EA824]">
              For Technicians
            </span>

            <h3 className="text-3xl font-black tracking-tight text-[#09130F]">
              Find work. Build your business.
            </h3>

            <p className="text-sm text-[#5A6874] leading-relaxed">
              Create a profile, find jobs in your area, complete work, and get paid — on your terms.
            </p>

            <div className="pt-2">
              <Link
                href="/technicians"
                className="inline-flex h-12 items-center gap-3 rounded-xl bg-[#111C22] px-6 text-sm font-bold text-white transition hover:bg-[#1A2E35]"
              >
                Join as a Technician
                <ArrowRight className="h-4 w-4 text-[#85EB32]" />
              </Link>
            </div>
          </div>

          <div className="mt-8 space-y-4 border-t border-[#EBEFE9] pt-6">
            {technicianSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex items-center gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF8E9] font-mono text-xs font-bold text-[#18852E]">
                    {step.num}
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8FAF7] text-[#09130F]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-[#09130F]">{step.title}</h5>
                    <p className="text-[11px] text-[#7D8791]">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
