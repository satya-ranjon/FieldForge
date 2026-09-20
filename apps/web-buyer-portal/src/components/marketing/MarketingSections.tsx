'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight, Server, Smartphone, Radio, Lock } from 'lucide-react';
import { Button } from '@fieldforge/ui';

export const MarketingSections: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const trustLogos = [
    'APEX RETAIL',
    'VERIZON GLOBAL',
    'LEVEL3 FIBER',
    'CHARGEPOINT GRID',
    'CLOUDFLARE EDGE',
    'CISCO NETWORKS'
  ];

  const steps = [
    {
      num: '01',
      title: 'Define SOW & Authorize Escrow',
      description:
        'Specify mandatory technician certifications, GPS coordinates, geofence tolerance, and milestones. Escrow funds are secured in the Smart Vault before dispatch.',
      badge: 'Smart Contract Vault'
    },
    {
      num: '02',
      title: 'Geospatial Radar Broadcasts',
      description:
        'Redis GEOSEARCH algorithms evaluate nearby certified engineers within seconds. Technicians submit bids with ETAs and specialized tooling confirmation.',
      badge: 'Redis GEOSTREAM'
    },
    {
      num: '03',
      title: 'Verified Proof-of-Work Release',
      description:
        'Mobile check-in enforces a 200m physical geofence. High-res photo deliverables and manager signatures trigger automated, instant ACH fund disbursements.',
      badge: 'Instant ACH Release'
    }
  ];

  const features = [
    {
      icon: Radio,
      title: 'Autonomous Geospatial Matching',
      description:
        'Sub-second candidate ranking matches vetted engineers by driving distance, skill accreditation, and historical reliability ratings.',
      tag: 'Redis Clustering'
    },
    {
      icon: Lock,
      title: 'Non-Custodial Escrow Vault',
      description:
        'Eliminates payment friction and contractor ghosting. Funds are cryptographically locked until proof-of-work criteria are verified.',
      tag: 'Zero Payment Disputes'
    },
    {
      icon: Smartphone,
      title: 'Offline-First Field Mobile App',
      description:
        'Engineers track SOP steps, capture serial barcodes, and collect signatures even in basement server rooms with zero cellular reception.',
      tag: 'SQLite Delta Sync'
    },
    {
      icon: Server,
      title: 'Distributed Trace Observability',
      description:
        'Track end-to-end event logs, correlation IDs, and microservice latencies across AMQP RabbitMQ queues and REST gateways in real-time.',
      tag: 'Full Audit Trail'
    }
  ];

  const industries = [
    {
      title: 'Telecommunications & 5G',
      description:
        'Cell tower repairs, optical fiber fusion splicing, OTDR loss testing, and small-cell antenna provisioning.',
      tag: 'Sub-4h Emergency SLA'
    },
    {
      title: 'EV Charging Infrastructure',
      description:
        'DC fast charger repair, grid transformer maintenance, payment controller swaps, and OCPP firmware diagnostics.',
      tag: 'High-Voltage Certified'
    },
    {
      title: 'Retail POS & Networking',
      description:
        'Multi-lane POS terminal replacements, Cat6 drops, Cisco switch configurations, and merchant payment certifications.',
      tag: 'Nationwide Rollouts'
    },
    {
      title: 'Data Center & Edge Colocation',
      description:
        'Smart hands support, rack-and-stack server provisioning, hot aisle containment, and SFP28 transceiver swaps.',
      tag: 'Strict Background Checked'
    }
  ];

  const faqs = [
    {
      q: 'How are technicians vetted before dispatch?',
      a: 'Every contractor on the FieldForge network undergoes a multi-layer verification process including criminal background checks, license verification (OSHA, Cisco CCNA, EPA, State Electrical), and photo ID matching. Skill badges are recertified annually.'
    },
    {
      q: 'How does the Escrow Smart Vault protect both buyer and contractor?',
      a: 'Buyers pre-authorize payment when creating the Statement of Work, guaranteeing that funds exist before a technician drives to the site. Funds are safely held in trust and disbursed automatically once proof-of-work deliverables (GPS check-in, photos, manager signatures) are approved.'
    },
    {
      q: 'Can our enterprise integrate FieldForge with ServiceNow or Jira?',
      a: 'Yes. FieldForge provides full REST API and webhook integrations. Work orders can be generated automatically from incoming monitoring alerts, and status changes are synced in real-time.'
    },
    {
      q: 'What happens if a technician arrives but cannot access the facility?',
      a: 'Our smart geofence system logs the physical arrival time and GPS position. If site access is denied through no fault of the contractor, a standardized trip fee is disbursed from escrow pursuant to our SLA terms.'
    }
  ];

  return (
    <div className="space-y-24 py-16 bg-[#f5fbf5]">
      {/* 1. Enterprise Trust Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-mono font-bold text-[#64748b] tracking-wider uppercase mb-8">
          Trusted by Mission-Critical Infrastructure Leaders
        </p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 items-center justify-center opacity-70">
          {trustLogos.map((logo) => (
            <div
              key={logo}
              className="py-3 px-4 rounded-xl bg-white/70 border border-[#e2ece5] text-xs font-black font-mono text-[#475569] tracking-widest shadow-xs"
            >
              {logo}
            </div>
          ))}
        </div>
      </section>

      {/* 2. How It Works (3-Step Lifecycle) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-mono font-bold text-[#5a9332] uppercase px-3 py-1 rounded-full bg-[#eaf5ec] border border-[#d2e8d6]">
            Lifecycle Automation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
            How Autonomous Dispatch Works
          </h2>
          <p className="text-sm text-[#475569] leading-relaxed">
            From emergency ticket generation to verified escrow payout in three predictable steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div
              key={s.num}
              className="bg-white rounded-3xl p-7 border border-[#e2ece5] shadow-sm relative space-y-4 hover:border-[#22B947] transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-3xl font-black text-[#5a9332]">{s.num}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#eaf5ec] text-[#5a9332] border border-[#d2e8d6]">
                  {s.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#111827] tracking-tight">{s.title}</h3>
              <p className="text-xs text-[#475569] leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Core Features Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-mono font-bold text-[#5a9332] uppercase px-3 py-1 rounded-full bg-[#eaf5ec] border border-[#d2e8d6]">
            Architectural Invariants
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
            Engineered for High-Concurrency Operations
          </h2>
          <p className="text-sm text-[#475569] leading-relaxed">
            Eliminate SLA penalties and disintermediation through automated contractual guarantees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-white rounded-3xl p-7 border border-[#e2ece5] shadow-xs hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#eaf5ec] flex items-center justify-center text-[#5a9332]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono text-[#64748b] bg-[#f5fbf5] px-2.5 py-1 rounded-lg border border-[#e2ece5]">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#111827]">{f.title}</h3>
                <p className="text-xs text-[#475569] leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Solutions by Industry */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-mono font-bold text-[#5a9332] uppercase px-3 py-1 rounded-full bg-[#eaf5ec] border border-[#d2e8d6]">
            Vertical Solutions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
            Field Teams for Every Mission
          </h2>
          <p className="text-sm text-[#475569] leading-relaxed">
            Tailored Statements of Work and certification requirements across industrial sectors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((ind) => (
            <div
              key={ind.title}
              className="bg-white rounded-3xl p-6 border border-[#e2ece5] shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#eaf5ec] text-[#5a9332] inline-block">
                  {ind.tag}
                </span>
                <h4 className="text-sm font-bold text-[#111827]">{ind.title}</h4>
                <p className="text-xs text-[#475569] leading-relaxed">{ind.description}</p>
              </div>
              <Link
                href="/solutions"
                className="text-xs font-semibold text-[#5a9332] hover:underline flex items-center gap-1 pt-2"
              >
                Explore SOW Blueprints →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Enterprise Testimonial Quotes */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#142427] rounded-3xl p-8 sm:p-12 border border-[#22383c] text-white shadow-xl space-y-6">
          <div className="flex items-center space-x-2">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-[#22B947] text-base">
                ★
              </span>
            ))}
            <span className="text-xs font-mono text-slate-400 pl-2">
              5.0 Enterprise Trust Score
            </span>
          </div>

          <blockquote className="text-xl sm:text-2xl font-semibold leading-relaxed tracking-tight text-slate-100">
            &quot;Before FieldForge, emergency fiber cuts and POS failures averaged a 6.2 hour response
            window with an 18% SLA breach rate. With autonomous radar matching and escrow
            guarantees, our mean time to on-site check-in dropped to 48 minutes.&quot;
          </blockquote>

          <div className="flex items-center justify-between border-t border-[#22383c] pt-5">
            <div>
              <div className="font-bold text-sm text-white">David Henderson</div>
              <div className="text-xs text-slate-400">
                VP of National Infrastructure, Apex Retail Corp
              </div>
            </div>
            <div className="text-right font-mono text-xs text-[#22B947] font-bold">
              99.8% On-Time SLA
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-[#64748b]">
            Everything you need to know about compliance, vetting, and escrow settlement.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#e2ece5] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#f8faf8] transition"
                >
                  <span className="text-sm font-bold text-[#111827]">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#64748b] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#5a9332]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs text-[#475569] leading-relaxed border-t border-[#e2ece5]/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Final High-Impact CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-[#0d1517] border border-[#22383c] p-8 sm:p-14 text-center overflow-hidden shadow-2xl space-y-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[#22B947]/10 via-transparent to-[#22B947]/10 pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-[#142427] text-[#22B947] border border-[#22383c]">
              ZERO PLATFORM SETUP FEES
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ready to automate your mission-critical field operations?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Join over 10,000 certified technicians and enterprise operators managing field service
              with cryptographic SLA certainty.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link href="/" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-8 py-3.5 shadow-md shadow-[#22B947]/30 text-sm font-bold"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Your First Work Order
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button
                  variant="dark"
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-7 py-3.5 text-sm font-semibold"
                >
                  Schedule an Architecture Walkthrough
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
