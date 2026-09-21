'use client';

import React from 'react';
import { FilePlus, Users, Settings, CreditCard, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: FilePlus,
    title: 'Create & Post Work',
    description: 'Share job details in minutes.',
    yOffset: '-translate-y-2'
  },
  {
    num: '02',
    icon: Users,
    title: 'Find Talent',
    description: 'Connect with verified technicians.',
    yOffset: 'translate-y-2'
  },
  {
    num: '03',
    icon: Settings,
    title: 'Track Progress',
    description: 'Monitor work in real time.',
    yOffset: '-translate-y-2'
  },
  {
    num: '04',
    icon: CreditCard,
    title: 'Approve & Pay',
    description: 'Secure and transparent payments.',
    yOffset: 'translate-y-2'
  },
  {
    num: '05',
    icon: CheckCircle2,
    title: 'Get Results',
    description: 'Reliable work, happier operations.',
    yOffset: '-translate-y-2'
  }
];

export const HowItWorksSteps: React.FC = () => {
  return (
    <section className="relative mx-auto my-8 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-[#DCE8DB] bg-gradient-to-b from-[#F2F8EE]/70 to-[#EDF6EA]/90 p-8 sm:p-12 shadow-[0_12px_40px_rgba(9,20,15,0.03)]">
        {/* Subtle background dot matrix pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#5EA824_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Header Tag */}
        <div className="mb-6 flex justify-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#DCE8DB] bg-white px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#17212B] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
            How It Works
          </span>
        </div>

        {/* Wavy Connected Timeline Container */}
        <div className="relative mt-6">
          {/* SVG Undulating Wavy Dashed Green Path */}
          <svg
            className="pointer-events-none absolute left-0 top-1/2 hidden h-28 w-full -translate-y-1/2 lg:block"
            viewBox="0 0 1200 100"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M 60 45 C 180 15, 240 85, 360 85 C 480 85, 540 20, 660 20 C 780 20, 840 85, 960 85 C 1050 85, 1100 35, 1180 35"
              stroke="#85EB32"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
            {/* Arrowhead at the end */}
            <path
              d="M 1170 25 L 1185 35 L 1170 45"
              stroke="#85EB32"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Intermediate green coordinate nodes on path */}
            <circle cx="210" cy="50" r="4.5" fill="#85EB32" />
            <circle cx="510" cy="52" r="4.5" fill="#85EB32" />
            <circle cx="810" cy="52" r="4.5" fill="#85EB32" />
            <circle cx="1060" cy="60" r="4.5" fill="#85EB32" />
          </svg>

          {/* 5 Step Nodes Grid */}
          <div className="relative z-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className={`flex flex-col items-center text-center transition-transform duration-300 lg:${step.yOffset}`}
                >
                  {/* Step Circle with Icon */}
                  <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#DCE8DB] bg-white shadow-[0_10px_28px_rgba(9,20,15,0.06)] ring-8 ring-[#EAF6E3]">
                    <Icon className="h-8 w-8 text-[#17212B] stroke-[1.8]" />
                  </div>

                  {/* Step Number & Titles */}
                  <span className="font-mono text-xs font-bold text-[#5EA824]">{step.num}</span>
                  <h3 className="mt-1 text-base font-extrabold tracking-tight text-[#09130F]">
                    {step.title}
                  </h3>
                  <p className="mt-1 max-w-[190px] text-xs leading-relaxed text-[#5A6874]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
