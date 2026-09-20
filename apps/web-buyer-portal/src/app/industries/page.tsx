'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingNavbar } from '../../components/marketing/MarketingNavbar';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { Radio, Zap, ShoppingBag, Server, Wind, Eye } from 'lucide-react';
import { Button } from '@fieldforge/ui';

export default function IndustriesPage(): React.JSX.Element {
  const industries = [
    {
      icon: Radio,
      title: 'Telecommunications & 5G Infrastructure',
      sla: 'Sub-4h Emergency SLA',
      description:
        'Rapid response for cell tower alarms, core router outages, and fiber optic cable cuts. Certified fiber optic technicians and RF antenna specialists on standby.',
      tags: ['Cisco CCNA', 'Fiber Splicing', 'OTDR Testing', 'Tower Climbing']
    },
    {
      icon: Zap,
      title: 'EV Charging & Smart Power Grid',
      sla: '99.5% Charger Uptime Target',
      description:
        'Maintenance for DC fast chargers, Level 2 commercial stations, transformers, and OCPP payment hardware. State-licensed electricians with high-voltage training.',
      tags: ['Licensed Electrician', 'NFPA 70E', 'OCPP Certified', 'Transformer Prep']
    },
    {
      icon: ShoppingBag,
      title: 'Retail POS, Banking & Kiosks',
      sla: 'Same-Day Register Swap',
      description:
        'Keep checkout lanes running during high-traffic holiday sales. Overnight swaps of Ingenico, Verifone, NCR registers, and back-office network switches.',
      tags: ['PCI-DSS Compliance', 'Cat6 Cabling', 'Ingenico Lane/7000', 'Barcode Scanners']
    },
    {
      icon: Server,
      title: 'Data Center & Edge Colocation',
      sla: '60m On-Site Smart Hands',
      description:
        'Physical hands-and-eyes support within mission-critical facilities. Rack-and-stack server deployment, optic transceiver swap, cable combing, and power cycling.',
      tags: ['Strict Background Check', 'ESD Safety', 'SFP-10G-LR', 'KVM Provisioning']
    },
    {
      icon: Wind,
      title: 'Commercial HVAC & Building Automation',
      sla: 'Same-Day Environmental Recovery',
      description:
        'Server room cooling, rooftop packaged HVAC units, and smart building management systems (BMS). EPA Universal certified refrigeration mechanics.',
      tags: ['EPA 608 Universal', 'BACnet Controls', 'Compressor Swap', 'Chilled Water']
    },
    {
      icon: Eye,
      title: 'CCTV Security & Access Control',
      sla: '24-Hour Perimeter Restoration',
      description:
        'Security camera installation, IP PoE NVR recording systems, magnetic door locks, and biometric keycard scanner troubleshooting.',
      tags: ['Axis Certified', 'PoE Network Injector', 'HID Global Access', 'OSHA 10']
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f5fbf5] text-[#111827]">
      <MarketingNavbar />

      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-[#5a9332] uppercase px-3 py-1 rounded-full bg-[#eaf5ec] border border-[#d2e8d6]">
              Industry Verticals
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] tracking-tight">
              Specialized Field Teams Across Critical Sectors
            </h1>
            <p className="text-base text-[#475569] leading-relaxed">
              Every industry has distinct accreditation standards and safety protocols. FieldForge
              filters for domain-specific credentials automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((ind) => {
              const Icon = ind.icon;
              return (
                <div
                  key={ind.title}
                  className="bg-white rounded-3xl p-7 border border-[#e2ece5] shadow-xs hover:border-[#84e539] transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#eaf5ec] flex items-center justify-center text-[#5a9332]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#f5fbf5] text-[#5a9332] border border-[#d2e8d6]">
                        {ind.sla}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#111827] tracking-tight">
                      {ind.title}
                    </h3>
                    <p className="text-xs text-[#475569] leading-relaxed">{ind.description}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ind.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#f5fbf5] text-[#64748b] border border-[#e2ece5] font-mono"
                        >
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#e2ece5]">
                    <Link href="/">
                      <Button variant="primary" size="sm" className="w-full">
                        Create Work Order →
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
