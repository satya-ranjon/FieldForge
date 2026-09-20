'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  Car,
  Check,
  ClipboardList,
  FileText,
  Monitor,
  Play,
  ShieldCheck,
  Star,
  Users
} from 'lucide-react';

const trustLogos = ['cisco', 'Walmart', 'CBRE', 'SIEMENS', 'verizon'];

const jobCards = [
  {
    icon: Camera,
    title: 'Security Camera Install',
    status: 'Scheduled',
    statusTone: 'success',
    location: 'Lakeside Warehouse',
    className: 'left-[492px] top-[90px] hidden xl:flex'
  },
  {
    icon: Monitor,
    title: 'Digital Signage Repair',
    status: 'Assigned',
    statusTone: 'success',
    location: 'Downtown Branch',
    className: 'left-[540px] top-[266px] hidden xl:flex'
  },
  {
    icon: ClipboardList,
    title: 'POS Terminal Offline',
    status: 'Urgent',
    statusTone: 'danger',
    location: 'Market St. Retail',
    className: 'left-0 top-[256px] hidden xl:flex'
  }
];

export const MarketingHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-[#fbfcf8] pb-12 pt-7 sm:pb-20 lg:min-h-[916px] lg:pb-0 lg:pt-5">
      <DecorativeFieldLines />

      <div className="relative z-10 mx-auto grid max-w-[1260px] gap-12 px-6 sm:px-8 lg:grid-cols-[470px_775px] lg:gap-[15px] xl:px-0">
        <div className="relative z-20 max-w-[470px] pt-8 lg:pt-0">
          <div className="inline-flex h-9 items-center gap-3 rounded-full border border-[#dce8db] bg-white px-4 pr-5 shadow-[0_8px_24px_rgba(9,18,17,0.06)]">
            <span className="h-3 w-3 rounded-full bg-[#83eb36] shadow-[0_0_0_6px_rgba(131,235,54,0.14)]" />
            <span className="text-[12px] font-extrabold uppercase tracking-[-0.01em] text-[#17212b]">
              Field Service Operations Platform
            </span>
          </div>

          <h1 className="mt-[30px] text-[58px] font-black leading-[0.95] tracking-[-0.065em] text-[#07121b] sm:text-[70px] xl:text-[70px]">
            <span className="block">Field service</span>
            <span className="relative mt-1 inline-block text-[#5aa12e]">
              without the
              <span className="absolute -bottom-1 left-0 h-3 w-full rounded-full bg-[#73c642]/30" />
              <span className="absolute -bottom-2 left-0 h-1.5 w-[104%] -rotate-2 rounded-full bg-[#69b735]" />
            </span>
            <span className="mt-1 block">field-service</span>
            <span className="mt-1 block">chaos.</span>
          </h1>

          <div className="mt-8 space-y-5">
            <p className="max-w-[460px] text-[18px] font-semibold leading-[1.25] tracking-[-0.025em] text-[#17212b]">
              One operating field for staffing, dispatching, verifying and paying technician work
              orders.
            </p>
            <p className="max-w-[470px] text-[18px] font-medium leading-[1.26] tracking-[-0.02em] text-[#5a6874]">
              Find qualified technicians, assign the right person and watch every job state move
              from dispatch to verified completion in one clean workflow.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create-wo"
              className="inline-flex h-[50px] items-center justify-center gap-3 rounded-xl bg-[#86ef33] px-8 text-[16px] font-extrabold tracking-[-0.03em] text-[#07120e] shadow-[0_16px_34px_rgba(118,224,44,0.24)] transition hover:bg-[#79e02b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8f22d]"
            >
              Get Started
              <ArrowRight className="h-5 w-5 stroke-[3]" />
            </Link>
            <Link
              href="/resources"
              className="inline-flex h-[50px] items-center justify-center gap-3 rounded-xl border border-[#dce8db] bg-white/70 px-8 text-[16px] font-extrabold tracking-[-0.03em] text-[#17212b] shadow-[0_10px_26px_rgba(9,18,17,0.04)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8f22d]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#07121b] text-white">
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
              </span>
              Watch Demo
            </Link>
          </div>

          <div className="mt-8 flex flex-nowrap gap-x-5">
            {['Verified Technicians', 'Live ETA Tracking', 'Secure Payments'].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2.5 text-[12px] font-bold text-[#5a6874]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#42cc3b] text-white">
                  <Check className="h-3.5 w-3.5 stroke-[4]" />
                </span>
                {item}
              </span>
            ))}
          </div>

          <div className="mt-12 hidden lg:block">
            <p className="mb-4 text-[13px] font-bold tracking-[-0.01em] text-[#5a6874]">
              Trusted by modern businesses
            </p>
            <div className="flex items-center gap-3">
              {trustLogos.map((logo) => (
                <div
                  key={logo}
                  className="flex h-9 min-w-[80px] items-center justify-center rounded-full border border-[#e0e8df] bg-white/80 px-4 text-[13px] font-black tracking-[-0.04em] text-[#5d6b78] shadow-[0_8px_20px_rgba(9,18,17,0.035)]"
                >
                  {logo === 'cisco' ? (
                    <span className="leading-[0.78]">
                      <span className="block text-[9px] tracking-[0.18em]">|||||</span>
                      <span className="block">cisco</span>
                    </span>
                  ) : (
                    logo
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
};

const HeroVisual: React.FC = () => {
  return (
    <div className="relative min-h-[780px] lg:min-h-[860px]">
      <div className="absolute left-0 top-[-32px] hidden h-[790px] w-[780px] rounded-[42%_44%_36%_38%/26%_22%_36%_42%] bg-[#c9f6b7]/62 blur-[1px] lg:block" />
      <div className="absolute right-[-130px] top-[176px] hidden h-[420px] w-[420px] rounded-full bg-[#d6f9c8]/70 lg:block" />

      <div className="relative mt-10 h-[700px] overflow-hidden rounded-[140px_0_0_180px] bg-[#d9f7cd] shadow-[0_30px_90px_rgba(49,108,41,0.16)] lg:mt-2 lg:h-[790px] lg:w-[865px]">
        <img
          src="/marketing/fieldforge-technician-van-hero.png"
          alt="Field service technician using a tablet beside a service van"
          className="h-full w-full object-cover object-[100%_50%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(251,252,248,0.42),rgba(251,252,248,0)_22%,rgba(251,252,248,0)_76%,rgba(251,252,248,0.10))]" />
      </div>

      <LiveTrackingCard />

      {jobCards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`absolute h-[94px] w-[250px] items-center gap-3 rounded-[16px] border border-[#e8eee7] bg-white/95 p-4 shadow-[0_18px_50px_rgba(7,18,27,0.14)] backdrop-blur ${card.className}`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef5f2] text-[#082328]">
              <Icon className="h-6 w-6 stroke-[2.2]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-extrabold tracking-[-0.03em] text-[#111820]">
                {card.title}
              </span>
              <span
                className={`mt-1.5 inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-extrabold ${
                  card.statusTone === 'danger'
                    ? 'bg-[#ffe5e5] text-[#f04444]'
                    : 'bg-[#dff9cf] text-[#69b735]'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    card.statusTone === 'danger' ? 'bg-[#ff2f3f]' : 'bg-[#73df3a]'
                  }`}
                />
                {card.status}
              </span>
              <span className="mt-1.5 block truncate text-[11px] font-semibold text-[#687583]">
                {card.location}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[#17212b]" />
          </div>
        );
      })}

      <ActiveJobsCard />
      <VerifiedTechnicianCard />
      <StatsRail />

      <div className="absolute left-[645px] top-0 hidden xl:block">
        <CurvedArrow />
        <p
          className="rotate-[-12deg] text-[19px] font-bold leading-[1.02] tracking-[0.02em] text-[#53697d]"
          style={{ fontFamily: "'Comic Sans MS', 'Bradley Hand', cursive" }}
        >
          Real-time
          <br />
          visibility.
          <br />
          Better results.
        </p>
      </div>
    </div>
  );
};

const LiveTrackingCard: React.FC = () => {
  return (
    <div className="absolute left-[35px] top-9 hidden h-[174px] w-[255px] rounded-[16px] border border-white/15 bg-[#102126]/94 p-5 text-white shadow-[0_26px_70px_rgba(7,18,27,0.34)] backdrop-blur xl:block">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#83eb36]/20">
          <span className="h-2 w-2 rounded-full bg-[#83eb36]" />
        </span>
        <h2 className="text-[16px] font-extrabold tracking-[-0.04em]">Live Job Tracking</h2>
      </div>

      <div className="relative h-[116px] overflow-hidden rounded-[12px] bg-[#21353a]/75">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#496067_1px,transparent_1px),linear-gradient(90deg,#496067_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute left-6 top-6 flex items-center gap-2.5">
          <span className="h-8 w-8 overflow-hidden rounded-full border-2 border-white/80 bg-[#d2e4e6]">
            <span className="block h-full w-full bg-[radial-gradient(circle_at_50%_32%,#c57a54_0_16%,transparent_17%),linear-gradient(#1c2630_0_46%,#ffffff_47%_100%)]" />
          </span>
          <span>
            <span className="block text-[12px] font-extrabold">Alex M.</span>
            <span className="mt-0.5 block text-[11px] font-extrabold text-[#83eb36]">
              On the way
            </span>
            <span className="mt-0.5 block text-[10px] font-bold text-white/78">ETA 12 min</span>
          </span>
        </div>
        <div className="absolute bottom-7 left-[92px] flex h-9 w-9 items-center justify-center rounded-full bg-[#8bed34] text-[#082328] shadow-[0_0_28px_rgba(139,237,52,0.45)]">
          <Car className="h-5 w-5 fill-current" />
        </div>
        <svg
          className="absolute bottom-8 left-[118px] h-20 w-32"
          viewBox="0 0 160 96"
          aria-hidden="true"
        >
          <path
            d="M0 62 C26 62 26 48 55 54 C84 60 78 34 112 36 L142 36"
            fill="none"
            stroke="#83eb36"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <circle cx="142" cy="36" r="7" fill="#83eb36" />
        </svg>
        <div className="absolute right-4 top-[48px] flex h-9 w-9 items-center justify-center rounded-full bg-[#63cc35] text-white shadow-[0_0_26px_rgba(99,204,53,0.52)]">
          <span className="h-2.5 w-2.5 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
};

const ActiveJobsCard: React.FC = () => {
  const metrics = [
    { value: '2', label: 'In Progress', color: 'text-[#83eb36]' },
    { value: '1', label: 'Scheduled', color: 'text-[#27bcff]' },
    { value: '1', label: 'On Hold', color: 'text-[#f4b82b]' },
    { value: '4', label: 'This Week', color: 'text-white' }
  ];

  return (
    <div className="absolute left-5 top-[476px] hidden h-[124px] w-[338px] rounded-[16px] border border-white/14 bg-[#112329]/94 p-5 text-white shadow-[0_24px_70px_rgba(7,18,27,0.28)] backdrop-blur xl:block">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h2 className="text-[16px] font-extrabold tracking-[-0.04em]">4 Active Service Jobs</h2>
        <Link
          href="/operations"
          className="flex items-center gap-1.5 text-[12px] font-extrabold text-white/88"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-4 divide-x divide-white/10">
        {metrics.map((metric) => (
          <div key={metric.label} className="px-2.5 first:pl-0 last:pr-0">
            <span className={`block text-[24px] font-black leading-none ${metric.color}`}>
              {metric.value}
            </span>
            <span className="mt-1.5 block text-[10px] font-bold text-white/88">{metric.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const VerifiedTechnicianCard: React.FC = () => {
  return (
    <div className="absolute left-[575px] top-[566px] hidden h-[84px] w-[210px] items-center gap-4 rounded-[16px] border border-[#e8eee7] bg-white/96 p-4 shadow-[0_18px_50px_rgba(7,18,27,0.14)] xl:flex">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#42cc3b] text-white">
        <Check className="h-6 w-6 stroke-[4]" />
      </span>
      <span>
        <span className="block text-[12px] font-extrabold tracking-[-0.03em] text-[#111820]">
          Verified Technician
        </span>
        <span className="mt-1 block text-[11px] font-semibold leading-[1.2] text-[#687583]">
          Background checked
          <br />
          and insured
        </span>
      </span>
    </div>
  );
};

const StatsRail: React.FC = () => {
  const stats = [
    {
      icon: Users,
      value: '10K+',
      label: 'Verified Technicians',
      tone: 'bg-[#dff9cf] text-[#63c932]'
    },
    {
      icon: FileText,
      value: '50K+',
      label: 'Work Orders Monthly',
      tone: 'bg-[#dff4ff] text-[#1ba8dd]'
    },
    {
      icon: ShieldCheck,
      value: '99.9%',
      label: 'Uptime & Reliability',
      tone: 'bg-[#dff9cf] text-[#63c932]'
    },
    {
      icon: Star,
      value: '4.8/5',
      label: 'Customer Satisfaction',
      tone: 'bg-[#fff3cf] text-[#f4ad1f]'
    }
  ];

  return (
    <div className="absolute left-2.5 top-[671px] hidden h-[90px] w-[790px] items-center rounded-[18px] border border-[#e8eee7] bg-white/95 px-7 shadow-[0_24px_70px_rgba(7,18,27,0.14)] backdrop-blur lg:flex">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="flex flex-1 items-center gap-4 border-r border-[#e2e9e0] px-6 first:pl-0 last:border-r-0 last:pr-0"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${stat.tone}`}
            >
              <Icon className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-[21px] font-black leading-none tracking-[-0.05em] text-[#07121b]">
                {stat.value}
              </span>
              <span className="mt-1.5 block text-[10px] font-bold leading-tight text-[#6d7884]">
                {stat.label}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

const CurvedArrow: React.FC = () => (
  <svg
    className="absolute -left-[86px] top-[24px] h-[86px] w-[76px]"
    viewBox="0 0 76 86"
    aria-hidden="true"
  >
    <path
      d="M66 8C33 10 18 35 19 72"
      fill="none"
      stroke="#54c43b"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <path
      d="M8 58 19 74 35 63"
      fill="none"
      stroke="#54c43b"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
    />
  </svg>
);

const DecorativeFieldLines: React.FC = () => (
  <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55" aria-hidden="true">
    <path d="M-20 124 C54 140 58 198 115 190" fill="none" stroke="#cde9c6" strokeWidth="2" />
    <circle cx="86" cy="190" r="11" fill="none" stroke="#cde9c6" strokeWidth="2" />
    <path d="M42 392 C-10 470 28 546 88 548" fill="none" stroke="#bfe4b8" strokeWidth="3" />
    <path
      d="M31 398 42 375 54 399"
      fill="none"
      stroke="#bfe4b8"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
    />
    <circle cx="20" cy="548" r="9" fill="none" stroke="#cde9c6" strokeWidth="2" />
    <path d="M1280 130 C1460 142 1458 214 1630 178" fill="none" stroke="#bfe4b8" strokeWidth="3" />
  </svg>
);
