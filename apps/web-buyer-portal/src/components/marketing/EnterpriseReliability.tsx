import React from 'react';
import { marketingLayoutScale } from './MarketingHero.styles';
import { Bell, Link2, FileText, BarChart2 } from 'lucide-react';

const reliabilityFeatures = [
  {
    icon: Bell,
    title: 'Reliable Notifications',
    desc: 'Keep buyers, dispatchers and technicians aligned.'
  },
  {
    icon: Link2,
    title: 'Operational Traceability',
    desc: 'Every job action stays connected to the work order.'
  },
  {
    icon: FileText,
    title: 'Consistent Financial Records',
    desc: 'Approvals, invoices and payout records stay reconciled.'
  },
  {
    icon: BarChart2,
    title: 'Platform Monitoring',
    desc: 'Operational visibility for serious field programs.'
  }
];

export function EnterpriseReliability(): React.JSX.Element {
  return (
    <section
      id="enterprise-reliability"
      aria-labelledby="enterprise-reliability-title"
      className={`${marketingLayoutScale} relative mx-auto w-[calc(100%-2.5rem)] max-w-marketing-page font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:w-[calc(var(--hero-unit)*89)] lg:text-[length:var(--hero-unit)]`}
    >
      <header className="mx-auto mb-5 max-w-3xl text-center lg:mb-[1.7em] lg:max-w-[65em]">
        <span className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-white px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.04em] lg:gap-[1em] lg:px-[1.5em] lg:py-[0.8em] lg:text-[0.75em]">
          <span className="size-[0.8em] rounded-full bg-brand-green" aria-hidden="true" />
          Enterprise Reliability
        </span>
        <h2
          id="enterprise-reliability-title"
          className="mt-4 font-[family-name:'FieldForge_Hero',Arial,sans-serif] text-3xl font-black leading-[1.04] tracking-[-0.025em] sm:text-4xl lg:mt-[0.35em] lg:text-[4em]"
        >
          Built for operations that cannot
          <br className="hidden sm:block" /> lose track of work.
        </h2>
      </header>
      <ul
        aria-label="Enterprise reliability features"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[1.2em]"
      >
        {reliabilityFeatures.map(({ title, desc, icon: Icon }) => (
          <li
            key={title}
            className="rounded-xl border border-border-default bg-surface-white p-5 lg:rounded-[0.9em] lg:px-[1.9em] lg:py-[1.5em]"
          >
            <span className="mb-3 grid size-10 place-items-center rounded-full bg-brand-green-soft text-brand-dark lg:mb-[1em] lg:size-[3.6em]">
              <Icon className="size-5 lg:size-[1.9em]" aria-hidden="true" />
            </span>
            <h3 className="text-sm font-bold leading-tight lg:text-[1.3em]">{title}</h3>
            <p className="mt-1.5 text-sm leading-[1.3] text-text-secondary lg:mt-[0.45em] lg:text-[1.15em]">
              {desc}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
