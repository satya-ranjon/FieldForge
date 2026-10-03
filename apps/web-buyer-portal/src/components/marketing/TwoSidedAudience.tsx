import React from 'react';
import Link from 'next/link';
import { marketingLayoutScale } from './MarketingHero.styles';
import {
  FilePlus,
  Users,
  BarChart2,
  CreditCard,
  User,
  Search,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const businessSteps = [
  { num: '01', title: 'Create Work', desc: 'Post your project in minutes.', icon: FilePlus },
  { num: '02', title: 'Find Talent', desc: 'Get matched with qualified techs.', icon: Users },
  { num: '03', title: 'Track Execution', desc: 'Monitor progress in real time.', icon: BarChart2 },
  { num: '04', title: 'Approve & Pay', desc: 'Review work and release payment.', icon: CreditCard }
];

const technicianSteps = [
  { num: '01', title: 'Create Profile', desc: 'Showcase your skills and experience.', icon: User },
  { num: '02', title: 'Find Jobs', desc: 'Browse opportunities near you.', icon: Search },
  { num: '03', title: 'Complete Work', desc: 'Do what you do best.', icon: CheckCircle2 },
  { num: '04', title: 'Get Paid', desc: 'Fast, secure payments.', icon: CreditCard }
];

const audiences = [
  {
    label: 'For Businesses',
    title: (
      <>
        Get the work done
        <br />
        with confidence.
      </>
    ),
    description:
      'Post work, find qualified technicians, track progress, and approve payment — all in one place.',
    action: 'Get Started',
    href: '/create-wo',
    steps: businessSteps
  },
  {
    label: 'For Technicians',
    title: (
      <>
        Find work.
        <br />
        Build your business.
      </>
    ),
    description:
      'Create a profile, find jobs in your area, complete work, and get paid — on your terms.',
    action: 'Join as a Technician',
    href: '/technicians',
    steps: technicianSteps
  }
];

export function TwoSidedAudience(): React.JSX.Element {
  return (
    <section
      id="audience-pathways"
      aria-label="For businesses and technicians"
      className={`${marketingLayoutScale} mx-auto w-[calc(100%-2.5rem)] max-w-marketing-page font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:w-[calc(var(--hero-unit)*89)] lg:text-[length:var(--hero-unit)]`}
    >
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-[1.2em]">
        {audiences.map((audience) => (
          <article
            key={audience.label}
            aria-label={audience.label}
            className="grid min-w-0 gap-5 rounded-xl bg-surface-white p-5 sm:grid-cols-[1.25fr_1fr] sm:gap-3 lg:gap-[1em] lg:rounded-[1em] lg:p-[2em]"
          >
            <div className="sm:border-r sm:border-border-soft sm:pr-4 lg:pr-[1.2em]">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-marketing-status-green lg:mt-[0.5em] lg:text-[0.8em]">
                {audience.label}
              </p>
              <h2 className="mt-2 font-[family-name:'FieldForge_Hero',Arial,sans-serif] text-2xl font-black leading-[1.12] tracking-[-0.02em] lg:mt-[0.4em] lg:text-[2.2em]">
                {audience.title}
              </h2>
              <p className="mt-3 text-sm leading-[1.4] text-text-secondary lg:mt-[0.8em] lg:text-[1.05em]">
                {audience.description}
              </p>
              <Link
                href={audience.href}
                className="mt-4 inline-flex min-h-11 items-center justify-between gap-5 rounded-xl bg-brand-dark px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marketing-check lg:mt-[1.7em] lg:min-h-0 lg:gap-[2em] lg:rounded-[1em] lg:px-[1.5em] lg:py-[1em] lg:text-[0.9em]"
              >
                {audience.action}
                <ArrowRight className="size-4 text-trust-lime lg:size-[1.5em]" aria-hidden="true" />
              </Link>
            </div>
            <ol
              aria-label={`${audience.label} steps`}
              className="divide-y divide-border-soft border-t border-border-soft sm:border-t-0"
            >
              {audience.steps.map(({ num, title, desc, icon: Icon }) => (
                <li
                  key={num}
                  className="flex items-center gap-3 py-3 first:pt-4 sm:first:pt-0 lg:gap-[0.9em] lg:py-[1.15em] lg:first:pt-[0.2em] lg:last:pb-0"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-green-subtle text-[10px] font-bold text-marketing-status-green lg:size-[2.8em] lg:text-[0.8em]">
                    {num}
                  </span>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-soft lg:size-[2.8em]">
                    <Icon className="size-5 lg:size-[1.7em]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold lg:text-[0.85em]">{title}</h3>
                    <p className="mt-0.5 text-[10px] leading-[1.35] text-text-secondary lg:text-[0.7em]">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
