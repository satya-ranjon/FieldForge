'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingNavbar } from '../../components/marketing/MarketingNavbar';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { Radio, FileText, Lock, Smartphone, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@fieldforge/ui';

export default function PlatformPage(): React.JSX.Element {
  const pillars = [
    {
      icon: Radio,
      title: 'Geospatial Technician Radar',
      subtitle: 'Real-Time Contractor Discovery & Bids',
      spec: 'Redis GEOSEARCH & GEOSTREAM',
      description:
        'Continuous geospatial indexing evaluates contractor distance, driving times, and active certifications in under 50 milliseconds. Broadcasters push emergency bids with live ETAs directly to qualified mobile engineers.',
      features: [
        'Dynamic perimeter radius filtering (5mi - 50mi)',
        'Skill and certification match scoring (98%+ accuracy)',
        'Real-time contractor bid counter-proposals',
        'Automatic failover to secondary perimeter upon timeout'
      ]
    },
    {
      icon: FileText,
      title: 'Enterprise SOW Studio',
      subtitle: 'Parametric Scope & Deliverables SOPs',
      spec: 'FR-WO-001 / FR-WO-002',
      description:
        'Eliminate ambiguous work orders. Construct precise, enforceable Statements of Work using enterprise blueprint presets, mandatory check-in geofences, and required proof-of-work deliverables.',
      features: [
        'Battle-tested blueprints (POS, Fiber, EV, HVAC, CCTV)',
        'Granular SOP checklists with step-by-step enforcement',
        'Mandatory photo & serial barcode capture rules',
        'Customer digital signature requirements'
      ]
    },
    {
      icon: Lock,
      title: 'Smart Escrow Vault',
      subtitle: 'Non-Custodial Milestone Settlement',
      spec: 'FR-BILL-001 / FR-BILL-002',
      description:
        'Never worry about contractor abandonment or delayed enterprise invoices. Pre-authorized funds are held securely in the Smart Vault and released automatically upon verified proof-of-work completion.',
      features: [
        'Automated pre-authorization upon ticket publication',
        'Idempotent transactional safety with AES-256 encryption',
        '48-hour auto-approval window with audit freeze',
        'Instant ACH and wire disbursement upon milestone sign-off'
      ]
    },
    {
      icon: Smartphone,
      title: 'Offline Field Mobile App',
      subtitle: 'Zero-Connectivity Execution Engine',
      spec: 'FR-MOB-001 / FR-MOB-003',
      description:
        'Built for challenging physical environments. Technicians execute step checklists, verify 200m GPS geofences, and capture hardware deliverables without needing active cellular coverage.',
      features: [
        'Strict 200m Haversine geofence check-in validation',
        'Local SQLite queue with transactional sync manager',
        'Media upload retry daemon with checksum verification',
        'Live GPS beacon telemetry'
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f5fbf5] text-[#111827]">
      <MarketingNavbar />

      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-[#5a9332] uppercase px-3 py-1 rounded-full bg-[#eaf5ec] border border-[#d2e8d6]">
              Platform Architecture
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] tracking-tight">
              The Autonomous Operating System for Field Operations
            </h1>
            <p className="text-base text-[#475569] leading-relaxed">
              Explore the four foundational engines powering autonomous dispatch, parametric SOWs,
              cryptographic escrow, and offline mobile execution.
            </p>
          </div>

          {/* Pillars List */}
          <div className="space-y-12">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              const isEven = idx % 2 === 1;

              return (
                <div
                  key={p.title}
                  className={`bg-white rounded-3xl p-8 sm:p-12 border border-[#e2ece5] shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
                    isEven ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#eaf5ec] flex items-center justify-center text-[#5a9332]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono font-bold text-[#5a9332] uppercase block">
                          {p.spec}
                        </span>
                        <h2 className="text-2xl font-bold text-[#111827] tracking-tight">
                          {p.title}
                        </h2>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                      {p.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {p.features.map((feat) => (
                        <div
                          key={feat}
                          className="flex items-center space-x-2 text-xs text-[#111827]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#5a9332] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-[#0d1517] rounded-2xl p-6 border border-[#22383c] text-white space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono border-b border-[#22383c] pb-3">
                      <span className="text-[#84e539] font-bold">{p.subtitle}</span>
                      <span className="text-slate-500">ENGINE VERIFIED</span>
                    </div>
                    <div className="space-y-2 font-mono text-xs text-slate-300">
                      <div className="bg-[#142427] p-2.5 rounded-lg border border-[#22383c]">
                        <span className="text-slate-500 block text-[10px]">THROUGHPUT:</span>
                        <span className="text-white font-bold">10,000+ Concurrent Ops</span>
                      </div>
                      <div className="bg-[#142427] p-2.5 rounded-lg border border-[#22383c]">
                        <span className="text-slate-500 block text-[10px]">RELIABILITY SLA:</span>
                        <span className="text-[#84e539] font-bold">99.99% Uptime Guarantee</span>
                      </div>
                    </div>
                    <Link href="/" className="block pt-1">
                      <Button variant="primary" size="sm" className="w-full">
                        Test in Command Center →
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Row */}
          <div className="bg-[#142427] rounded-3xl p-8 sm:p-12 text-center text-white border border-[#22383c] space-y-4">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to see the platform in action?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Launch our live command center demo to test real-time technician matching and escrow
              settlement.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-full px-8"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Launch Command Center
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
