'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, ChevronDown, Apple } from 'lucide-react';

export const MarketingFooter: React.FC = () => {
  return (
    <footer className="relative overflow-hidden bg-[#06120E] pt-20 pb-12 text-xs text-white/70 border-t border-[#162821]">
      {/* Subtle top ambient mint/green glows */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[#22C55E]/10 blur-[100px]" />
      <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-[#85EB32]/10 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* Main 5-Column Grid */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 mb-16">
          {/* Brand Col (3 cols on lg) */}
          <div className="space-y-6 lg:col-span-3">
            <Link href="/marketing" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#85EB32] text-lg font-black text-[#08120D] shadow-[0_8px_20px_rgba(133,235,50,0.25)]">
                F
              </span>
              <span className="text-2xl font-black tracking-tight text-white">FieldForge</span>
            </Link>

            <p className="max-w-xs text-xs leading-relaxed text-white/60">
              Field operations, simplified. Connect people, work and payments in one platform.
            </p>

            {/* Social Icons Row */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="LinkedIn"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Twitter / X"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Instagram"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="YouTube"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Facebook"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3.5 lg:col-span-2">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#85EB32]">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <Link href="/platform" className="hover:text-white transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/solutions" className="hover:text-white transition">
                  Solutions
                </Link>
              </li>
              <li>
                <Link href="/platform" className="hover:text-white transition">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition">
                  What&apos;s New
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-3.5 lg:col-span-2">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#85EB32]">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <Link href="/resources" className="hover:text-white transition">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3.5 lg:col-span-2">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#85EB32]">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Link href="/careers" className="hover:text-white transition">
                  Careers
                </Link>
                <span className="rounded-full bg-[#1A2E26] px-2 py-0.5 text-[9px] font-extrabold text-[#85EB32]">
                  We&apos;re Hiring
                </span>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/partners" className="hover:text-white transition">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-white transition">
                  Press Kit
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & App Download (3 cols on lg) */}
          <div className="space-y-4 lg:col-span-3">
            <div>
              <h4 className="text-sm font-extrabold text-white">
                Stay <span className="text-[#85EB32]">Updated</span>
              </h4>
              <p className="mt-1 text-xs text-white/60">
                Get the latest product updates, insights and field operations tips.
              </p>
            </div>

            {/* Email Form */}
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-xs text-white placeholder-white/40 focus:border-[#85EB32] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-[#85EB32] px-4 py-2.5 text-xs font-bold text-[#08120D] transition hover:bg-[#78dc29]"
              >
                Subscribe
              </button>
            </form>

            {/* Download Our App */}
            <div className="pt-2">
              <span className="block text-[11px] font-bold text-white/80 mb-2">
                Download Our App
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {/* App Store Button */}
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 cursor-pointer hover:bg-white/10 transition">
                  <Apple className="h-5 w-5 text-white" />
                  <div>
                    <span className="block text-[8px] text-white/60 leading-none">
                      Download on the
                    </span>
                    <span className="block text-[11px] font-bold text-white leading-tight">
                      App Store
                    </span>
                  </div>
                </div>

                {/* Google Play Button */}
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 cursor-pointer hover:bg-white/10 transition">
                  <svg className="h-4 w-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-.954V2.769c.147-.367.362-.693.609-.955zm11.365 11.365l2.096-2.096-12.279-7.09 10.183 9.186zm0 1.642L4.79 23.998l12.28-7.09-2.096-2.087zm3.178-1.835l2.96-1.709a1.5 1.5 0 0 0 0-2.592l-2.96-1.71-2.096 2.096 2.096 2.095z" />
                  </svg>
                  <div>
                    <span className="block text-[8px] text-white/60 leading-none">GET IT ON</span>
                    <span className="block text-[11px] font-bold text-white leading-tight">
                      Google Play
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-8 text-[11px] text-white/60">
          <div>© 2024 FieldForge. All rights reserved.</div>

          <div className="font-medium text-white/80">
            Built for the people who keep the world moving.
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#85EB32]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#85EB32] animate-pulse" />
              All Systems Operational
            </span>
            <span className="text-white/30">|</span>
            <button className="flex items-center gap-1 hover:text-white">
              English
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
