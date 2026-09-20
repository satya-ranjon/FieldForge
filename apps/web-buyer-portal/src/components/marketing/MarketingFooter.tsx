'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export const MarketingFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#e2ece5] pt-16 pb-12 text-xs text-[#64748b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Col (2 cols on md) */}
          <div className="col-span-2 space-y-4">
            <Link href="/marketing" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 rounded-lg bg-[#A8F22D] flex items-center justify-center text-[#08120D] font-black font-mono text-base">
                F
              </div>
              <span className="font-extrabold text-lg tracking-tight text-[#111827]">
                Field<span className="text-[#5a9332]">Forge</span>
              </span>
            </Link>
            <p className="text-xs text-[#475569] max-w-sm leading-relaxed">
              The autonomous field service platform for enterprise infrastructure. Real-time
              geospatial technician matching, cryptographic SLA guarantees, and non-custodial
              milestone escrow settlement.
            </p>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-[#5a9332]">
              <ShieldCheck className="w-4 h-4 text-[#5a9332]" />
              <span>SOC2 Type II • ISO 27001 • AES-256 Escrow Vault</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#111827] font-mono">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/platform" className="hover:text-[#111827] transition">
                  Matching Radar
                </Link>
              </li>
              <li>
                <Link href="/platform" className="hover:text-[#111827] transition">
                  SOW Builder Studio
                </Link>
              </li>
              <li>
                <Link href="/platform" className="hover:text-[#111827] transition">
                  Escrow Smart Vault
                </Link>
              </li>
              <li>
                <Link href="/platform" className="hover:text-[#111827] transition">
                  Mobile Field App
                </Link>
              </li>
              <li>
                <Link href="/audit" className="hover:text-[#111827] transition">
                  Distributed Telemetry
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#111827] font-mono">
              Solutions
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/solutions" className="hover:text-[#111827] transition">
                  Telecom & 5G
                </Link>
              </li>
              <li>
                <Link href="/solutions" className="hover:text-[#111827] transition">
                  EV Charging Networks
                </Link>
              </li>
              <li>
                <Link href="/solutions" className="hover:text-[#111827] transition">
                  Retail POS Systems
                </Link>
              </li>
              <li>
                <Link href="/solutions" className="hover:text-[#111827] transition">
                  Data Center Colocation
                </Link>
              </li>
              <li>
                <Link href="/industries" className="hover:text-[#111827] transition">
                  All Industries
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#111827] font-mono">
              Trust & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/pricing" className="hover:text-[#111827] transition">
                  Pricing & Escrow Fees
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-[#111827] transition">
                  Security Whitepaper
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-[#111827] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-[#111827] transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/" className="text-[#5a9332] font-semibold hover:underline">
                  Launch App →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#e2ece5] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#64748b]">
          <div>© {new Date().getFullYear()} FieldForge Marketplace Inc. All rights reserved.</div>
          <div className="font-mono">
            Platform Status:{' '}
            <span className="text-[#5a9332] font-bold">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
