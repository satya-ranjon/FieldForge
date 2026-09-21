'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Shield, Zap, BarChart2 } from 'lucide-react';

export const DarkBottomCtaBanner: React.FC = () => {
  return (
    <section className="relative mx-auto my-20 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[36px] border border-[#22383C] bg-gradient-to-br from-[#0B1A15] via-[#0E1E19] to-[#081410] p-8 sm:p-12 lg:p-16 text-white shadow-2xl">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#22C55E]/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#85EB32]/10 blur-[100px]" />

        <div className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: CTA Pitch */}
          <div className="space-y-6 lg:col-span-5">
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#85EB32] uppercase">
              — FIELDWORK MOVES FORWARD
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.08] text-white">
              Your next field job should not take hours to staff.
            </h2>

            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              Find qualified technicians, coordinate field work and keep every job accountable from
              dispatch through payment.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/create-wo"
                className="inline-flex h-12 items-center gap-3 rounded-full bg-[#85EB32] px-7 text-sm font-black text-[#08120D] shadow-[0_12px_28px_rgba(133,235,50,0.28)] transition hover:bg-[#78dc29]"
              >
                Find Technicians
                <ArrowRight className="h-4 w-4 stroke-[3]" />
              </Link>
              <Link
                href="/resources"
                className="inline-flex h-12 items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Book a Demo
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#85EB32] text-[#08120D]">
                  <Play className="ml-0.5 h-2.5 w-2.5 fill-current" />
                </span>
              </Link>
            </div>

            {/* 3 Bottom Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/10 text-[10px] font-bold text-white/80 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#85EB32]" />
                TRUSTED TECHNICIANS
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#85EB32]" />
                FASTER DISPATCH
              </div>
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#85EB32]" />
                GREATER ACCOUNTABILITY
              </div>
            </div>

            {/* Handwritten Note */}
            <div className="pt-2">
              <p
                className="rotate-[-6deg] text-base font-bold text-[#85EB32]"
                style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}
              >
                Field work. Built better.
              </p>
            </div>
          </div>

          {/* Right Column: Tablet Frame Live Command Mockup */}
          <div className="relative lg:col-span-7">
            <div className="overflow-hidden rounded-3xl border-4 border-white/10 bg-[#0E1B15] shadow-2xl">
              {/* Tablet App Header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-[#11211B] px-5 py-3 text-xs text-white">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#85EB32] text-[10px] font-black text-[#08120D]">
                      F
                    </span>
                    <span>FieldForge</span>
                  </div>
                  <span className="rounded-full bg-[#1A2E26] px-2.5 py-0.5 text-[10px] font-extrabold text-[#85EB32]">
                    ● Command Center
                  </span>
                  <span className="hidden sm:inline text-white/60">Work Orders</span>
                  <span className="hidden sm:inline text-white/60">Technicians</span>
                  <span className="hidden sm:inline text-white/60">Payments</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/60">Mon, Apr 22 10:24 AM</span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                    JS
                  </div>
                </div>
              </div>

              {/* Sub-header & 4 KPIs */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-black text-white">Command Center</h4>
                    <p className="text-[10px] text-white/60">
                      Open jobs, technicians, approvals and operational risk.
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] text-[#85EB32] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#85EB32] animate-pulse" />
                    Live Operational View
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  <div className="rounded-xl bg-white/5 p-2">
                    <span className="block text-base font-black text-[#85EB32]">18</span>
                    <span className="text-[9px] text-white/60">Open Jobs</span>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2">
                    <span className="block text-base font-black text-[#FBBF24]">04</span>
                    <span className="text-[9px] text-white/60">At Risk</span>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2">
                    <span className="block text-base font-black text-[#38BDF8]">09</span>
                    <span className="text-[9px] text-white/60">Pending Approval</span>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2">
                    <span className="block text-base font-black text-white">$42K</span>
                    <span className="text-[9px] text-white/60">Spend</span>
                  </div>
                </div>

                {/* Map & Alerts Two-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Texas Tactical Map */}
                  <div className="relative h-56 rounded-xl overflow-hidden sm:col-span-7 bg-[#0A1612]">
                    <img
                      src="/marketing/map-texas-command.png"
                      alt="Texas dispatch operations map"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Right Alerts & Best Match */}
                  <div className="space-y-2 text-[10px] sm:col-span-5">
                    {/* Operational Alerts */}
                    <div className="rounded-xl bg-white/5 p-2.5">
                      <span className="block font-bold text-white mb-1.5">Operational Alerts</span>
                      <div className="space-y-1.5 text-[9px]">
                        <div className="flex items-center justify-between text-red-400">
                          <span>! Emergency work needs dispatch</span>
                          <span className="text-white/40">2 min ago</span>
                        </div>
                        <div className="flex items-center justify-between text-amber-400">
                          <span>! Arrival verification pending</span>
                          <span className="text-white/40">14 min ago</span>
                        </div>
                        <div className="flex items-center justify-between text-[#85EB32]">
                          <span>✓ Invoice awaiting approval</span>
                          <span className="text-white/40">1 hour ago</span>
                        </div>
                      </div>
                    </div>

                    {/* Best Match Candidate */}
                    <div className="rounded-xl border border-[#85EB32]/40 bg-[#14261F] p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold uppercase text-[#85EB32]">
                          BEST MATCH
                        </span>
                        <span className="rounded bg-[#85EB32] px-1.5 py-0.5 text-[8px] font-extrabold text-[#08120D]">
                          96% match
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <img
                          src="/marketing/avatars/alex-morgan.png"
                          alt="Alex Morgan"
                          className="h-7 w-7 rounded-full object-cover"
                        />
                        <div>
                          <span className="block font-bold text-white">Alex Morgan</span>
                          <span className="block text-[8px] text-white/60">
                            HVAC • 4.9 ★ • 120 jobs
                          </span>
                        </div>
                      </div>

                      <button className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#85EB32] py-1.5 text-[10px] font-bold text-[#08120D]">
                        Assign Technician
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
