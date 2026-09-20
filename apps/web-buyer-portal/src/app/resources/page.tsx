'use client';

import React from 'react';
import { MarketingNavbar } from '../../components/marketing/MarketingNavbar';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { BookOpen, FileText, Code2, ShieldAlert, Download } from 'lucide-react';
import { Button } from '@fieldforge/ui';

export default function ResourcesPage(): React.JSX.Element {
  const resources = [
    {
      category: 'WHITE PAPER',
      icon: BookOpen,
      title: 'The Economic Impact of Autonomous Dispatch on Field Service SLAs',
      date: 'Q3 2026',
      readTime: '12 min read',
      description:
        'A comprehensive study analyzing 45,000 enterprise work orders. How geospatial Redis clustering and algorithmic bid matching reduce mean time to dispatch from 3.8 hours to 14 minutes.'
    },
    {
      category: 'CASE STUDY',
      icon: FileText,
      title: 'How Apex Retail Corp Scaled 450 Store Upgrades in 30 Days',
      date: 'Aug 2026',
      readTime: '8 min read',
      description:
        'Detailed retrospective on how Apex Retail coordinated emergency register swaps, Fluke cable continuity certifications, and escrow releases across 22 states.'
    },
    {
      category: 'DEVELOPER API',
      icon: Code2,
      title: 'REST Gateway & Webhook Event Streaming Guide',
      date: 'v2.4 Spec',
      readTime: 'Technical Doc',
      description:
        'Complete integration specification for connecting ServiceNow, Jira Service Management, or custom ERP systems directly to FieldForge AMQP topic exchanges.'
    },
    {
      category: 'SECURITY BRIEF',
      icon: ShieldAlert,
      title: 'Cryptographic Escrow: Guaranteeing Zero Disintermediation',
      date: 'Security Audit',
      readTime: '6 min read',
      description:
        'Technical architectural review of FieldForge Smart Vaults, AES-256 state machines, and dual-party dispute arbitration procedures.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f5fbf5] text-[#111827]">
      <MarketingNavbar />

      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-[#5a9332] uppercase px-3 py-1 rounded-full bg-[#eaf5ec] border border-[#d2e8d6]">
              Knowledge Base & Research
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] tracking-tight">
              Resources & Technical Insights
            </h1>
            <p className="text-base text-[#475569] leading-relaxed">
              Whitepapers, case studies, API specifications, and architectural deep-dives on the
              future of decentralized field engineering.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {resources.map((res) => {
              const Icon = res.icon;
              return (
                <div
                  key={res.title}
                  className="bg-white rounded-3xl p-8 border border-[#e2ece5] shadow-xs hover:border-[#84e539] transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#5a9332] px-2.5 py-0.5 rounded bg-[#eaf5ec] border border-[#d2e8d6] inline-flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        {res.category}
                      </span>
                      <span className="text-[#64748b]">
                        {res.date} • {res.readTime}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#111827] tracking-tight">{res.title}</h3>
                    <p className="text-xs text-[#475569] leading-relaxed">{res.description}</p>
                  </div>

                  <div className="pt-3 border-t border-[#e2ece5] flex items-center justify-between">
                    <span className="text-xs text-[#64748b] font-mono">
                      PDF + Interactive Online
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download PDF
                    </Button>
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
