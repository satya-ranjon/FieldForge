import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Play,
  ShieldCheck,
  Zap,
  BarChart2,
  CircleAlert,
  CircleCheck,
  Navigation,
  MapPin,
  House
} from 'lucide-react';
import { DispatchDemoMap } from './DispatchDemoMap';
import { marketingLayoutScale } from './MarketingHero.styles';
import { MarketingBrandMark } from './MarketingHeroArtwork';

const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-green';
const metrics = [
  { value: '18', label: 'Open Jobs' },
  { value: '04', label: 'At Risk' },
  { value: '09', label: 'Pending Approval' },
  { value: '$42K', label: 'Spend' }
];
const alerts = [
  {
    text: 'Emergency work needs dispatch',
    time: '2 min ago',
    icon: CircleAlert,
    tone: 'text-status-danger'
  },
  {
    text: 'Arrival verification pending',
    time: '14 min ago',
    icon: CircleAlert,
    tone: 'text-status-warning'
  },
  {
    text: 'Invoice awaiting approval',
    time: '1 hour ago',
    icon: CircleCheck,
    tone: 'text-brand-green'
  }
];
const benefits = [
  { first: 'Trusted', second: 'Technicians', icon: ShieldCheck },
  { first: 'Faster', second: 'Dispatch', icon: Zap },
  { first: 'Greater', second: 'Accountability', icon: BarChart2 }
];

function DispatchDashboard(): React.JSX.Element {
  return (
    <div
      aria-label="Dispatch command center preview"
      className="min-w-0 rounded-2xl border border-trust-lime/30 bg-brand-dark/70 p-2 shadow-xl lg:rounded-[1.8em] lg:p-[0.8em]"
    >
      <div className="overflow-hidden rounded-xl border border-white/15 bg-brand-dark/95 lg:rounded-[1em]">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3 lg:px-[1.6em] lg:py-[0.8em]">
          <div className="flex items-center gap-4 lg:gap-[4em]">
            <span className="flex items-center gap-1 text-xs font-bold lg:gap-[0.4em] lg:text-[0.9em]">
              <span className="block size-4 lg:size-[1.6em]">
                <MarketingBrandMark />
              </span>
              FieldForge
            </span>
            <div className="hidden items-center gap-[2em] text-[0.65em] text-white/65 sm:flex">
              <span className="flex items-center gap-[0.5em] rounded-md bg-brand-green/10 px-[1em] py-[0.8em] text-brand-green">
                <House className="size-[1.2em]" aria-hidden="true" />
                Command Center
              </span>
              <span>Work Orders</span>
              <span>Technicians</span>
              <span>Payments</span>
            </div>
          </div>
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15 text-[10px] lg:size-[2.4em] lg:text-[0.8em]">
            JS
          </span>
        </div>
        <div className="p-3 lg:p-[1.5em]">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2 lg:mb-[0.6em] lg:gap-[1em]">
            <div>
              <h3 className="text-sm font-bold lg:text-[1.3em]">Command Center</h3>
              <p className="max-w-[22em] text-[9px] leading-tight text-white/70 lg:text-[0.75em]">
                Open jobs, technicians, approvals
                <br />
                and operational risk.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[8px] lg:gap-[2em] lg:text-[0.65em]">
              <span className="flex items-center gap-1.5">
                <span className="size-[0.7em] rounded-full bg-brand-green" />
                Live Operational View
              </span>
              <span className="text-white/60">Mon, Apr 22 &nbsp; 10:24 AM</span>
            </div>
          </div>
          <ul
            aria-label="Dispatch summary"
            className="mb-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4 lg:mb-[0.7em] lg:gap-[0.8em]"
          >
            {metrics.map(({ value, label }, index) => (
              <li
                key={label}
                className="rounded-md border border-white/10 bg-white/[0.035] px-1 py-2 lg:rounded-[0.6em] lg:py-[0.65em]"
              >
                <strong
                  className={`block text-base leading-tight lg:text-[1.3em] ${index === 1 ? 'text-status-warning' : 'text-brand-green'}`}
                >
                  {value}
                </strong>
                <span className="block text-[9px] text-white/80 lg:text-[0.7em]">{label}</span>
              </li>
            ))}
          </ul>
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr] lg:gap-[0.7em]">
            <DispatchDemoMap compact />
            <div className="flex min-w-0 flex-col gap-2 lg:gap-[0.7em]">
              <section
                aria-labelledby="dispatch-alerts-title"
                className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-2 lg:rounded-[0.6em] lg:px-[0.7em] lg:py-[0.6em]"
              >
                <div className="mb-1 flex items-center justify-between gap-1">
                  <h4 id="dispatch-alerts-title" className="text-[10px] font-bold lg:text-[0.8em]">
                    Operational Alerts
                  </h4>
                  <span className="text-[8px] text-brand-green lg:text-[0.6em]">View All →</span>
                </div>
                <ul className="divide-y divide-white/10">
                  {alerts.map(({ text, time, icon: Icon, tone }) => (
                    <li
                      key={text}
                      className="flex items-center gap-1 py-1.5 lg:gap-[0.4em] lg:py-[0.6em]"
                    >
                      <Icon
                        className={`size-3 shrink-0 lg:size-[1em] ${tone}`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-[9px] leading-tight text-white/90 lg:text-[0.65em]">
                        {text}
                      </span>
                      <span className="shrink-0 text-[7px] text-white/60 lg:text-[0.55em]">
                        {time}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <section
                aria-label="Best technician match"
                className="flex flex-1 flex-col justify-between rounded-lg border border-brand-green/15 bg-brand-green/[0.06] p-2 lg:rounded-[0.6em] lg:p-[0.7em]"
              >
                <p className="text-[9px] font-bold uppercase tracking-wider text-brand-green lg:text-[0.6em]">
                  Best Match
                </p>
                <div className="my-2 flex items-center gap-2 lg:my-[0.5em] lg:gap-[0.7em]">
                  <Image
                    src="/marketing/avatars/marcus-lee-v2.png"
                    alt="Alex Morgan"
                    width={80}
                    height={80}
                    className="size-9 shrink-0 rounded-full object-cover lg:size-[3em]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <h4 className="text-xs font-bold lg:text-[0.85em]">Alex Morgan</h4>
                      <span className="rounded-full bg-brand-green px-[0.8em] py-[0.3em] text-[8px] font-bold text-brand-dark lg:text-[0.6em]">
                        96% match
                      </span>
                    </div>
                    <p className="mt-0.5 text-[9px] text-white/80 lg:text-[0.65em]">
                      HVAC · 4.9 ★ · 120 jobs
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[9px] text-white/75 lg:text-[0.65em]">
                      <MapPin className="size-[1em]" aria-hidden="true" />
                      Austin, TX · 18 mi
                    </p>
                  </div>
                </div>
                <Link
                  href="/technicians"
                  className={`${focus} flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-green px-2 py-2 text-xs font-bold text-brand-dark transition hover:bg-brand-green-hover lg:min-h-0 lg:gap-[0.6em] lg:py-[0.65em] lg:text-[0.7em]`}
                >
                  <Navigation className="size-[1.2em]" aria-hidden="true" />
                  Assign Technician
                </Link>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DarkBottomCtaBanner(): React.JSX.Element {
  return (
    <section
      id="fieldwork-cta"
      aria-labelledby="fieldwork-cta-title"
      className={`${marketingLayoutScale} relative isolate mx-auto w-[calc(100%-2.5rem)] overflow-hidden rounded-2xl border border-white/15 bg-brand-dark font-[family-name:Arial,Helvetica,sans-serif] text-white lg:w-[calc(var(--hero-unit)*90)] lg:rounded-[1.6em] lg:text-[length:var(--hero-unit)]`}
    >
      <Image
        src="/marketing/cta-forest-background.png"
        alt=""
        fill
        sizes="(min-width: 1500px) 1440px, (min-width: 1200px) 1200px, 100vw"
        className="pointer-events-none -z-10 object-cover"
      />
      <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[41%_minmax(0,1fr)] lg:gap-[1.5em] lg:py-[1.8em] lg:pr-[1.7em] lg:pl-[2.8em]">
        <div className="flex min-w-0 flex-col lg:pt-[2em]">
          <p className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.1em] text-trust-lime/80 lg:gap-[1.3em] lg:text-[0.7em]">
            <span className="h-px w-4 bg-brand-green" aria-hidden="true" />
            Fieldwork moves forward
          </p>
          <h2
            id="fieldwork-cta-title"
            className="mt-4 max-w-md font-[family-name:'FieldForge_Hero',Arial,sans-serif] text-4xl font-black leading-[1.04] tracking-[-0.025em] lg:mt-[0.5em] lg:text-[3.65em]"
          >
            Your next field job
            <br className="hidden lg:block" /> should not take
            <br className="hidden lg:block" /> hours to staff.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-[1.3] text-white/80 lg:mt-[1em] lg:max-w-[29em] lg:text-[1.2em]">
            Find qualified technicians, coordinate field work and keep every job accountable from
            dispatch through payment.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 lg:mt-[1.7em] lg:gap-[0.6em]">
            <Link
              href="/create-wo"
              className={`${focus} inline-flex min-h-11 items-center gap-3 rounded-full bg-brand-green px-5 py-3 text-xs font-bold text-brand-dark transition hover:bg-brand-green-hover lg:min-h-0 lg:gap-[1em] lg:px-[1.8em] lg:py-[1em] lg:text-[1em]`}
            >
              Find Technicians
              <ArrowRight className="size-[1.4em]" aria-hidden="true" />
            </Link>
            <Link
              href="/resources"
              className={`${focus} inline-flex min-h-11 items-center gap-3 rounded-full border border-trust-lime/35 bg-brand-dark/50 px-5 py-3 text-xs font-bold text-white transition hover:bg-brand-dark-hover lg:min-h-0 lg:gap-[1em] lg:px-[1.8em] lg:py-[1em] lg:text-[0.85em]`}
            >
              Book a Demo
              <span className="grid size-[1.5em] place-items-center rounded-full bg-trust-lime/15 text-brand-green">
                <Play className="size-[0.85em] fill-current" aria-hidden="true" />
              </span>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4 lg:mt-auto lg:gap-[1em] lg:pt-[4.5em] lg:pb-[1em]">
            <ul
              aria-label="Fieldwork benefits"
              className="flex flex-wrap items-center gap-y-3 divide-x divide-brand-green/40 lg:flex-nowrap"
            >
              {benefits.map(({ first, second, icon: Icon }) => (
                <li
                  key={first}
                  className="flex items-center gap-2 px-3 first:pl-0 lg:gap-[0.8em] lg:px-[1.5em]"
                >
                  <Icon
                    className="size-4 shrink-0 text-brand-green lg:size-[1.6em]"
                    aria-hidden="true"
                  />
                  <span className="text-[7px] font-bold uppercase leading-relaxed tracking-wider text-white/85 lg:text-[0.55em]">
                    {first}
                    <br />
                    {second}
                  </span>
                </li>
              ))}
            </ul>
            <p className="-rotate-12 font-[family-name:'Comic_Sans_MS',cursive] text-sm leading-tight text-trust-lime/80 lg:text-[1.3em]">
              Field work.
              <br />
              Built better.
            </p>
          </div>
        </div>
        <DispatchDashboard />
      </div>
    </section>
  );
}
