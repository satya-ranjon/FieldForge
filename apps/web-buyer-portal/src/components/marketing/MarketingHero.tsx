'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, MapPin, Clock, Star, CheckCircle2, ArrowRight, Radio } from 'lucide-react';
import { Button } from '@fieldforge/ui';

export const MarketingHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-[#f5fbf5] pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#e2ece5]">
      {/* Ambient background mint-green radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#22B947]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Hero Content: Badge, Headline, Subhead, CTAs */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Announcement Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e2ece5] shadow-xs text-xs font-medium text-[#111827]">
            <span className="w-2 h-2 rounded-full bg-[#22B947] animate-pulse" />
            <span className="font-semibold text-[#5a9332]">Vetted Field Network:</span>
            <span className="text-[#475569]">Over 10,000+ Certified Technicians Ready</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] tracking-tight leading-[1.1]">
            Deploy Certified Field Engineers in <span className="text-[#5a9332]">Minutes</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl mx-auto">
            Algorithmic geospatial matching, sub-4-hour emergency SLA guarantees, and
            cryptographically verified escrow release for mission-critical enterprise
            infrastructure.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto rounded-full px-8 py-3.5 shadow-md shadow-[#22B947]/25 text-sm font-bold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Find Technicians Now
              </Button>
            </Link>

            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="dark"
                size="lg"
                className="w-full sm:w-auto rounded-full px-7 py-3.5 text-sm font-semibold"
                leftIcon={<Radio className="w-4 h-4 text-[#22B947]" />}
              >
                Launch Command Center
              </Button>
            </Link>
          </div>

          {/* Enterprise Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-[#e2ece5]/80 text-left">
            <div className="bg-white/80 p-3.5 rounded-2xl border border-[#e2ece5] shadow-xs">
              <div className="text-2xl font-black font-mono text-[#111827]">99.98%</div>
              <div className="text-xs text-[#64748b] mt-0.5">SLA Compliance</div>
            </div>
            <div className="bg-white/80 p-3.5 rounded-2xl border border-[#e2ece5] shadow-xs">
              <div className="text-2xl font-black font-mono text-[#5a9332]">42ms</div>
              <div className="text-xs text-[#64748b] mt-0.5">Matching Latency</div>
            </div>
            <div className="bg-white/80 p-3.5 rounded-2xl border border-[#e2ece5] shadow-xs">
              <div className="text-2xl font-black font-mono text-[#111827]">$45M+</div>
              <div className="text-xs text-[#64748b] mt-0.5">Escrow Protected</div>
            </div>
            <div className="bg-white/80 p-3.5 rounded-2xl border border-[#e2ece5] shadow-xs">
              <div className="text-2xl font-black font-mono text-[#5a9332]">10,000+</div>
              <div className="text-xs text-[#64748b] mt-0.5">Certified Engineers</div>
            </div>
          </div>
        </div>

        <div className="mt-14 max-w-5xl mx-auto">
          <div className="rounded-3xl bg-[#0d1517] border-4 border-white shadow-2xl shadow-slate-900/20 overflow-hidden">
            {/* Window title bar */}
            <div className="bg-[#142427] px-5 py-3.5 border-b border-[#22383c] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]/80" />
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]/80" />
                <div className="w-3 h-3 rounded-full bg-[#22B947]/80" />
                <span className="text-xs font-mono text-slate-400 pl-3 font-semibold">
                  FieldForge Autonomous Dispatch • Live Geospatial Radar
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0d1517] text-[#22B947] border border-[#22383c] font-bold">
                ● 14 TECHS ON RADAR
              </span>
            </div>

            {/* Dashboard Mock Body */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left: Best Match Candidate Card (Alex Morgan from 1442.png) */}
              <div className="md:col-span-7 bg-[#142427] rounded-2xl border border-[#22383c] p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1c3539] to-[#2a4d53] border-2 border-[#22B947] flex items-center justify-center text-white font-bold text-lg font-mono shadow-sm shadow-[#22B947]/30">
                      AM
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-bold text-white tracking-tight">
                          Alex Morgan
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22B947] text-[#08120D] font-bold font-mono">
                          98% MATCH
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="flex items-center text-amber-400 font-bold font-mono">
                          <Star className="w-3 h-3 fill-current mr-0.5" /> 4.98
                        </span>
                        <span>•</span>
                        <span className="font-mono">184 jobs completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-lg font-bold text-[#22B947]">$85.00/hr</div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-[#22B947]" /> 12m ETA
                    </div>
                  </div>
                </div>

                {/* Vetting Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Cisco CCNA', 'Fiber Splicing Cert', 'OSHA 10', 'Background Checked'].map(
                    (badge) => (
                      <span
                        key={badge}
                        className="text-[10px] px-2.5 py-1 rounded-md bg-[#0d1517] text-slate-200 border border-[#22383c] font-mono flex items-center gap-1 font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#22B947]" />
                        {badge}
                      </span>
                    )
                  )}
                </div>

                {/* Geofence & Location status */}
                <div className="bg-[#0d1517] p-3 rounded-xl border border-[#22383c] flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-[#22B947]" />
                    <span>Current Proximity: 1.4 miles from Data Center</span>
                  </div>
                  <span className="text-[#22B947] font-mono font-bold text-[10px]">
                    GPS CALIBRATED
                  </span>
                </div>

                {/* Action CTA */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    SOW #WO-8841 • POS &amp; Fiber Restore
                  </span>
                  <Link href="/">
                    <Button
                      variant="primary"
                      size="sm"
                      className="shadow-sm shadow-[#22B947]/20"
                      leftIcon={<Zap className="w-3.5 h-3.5" />}
                    >
                      Instant Dispatch
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right: Circular Radar Scope Visualization */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-2">
                <div className="relative w-48 h-48 rounded-full bg-[#0a1012] border-2 border-[#1c3539] shadow-[0_0_25px_rgba(34,185,71,0.15)] flex items-center justify-center overflow-hidden">
                  {/* Concentric rings */}
                  <div className="absolute w-36 h-36 rounded-full border border-[#1c3539]/50" />
                  <div className="absolute w-24 h-24 rounded-full border border-[#1c3539]/60" />
                  <div className="absolute w-12 h-12 rounded-full border border-[#1c3539]/80" />

                  {/* Crosshairs */}
                  <div className="absolute inset-x-0 h-px bg-[#1c3539]/60" />
                  <div className="absolute inset-y-0 w-px bg-[#1c3539]/60" />

                  {/* Sweep beam */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div
                      className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#22B947]/40 to-[#22B947] animate-radar-sweep"
                      style={{ transformOrigin: '0% 50%' }}
                    />
                  </div>

                  {/* Center Node */}
                  <div className="relative z-10 w-3 h-3 rounded-full bg-[#22B947] shadow-[0_0_10px_rgba(34,185,71,0.9)] ring-4 ring-[#22B947]/20" />

                  {/* Tech Blips */}
                  <div className="absolute z-10 -translate-x-8 -translate-y-10">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22B947] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22B947]" />
                    </span>
                  </div>
                  <div className="absolute z-10 translate-x-12 translate-y-6">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22B947]" />
                    </span>
                  </div>
                  <div className="absolute z-10 -translate-x-12 translate-y-8">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <span className="text-xs font-mono text-slate-300 font-bold block">
                    San Francisco Bay Area Radius: 25mi
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Sub-15m Response Target • Active GPS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
