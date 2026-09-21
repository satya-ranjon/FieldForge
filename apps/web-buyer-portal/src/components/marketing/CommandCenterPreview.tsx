'use client';

import React from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  DollarSign,
  Maximize2,
  Navigation,
  Zap,
  Eye,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

const kpiCards = [
  {
    icon: FileText,
    count: '18',
    label: 'Open Jobs',
    delta: '↑ 12%',
    deltaTone: 'text-[#18852E] bg-[#EAF8E9]',
    iconBg: 'bg-[#EAF8E9] text-[#18852E]'
  },
  {
    icon: AlertTriangle,
    count: '04',
    label: 'At Risk',
    delta: '↑ 8%',
    deltaTone: 'text-[#B76B00] bg-[#FFF5DF]',
    iconBg: 'bg-[#FFF5DF] text-[#B76B00]'
  },
  {
    icon: Clock,
    count: '09',
    label: 'Pending Approval',
    delta: '↓ 3%',
    deltaTone: 'text-[#0284C7] bg-[#EBF5FB]',
    iconBg: 'bg-[#EBF5FB] text-[#0284C7]'
  },
  {
    icon: DollarSign,
    count: '$42K',
    label: 'Total Spend',
    delta: '↑ 16%',
    deltaTone: 'text-[#18852E] bg-[#EAF8E9]',
    iconBg: 'bg-[#EAF8E9] text-[#18852E]'
  }
];

export const CommandCenterPreview: React.FC = () => {
  return (
    <section className="relative mx-auto my-20 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      {/* Side Vertical Accents for Wide Viewports */}
      <div className="pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 hidden xl:block">
        <span className="-rotate-90 block text-[10px] font-mono font-bold tracking-[0.2em] text-[#A0AEC0]">
          PEOPLE IN THE FIELD POWER TOMORROW
        </span>
      </div>
      <div className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 hidden xl:block">
        <span className="rotate-90 block text-[10px] font-mono font-bold tracking-[0.2em] text-[#A0AEC0]">
          OPERATIONS MADE SMARTER
        </span>
      </div>

      {/* Top Header */}
      <div className="relative text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8DB] bg-white px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#17212B] shadow-xs">
          <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
          Command Center
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.12] text-[#09130F]">
          One command center for every{' '}
          <span className="relative inline-block">
            field operation.
            <span className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-[#A8F22D]/40" />
          </span>
        </h2>

        <p className="text-base sm:text-lg text-[#5A6874] leading-relaxed max-w-2xl mx-auto">
          A product-led view of work orders, technician positions, emergency work, approvals, spend
          and operational alerts — all in real time.
        </p>

        {/* Right handwriting note */}
        <div className="absolute right-0 -bottom-4 hidden lg:block">
          <p
            className="rotate-[-6deg] text-sm font-bold text-[#5EA824]"
            style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}
          >
            Real-time visibility.
            <br />
            Better decisions.
          </p>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="flex items-center justify-between rounded-2xl border border-[#DCE8DB] bg-white p-5 shadow-[0_8px_24px_rgba(9,20,15,0.03)]"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${kpi.iconBg}`}
                >
                  <Icon className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="block text-2xl font-black text-[#09130F]">{kpi.count}</span>
                  <span className="block text-xs font-semibold text-[#5A6874]">{kpi.label}</span>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${kpi.deltaTone}`}>
                {kpi.delta}
              </span>
            </div>
          );
        })}
      </div>

      {/* Large Command Center Mockup Window */}
      <div className="mt-8 overflow-hidden rounded-3xl border border-[#22383C] bg-[#0E1B15] shadow-2xl">
        {/* Mock Window Top Bar */}
        <div className="flex items-center justify-between border-b border-[#22383C] bg-[#11231C] px-6 py-3.5 text-xs text-white">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-sm">Field Operations</span>
            <span className="hidden sm:inline text-white/60">
              Live view of technicians, work orders and operational status.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-black/40 p-1">
              <span className="rounded-md bg-[#85EB32] px-2.5 py-1 text-[10px] font-extrabold text-[#08120D]">
                Live
              </span>
              <span className="px-2.5 py-1 text-[10px] text-white/70">Today</span>
              <span className="px-2.5 py-1 text-[10px] text-white/70">This Week</span>
              <span className="px-2.5 py-1 text-[10px] text-white/70">This Month</span>
            </div>
            <Maximize2 className="h-4 w-4 text-white/60" />
          </div>
        </div>

        {/* Mock Window Body */}
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
          {/* Left Mini Sidebar */}
          <div className="hidden border-r border-[#22383C] bg-[#0A1612] p-4 text-xs text-white/80 lg:col-span-2 lg:block">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#85EB32] text-xs font-black text-[#08120D]">
                F
              </div>
              <span className="font-bold text-sm text-white">FieldForge</span>
            </div>

            <div className="space-y-1.5 font-semibold text-[11px]">
              <div className="flex items-center gap-2 rounded-xl bg-[#1A2E26] px-3 py-2 text-[#85EB32]">
                Command Center
              </div>
              <div className="px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer">
                Work Orders
              </div>
              <div className="px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer">
                Technicians
              </div>
              <div className="px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer">Customers</div>
              <div className="px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer">Assets</div>
              <div className="px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer">Approvals</div>
              <div className="px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer">Reports</div>
              <div className="px-3 py-2 hover:bg-white/5 rounded-xl cursor-pointer">Settings</div>
            </div>

            <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-2.5 text-[10px]">
              <span className="flex items-center gap-1.5 text-[#85EB32] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#85EB32]" />
                System Online
              </span>
              <span className="text-white/60">All systems operational</span>
            </div>
          </div>

          {/* Center NYC Tactical Map */}
          <div className="relative min-h-[420px] bg-[#0A1612] lg:col-span-7 overflow-hidden">
            <img
              src="/marketing/map-command-center.png"
              alt="New York live command operations map"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Right Panel: Alerts & Technicians Nearby */}
          <div className="border-l border-[#22383C] bg-[#0E1B15] p-4 text-xs text-white lg:col-span-3 space-y-4">
            {/* Operational Alerts */}
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">
                  Operational Alerts
                </span>
                <span className="text-[10px] text-[#85EB32] font-bold">View all →</span>
              </div>

              <div className="space-y-2">
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F87171]">Network Down</span>
                    <span className="text-[9px] text-white/50">2 min ago</span>
                  </div>
                  <span className="block text-[10px] text-white/70">1200 Market St, NY</span>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#FBBF24]">Delayed Arrival</span>
                    <span className="text-[9px] text-white/50">12 min ago</span>
                  </div>
                  <span className="block text-[10px] text-white/70">Technician running late</span>
                </div>

                <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#38BDF8]">Invoice Pending Approval</span>
                    <span className="text-[9px] text-white/50">28 min ago</span>
                  </div>
                  <span className="block text-[10px] text-white/70">#INV-7842</span>
                </div>
              </div>
            </div>

            {/* Technicians Nearby */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-white">
                  Technicians Nearby
                </span>
                <span className="text-[10px] text-[#85EB32] font-bold">View all →</span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    name: 'Alex Morgan',
                    status: '● On Site',
                    dist: '1.2 km',
                    avatar: '/marketing/avatars/alex-morgan.png'
                  },
                  {
                    name: 'Priya Shah',
                    status: '● In Transit',
                    dist: '2.4 km',
                    avatar: '/marketing/avatars/priya-shah.png'
                  },
                  {
                    name: 'Daniel Lee',
                    status: '● Available',
                    dist: '3.1 km',
                    avatar: '/marketing/avatars/daniel-carter.png'
                  }
                ].map((tech) => (
                  <div
                    key={tech.name}
                    className="flex items-center justify-between rounded-xl bg-white/5 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={tech.avatar}
                        alt={tech.name}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                      <div>
                        <span className="block text-[11px] font-bold text-white">{tech.name}</span>
                        <span className="block text-[9px] text-[#85EB32]">{tech.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/60">{tech.dist}</span>
                      <Navigation className="h-3 w-3 text-[#85EB32]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Feature Pills Below */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#DCE8DB] bg-white p-4 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7E2] text-[#22C55E]">
            <Zap className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-[#09130F]">Faster Response</h5>
            <p className="text-[10px] text-[#5A6874]">Solve issues quickly</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[#DCE8DB] bg-white p-4 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7E2] text-[#22C55E]">
            <Eye className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-[#09130F]">Full Visibility</h5>
            <p className="text-[10px] text-[#5A6874]">Track everything in real time</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[#DCE8DB] bg-white p-4 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7E2] text-[#22C55E]">
            <ShieldCheck className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-[#09130F]">Trusted &amp; Secure</h5>
            <p className="text-[10px] text-[#5A6874]">Role based access &amp; audit logs</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[#DCE8DB] bg-white p-4 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7E2] text-[#22C55E]">
            <TrendingUp className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-[#09130F]">Higher Productivity</h5>
            <p className="text-[10px] text-[#5A6874]">More jobs, less downtime</p>
          </div>
        </div>
      </div>
    </section>
  );
};
