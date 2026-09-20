'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingNavbar } from '../../components/marketing/MarketingNavbar';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { ShieldCheck, Clock, CheckCircle2, Layers, DollarSign } from 'lucide-react';
import { Button } from '@fieldforge/ui';

export default function SolutionsPage(): React.JSX.Element {
  const solutions = [
    {
      icon: Clock,
      title: 'Emergency SLA Rapid Response',
      target: '< 4-Hour On-Site Resolution',
      description:
        'When critical network links fail or point-of-sale registers drop during peak retail hours, automated radar dispatch locates and dispatches vetted local contractors immediately.',
      benefits: [
        'Automated ticket escalation to available engineers',
        'Sub-15m dispatch broadcast via Redis GEOSTREAM',
        'Live GPS proximity tracking and arrival notifications',
        'Penalties waived through transparent SLA audit trails'
      ]
    },
    {
      icon: Layers,
      title: 'Multi-Site Nationwide Rollouts',
      target: 'Deploy 500+ Sites Simultaneously',
      description:
        'Executing nationwide POS terminal upgrades or 5G small-cell provisioning across hundreds of regional stores. Standardized SOW templates guarantee identical installation quality.',
      benefits: [
        'Single unified SOW template deployment',
        'Automated local contractor pool aggregation',
        'Centralized dashboard tracking all concurrent installs',
        'Batch milestone sign-off and consolidated invoicing'
      ]
    },
    {
      icon: ShieldCheck,
      title: 'Certified Contractor Workforce Vetting',
      target: 'Zero Compliance Risk',
      description:
        'Eliminate the overhead and liability of managing independent contractors. FieldForge verifies background checks, licenses, OSHA credentials, and general liability insurance.',
      benefits: [
        'Annual background and criminal history verification',
        'Direct certification verification with issuing boards',
        'Automated $2M general liability coverage verification',
        'Continuous performance ratings and disciplinary logging'
      ]
    },
    {
      icon: DollarSign,
      title: 'Autonomous Escrow & Dispute Elimination',
      target: '100% Guaranteed Settlement',
      description:
        'End billing disputes and payment collection calls. Escrow vaults hold funds in trust until objective deliverables (photos, serial barcodes, manager signatures) are approved.',
      benefits: [
        'Instant pre-authorization with Stripe & SVB Direct ACH',
        'Non-custodial cryptographic vault rules',
        'Automated 48-hour acceptance window',
        'Single monthly consolidated enterprise statement'
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f5fbf5] text-[#111827]">
      <MarketingNavbar />

      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-[#5a9332] uppercase px-3 py-1 rounded-full bg-[#eaf5ec] border border-[#d2e8d6]">
              Enterprise Solutions
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] tracking-tight">
              Operational Solutions for Scale
            </h1>
            <p className="text-base text-[#475569] leading-relaxed">
              Whether responding to emergency equipment outages or coordinating multi-thousand site
              technology rollouts, FieldForge provides turnkey automation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((sol) => {
              const Icon = sol.icon;
              return (
                <div
                  key={sol.title}
                  className="bg-white rounded-3xl p-8 border border-[#e2ece5] shadow-xs hover:border-[#84e539] transition space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#eaf5ec] flex items-center justify-center text-[#5a9332]">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#f5fbf5] text-[#111827] border border-[#e2ece5]">
                        {sol.target}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#111827] tracking-tight">{sol.title}</h3>
                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                      {sol.description}
                    </p>

                    <div className="space-y-2 pt-2">
                      {sol.benefits.map((b) => (
                        <div key={b} className="flex items-center space-x-2 text-xs text-[#111827]">
                          <CheckCircle2 className="w-4 h-4 text-[#5a9332] shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#e2ece5]">
                    <Link href="/">
                      <Button variant="primary" size="sm" className="w-full">
                        Deploy this Solution →
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
