import React, { type ReactElement } from 'react';
import Image from 'next/image';
import { ArrowRight, Eye, Monitor, ShieldCheck, Store, Video, Wifi, Zap } from 'lucide-react';
import { StatusBadge } from '@fieldforge/ui';
import { marketingLayoutScale } from './MarketingHero.styles';

const benefits = [
  { title: 'Faster resolution', description: 'Get the right tech, sooner', icon: Zap },
  { title: 'Full visibility', description: 'Track every step in real time', icon: Eye },
  {
    title: 'Trusted & compliant',
    description: 'Verified professionals, secure payments',
    icon: ShieldCheck
  }
];

const jobs = [
  { title: 'POS Terminal Repair', site: 'Market St. Retail', status: 'Urgent', icon: Store },
  { title: 'Wi-Fi AP Replacement', site: 'Riverside Office', status: 'Scheduled', icon: Wifi },
  {
    title: 'Security Camera Install',
    site: 'Lakeside Warehouse',
    status: 'In Progress',
    icon: Video
  },
  { title: 'Digital Signage Repair', site: 'Downtown Branch', status: 'Assigned', icon: Monitor }
];

const jobStatusTones: Record<string, string> = {
  Urgent: 'bg-status-danger-soft! text-marketing-status-red!',
  Scheduled: 'bg-status-warning-soft! text-amber-700!',
  'In Progress': 'bg-status-info-soft! text-blue-700!',
  Assigned: 'bg-marketing-status-soft! text-marketing-status-green!'
};

const services = [
  {
    label: 'Security',
    image: 'real-work-security-v2',
    alt: 'Ceiling-mounted dome security camera'
  },
  {
    label: 'Networking',
    image: 'real-work-networking-v2',
    alt: 'Ceiling-mounted wireless access point'
  },
  {
    label: 'POS Systems',
    image: 'real-work-pos-v2',
    alt: 'Retail point-of-sale touchscreen and payment terminal'
  },
  {
    label: 'Cabling',
    image: 'real-work-cabling-v2',
    alt: 'Technician connecting blue network cables'
  },
  {
    label: 'IT Hardware',
    image: 'real-work-hardware-v2',
    alt: 'Business laptop on an office desk'
  },
  {
    label: 'AV & Digital Signage',
    image: 'real-work-av-v2',
    alt: 'Wall-mounted digital display in an office lobby'
  }
];

export function RealWorkSection(): ReactElement {
  return (
    <section
      id="real-work"
      aria-labelledby="real-work-title"
      className={`${marketingLayoutScale} relative mx-auto w-[calc(100%-2.5rem)] max-w-marketing-page overflow-hidden rounded-2xl border border-border-soft bg-surface-marketing font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:w-[calc(var(--hero-unit)*89)] lg:rounded-[1.6em] lg:text-[length:var(--hero-unit)]`}
    >
      <div className="relative z-10 p-5 sm:p-6 lg:w-[28%] lg:px-[1.6em] lg:py-[1.1em]">
        <span className="inline-flex items-center gap-[0.6em] rounded-full bg-surface-white px-[1em] py-[0.6em] text-[0.625rem] font-bold uppercase leading-none lg:text-[0.75em]">
          <span className="size-[0.8em] rounded-full bg-lifecycle-active" aria-hidden="true" />
          Real work. All industries.
        </span>
        <h2
          id="real-work-title"
          className="mt-3 text-2xl font-bold leading-[1.12] tracking-[-0.025em] lg:mt-[0.6em] lg:text-[1.8em]"
        >
          Create work, match talent, dispatch quickly, verify proof and release payment without
          losing the thread.
        </h2>
        <p className="mt-3 text-sm leading-[1.25] text-text-secondary lg:mt-[0.7em] lg:text-[1em]">
          FieldForge connects businesses with qualified field technicians across industries — from
          POS and IT hardware to networking, security, AV and more.
        </p>
        <ul className="mt-4 space-y-3 lg:mt-[1.2em] lg:space-y-[0.8em]">
          {benefits.map(({ title, description, icon: Icon }) => (
            <li key={title} className="flex items-center gap-3 lg:gap-[1em]">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lifecycle-active text-brand-dark lg:size-[3.2em]">
                <Icon className="size-5 stroke-[2.6] lg:size-[1.7em]" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-bold leading-tight lg:text-[1em]">{title}</h3>
                <p className="mt-0.5 text-xs leading-tight text-text-secondary lg:text-[0.85em]">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative lg:absolute lg:inset-y-0 lg:right-0 lg:w-[72%]">
        <div className="relative aspect-[1.25] overflow-hidden lg:absolute lg:inset-y-0 lg:left-[-10%] lg:w-full lg:aspect-auto lg:[mask-image:linear-gradient(to_right,transparent,black_13%,black_84%,transparent)]">
          <Image
            src="/marketing/real-work-technician-v3.png"
            alt="FieldForge technician using a tablet at a customer site"
            fill
            sizes="(min-width: 1500px) 1000px, (min-width: 1200px) 835px, (min-width: 1024px) 641px, 95vw"
            className="object-cover object-center"
          />
        </div>
        <svg
          data-testid="real-work-dispatch-route"
          viewBox="0 0 1000 500"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden h-full w-full text-brand-green lg:block"
        >
          <path
            d="M 275 88 C 305 65 332 62 350 65 M 470 95 C 515 125 540 177 543 233"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="275" cy="88" r="11" fill="var(--color-lifecycle-active)" />
          <circle cx="275" cy="88" r="3.5" fill="var(--color-trust-lime-ink)" />
          <circle cx="515" cy="148" r="11" fill="var(--color-lifecycle-active)" />
          <circle cx="515" cy="148" r="3.5" fill="var(--color-trust-lime-ink)" />
        </svg>
        <div
          data-testid="real-work-dispatch-badge"
          className="absolute top-4 left-4 flex items-center gap-2 rounded-2xl bg-surface-white/95 px-3 py-2 shadow-sm lg:top-[9%] lg:left-[45%] lg:gap-[0.6em] lg:rounded-[1.2em] lg:px-[1em] lg:py-[0.7em]"
        >
          <span
            className="grid size-5 shrink-0 place-items-center rounded-full bg-lifecycle-active lg:size-[1.7em]"
            aria-hidden="true"
          >
            <span className="size-2 rounded-full bg-brand-dark lg:size-[0.6em]" />
          </span>
          <p className="text-xs font-bold leading-tight text-trust-lime-ink lg:text-[0.75em]">
            Technician
            <br />
            dispatched
          </p>
        </div>
        <div
          aria-label="Example active jobs"
          className="relative m-4 rounded-xl bg-surface-white p-4 shadow-sm lg:absolute lg:top-[17.5%] lg:left-[0.5%] lg:m-0 lg:flex lg:h-[59%] lg:w-[28%] lg:flex-col lg:rounded-[1.2em] lg:p-[1em]"
        >
          <div className="mb-3 flex items-center gap-1.5 lg:mb-[1em] lg:gap-[0.5em]">
            <h3 className="text-sm font-bold lg:text-[0.9em]">Active Jobs</h3>
            <span className="grid size-4 place-items-center rounded-full bg-lifecycle-active text-[10px] font-bold lg:size-[1.5em] lg:text-[0.75em]">
              4
            </span>
            <span className="ml-auto flex items-center gap-0.5 text-xs text-trust-lime-ink lg:text-[0.65em]">
              View all <ArrowRight className="size-[1em]" aria-hidden="true" />
            </span>
          </div>
          <ul className="space-y-4 lg:flex lg:flex-1 lg:flex-col lg:justify-around lg:space-y-0">
            {jobs.map(({ title, site, status, icon: Icon }) => (
              <li key={title} className="flex items-center gap-2 lg:gap-[0.65em]">
                <Icon className="size-4 shrink-0 lg:size-[1.5em]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-tight lg:whitespace-nowrap lg:text-[0.72em]">
                    {title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-text-secondary lg:text-[0.7em]">
                    {site}
                  </p>
                </div>
                <StatusBadge
                  status={status}
                  showPulse={false}
                  className={`h-auto! shrink-0 border-0! px-1.5! py-1! text-[10px]! tracking-normal! lg:px-[0.6em]! lg:py-[0.4em]! lg:text-[0.65em]! ${jobStatusTones[status]}`}
                />
                <ArrowRight
                  className="size-3 shrink-0 text-text-muted lg:size-[0.8em]"
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
        </div>
        <ul
          aria-label="Industries served"
          className="grid grid-cols-2 gap-3 p-4 lg:absolute lg:top-[4%] lg:right-[2.1%] lg:bottom-[18%] lg:w-[38%] lg:grid-rows-3 lg:gap-[0.6em] lg:p-0"
        >
          {services.map(({ label, image, alt }) => (
            <li
              key={label}
              className="relative aspect-[1.65] min-h-0 overflow-hidden rounded-xl bg-surface-soft lg:aspect-auto lg:rounded-[0.9em]"
            >
              <Image
                src={`/marketing/${image}.png`}
                alt={alt}
                fill
                sizes="(min-width: 1500px) 195px, (min-width: 1200px) 165px, (min-width: 1024px) 125px, 45vw"
                className="object-cover"
              />
              <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] rounded-full bg-brand-dark/85 px-2 py-1 text-[10px] font-medium leading-tight text-white lg:bottom-[0.6em] lg:left-[0.6em] lg:max-w-[calc(100%-1.2em)] lg:px-[0.8em] lg:py-[0.35em] lg:text-[0.75em]">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
