'use client';

import React from 'react';
import {
  FileText,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Wallet,
  Shield,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

const paymentSteps = [
  {
    icon: FileText,
    title: 'Job Posted',
    desc: 'Client creates a job',
    highlight: false
  },
  {
    icon: ShieldCheck,
    title: 'Work Completed',
    desc: 'Deliver and get approved',
    highlight: false
  },
  {
    icon: CreditCard,
    title: 'Payment Released',
    desc: 'Get paid securely',
    highlight: false
  },
  {
    icon: CheckCircle2,
    title: 'You Get Paid',
    desc: 'Funds in your account',
    highlight: true
  }
];

const valuePillars = [
  {
    num: '01',
    icon: Wallet,
    title: 'Transparent & Fair Funds',
    desc: 'Payments are held securely and released when work is completed.',
    iconBg: 'bg-[#EAF7E2] text-[#22C55E]'
  },
  {
    num: '02',
    icon: Shield,
    title: 'Secure and On-time',
    desc: 'Your payments are protected with industry-standard security.',
    iconBg: 'bg-[#E6F4F1] text-[#0D9488]'
  },
  {
    num: '03',
    icon: TrendingUp,
    title: 'Hassle-free Payouts',
    desc: 'Multiple payment methods and fast withdrawals to your account.',
    iconBg: 'bg-[#F3E8FF] text-[#9333EA]'
  }
];

export const SecurePaymentsSection: React.FC = () => {
  return (
    <section className="relative mx-auto my-16 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      {/* Outer Card Container */}
      <div className="relative overflow-hidden rounded-3xl border border-[#DCE8DB] bg-white p-8 sm:p-12 shadow-[0_16px_50px_rgba(9,20,15,0.03)]">
        {/* Top Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8DB] bg-[#F2F8EE] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#17212B]">
            <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
            Secure Payments
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.12] text-[#09130F]">
            Payments built around completed work.
          </h2>

          <p className="text-base sm:text-lg text-[#5A6874] leading-relaxed">
            Get paid with confidence. Your work, our secure payment flow — simple, transparent and
            reliable.
          </p>
        </div>

        {/* 4-Step Horizontal Payment Sequence */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paymentSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className={`relative flex flex-col items-center justify-center rounded-2xl p-6 text-center transition-all ${
                  step.highlight
                    ? 'border-2 border-[#85EB32] bg-[#A8F22D] text-[#08120D] shadow-[0_12px_36px_rgba(168,242,45,0.3)] ring-4 ring-[#A8F22D]/20'
                    : 'border border-[#DCE8DB] bg-[#F8FAF7] text-[#09130F] hover:bg-white'
                }`}
              >
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    step.highlight
                      ? 'bg-[#08120D] text-[#A8F22D]'
                      : 'bg-white text-[#09130F] shadow-xs'
                  }`}
                >
                  <Icon className="h-6 w-6 stroke-[2.2]" />
                </div>

                <h4 className="text-base font-extrabold">{step.title}</h4>
                <p
                  className={`mt-1 text-xs ${
                    step.highlight ? 'text-[#08120D]/80 font-semibold' : 'text-[#5A6874]'
                  }`}
                >
                  {step.desc}
                </p>

                {/* Connecting Arrow for desktop (hidden on last item) */}
                {idx < paymentSteps.length - 1 && (
                  <div className="pointer-events-none absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
                    <ArrowRight className="h-4 w-4 text-[#C3EBC2]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3 Pillars Below */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {valuePillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.num}
                className="relative overflow-hidden rounded-2xl border border-[#EBEFE9] bg-[#F8FAF7] p-6 transition hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${pillar.iconBg}`}
                  >
                    <Icon className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF8E9] text-[11px] font-mono font-bold text-[#18852E]">
                    {pillar.num}
                  </span>
                </div>

                <h4 className="mt-5 text-base font-extrabold text-[#09130F]">{pillar.title}</h4>
                <p className="mt-1.5 text-xs text-[#5A6874] leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
