'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, ChevronDown, Apple } from 'lucide-react';
import { Input } from '@fieldforge/ui';
import { marketingLayoutScale } from './MarketingHero.styles';
import { MarketingBrandMark } from './MarketingHeroArtwork';

const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-green';
const groups = [
  {
    title: 'Product',
    items: [
      { label: 'Features', href: '/platform' },
      { label: 'Solutions', href: '/solutions' },
      { label: 'Integrations', href: '/platform' },
      { label: 'Pricing', href: '/pricing' },
      { label: "What's New", href: '/resources' }
    ]
  },
  {
    title: 'Resources',
    items: [
      { label: 'Documentation', href: '/resources' },
      { label: 'Help Center', href: '/resources' },
      { label: 'Blog', href: '/resources' },
      { label: 'Case Studies', href: '/resources' },
      { label: 'API Reference', href: '/resources' }
    ]
  },
  {
    title: 'Company',
    items: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers', hiring: true },
      { label: 'Contact', href: '/contact' },
      { label: 'Partners', href: '/partners' },
      { label: 'Press Kit', href: '/press' }
    ]
  }
];
const legalItems = ['Privacy Policy', 'Terms of Service', 'Security', 'Compliance', 'Sitemap'];

export function MarketingFooter(): React.JSX.Element {
  const [newsletterMessage, setNewsletterMessage] = useState('');
  return (
    <footer
      id="marketing-footer"
      className={`${marketingLayoutScale} relative isolate overflow-hidden bg-brand-dark font-[family-name:Arial,Helvetica,sans-serif] text-white/75 lg:text-[length:var(--hero-unit)]`}
    >
      <Image
        src="/marketing/footer-background.png"
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none -z-10 object-cover"
      />
      <div className="mx-auto w-[calc(100%-2.5rem)] max-w-marketing-page pt-12 pb-8 lg:w-[calc(var(--hero-unit)*89)] lg:pt-[9em] lg:pb-[3.8em]">
        <div className="grid gap-8 md:grid-cols-[1fr_2fr] lg:grid-cols-[20em_minmax(0,1fr)_22em] lg:gap-[2.3em]">
          <div className="lg:border-r lg:border-white/10 lg:pr-[2em]">
            <Link
              href="/"
              aria-label="FieldForge home"
              className={`${focus} inline-flex items-center gap-3 rounded-sm lg:mt-[0.8em] lg:gap-[1em]`}
            >
              <span className="block size-8 lg:size-[2.6em]">
                <MarketingBrandMark />
              </span>
              <span className="text-2xl font-bold tracking-tight text-white lg:text-[2em]">
                FieldForge
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-[1.5] text-white/65 lg:mt-[1.1em] lg:text-[0.85em]">
              Field operations, simplified. Connect people, work and payments in one platform.
            </p>
            <div
              aria-label="Social media"
              className="mt-4 flex items-center gap-2 lg:mt-[1.5em] lg:gap-[0.6em]"
            >
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className={`${focus} grid size-11 place-items-center rounded-full bg-white/5 text-white/80 transition hover:bg-white/15 lg:size-[2.5em]`}
                aria-label="LinkedIn"
              >
                <svg
                  aria-hidden="true"
                  className="size-4 fill-current lg:size-[1.1em]"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className={`${focus} grid size-11 place-items-center rounded-full bg-white/5 text-white/80 transition hover:bg-white/15 lg:size-[2.5em]`}
                aria-label="Twitter / X"
              >
                <svg
                  aria-hidden="true"
                  className="size-4 fill-current lg:size-[1.1em]"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className={`${focus} grid size-11 place-items-center rounded-full bg-white/5 text-white/80 transition hover:bg-white/15 lg:size-[2.5em]`}
                aria-label="Instagram"
              >
                <svg
                  aria-hidden="true"
                  className="size-4 fill-current lg:size-[1.1em]"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className={`${focus} grid size-11 place-items-center rounded-full bg-white/5 text-white/80 transition hover:bg-white/15 lg:size-[2.5em]`}
                aria-label="YouTube"
              >
                <svg
                  aria-hidden="true"
                  className="size-4 fill-current lg:size-[1.1em]"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className={`${focus} grid size-11 place-items-center rounded-full bg-white/5 text-white/80 transition hover:bg-white/15 lg:size-[2.5em]`}
                aria-label="Facebook"
              >
                <svg
                  aria-hidden="true"
                  className="size-4 fill-current lg:size-[1.1em]"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 md:gap-3 lg:gap-[1.8em]">
            {groups.map(({ title, items }) => (
              <nav key={title} aria-label={`Footer ${title}`}>
                <h2 className="mb-3 text-[11px] font-bold uppercase text-brand-green lg:mb-[1em] lg:text-[0.9em]">
                  {title}
                </h2>
                <ul className="space-y-1 lg:space-y-[0.8em]">
                  {items.map((item) => (
                    <li
                      key={item.label}
                      className="flex flex-wrap items-center gap-1 lg:gap-[0.5em]"
                    >
                      <Link
                        href={item.href}
                        className={`${focus} inline-flex min-h-11 items-center rounded-sm text-xs leading-tight transition hover:text-white lg:min-h-0 lg:text-[0.95em]`}
                      >
                        {item.label}
                      </Link>
                      {'hiring' in item && (
                        <span className="rounded bg-brand-green/15 px-[0.7em] py-[0.3em] text-[8px] leading-none text-trust-lime lg:text-[0.6em]">
                          We're Hiring
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <section aria-labelledby="footer-legal-title">
              <h2
                id="footer-legal-title"
                className="mb-3 text-[11px] font-bold uppercase text-brand-green lg:mb-[1em] lg:text-[0.9em]"
              >
                Legal
              </h2>
              <ul className="space-y-1 lg:space-y-[0.8em]">
                {legalItems.map((label) => (
                  <li
                    key={label}
                    className="flex min-h-11 items-center text-xs leading-tight lg:min-h-0 lg:text-[0.95em]"
                  >
                    <span title="This page is not available yet">{label}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <section
            aria-labelledby="footer-newsletter-title"
            className="min-w-0 md:col-span-2 md:max-w-md lg:col-span-1 lg:max-w-none lg:border-l lg:border-white/10 lg:pl-[2.3em]"
          >
            <h2 id="footer-newsletter-title" className="text-sm font-bold text-white lg:text-[1em]">
              Stay <span className="text-brand-green">Updated</span>
            </h2>
            <p className="mt-1 text-xs leading-[1.5] text-white/65 lg:text-[0.85em]">
              Get the latest product updates, insights
              <br className="hidden lg:block" /> and field operations tips.
            </p>
            <form
              aria-label="Newsletter subscription"
              onSubmit={(event) => {
                event.preventDefault();
                setNewsletterMessage(
                  'Newsletter subscriptions are not available yet. Please check back soon.'
                );
              }}
              className="mt-3 flex items-start gap-2 lg:mt-[1em] lg:gap-[0.7em]"
            >
              <div className="relative min-w-0 flex-1">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-2 z-10 size-3.5 -translate-y-1/2 text-white/60 lg:left-[0.8em] lg:size-[1.1em]"
                />
                <Input
                  id="footer-email"
                  aria-label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  aria-describedby={newsletterMessage ? 'footer-newsletter-message' : undefined}
                  className="h-11! rounded-md! border-white/15! bg-white/5! pr-2! pl-7! text-xs! text-white! placeholder:text-white/50! lg:h-[3.2em]! lg:rounded-[0.6em]! lg:pr-[0.8em]! lg:pl-[2.6em]! lg:text-[0.85em]!"
                />
              </div>
              <button
                type="submit"
                className={`${focus} min-h-11 shrink-0 rounded-md bg-brand-green px-3 text-xs font-bold text-brand-dark transition hover:bg-brand-green-hover lg:min-h-0 lg:rounded-[0.6em] lg:px-[1.2em] lg:py-[1em] lg:text-[0.85em]`}
              >
                Subscribe
              </button>
            </form>
            {newsletterMessage && (
              <p
                id="footer-newsletter-message"
                role="status"
                className="mt-2 text-xs leading-relaxed text-trust-lime lg:text-[0.8em]"
              >
                {newsletterMessage}
              </p>
            )}
            <div className="mt-4 lg:mt-[1.4em]">
              <p className="mb-2 text-[11px] font-medium text-white/80 lg:mb-[0.6em] lg:text-[0.85em]">
                Download Our App
              </p>
              <div className="flex flex-wrap gap-2 lg:gap-[1em]">
                <button
                  type="button"
                  disabled
                  title="App Store download is not available yet"
                  aria-label="App Store — coming soon"
                  className="flex min-h-11 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-left lg:min-h-0 lg:gap-[0.6em] lg:rounded-[0.6em] lg:px-[0.7em] lg:py-[0.5em]"
                >
                  <Apple
                    aria-hidden="true"
                    className="size-5 shrink-0 fill-white text-white lg:size-[1.7em]"
                  />
                  <span>
                    <span className="block text-[8px] leading-none lg:text-[0.55em]">
                      Download on the
                    </span>
                    <span className="block text-xs leading-tight text-white lg:text-[1em]">
                      App Store
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  disabled
                  title="Google Play download is not available yet"
                  aria-label="Google Play — coming soon"
                  className="flex min-h-11 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-left lg:min-h-0 lg:gap-[0.6em] lg:rounded-[0.6em] lg:px-[0.7em] lg:py-[0.5em]"
                >
                  <svg
                    aria-hidden="true"
                    className="size-5 shrink-0 fill-current text-white lg:size-[1.7em]"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-.954V2.769c.147-.367.362-.693.609-.955zm11.365 11.365l2.096-2.096-12.279-7.09 10.183 9.186zm0 1.642L4.79 23.998l12.28-7.09-2.096-2.087zm3.178-1.835l2.96-1.709a1.5 1.5 0 0 0 0-2.592l-2.96-1.71-2.096 2.096 2.096 2.095z" />
                  </svg>
                  <span>
                    <span className="block text-[8px] leading-none tracking-wider lg:text-[0.55em]">
                      GET IT ON
                    </span>
                    <span className="block text-xs leading-tight text-white lg:text-[1em]">
                      Google Play
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-[calc(100%-2.5rem)] max-w-marketing-page flex-col items-center justify-between gap-3 py-6 text-center text-[10px] text-white/65 lg:w-[calc(var(--hero-unit)*89)] lg:flex-row lg:gap-[2em] lg:pt-[2em] lg:pb-[4em] lg:text-[0.8em]">
          <p>© {new Date().getFullYear()} FieldForge. All rights reserved.</p>
          <p className="text-white/85">Built for the people who keep the world moving.</p>
          <div className="flex items-center gap-4 lg:gap-[1.8em]">
            <span className="flex items-center gap-2">
              <span className="size-[0.75em] rounded-full bg-brand-green" aria-hidden="true" />
              All Systems Operational
            </span>
            <div className="relative border-l border-white/15 pl-3 lg:pl-[1.8em]">
              <select
                aria-label="Language"
                defaultValue="en"
                className={`${focus} min-h-11 appearance-none rounded-sm bg-transparent pr-4 text-white/85 lg:min-h-0 lg:pr-[1.7em]`}
              >
                <option value="en" className="bg-brand-dark">
                  English
                </option>
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-0 size-3 -translate-y-1/2 lg:size-[1em]"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
