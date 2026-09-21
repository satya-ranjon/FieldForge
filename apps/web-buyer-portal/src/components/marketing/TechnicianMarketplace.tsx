'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Wrench,
  Award,
  Calendar,
  Star,
  Check,
  ArrowRight,
  Briefcase,
  ChevronDown
} from 'lucide-react';

export const TechnicianMarketplace: React.FC = () => {
  return (
    <section className="relative mx-auto my-16 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      {/* Top Filter Bar */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DCE8DB] bg-white p-3.5 shadow-[0_8px_24px_rgba(9,20,15,0.03)]">
        <div className="flex flex-wrap items-center gap-2.5">
          <button className="flex items-center gap-2 rounded-xl border border-[#EBEFE9] bg-[#F8FAF7] px-3.5 py-2 text-xs font-bold text-[#09130F] hover:bg-white transition">
            <MapPin className="h-3.5 w-3.5 text-[#5EA824]" />
            Location
            <ChevronDown className="h-3 w-3 text-[#7D8791]" />
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-[#EBEFE9] bg-[#F8FAF7] px-3.5 py-2 text-xs font-bold text-[#09130F] hover:bg-white transition">
            <Wrench className="h-3.5 w-3.5 text-[#5EA824]" />
            Skill
            <ChevronDown className="h-3 w-3 text-[#7D8791]" />
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-[#EBEFE9] bg-[#F8FAF7] px-3.5 py-2 text-xs font-bold text-[#09130F] hover:bg-white transition">
            <Award className="h-3.5 w-3.5 text-[#5EA824]" />
            Certification
            <ChevronDown className="h-3 w-3 text-[#7D8791]" />
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-[#EBEFE9] bg-[#F8FAF7] px-3.5 py-2 text-xs font-bold text-[#09130F] hover:bg-white transition">
            <Calendar className="h-3.5 w-3.5 text-[#5EA824]" />
            Availability
            <ChevronDown className="h-3 w-3 text-[#7D8791]" />
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-[#EBEFE9] bg-[#F8FAF7] px-3.5 py-2 text-xs font-bold text-[#09130F] hover:bg-white transition">
            <Star className="h-3.5 w-3.5 text-[#F59E0B]" />
            Rating
            <ChevronDown className="h-3 w-3 text-[#7D8791]" />
          </button>
        </div>

        <div className="rounded-xl bg-[#EAF8E9] px-3.5 py-2 text-xs font-bold text-[#18852E]">
          150+ technicians
        </div>
      </div>

      {/* Main Two-Column Section */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
        {/* Left Copy & CTA */}
        <div className="space-y-6 lg:col-span-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8DB] bg-white px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#17212B] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
            Technician Marketplace
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.08] text-[#09130F]">
            The right technician for every job.
          </h2>

          <p className="text-base sm:text-lg text-[#5A6874] leading-relaxed">
            Find qualified professionals based on location, experience, ratings and verified
            credentials. Get the right tech on site, faster.
          </p>

          <div>
            <Link
              href="/"
              className="inline-flex h-14 items-center gap-4 rounded-full bg-[#111C22] px-8 text-base font-bold text-white shadow-[0_16px_36px_rgba(17,28,34,0.18)] transition hover:bg-[#1A2E35]"
            >
              Explore Technician Network
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#85EB32] text-[#0F1A15]">
                <ArrowRight className="h-4 w-4 stroke-[3]" />
              </span>
            </Link>
          </div>

          {/* 3 Checkmarks */}
          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs font-bold text-[#5A6874]">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF8E9] text-[#18852E]">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
              Verified professionals
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF8E9] text-[#18852E]">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
              Validated credentials
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF8E9] text-[#18852E]">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
              Faster job completion
            </div>
          </div>
        </div>

        {/* Right Candidate Cards Composition */}
        <div className="relative lg:col-span-7">
          <div className="relative min-h-[500px] rounded-3xl border border-[#DCE8DB] bg-gradient-to-br from-[#F2F8EE]/80 via-[#EDF6EA]/60 to-[#E5F2E1]/70 p-6 sm:p-8 shadow-[0_16px_50px_rgba(9,20,15,0.03)]">
            {/* Handwritten annotation top left */}
            <div className="mb-4">
              <p
                className="rotate-[-8deg] text-base font-bold text-[#5EA824]"
                style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}
              >
                Skilled technicians. Where you need them.
              </p>
            </div>

            {/* Cards Positioning Container */}
            <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
              {/* Left Secondary Card: Priya Shah */}
              <div className="rounded-2xl border border-[#EBEFE9] bg-white p-4 shadow-sm lg:col-span-5 lg:self-center">
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <img
                      src="/marketing/avatars/priya-shah.png"
                      alt="Priya Shah"
                      className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-xs"
                    />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#22C55E]" />
                  </div>
                  <span className="rounded-full bg-[#EAF8E9] px-2 py-0.5 text-[10px] font-bold text-[#18852E]">
                    ● Available
                  </span>
                </div>

                <div className="mt-2.5">
                  <h4 className="text-sm font-black text-[#09130F]">Priya Shah</h4>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#5A6874]">
                    <span className="font-bold text-[#D97706]">★ 4.9</span>
                    <span>(221 reviews)</span>
                    <span>•</span>
                    <Briefcase className="h-3 w-3 text-[#7D8791]" />
                    <span>480 jobs</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-[#7D8791]">
                    <MapPin className="h-3 w-3 text-[#5EA824]" />
                    <span>San Jose, CA • 12 mi away</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {['POS Systems', 'IT Hardware', 'CompTIA A+', 'Cisco CCNA'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#F0F2F3] px-1.5 py-0.5 text-[9px] font-semibold text-[#5A6874]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Center Featured Card: Marcus Lee */}
              <div className="z-20 rounded-3xl border-2 border-[#DCE8DB] bg-white p-6 shadow-[0_20px_60px_rgba(9,20,15,0.1)] lg:col-span-7">
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <img
                      src="/marketing/avatars/marcus-lee.png"
                      alt="Marcus Lee"
                      className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-sm ring-4 ring-[#EAF6E3]"
                    />
                    <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#22C55E]" />
                  </div>
                  <span className="rounded-full bg-[#EAF8E9] px-2.5 py-1 text-xs font-extrabold text-[#18852E]">
                    ● Available
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-black tracking-tight text-[#09130F]">Marcus Lee</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#5A6874]">
                    <span className="font-bold text-[#D97706]">★ 4.9</span>
                    <span>(126 reviews)</span>
                    <span>•</span>
                    <Briefcase className="h-3.5 w-3.5 text-[#7D8791]" />
                    <span className="font-semibold">320 jobs</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#7D8791]">
                    <MapPin className="h-3.5 w-3.5 text-[#5EA824]" />
                    <span>Austin, TX</span>
                    <span>•</span>
                    <span>3.2 mi away</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['Cisco CCNA', 'CompTIA A+', 'Structured Cabling', 'OSHA 10'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-[#EBEFE9] bg-[#F8FAF7] px-2.5 py-1 text-[11px] font-bold text-[#09130F]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-2.5">
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#111C22] py-2.5 text-xs font-bold text-white transition hover:bg-[#1A2E35]">
                    Invite to job
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#85EB32] text-[#0F1A15]">
                      <ArrowRight className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  </button>
                  <button className="rounded-xl border border-[#DCE8DB] bg-white px-4 py-2.5 text-xs font-bold text-[#09130F] hover:bg-[#F8FAF7] transition">
                    View profile
                  </button>
                </div>
              </div>

              {/* Right Stack: Daniel Carter & Alex Rivera */}
              <div className="space-y-4 lg:col-span-12 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                <div className="rounded-2xl border border-[#EBEFE9] bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <img
                      src="/marketing/avatars/daniel-carter.png"
                      alt="Daniel Carter"
                      className="h-11 w-11 rounded-full border border-white object-cover"
                    />
                    <span className="rounded-full bg-[#FFF5DF] px-2 py-0.5 text-[10px] font-bold text-[#B76B00]">
                      In 2 days
                    </span>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-bold text-[#09130F]">Daniel Carter</h4>
                    <p className="text-[11px] text-[#7D8791]">
                      ★ 4.8 (98 reviews) • Dallas, TX • 8 mi away
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['Security Systems', 'OSHA 10', 'Access Control'].map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-[#F0F2F3] px-1.5 py-0.5 text-[9px] font-semibold text-[#5A6874]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#EBEFE9] bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <img
                      src="/marketing/avatars/alex-rivera.png"
                      alt="Alex Rivera"
                      className="h-11 w-11 rounded-full border border-white object-cover"
                    />
                    <span className="rounded-full bg-[#EAF8E9] px-2 py-0.5 text-[10px] font-bold text-[#18852E]">
                      ● Available
                    </span>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-bold text-[#09130F]">Alex Rivera</h4>
                    <p className="text-[11px] text-[#7D8791]">
                      ★ 4.7 (64 reviews) • Orlando, FL • 25 mi away
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['IT Hardware', 'Structured Cabling', 'CompTIA A+'].map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-[#F0F2F3] px-1.5 py-0.5 text-[9px] font-semibold text-[#5A6874]"
                      >
                        {tag}
                      </span>
                    ))}
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
