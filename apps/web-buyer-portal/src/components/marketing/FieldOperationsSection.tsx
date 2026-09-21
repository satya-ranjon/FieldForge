'use client';

import React from 'react';
import {
  MapPin,
  ListOrdered,
  Camera,
  PenTool,
  FileCheck,
  CheckCircle2,
  ChevronDown,
  Send,
  Zap,
  Eye,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

const deliverables = [
  {
    icon: MapPin,
    title: 'Live Location',
    desc: 'Track technicians in real time',
    color: 'bg-[#EAF7E2] text-[#22C55E]'
  },
  {
    icon: ListOrdered,
    title: 'Job Progress',
    desc: 'See each step as it happens',
    color: 'bg-[#EAF7E2] text-[#22C55E]'
  },
  {
    icon: Camera,
    title: 'Photo Proof',
    desc: 'Images from the site',
    color: 'bg-[#EAF7E2] text-[#22C55E]'
  },
  {
    icon: PenTool,
    title: 'Digital Signature',
    desc: 'Customer confirmation',
    color: 'bg-[#EAF7E2] text-[#22C55E]'
  },
  {
    icon: FileCheck,
    title: 'Instant Reports',
    desc: 'Field data, no delays',
    color: 'bg-[#EAF7E2] text-[#22C55E]'
  }
];

export const FieldOperationsSection: React.FC = () => {
  return (
    <section className="relative mx-auto my-20 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="relative text-center max-w-3xl mx-auto space-y-4">
        {/* Handwritten note left */}
        <div className="absolute -left-12 -top-6 hidden sm:block">
          <p
            className="rotate-[-10deg] text-sm font-bold text-[#5EA824]"
            style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}
          >
            From assignment
            <br />
            to completion
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8DB] bg-white px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#17212B] shadow-xs">
          <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
          Field Operations
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.12] text-[#09130F]">
          Know what is happening in the field —{' '}
          <span className="relative inline-block text-[#22C55E]">
            then prove it.
            <span className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-[#A8F22D]/40" />
          </span>
        </h2>

        <p className="text-base sm:text-lg text-[#5A6874] leading-relaxed max-w-2xl mx-auto">
          Get real-time updates from the field, track technician location, job progress, photos,
          signatures and more — all in one place.
        </p>
      </div>

      {/* Main Composite Visual Container */}
      <div className="relative mt-12 rounded-3xl border border-[#DCE8DB] bg-gradient-to-b from-[#F2F8EE]/60 to-[#EDF6EA]/80 p-6 sm:p-10 shadow-[0_16px_50px_rgba(9,20,15,0.03)]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Smartphone Mock: TechCare App */}
          <div className="mx-auto w-[270px] rounded-[38px] border-[6px] border-[#162821] bg-[#0F1A15] p-3.5 text-white shadow-2xl lg:col-span-3">
            {/* Phone Top Notch */}
            <div className="mx-auto mb-3 flex h-4 w-28 items-center justify-center rounded-full bg-black">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
            </div>

            {/* App Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
                <span className="text-xs font-black">TechCare</span>
              </div>
              <span className="text-[10px] text-white/60">9:41</span>
            </div>

            {/* Current Job Status Card */}
            <div className="mt-3 rounded-2xl bg-[#1A2E26] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white/60">Current Job</span>
                  <h4 className="text-sm font-black text-[#85EB32]">En Route</h4>
                  <span className="text-[10px] text-white/80">ETA 12 min • 2.8 km</span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#85EB32] text-[#0F1A15]">
                  <Send className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Job Stepper */}
            <div className="mt-4 space-y-3 pl-2 text-xs">
              <div className="flex items-center gap-2 text-white/60">
                <span className="h-2 w-2 rounded-full border border-white/40" />
                <span>Job Assigned</span>
                <span className="ml-auto text-[10px]">10:14 AM</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-[#85EB32]">
                <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
                <span>En Route</span>
                <span className="ml-auto text-[10px]">10:32 AM</span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <span className="h-2 w-2 rounded-full border border-white/20" />
                <span>Arrived on Site</span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <span className="h-2 w-2 rounded-full border border-white/20" />
                <span>Work in Progress</span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <span className="h-2 w-2 rounded-full border border-white/20" />
                <span>Complete Job</span>
              </div>
            </div>

            <button className="mt-5 w-full rounded-xl bg-[#85EB32] py-2.5 text-xs font-bold text-[#0F1A15] shadow-sm">
              View Job Details →
            </button>
          </div>

          {/* Center Live Map & Site Visit Card */}
          <div className="rounded-2xl border border-[#DCE8DB] bg-white p-4 shadow-sm lg:col-span-5">
            <div className="flex items-center justify-between border-b border-[#EBEFE9] pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                <span className="text-xs font-black text-[#09130F]">Live Technicians</span>
                <span className="rounded-full bg-[#EAF8E9] px-2 py-0.5 text-[10px] font-bold text-[#18852E]">
                  12
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#5A6874]">
                <span>All Technicians</span>
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
              {/* Map Column */}
              <div className="relative h-56 overflow-hidden rounded-xl sm:col-span-6">
                <img
                  src="/marketing/map-field-operations.png"
                  alt="City street map"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Site Visit Card Column */}
              <div className="flex flex-col justify-between rounded-xl border border-[#EBEFE9] bg-[#F8FAF7] p-3 text-xs sm:col-span-6">
                <div>
                  <div className="relative mb-2 h-20 w-full overflow-hidden rounded-lg">
                    <img
                      src="/marketing/photo-server-rack.png"
                      alt="Data center server rack"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-[#85EB32]">
                      ● Live
                    </span>
                  </div>

                  <h5 className="font-extrabold text-[#09130F]">Site Visit</h5>
                  <p className="text-[10px] text-[#7D8791]">1200 Market St, NY</p>

                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src="/marketing/avatars/priya-shah.png"
                      alt="Priya Shah"
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <div>
                      <span className="block text-[10px] font-bold text-[#09130F]">Priya Shah</span>
                      <span className="block text-[9px] text-[#22C55E]">● On Site</span>
                    </div>
                  </div>
                </div>

                <button className="mt-2 w-full rounded-lg bg-[#111C22] py-1.5 text-[11px] font-bold text-white">
                  View Details →
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Deliverables List & Summary Phone Mock */}
          <div className="space-y-4 lg:col-span-4">
            {/* 5 Deliverables Pills */}
            <div className="space-y-2 rounded-2xl border border-[#DCE8DB] bg-white p-4 shadow-sm">
              {deliverables.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#F8FAF7] transition"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-[#09130F]">{item.title}</h5>
                      <p className="text-[10px] text-[#7D8791]">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Job Completed Toast */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#DCE8DB] bg-white p-3.5 shadow-md">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF8E9] text-[#18852E]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold text-[#09130F]">Job Completed!</span>
                <span className="block truncate text-[10px] text-[#5A6874]">
                  Priya Shah completed job at 1200 Market St.
                </span>
              </div>
              <span className="text-[9px] font-bold text-[#A0AEC0]">2m ago</span>
            </div>
          </div>
        </div>

        {/* 4 Bottom Metric Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#DCE8DB] pt-8 sm:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7E2] text-[#22C55E]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#09130F]">Faster Resolution</h5>
              <p className="text-[10px] text-[#5A6874]">Solve issues quickly</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7E2] text-[#22C55E]">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#09130F]">Full Visibility</h5>
              <p className="text-[10px] text-[#5A6874]">Real-time field insights</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7E2] text-[#22C55E]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#09130F]">Trusted &amp; Compliant</h5>
              <p className="text-[10px] text-[#5A6874]">Verified work &amp; proof</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7E2] text-[#22C55E]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#09130F]">Higher Productivity</h5>
              <p className="text-[10px] text-[#5A6874]">More jobs, less downtime</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
