'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingNavbar } from '../../components/marketing/MarketingNavbar';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { Check, DollarSign } from 'lucide-react';
import { Button } from '@fieldforge/ui';

export default function PricingPage(): React.JSX.Element {
  const [budgetSim, setBudgetSim] = useState<number>(500);

  const plans = [
    {
      name: 'Starter',
      badge: 'Pay As You Go',
      price: '$0',
      period: 'No monthly subscription',
      fee: '8% Platform Escrow Fee',
      description:
        'Ideal for regional operators and growing retail chains needing on-demand field engineers.',
      isPopular: false,
      features: [
        'Geospatial technician radar matching',
        'Standard SOW builder with 5 presets',
        'AES-256 escrow vault pre-authorization',
        'Mobile proof-of-work deliverables (photos, signatures)',
        'Email & community support',
        'Standard 24-hour SLA targets'
      ],
      cta: 'Get Started Free'
    },
    {
      name: 'Scale Enterprise',
      badge: 'Most Popular',
      price: '$499',
      period: 'per month + 6% escrow fee',
      fee: '6% Platform Escrow Fee',
      description:
        'For national telecom, EV charging, and retail operators running continuous field dispatch.',
      isPopular: true,
      features: [
        'Everything in Starter, plus:',
        'Priority radar broadcast to top 5% contractors',
        'Sub-4 hour emergency SLA target guarantee',
        'Custom SOW templates and custom deliverables checklist',
        'Direct ACH & SVB corporate payment routing',
        'Dedicated account manager',
        'Full REST API & Webhook event streaming'
      ],
      cta: 'Start 14-Day Free Trial'
    },
    {
      name: 'Custom Infrastructure',
      badge: 'Global Deployments',
      price: 'Custom',
      period: 'Tailored volume commitment',
      fee: '4% Volume Escrow Fee',
      description:
        'For Fortune 500 infrastructure operators with thousands of distributed retail or tower sites.',
      isPopular: false,
      features: [
        'Everything in Scale Enterprise, plus:',
        'Sub-60 minute emergency smart hands response',
        'ServiceNow, Jira, and SAP direct ERP integration',
        'SSO, SAML, and custom role-based permissions',
        'Dedicated 24/7/365 NOC dispatch bridge',
        'Custom contractor vetting criteria and drug screening',
        'Consolidated net-30 enterprise invoicing'
      ],
      cta: 'Speak with Enterprise Sales'
    }
  ];

  const calculatedFee = Math.round(budgetSim * 0.08);
  const calculatedTotal = budgetSim + calculatedFee;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5fbf5] text-[#111827]">
      <MarketingNavbar />

      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-[#5a9332] uppercase px-3 py-1 rounded-full bg-[#eaf5ec] border border-[#d2e8d6]">
              Simple, Transparent Pricing
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] tracking-tight">
              Pay Only When Work is Verified
            </h1>
            <p className="text-base text-[#475569] leading-relaxed">
              No hidden dispatch markups. No contractor ghosting. Escrow funds stay protected in the
              Smart Vault until you approve proof-of-work.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-3xl p-8 border flex flex-col justify-between transition relative ${
                  p.isPopular
                    ? 'bg-[#142427] text-white border-[#84e539] shadow-xl shadow-slate-900/20 ring-2 ring-[#84e539]/30'
                    : 'bg-white text-[#111827] border-[#e2ece5] shadow-xs'
                }`}
              >
                {p.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#84e539] text-[#0f1a1c] font-mono text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm">
                    {p.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md inline-block ${
                        p.isPopular
                          ? 'bg-[#0d1517] text-[#84e539] border border-[#22383c]'
                          : 'bg-[#eaf5ec] text-[#5a9332] border border-[#d2e8d6]'
                      }`}
                    >
                      {p.name}
                    </span>
                    <div className="mt-4 flex items-baseline space-x-2">
                      <span className="text-4xl font-extrabold tracking-tight font-mono">
                        {p.price}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          p.isPopular ? 'text-slate-400' : 'text-[#64748b]'
                        }`}
                      >
                        {p.period}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-3 leading-relaxed ${
                        p.isPopular ? 'text-slate-300' : 'text-[#475569]'
                      }`}
                    >
                      {p.description}
                    </p>
                  </div>

                  <div
                    className={`border-t pt-5 space-y-3 ${
                      p.isPopular ? 'border-[#22383c]' : 'border-[#e2ece5]'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider block font-mono ${
                        p.isPopular ? 'text-slate-400' : 'text-[#64748b]'
                      }`}
                    >
                      Included In This Plan:
                    </span>
                    <ul className="space-y-2.5 text-xs">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start space-x-2.5">
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              p.isPopular ? 'text-[#84e539]' : 'text-[#5a9332]'
                            }`}
                          />
                          <span className={p.isPopular ? 'text-slate-200' : 'text-[#111827]'}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <Link href="/">
                    <Button
                      variant={p.isPopular ? 'primary' : 'outline'}
                      size="md"
                      className="w-full"
                    >
                      {p.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Escrow Fee Calculator Widget */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#e2ece5] shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#eaf5ec] flex items-center justify-center text-[#5a9332]">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111827] tracking-tight">
                  Transparent Escrow Fee Calculator
                </h3>
                <p className="text-xs text-[#64748b]">
                  Calculate exact milestone pre-authorization and contractor payout before
                  publishing.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#111827]">Estimated Ticket Payout:</span>
                <span className="text-lg font-mono font-bold text-[#5a9332]">
                  ${budgetSim}.00 USD
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="2500"
                step="50"
                value={budgetSim}
                onChange={(e) => setBudgetSim(parseInt(e.target.value, 10))}
                className="w-full accent-[#5a9332] bg-[#eaf5ec] h-2 rounded-lg cursor-pointer"
              />

              <div className="bg-[#f5fbf5] p-4 rounded-2xl border border-[#e2ece5] space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#475569]">
                  <span>Technician Net Payout:</span>
                  <span className="font-bold text-[#111827]">${budgetSim}.00</span>
                </div>
                <div className="flex justify-between text-[#475569]">
                  <span>FieldForge Platform Service Fee (8%):</span>
                  <span className="font-bold text-[#111827]">${calculatedFee}.00</span>
                </div>
                <div className="flex justify-between border-t border-[#e2ece5] pt-2 text-sm font-bold text-[#111827]">
                  <span>Total Escrow Locked in Vault:</span>
                  <span className="text-[#5a9332]">${calculatedTotal}.00</span>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <Link href="/">
                <Button variant="primary" size="md" className="px-8 shadow-sm shadow-[#84e539]/20">
                  Publish SOW with ${calculatedTotal}.00 Escrow →
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
