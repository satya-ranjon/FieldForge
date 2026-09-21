'use client';

import React from 'react';
import { CheckCircle2, ShieldCheck, Award, MapPin, ArrowRight, MoreHorizontal } from 'lucide-react';

const verificationItems = [
  { title: 'Identity verified', desc: 'Government ID checked' },
  { title: 'Background check', desc: 'National criminal database' },
  { title: 'Certifications confirmed', desc: 'Industry and employer verified' },
  { title: 'Safety training', desc: 'OSHA, site-specific and more' },
  { title: 'Ongoing monitoring', desc: 'Keep credentials up to date' }
];

const workHistory = [
  { title: 'Network Technician', company: 'Vertex IT Solutions', period: '2022 – Present' },
  { title: 'Field Support Technician', company: 'BrightPath Technologies', period: '2019 – 2022' },
  { title: 'IT Support Specialist', company: 'Summit Communications', period: '2017 – 2019' }
];

export const ComplianceTrustSection: React.FC = () => {
  return (
    <section className="relative mx-auto my-16 max-w-[1360px] px-4 sm:px-6 lg:px-8">
      {/* Outer Card Container */}
      <div className="relative overflow-hidden rounded-3xl border border-[#DCE8DB] bg-gradient-to-b from-[#F2F8EE]/70 to-[#EDF6EA]/90 p-8 sm:p-12 shadow-[0_16px_50px_rgba(9,20,15,0.03)]">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start mb-12">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8DB] bg-white px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#17212B] shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[#85EB32]" />
              Compliance &amp; Trust
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.08] text-[#09130F]">
              Send people you can trust.
            </h2>

            <p className="text-base sm:text-lg text-[#5A6874] leading-relaxed">
              Credentials, certifications, work history, identity verification, and job-fit signals
              stay connected to every technician profile.
            </p>
          </div>

          <div className="hidden lg:block">
            <p
              className="rotate-[-6deg] text-base font-bold text-[#5EA824]"
              style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}
            >
              Qualified people
              <br />
              for real work.
            </p>
          </div>
        </div>

        {/* Content Split: Left Profile & Right Comprehensive Matrix */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Technician Profile Card */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#DCE8DB] bg-white p-6 shadow-sm lg:col-span-4">
            <div>
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src="/marketing/avatars/marcus-lee.png"
                    alt="Marcus Lee"
                    className="h-20 w-20 rounded-2xl object-cover shadow-sm ring-4 ring-[#EAF6E3]"
                  />
                  <span className="absolute -bottom-2 -right-1 flex items-center gap-1 rounded-full bg-[#EAF8E9] px-2 py-0.5 text-[9px] font-bold text-[#18852E] shadow-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-[#09130F]">Marcus Lee</h4>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[#5A6874]">
                    <span className="font-bold text-[#D97706]">★ 4.9</span>
                    <span>(186 jobs)</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[#7D8791]">
                    <MapPin className="h-3 w-3 text-[#5EA824]" />
                    <span>3.2 mi away</span>
                  </div>
                  <div className="mt-1 text-[11px] font-bold text-[#18852E]">
                    ● Available this week
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-[#5A6874] leading-relaxed">
                Network and infrastructure technician with 6+ years of field experience. Reliable,
                detail-oriented, and safety focused.
              </p>

              {/* Verified Badges */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {[
                  'Identity Verified',
                  'CompTIA A+',
                  'Background Check',
                  'OSHA 10',
                  'Cisco CCNA'
                ].map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#EBEFE9] bg-[#F8FAF7] px-2 py-1 text-[10px] font-bold text-[#09130F]"
                  >
                    <CheckCircle2 className="h-3 w-3 text-[#22C55E]" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 pt-4 border-t border-[#EBEFE9]">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#111C22] py-2.5 text-xs font-bold text-white transition hover:bg-[#1A2E35]">
                Invite to job
                <ArrowRight className="h-3.5 w-3.5 text-[#85EB32]" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE8DB] bg-white text-[#7D8791] hover:bg-[#F8FAF7]">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Matrix: Verification + Credentials + Fit Metrics */}
          <div className="rounded-3xl border border-[#DCE8DB] bg-white p-6 shadow-sm lg:col-span-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Column 1: Verification & Compliance */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#EBEFE9] pb-3">
                  <ShieldCheck className="h-4 w-4 text-[#22C55E]" />
                  <h5 className="text-xs font-black uppercase tracking-wider text-[#09130F]">
                    Verification &amp; Compliance
                  </h5>
                </div>

                <div className="space-y-3">
                  {verificationItems.map((item) => (
                    <div key={item.title} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22C55E] mt-0.5" />
                      <div>
                        <span className="block text-xs font-bold text-[#09130F]">{item.title}</span>
                        <span className="block text-[10px] text-[#7D8791]">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Credentials & Experience */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#EBEFE9] pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#22C55E]" />
                    <h5 className="text-xs font-black uppercase tracking-wider text-[#09130F]">
                      Credentials &amp; Experience
                    </h5>
                  </div>
                </div>

                {/* Certifications Pills */}
                <div>
                  <span className="block text-[11px] font-bold text-[#5A6874] mb-2">
                    Certifications
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {['Cisco CCNA', 'CompTIA A+', 'OSHA 10', 'First Aid/CPR'].map((cert) => (
                      <span
                        key={cert}
                        className="rounded bg-[#EAF8E9] px-2 py-0.5 text-[10px] font-bold text-[#18852E]"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Work History */}
                <div className="pt-2">
                  <span className="block text-[11px] font-bold text-[#5A6874] mb-2">
                    Work History
                  </span>
                  <div className="space-y-2">
                    {workHistory.map((work) => (
                      <div key={work.title} className="text-xs">
                        <span className="block font-bold text-[#09130F]">{work.title}</span>
                        <span className="block text-[10px] text-[#7D8791]">
                          {work.company} • {work.period}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3: Job Fit & Reliability Stats */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#EBEFE9] pb-3">
                  <Award className="h-4 w-4 text-[#22C55E]" />
                  <h5 className="text-xs font-black uppercase tracking-wider text-[#09130F]">
                    Job Fit &amp; Reliability
                  </h5>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#EBEFE9] bg-[#F8FAF7] p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-[#22C55E]">92%</span>
                      <span className="text-xs font-extrabold text-[#09130F]">job match</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#7D8791]">Skills and location align</p>
                  </div>

                  <div className="rounded-2xl border border-[#EBEFE9] bg-[#F8FAF7] p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-[#22C55E]">98%</span>
                      <span className="text-xs font-extrabold text-[#09130F]">response rate</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#7D8791]">
                      Typically replies in &lt; 1 hour
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#EBEFE9] bg-[#F8FAF7] p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-[#09130F]">186</span>
                      <span className="text-xs font-extrabold text-[#09130F]">completed jobs</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#7D8791]">
                      Across IT, cabling, and field support
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#EBEFE9] bg-[#F8FAF7] p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-[#D97706]">4.9</span>
                      <span className="text-xs font-extrabold text-[#09130F]">out of 5 rating</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#7D8791]">From verified clients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Row Below */}
        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-[#DCE8DB] pt-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['alex-morgan', 'priya-shah', 'marcus-lee', 'daniel-carter'].map((img) => (
                <img
                  key={img}
                  src={`/marketing/avatars/${img}.png`}
                  alt="Technician avatar"
                  className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-xs"
                />
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-[#09130F]">
                Trusted by leading facilities, IT and field operations teams
              </p>
              <p className="text-[11px] text-[#5A6874]">10,000+ verified technicians nationwide</p>
            </div>
          </div>

          <div className="hidden sm:block">
            <p
              className="rotate-[-4deg] text-xs font-bold text-[#5EA824]"
              style={{ fontFamily: "'Comic Sans MS', 'Caveat', cursive" }}
            >
              Real people. Real qualifications. Real results.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
