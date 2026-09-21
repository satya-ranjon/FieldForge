'use client';

import React from 'react';
import { MapPin, Layers, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

const candidates = [
  {
    name: 'Alex Morgan',
    meta: '1.8 mi • 4 min • CCNA • Available',
    avatar: '/marketing/avatars/alex-morgan.png',
    bestMatch: true
  },
  {
    name: 'Daniel Lee',
    meta: '3.1 mi • 8 min • A+',
    avatar: '/marketing/avatars/daniel-carter.png',
    bestMatch: false
  },
  {
    name: 'Priya Shah',
    meta: '4.0 mi • 11 min • OSHA',
    avatar: '/marketing/avatars/priya-shah.png',
    bestMatch: false
  }
];

export const SmartDispatchSection: React.FC = () => {
  return (
    <section className="relative mx-auto my-16 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end mb-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8DB] bg-white px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#17212B] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
            Smart Dispatch
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.08] text-[#09130F]">
            Dispatch faster.
            <br />
            Without guessing.
          </h2>
        </div>

        <p className="max-w-md text-base sm:text-lg text-[#5A6874] leading-relaxed">
          Automatically identify nearby qualified technicians using location, availability,
          performance and verified credentials.
        </p>
      </div>

      {/* Main Map + Candidates Card Container */}
      <div className="relative overflow-hidden rounded-3xl border border-[#DCE8DB] bg-white p-6 sm:p-8 shadow-[0_16px_50px_rgba(9,20,15,0.03)]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Tactical Map View */}
          <div className="relative overflow-hidden rounded-2xl border border-[#22383C] bg-[#0A1612] lg:col-span-8">
            <img
              src="/marketing/map-smart-dispatch.png"
              alt="San Francisco dispatch map with real-time technician routes and emergency callout"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Right Dispatch Candidates List */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#22383C] bg-[#111C22] p-5 text-white lg:col-span-4">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">Dispatch candidates</span>
                </div>
                <span className="text-[11px] text-[#A0AEC0]">Sorted by best match</span>
              </div>

              {/* Candidate Items */}
              <div className="mt-4 space-y-3">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.name}
                    className={`flex items-center justify-between rounded-2xl p-3 transition-all ${
                      candidate.bestMatch
                        ? 'bg-[#A8F22D] text-[#08120D] shadow-[0_8px_24px_rgba(168,242,45,0.25)] ring-2 ring-[#A8F22D]/40'
                        : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={candidate.avatar}
                        alt={candidate.name}
                        className="h-10 w-10 rounded-full border border-white/40 object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs font-black ${
                              candidate.bestMatch ? 'text-[#08120D]' : 'text-white'
                            }`}
                          >
                            {candidate.name}
                          </h4>
                          {candidate.bestMatch && (
                            <span className="rounded-full bg-[#08120D] px-2 py-0.5 text-[9px] font-extrabold text-[#A8F22D]">
                              BEST MATCH
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] ${
                            candidate.bestMatch
                              ? 'text-[#08120D]/80 font-semibold'
                              : 'text-[#A0AEC0]'
                          }`}
                        >
                          {candidate.meta}
                        </p>
                      </div>
                    </div>

                    <ArrowRight
                      className={`h-4 w-4 ${
                        candidate.bestMatch ? 'text-[#08120D]' : 'text-white/60'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Dispatch Bottom Action */}
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <span className="text-xs text-white/70">
                Algorithmically optimized for sub-15m arrival
              </span>
            </div>
          </div>
        </div>

        {/* 4 Feature Pills Below */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-[#DCE8DB] bg-[#F8FAF7] px-4 py-3 text-xs font-extrabold text-[#09130F]">
            <MapPin className="h-4 w-4 text-[#5EA824]" />
            Real-time location
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-[#DCE8DB] bg-[#F8FAF7] px-4 py-3 text-xs font-extrabold text-[#09130F]">
            <Layers className="h-4 w-4 text-[#5EA824]" />
            Smart matching
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-[#DCE8DB] bg-[#F8FAF7] px-4 py-3 text-xs font-extrabold text-[#09130F]">
            <Zap className="h-4 w-4 text-[#5EA824]" />
            Emergency routing
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-[#DCE8DB] bg-[#F8FAF7] px-4 py-3 text-xs font-extrabold text-[#09130F]">
            <ShieldCheck className="h-4 w-4 text-[#5EA824]" />
            Priority dispatch
          </div>
        </div>
      </div>
    </section>
  );
};
