'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, Search, X } from 'lucide-react';
import { Input } from '@fieldforge/ui';
import { AuthModal } from '../auth/AuthModal';
import {
  PlatformBrand,
  PlatformLink,
  platformFocus as focus,
  platformFrame as frame
} from '../platform/PlatformPrimitives';
import { Linkedin, SocialX, Youtube } from '../platform/PlatformSocialIcons';

const navigation = [
  ['Platform', '/platform'],
  ['Solutions', '/solutions'],
  ['Industries', '/industries'],
  ['Resources', '/resources'],
  ['Pricing', '/pricing']
] as const;

export function SolutionsNavigation({
  activePage = '/solutions'
}: {
  activePage?: '/solutions' | '/industries';
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [auth, setAuth] = useState<'login' | 'register' | null>(null);
  return (
    <>
      <header className="relative z-30 border-b border-border-soft bg-white/95">
        <div
          className={`${frame} flex min-h-16 items-center justify-between gap-5 lg:min-h-[4.2em]`}
        >
          <Link href="/marketing" aria-label="FieldForge home" className={focus}>
            <PlatformBrand />
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-[2.4em] lg:flex">
            {navigation.map(([name, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={href === activePage ? 'page' : undefined}
                className={`${focus} border-b-2 py-[1.2em] text-[0.85em] ${href === activePage ? 'border-brand-green font-bold' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
              >
                {name}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-[1.7em] lg:flex">
            <Link
              href="/technicians"
              aria-label="Search technicians"
              className={`${focus} grid size-11 place-items-center`}
            >
              <Search className="size-[1.4em]" />
            </Link>
            <button
              type="button"
              onClick={() => setAuth('login')}
              className={`${focus} min-h-11 text-[0.9em] text-text-secondary`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setAuth('register')}
              className={`${focus} inline-flex min-h-11 items-center gap-[1em] rounded-lg bg-brand-dark px-[1.8em] text-[0.95em] font-bold text-white hover:bg-brand-dark-hover`}
            >
              Get started <ArrowRight className="size-[1.3em] text-brand-green" />
            </button>
          </div>
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            aria-controls={`${activePage.slice(1)}-mobile-menu`}
            onClick={() => setOpen(!open)}
            className={`${focus} grid size-11 place-items-center lg:hidden`}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav
            id={`${activePage.slice(1)}-mobile-menu`}
            aria-label="Mobile navigation"
            className="absolute inset-x-0 top-full border-b border-border-default bg-white p-5 shadow-md lg:hidden"
          >
            {navigation.map(([name, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={href === activePage ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`${focus} block rounded-lg p-3 text-sm hover:bg-surface-green`}
              >
                {name}
              </Link>
            ))}
            <div className="flex gap-5 px-3">
              <button
                type="button"
                className={`${focus} min-h-11 text-sm`}
                onClick={() => {
                  setOpen(false);
                  setAuth('login');
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`${focus} min-h-11 text-sm font-bold`}
                onClick={() => {
                  setOpen(false);
                  setAuth('register');
                }}
              >
                Get started →
              </button>
            </div>
          </nav>
        )}
      </header>
      {auth && <AuthModal isOpen onClose={() => setAuth(null)} initialMode={auth} />}
    </>
  );
}

export function TalkToSales(): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={`${focus} inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-border-strong bg-white px-[2.5em] py-[0.8em] text-xs font-bold shadow-xs hover:bg-surface-soft lg:text-[0.9em]`}
      >
        Talk to sales
      </button>
      <dialog
        ref={dialog}
        aria-label="Talk to sales"
        className="fixed inset-0 m-auto w-[calc(100%-2.5rem)] max-w-md rounded-2xl border border-border-default bg-white p-7 text-text-primary shadow-xl backdrop:bg-brand-dark/50"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Let’s connect your operations.</h2>
          <button
            type="button"
            autoFocus
            aria-label="Close sales information"
            onClick={() => dialog.current?.close()}
            className={`${focus} grid size-11 shrink-0 place-items-center rounded-full bg-surface-soft`}
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="my-5 text-sm leading-relaxed text-text-secondary">
          Sales booking is not available yet. Explore the platform and resources to learn how
          FieldForge brings your field work together.
        </p>
        <PlatformLink href="/resources">Explore resources</PlatformLink>
      </dialog>
    </>
  );
}

export function SolutionsFooter({
  activePage = '/solutions'
}: {
  activePage?: '/solutions' | '/industries';
}): React.JSX.Element {
  const [message, setMessage] = useState('');
  return (
    <footer className="border-t border-border-soft bg-white">
      <div
        className={`${frame} py-6 ${activePage === '/industries' ? 'lg:py-[2em]' : 'lg:py-[1.2em]'}`}
      >
        <div
          className={`grid gap-7 sm:grid-cols-2 lg:gap-[2.2em] ${activePage === '/industries' ? 'lg:grid-cols-[1.5fr_0.85fr_0.85fr_1.05fr_2.1fr]' : 'lg:grid-cols-[2.2fr_1fr_0.85fr_1.2fr_2.1fr]'}`}
        >
          <div>
            <Link href="/marketing" className={focus} aria-label="FieldForge home">
              <span className={activePage === '/industries' ? 'text-[1.4em]' : ''}>
                <PlatformBrand small />
              </span>
            </Link>
            <p
              className={`mt-2 text-xs text-text-secondary lg:text-[0.72em] ${activePage === '/industries' ? 'max-w-[16em] leading-relaxed' : ''}`}
            >
              Skilled people. Real work. A more connected world.
            </p>
            <div className="mt-2 flex gap-2">
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
                  className={`${focus} grid size-11 place-items-center rounded-full bg-surface-soft text-text-secondary lg:size-[1.9em]`}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold lg:text-[0.75em]">Product</h3>
            <ul className="mt-2 space-y-1 text-xs lg:text-[0.72em]">
              {navigation.map(([name, href]) => (
                <li key={name}>
                  <Link
                    href={href}
                    aria-current={href === activePage ? 'page' : undefined}
                    className={`${focus} inline-flex min-h-11 items-center lg:min-h-0 ${href === activePage ? 'font-bold text-trust-lime-ink' : 'text-text-secondary'}`}
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={activePage === '/industries' ? 'lg:order-4' : ''}>
            <h3 className="text-xs font-bold lg:text-[0.75em]">Company</h3>
            <ul className="mt-2 space-y-2 text-xs text-text-secondary lg:text-[0.72em]">
              {['About Us', 'Careers', 'Contact'].map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
          <div className={activePage === '/industries' ? 'lg:order-3' : ''}>
            <h3 className="text-xs font-bold lg:text-[0.75em]">Resources</h3>
            <ul className="mt-2 space-y-1 text-xs text-text-secondary lg:text-[0.72em]">
              {['Blog', 'Help Center', 'Guides', 'Case Studies'].map((name) => (
                <li key={name}>
                  <Link
                    href="/resources"
                    className={`${focus} inline-flex min-h-11 items-center lg:min-h-0`}
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <form
            className={activePage === '/industries' ? 'lg:order-5' : ''}
            onSubmit={(event) => {
              event.preventDefault();
              setMessage('Newsletter subscriptions are not available yet. Please check back soon.');
            }}
          >
            <label
              htmlFor={`${activePage.slice(1)}-email`}
              className="text-xs font-bold lg:text-[0.75em]"
            >
              Subscribe to our newsletter
            </label>
            <div className="mt-2 flex overflow-hidden rounded-lg border border-border-default">
              <Input
                id={`${activePage.slice(1)}-email`}
                aria-label="Your email address"
                type="email"
                required
                placeholder="Enter your email"
                className="h-11! min-w-0! rounded-none! border-0! text-xs!"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className={`${focus} grid min-h-11 min-w-11 place-items-center bg-brand-green text-brand-dark hover:bg-brand-green-hover`}
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-text-secondary lg:text-[0.72em]">
              Get the latest updates and field service insights.
            </p>
            <p role="status" className="mt-2 text-xs text-trust-lime-ink">
              {message}
            </p>
          </form>
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-4 border-t border-border-soft pt-3 text-[10px] text-text-secondary lg:text-[0.72em]">
          <p>© {new Date().getFullYear()} FieldForge. All rights reserved.</p>
          <p className="flex flex-wrap gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Cookie Policy</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
