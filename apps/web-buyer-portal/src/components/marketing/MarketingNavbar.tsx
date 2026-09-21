'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, Search, X } from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';

const navLinks = [
  { href: '/platform', label: 'Platform' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/industries', label: 'Industries' },
  { href: '/resources', label: 'Resources' },
  { href: '/pricing', label: 'Pricing' }
];

export const MarketingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <header className="relative z-50 w-full bg-[#fbfcf8]">
        <div className="mx-auto flex h-[88px] max-w-[1360px] items-center justify-between px-6 sm:px-8 xl:px-12">
          <Link
            href="/marketing"
            className="group flex items-center gap-3"
            aria-label="FieldForge home"
          >
            <span className="relative flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#85eb32] shadow-[0_8px_20px_rgba(133,235,50,0.3)] transition group-hover:bg-[#78dc29]">
              <span className="text-[22px] font-black leading-none tracking-tight text-white">
                F
              </span>
            </span>
            <span className="text-[24px] font-bold tracking-tight text-[#07121b]">FieldForge</span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[15px] font-medium text-[#243342] transition hover:text-[#5ea824] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85eb32]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#07121b] transition hover:bg-[#eef6ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85eb32]"
              aria-label="Search"
            >
              <Search className="h-5 w-5 stroke-[2.2]" />
            </button>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="h-[46px] rounded-full border border-[#dce5dc] bg-white px-6 text-[15px] font-semibold text-[#07121b] shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition hover:bg-[#f8faf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85eb32]"
            >
              Log in
            </button>
            <Link
              href="/technicians"
              className="inline-flex h-[46px] items-center gap-2.5 rounded-full bg-[#112328] px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(17,35,40,0.2)] transition hover:bg-[#0c1a1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85eb32]"
            >
              <span>Join as Technician</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5] text-[#85eb32]" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-12 w-12 items-center justify-center rounded-xl text-[#07121b] transition hover:bg-[#eef6ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8f22d] lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#e2ece5] bg-[#fbfcf8] px-6 py-5 lg:hidden">
            <div className="mx-auto flex max-w-[1260px] flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-semibold text-[#17212b] hover:bg-[#eef6ed]"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="mt-3 rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-base font-bold text-[#081018]"
              >
                Log in
              </button>
              <Link
                href="/technicians"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl bg-[#111c22] px-4 py-3 text-center text-base font-bold text-white"
              >
                Join as Technician
              </Link>
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};
