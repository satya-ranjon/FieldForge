'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Search } from 'lucide-react';
import { Linkedin, Youtube, SocialX } from './PlatformSocialIcons';
import { Input } from '@fieldforge/ui';
import { PlatformBrand, PlatformLink, platformFocus, platformFrame } from './PlatformPrimitives';

const navigation = [
  ['Platform', '/platform'],
  ['Solutions', '/solutions'],
  ['Industries', '/industries'],
  ['Resources', '/resources'],
  ['Pricing', '/pricing']
];
export function PlatformNavigation(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-30 bg-surface-marketing/80">
      <div
        className={`${platformFrame} flex min-h-20 items-center justify-between gap-5 lg:min-h-[5em]`}
      >
        <Link href="/marketing" aria-label="FieldForge home" className={platformFocus}>
          <PlatformBrand />
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-[2.5em] lg:flex">
          {navigation.map(([name, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={href === '/platform' ? 'page' : undefined}
              className={`${platformFocus} border-b-2 py-[1.2em] text-[0.9em] ${href === '/platform' ? 'border-brand-green font-bold' : 'border-transparent hover:text-marketing-heading-accent'}`}
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-[0.9em] lg:flex">
          <Link
            href="/technicians"
            aria-label="Search technicians"
            className={`${platformFocus} grid size-11 place-items-center`}
          >
            <Search className="size-5" />
          </Link>
          <Link
            href="/technicians"
            className={`${platformFocus} inline-flex min-h-11 items-center rounded-lg border border-border-default bg-white px-[1.5em] text-[0.85em] font-bold shadow-sm`}
          >
            Join as Technician
          </Link>
          <PlatformLink href="/technicians">Find Technicians</PlatformLink>
        </div>
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-controls="platform-mobile-menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={`${platformFocus} grid size-11 place-items-center lg:hidden`}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          id="platform-mobile-menu"
          aria-label="Mobile navigation"
          className="absolute inset-x-0 top-full border-y border-border-soft bg-white px-5 py-4 shadow-md lg:hidden"
        >
          {navigation.map(([name, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={href === '/platform' ? 'page' : undefined}
              className={`${platformFocus} block rounded-lg px-3 py-3 text-sm hover:bg-surface-green`}
            >
              {name}
            </Link>
          ))}
          <PlatformLink href="/technicians">Find Technicians</PlatformLink>
        </nav>
      )}
    </header>
  );
}

const footerGroups = [
  {
    title: 'Platform',
    links: [
      ['Command Center', '/operations'],
      ['Technician Marketplace', '/technicians'],
      ['Work Order Management', '/create-wo']
    ]
  },
  {
    title: 'Solutions',
    links: [
      ['For Businesses', '/solutions'],
      ['For Technicians', '/technicians'],
      ['Integrations', '/platform#capabilities']
    ]
  },
  {
    title: 'Resources',
    links: [
      ['Blog', '/resources'],
      ['Help Center', '/resources'],
      ['Status', '/resources']
    ]
  }
];
export function PlatformFooter(): React.JSX.Element {
  const [message, setMessage] = useState('');
  return (
    <footer className="relative isolate overflow-hidden bg-brand-dark text-white">
      <Image
        src="/marketing/footer-background.png"
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none -z-10 object-cover"
      />
      <div className={`${platformFrame} py-8 lg:py-[1.5em]`}>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_0.9fr_0.8fr_0.8fr_1.65fr] lg:gap-[2em]">
          <div>
            <Link href="/marketing" aria-label="FieldForge home" className={platformFocus}>
              <PlatformBrand />
            </Link>
            <p className="mt-2 text-xs text-white/70 lg:text-[0.8em]">
              Field work moves the world forward.
            </p>
            <div aria-label="Social media" className="mt-2 flex gap-2">
              {[
                { name: 'LinkedIn', href: 'https://linkedin.com', Icon: Linkedin },
                { name: 'X', href: 'https://twitter.com', Icon: SocialX },
                { name: 'YouTube', href: 'https://youtube.com', Icon: Youtube }
              ].map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  aria-label={name}
                  target="_blank"
                  rel="noreferrer"
                  className={`${platformFocus} grid size-11 place-items-center rounded-full bg-white/5 lg:size-[2.1em]`}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
          {footerGroups.map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-xs font-bold text-trust-lime lg:text-[0.8em]">{title}</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-white/75 lg:text-[0.75em]">
                {links.map(([name, href]) => (
                  <li key={name}>
                    <Link
                      href={href}
                      className={`${platformFocus} inline-flex min-h-8 items-center hover:text-white lg:min-h-0`}
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="text-xs font-bold text-trust-lime lg:text-[0.8em]">Company</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-white/75 lg:text-[0.75em]">
              {['About', 'Careers', 'Contact'].map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setMessage('Newsletter subscriptions are not available yet. Please check back soon.');
            }}
          >
            <label htmlFor="platform-email" className="text-xs lg:text-[0.85em]">
              Stay in the loop
            </label>
            <div className="mt-2 flex overflow-hidden rounded-lg border border-white/40">
              <Input
                id="platform-email"
                aria-label="Your email address"
                type="email"
                required
                placeholder="Enter your email"
                className="h-11! min-w-0! rounded-none! border-0! bg-transparent! text-xs! text-white! placeholder:text-white/60!"
              />
              <button
                type="submit"
                className={`${platformFocus} min-h-11 bg-lifecycle-active px-4 text-xs font-bold text-brand-dark hover:bg-brand-green`}
              >
                Subscribe
              </button>
            </div>
            <p role="status" className="mt-2 text-xs text-trust-lime">
              {message}
            </p>
          </form>
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-3 text-[10px] text-white/65 lg:mt-[1em] lg:text-[0.75em]">
          <p>© {new Date().getFullYear()} FieldForge. All rights reserved.</p>
          <p className="flex gap-8">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
