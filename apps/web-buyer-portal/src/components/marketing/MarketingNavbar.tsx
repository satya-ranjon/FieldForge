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
        <div className="mx-auto flex h-[104px] max-w-[1260px] items-center justify-between px-6 sm:px-8 xl:px-0">
          <Link
            href="/marketing"
            className="group flex items-center gap-4"
            aria-label="FieldForge home"
          >
            <span className="relative flex h-[43px] w-[43px] items-center justify-center rounded-xl bg-[#85eb32] shadow-[0_14px_34px_rgba(117,222,38,0.28)] transition group-hover:bg-[#78dc29]">
              <span className="text-[26px] font-black leading-none tracking-[-0.16em] text-white">
                F
              </span>
              <span className="absolute left-4 top-4 h-1 w-4 rounded-full bg-white" />
            </span>
            <span className="text-[29px] font-extrabold tracking-[-0.04em] text-[#07121b]">
              FieldForge
            </span>
          </Link>

          <nav className="hidden items-center gap-11 lg:flex" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[16px] font-semibold tracking-[-0.01em] text-[#17212b] transition hover:text-[#5ea824] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8f22d]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full text-[#07121b] transition hover:bg-[#eef6ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8f22d]"
              aria-label="Search"
            >
              <Search className="h-7 w-7 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="h-16 rounded-[22px] border border-[#dfe9dd] bg-[#fbfcf8] px-7 text-[17px] font-bold text-[#081018] shadow-[0_8px_24px_rgba(10,20,15,0.04)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8f22d]"
            >
              Log in
            </button>
            <Link
              href="/technicians"
              className="inline-flex h-16 items-center gap-4 rounded-[22px] bg-[#111c22] px-7 text-[17px] font-bold text-white shadow-[0_18px_36px_rgba(7,18,27,0.18)] transition hover:bg-[#1b2b31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8f22d]"
            >
              <span>
                <span className="text-[#80e439]">Join</span> as Technician
              </span>
              <ArrowRight className="h-6 w-6 text-[#80e439]" />
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
