'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@fieldforge/ui';
import { AuthModal } from '../auth/AuthModal';

export const MarketingNavbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const navLinks = [
    { href: '/platform', label: 'Platform' },
    { href: '/solutions', label: 'Solutions' },
    { href: '/industries', label: 'Industries' },
    { href: '/resources', label: 'Resources' },
    { href: '/pricing', label: 'Pricing' }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#f5fbf5]/90 backdrop-blur-md border-b border-[#e2ece5] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Mark */}
          <Link href="/marketing" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#A8F22D] flex items-center justify-center shadow-sm shadow-[#A8F22D]/30 group-hover:bg-[#9CE228] transition">
              <span className="font-mono font-black text-xl text-[#0f1a1c] tracking-tighter">
                F
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#111827]">
                  Field<span className="text-[#5a9332]">Forge</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#eaf5ec] text-[#5a9332] font-bold border border-[#d2e8d6]">
                  ENTERPRISE
                </span>
              </div>
              <span className="text-[11px] text-[#64748b] tracking-wider uppercase font-medium">
                Autonomous Dispatch & SOW
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? 'text-[#5a9332] font-semibold'
                      : 'text-[#475569] hover:text-[#111827]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA Controls */}
          <div className="hidden md:flex items-center space-x-3.5">
            <Link
              href="/"
              className="text-xs font-semibold text-[#475569] hover:text-[#111827] px-3 py-2 rounded-xl transition"
            >
              Command Center
            </Link>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="text-xs font-semibold text-[#111827] bg-white border border-[#e2ece5] hover:bg-[#f8faf8] px-4 py-2.5 rounded-full transition shadow-xs cursor-pointer"
            >
              Sign In
            </button>

            <Link href="/pricing">
              <Button
                variant="primary"
                size="md"
                className="rounded-full shadow-sm shadow-[#A8F22D]/30"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Book a Demo
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#475569] hover:bg-[#eaf5ec] transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#f5fbf5] border-b border-[#e2ece5] px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium ${
                    pathname === link.href
                      ? 'bg-[#eaf5ec] text-[#5a9332] font-semibold'
                      : 'text-[#475569] hover:bg-[#eaf5ec]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-[#e2ece5] space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center text-sm font-semibold text-[#111827] bg-white border border-[#e2ece5] py-2.5 rounded-xl shadow-xs"
              >
                Launch Command Center
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full text-center text-sm font-semibold text-[#08120D] bg-[#A8F22D] py-2.5 rounded-xl shadow-sm cursor-pointer"
              >
                Sign In / Book a Demo
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal for Sign In */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};
