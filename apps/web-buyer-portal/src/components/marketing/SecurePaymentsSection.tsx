import React from 'react';
import {
  FileText,
  ShieldCheck,
  CreditCard,
  CircleCheck,
  Wallet,
  Shield,
  ChartNoAxesCombined
} from 'lucide-react';
import { marketingLayoutScale } from './MarketingHero.styles';

const paymentSteps = [
  { icon: FileText, title: 'Job Posted', desc: 'Client creates a job' },
  { icon: ShieldCheck, title: 'Work Completed', desc: 'Deliver and get approved' },
  { icon: CreditCard, title: 'Payment Released', desc: 'Get paid securely' },
  { icon: CircleCheck, title: 'You Get Paid', desc: 'Funds in your account', highlight: true }
];
const valuePillars = [
  {
    num: '01',
    icon: Wallet,
    title: 'Transparent & Fair Funds',
    desc: 'Payments are held securely and released when work is completed.',
    tone: 'bg-brand-green-soft'
  },
  {
    num: '02',
    icon: Shield,
    title: 'Secure and On-time',
    desc: 'Your payments are protected with industry-standard security.',
    tone: 'bg-teal-50'
  },
  {
    num: '03',
    icon: ChartNoAxesCombined,
    title: 'Hassle-free Payouts',
    desc: 'Multiple payment methods and fast withdrawals to your account.',
    tone: 'bg-purple-50'
  }
];

export function SecurePaymentsSection(): React.JSX.Element {
  return (
    <section
      id="secure-payments"
      aria-labelledby="secure-payments-title"
      className={`${marketingLayoutScale} relative mx-auto w-[calc(100%-2.5rem)] rounded-2xl bg-surface-white/65 p-5 font-[family-name:Arial,Helvetica,sans-serif] text-text-primary shadow-sm sm:p-7 lg:w-[calc(var(--hero-unit)*89)] lg:rounded-[1.6em] lg:p-[2.8em] lg:text-[length:var(--hero-unit)]`}
    >
      <div className="grid items-center gap-6 lg:grid-cols-[42%_minmax(0,1fr)] lg:gap-[2.7em]">
        <header>
          <span className="inline-flex items-center gap-[0.65em] rounded-full bg-surface-white px-[1em] py-[0.55em] text-[0.625rem] font-bold uppercase leading-none lg:text-[0.7em]">
            <span className="size-[0.8em] rounded-full bg-lifecycle-active" aria-hidden="true" />
            Secure payments
          </span>
          <h2
            id="secure-payments-title"
            className="mt-2 text-3xl font-bold leading-[1.1] tracking-[-0.025em] lg:mt-[0.25em] lg:text-[2.5em]"
          >
            Payments built around
            <br className="hidden lg:block" /> completed work.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-[1.35] text-text-secondary lg:mt-[0.6em] lg:text-[1.1em]">
            Get paid with confidence. Your work, our secure payment flow — simple, transparent and
            reliable.
          </p>
        </header>
        <ol
          aria-label="Payment workflow"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-[1.5em]"
        >
          {paymentSteps.map(({ icon: Icon, title, desc, highlight }, index) => (
            <li
              key={title}
              className={`relative flex flex-col items-center justify-center rounded-lg border border-border-soft px-2 py-4 text-center lg:min-h-[7.2em] lg:rounded-[0.8em] lg:px-[0.6em] lg:py-[1em] ${highlight ? 'bg-lifecycle-active' : 'bg-surface-white'} ${index < 3 ? "lg:after:absolute lg:after:top-1/2 lg:after:-right-[1.6em] lg:after:w-[1.5em] lg:after:border-t lg:after:border-dashed lg:after:border-border-strong lg:after:content-['']" : ''}`}
            >
              <Icon
                className={`mb-2 size-6 lg:mb-[0.8em] lg:size-[2em] ${highlight ? 'fill-brand-dark text-lifecycle-active' : 'text-text-primary'}`}
                aria-hidden="true"
              />
              <h3 className="text-xs font-bold lg:text-[0.8em]">{title}</h3>
              <p className="mt-1 text-[10px] leading-tight text-text-secondary lg:text-[0.7em]">
                {desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
      <ol
        aria-label="Payment benefits"
        className="mt-6 grid gap-4 md:grid-cols-3 lg:mt-[2em] lg:gap-[1.6em]"
      >
        {valuePillars.map(({ num, icon: Icon, title, desc, tone }) => (
          <li
            key={num}
            className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-border-soft bg-surface-white/90 p-4 lg:min-h-[9em] lg:gap-[1.8em] lg:rounded-[1em] lg:p-[1.5em]"
          >
            <span
              className={`grid size-12 shrink-0 place-items-center rounded-lg text-brand-dark lg:size-[5em] lg:rounded-[0.6em] ${tone}`}
            >
              <Icon className="size-[48%] stroke-[1.8]" aria-hidden="true" />
            </span>
            <div className="relative">
              <span
                className={`mb-1 inline-grid size-5 place-items-center rounded-full text-[9px] font-bold lg:mb-[0.7em] lg:size-[2em] lg:text-[0.65em] ${tone}`}
              >
                {num}
              </span>
              <h3 className="text-sm font-bold leading-tight lg:text-[1em]">{title}</h3>
              <p className="mt-1 text-xs leading-[1.4] text-text-secondary lg:mt-[0.6em] lg:text-[0.85em]">
                {desc}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
