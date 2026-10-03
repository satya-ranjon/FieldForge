import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Handshake,
  LockKeyhole,
  Percent,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  CornerDownLeft,
  type LucideIcon
} from 'lucide-react';
import { SolutionsNavigation } from '../../components/solutions/SolutionsChrome';
import {
  platformFrame as frame,
  platformHeading as heading,
  platformFocus as focus
} from '../../components/platform/PlatformPrimitives';
import {
  PricingContact,
  PricingFooter,
  TechnicianJoin
} from '../../components/pricing/PricingChrome';
import { PricingExample, PricingFaq } from '../../components/pricing/PricingInteractive';

export const metadata: Metadata = {
  title: 'Pricing | FieldForge',
  description:
    'Explore FieldForge’s simple completed-job pricing model, a 12% platform fee example, and free access for technicians.'
};
const panel =
  'mx-auto w-[calc(100%-2rem)] max-w-[1540px] rounded-2xl bg-white px-5 py-6 sm:px-7 lg:w-[92%] lg:px-[2.8em] lg:py-[1.3em]';
function Eyebrow({
  children,
  dark = false
}: {
  children: string;
  dark?: boolean;
}): React.JSX.Element {
  return (
    <p
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-bold uppercase lg:text-[0.65em] ${dark ? 'border-white/10 bg-white/10 text-white' : 'border-trust-lime bg-white text-text-primary'}`}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-brand-green ring-2 ring-brand-green-soft/70"
      />
      {children}
    </p>
  );
}
function CheckItem({ children }: { children: string }): React.JSX.Element {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-brand-green lg:size-[1.1em]">
        <Check className="size-[0.8em] stroke-[3] text-trust-lime-ink" />
      </span>
      {children}
    </li>
  );
}
function FindTechnician(): React.JSX.Element {
  return (
    <Link
      href="/technicians"
      className={`${focus} inline-flex min-h-11 items-center justify-center gap-[1em] rounded-lg bg-brand-dark px-[1.8em] py-[0.95em] text-xs font-bold text-white shadow-sm hover:bg-brand-dark-hover lg:text-[0.92em]`}
    >
      Find a Technician <ArrowRight className="size-[1.1em] text-brand-green" />
    </Link>
  );
}
function PricingHero(): React.JSX.Element {
  return (
    <div
      aria-label="Completed-job pricing illustration"
      className="relative mx-auto aspect-[1.2] w-full max-w-[640px] text-[clamp(10px,1.2vw,18px)] lg:max-w-none lg:text-[1em]"
    >
      <Image
        src="/marketing/pricing-route.png"
        alt=""
        fill
        sizes="50vw"
        className="pointer-events-none object-contain opacity-70"
      />
      <div className="absolute bottom-[8%] left-[21%] top-[1%] w-[59%] overflow-hidden rounded-[1.5em]">
        <Image
          src="/marketing/pricing-customer.png"
          alt="Customer in a green sweater smiling while using her phone"
          fill
          priority
          sizes="(max-width: 1023px) 65vw, 30vw"
          className="object-cover object-[center_40%]"
        />
      </div>
      <div className="absolute left-[4%] top-[13%] flex w-[47%] items-center gap-[0.9em] rounded-[1em] border border-border-soft bg-white p-[1em] shadow-card">
        <span className="grid size-[3.6em] shrink-0 place-items-center rounded-lg bg-brand-green-subtle text-trust-lime-ink">
          <ClipboardList className="size-[2.1em]" />
        </span>
        <div>
          <p className="text-[0.8em] font-bold">Post a job</p>
          <p className="mt-[0.35em] text-[0.65em] leading-snug text-text-secondary">
            Find a verified technician
            <br />
            in minutes
          </p>
        </div>
        <ArrowRight className="ml-auto size-[1em] shrink-0 text-trust-lime-ink" />
      </div>
      <div className="absolute right-0 top-[25%] flex w-[40%] items-center gap-[0.8em] rounded-[1em] border border-border-soft bg-white p-[1em] shadow-card">
        <span className="grid size-[3.3em] shrink-0 place-items-center rounded-lg bg-brand-green-subtle text-trust-lime-ink">
          <CheckCircle2 className="size-[2em]" />
        </span>
        <div>
          <p className="text-[0.7em] font-bold">Job completed</p>
          <p className="mt-[0.35em] text-[0.57em] leading-relaxed text-text-secondary">
            Automotive AC repair
            <br />
            Completed on Sep 12
          </p>
        </div>
        <ArrowRight className="ml-auto size-[0.8em] shrink-0 text-trust-lime-ink" />
      </div>
      <div className="absolute bottom-[7%] right-[9%] w-[32%] rounded-[1.2em] border border-border-soft bg-white p-[1.2em] shadow-lg">
        <p className="text-[0.95em] font-bold">Platform fee</p>
        <p className={`${heading} my-[0.1em] text-[2.7em]`}>12%</p>
        <p className="text-[0.9em] leading-snug text-text-secondary">
          Only when the job
          <br />
          is completed
        </p>
      </div>
      <p
        aria-hidden="true"
        className="absolute right-[1%] top-[5%] -rotate-12 font-[family-name:'Comic_Sans_MS',cursive] text-[1em] text-text-secondary"
      >
        Pay only
        <br />
        when it’s done
        <CornerDownLeft className="ml-4 mt-2 size-[1.4em] stroke-trust-lime-ink" />
      </p>
    </div>
  );
}
const steps: { title: string; text: string; icon: LucideIcon }[] = [
  { title: 'Post your job', text: 'Describe what you need', icon: ClipboardList },
  { title: 'Hire a technician', text: 'Choose the right professional', icon: Users },
  { title: 'Job completed', text: 'Work is done and approved', icon: CheckCircle2 },
  { title: 'Pay platform fee', text: '12% of the job amount, added separately', icon: CreditCard }
];
const benefits = [
  {
    title: 'Pay for results',
    text: 'The platform fee applies when the job is done.',
    icon: ShieldCheck
  },
  {
    title: 'No subscription cost',
    text: 'No recurring subscription or upfront platform fee.',
    icon: LockKeyhole
  },
  {
    title: 'Supports independent professionals',
    text: 'Technicians keep the full agreed job amount.',
    icon: Users
  },
  {
    title: 'Better service quality',
    text: 'Clear expectations and proof help support quality work.',
    icon: Star
  }
];

export default function PricingPage(): React.JSX.Element {
  return (
    <div className="min-h-screen overflow-x-clip bg-surface-marketing/65 font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:text-[clamp(12px,1.2vw,18px)]">
      <SolutionsNavigation activePage="/pricing" />
      <main>
        <section
          className={`${frame} grid items-center gap-6 py-7 lg:grid-cols-[46%_52%] lg:justify-between lg:gap-0 lg:pb-[1.1em] lg:pt-[0.7em]`}
        >
          <div>
            <Eyebrow>Pricing</Eyebrow>
            <h1
              className={`${heading} mt-3 max-w-[12em] text-[clamp(35px,4.3vw,58px)] lg:text-[3.1em]`}
            >
              Simple, transparent pricing that{' '}
              <span className="text-marketing-heading-accent">works</span> for everyone
            </h1>
            <p className="mt-4 max-w-[35em] text-sm leading-[1.45] text-text-secondary lg:mt-[1em] lg:text-[1.04em]">
              You only pay the platform fee when a job is completed. Technicians can join and use
              the platform for free.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-[11px] font-bold lg:mt-[1.4em] lg:gap-x-[1.6em] lg:text-[0.7em]">
              {['No subscription', 'No hidden platform fees', 'No long-term contracts'].map(
                (text) => (
                  <CheckItem key={text}>{text}</CheckItem>
                )
              )}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 lg:mt-[1.8em] lg:gap-[1.2em]">
              <FindTechnician />
              <TechnicianJoin />
            </div>
            <p className="mt-4 text-xs text-text-secondary lg:mt-[1.4em] lg:text-[0.85em]">
              Fair for businesses. Free for technicians. Better service for everyone.
            </p>
          </div>
          <PricingHero />
        </section>

        <section className={`${panel} bg-surface-green/80!`}>
          <div className="grid items-center gap-5 lg:grid-cols-[46%_50%] lg:justify-between">
            <div>
              <Eyebrow>How it works</Eyebrow>
              <h2 className={`${heading} mt-3 max-w-[14em] text-3xl lg:text-[2.3em]`}>
                A pricing model built on trust and results
              </h2>
            </div>
            <p className="text-sm leading-relaxed lg:text-[0.98em]">
              We keep it simple. You pay a platform fee when your job is successfully completed. No
              upfront platform fee and no subscription.
            </p>
          </div>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:mt-[1.7em] lg:grid-cols-4 lg:gap-[2.5em]">
            {steps.map(({ title, text, icon: Icon }, index) => (
              <li key={title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full bg-brand-green text-sm font-bold lg:size-[2em] lg:text-[1em]">
                    {index + 1}
                  </span>
                  <span className="grid size-14 place-items-center rounded-full bg-white/85 lg:size-[4em]">
                    <Icon className="size-7 lg:size-[2em]" />
                  </span>
                </div>
                {index < 3 && (
                  <ArrowRight
                    aria-hidden="true"
                    className="absolute -right-[1.7em] top-[1.5em] hidden size-[1.2em] text-text-secondary lg:block"
                  />
                )}
                <h3 className="mt-3 text-base font-bold lg:text-[1.2em]">{title}</h3>
                <p className="mt-1 text-xs text-text-secondary lg:text-[0.9em]">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${panel} mt-6 lg:mt-[1.8em]`}>
          <Eyebrow>Pricing overview</Eyebrow>
          <h2 className={`${heading} mt-3 text-3xl lg:text-[2.2em]`}>
            Clear and fair for both sides
          </h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:gap-[2em]">
            <div className="relative rounded-xl border border-border-soft p-5 lg:p-[1.5em]">
              <p className="inline-flex items-center gap-2 rounded-full bg-trust-lime/70 px-3 py-2 text-[10px] font-bold lg:py-[0.5em] lg:text-[0.8em]">
                <ClipboardList className="size-[1em]" />
                For Customers (Job Posters)
              </p>
              <Percent
                aria-hidden="true"
                className="absolute right-[1.4em] top-[4.5em] size-14 rounded-full bg-brand-green-subtle p-3 text-trust-lime-ink lg:size-[4.4em]"
              />
              <h3 className="mt-4 pr-14 text-xl font-bold tracking-tight lg:mt-[0.8em] lg:text-[1.65em]">
                Pay 12% per completed job
              </h3>
              <p className="mt-2 max-w-[26em] pr-12 text-sm leading-snug text-text-secondary lg:text-[0.95em]">
                We charge a 12% platform fee only when the job is successfully completed.
              </p>
              <ul className="my-4 space-y-2 text-xs text-text-secondary lg:my-[1.1em] lg:space-y-[0.65em] lg:text-[0.92em]">
                {[
                  'No subscription fees',
                  'No upfront platform fee',
                  'Pay the fee only on completed jobs',
                  'Clear, itemized pricing'
                ].map((text) => (
                  <CheckItem key={text}>{text}</CheckItem>
                ))}
              </ul>
              <FindTechnician />
            </div>
            <div className="relative rounded-xl border border-border-soft p-5 lg:p-[1.5em]">
              <p className="inline-flex items-center gap-2 rounded-full bg-trust-lime/70 px-3 py-2 text-[10px] font-bold lg:py-[0.5em] lg:text-[0.8em]">
                <Handshake className="size-[1em]" />
                For Technicians
              </p>
              <UserRound
                aria-hidden="true"
                className="absolute right-[1.4em] top-[4.5em] size-14 rounded-full bg-brand-green-subtle p-3 text-trust-lime-ink lg:size-[4.4em]"
              />
              <h3 className="mt-4 pr-14 text-xl font-bold tracking-tight lg:mt-[0.8em] lg:text-[1.65em]">
                Completely free to use
              </h3>
              <p className="mt-2 max-w-[26em] pr-12 text-sm leading-snug text-text-secondary lg:text-[0.95em]">
                Join, get job opportunities, and grow your business without platform fees.
              </p>
              <ul className="my-4 space-y-2 text-xs text-text-secondary lg:my-[1.1em] lg:space-y-[0.65em] lg:text-[0.92em]">
                {[
                  'Free account and profile',
                  'Get job leads',
                  'Keep 100% of your job earnings',
                  'No hidden platform costs'
                ].map((text) => (
                  <CheckItem key={text}>{text}</CheckItem>
                ))}
              </ul>
              <TechnicianJoin />
            </div>
          </div>
        </section>

        <section id="pricing-example" className={`${panel} mt-5 lg:mt-[1.4em]`}>
          <Eyebrow>Example</Eyebrow>
          <h2 className={`${heading} mt-3 text-3xl lg:text-[2.2em]`}>See how it works</h2>
          <p className="mt-1 text-xs text-text-secondary lg:text-[0.95em]">
            Here’s a simple example of how the 12% platform fee is applied.
          </p>
          <PricingExample />
        </section>

        <section className={`${panel} mt-5 lg:mt-[1.4em]`}>
          <Eyebrow>Why this model</Eyebrow>
          <h2 className={`${heading} mt-3 max-w-[17em] text-3xl lg:text-[2.2em]`}>
            A fairer way to connect
            <br className="hidden lg:block" /> with trusted professionals
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:mt-[1em] lg:grid-cols-4 lg:gap-[3em]">
            {benefits.map(({ title, text, icon: Icon }) => (
              <div key={title}>
                <span className="grid size-11 place-items-center rounded-full bg-brand-green-soft text-trust-lime-ink lg:size-[3.2em]">
                  <Icon
                    className={`size-[1.7em] ${title === 'Better service quality' ? 'fill-brand-green' : ''}`}
                  />
                </span>
                <h3 className="mt-2 text-sm font-bold leading-tight lg:text-[1.02em]">{title}</h3>
                <p className="mt-2 max-w-[17em] text-xs leading-snug text-text-secondary lg:text-[0.95em]">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${panel} mt-5 lg:mt-[1.4em]`}>
          <Eyebrow>FAQ</Eyebrow>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className={`${heading} text-3xl lg:text-[2.2em]`}>Common questions</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary lg:text-[0.85em]">
                Still have questions?
              </span>
              <PricingContact />
            </div>
          </div>
          <PricingFaq />
        </section>

        <section className="relative mx-auto my-5 w-[calc(100%-2rem)] max-w-[1520px] overflow-hidden rounded-xl bg-brand-dark px-6 py-7 text-white lg:my-[1.2em] lg:w-[91%] lg:px-[2.5em] lg:py-[1.5em]">
          <Image
            src="/marketing/footer-background.png"
            alt=""
            fill
            sizes="100vw"
            className="pointer-events-none object-cover opacity-50"
          />
          <div className="relative grid items-center gap-6 lg:grid-cols-[50%_48%] lg:justify-between">
            <div>
              <Eyebrow dark>Get started today</Eyebrow>
              <h2 className={`${heading} mt-3 max-w-[16em] text-3xl lg:text-[2.2em]`}>
                Find the right technician
                <br className="hidden lg:block" /> and get your job done
              </h2>
              <p className="mt-2 text-sm text-white/85 lg:text-[1em]">
                No subscriptions. Clear pricing. Real results.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/create-wo"
                  className={`${focus} inline-flex min-h-11 items-center gap-3 rounded-lg bg-brand-green px-6 text-xs font-bold text-brand-dark lg:min-h-[3em] lg:text-[0.9em]`}
                >
                  Post a Job <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/technicians"
                  className={`${focus} inline-flex min-h-11 items-center rounded-lg border border-trust-lime/50 px-6 text-xs font-bold lg:min-h-[3em] lg:text-[0.9em]`}
                >
                  Browse Technicians
                </Link>
              </div>
            </div>
            <div className="relative py-4">
              <div
                aria-label="Illustrative technician community"
                className="flex -space-x-4 lg:-space-x-[1.1em]"
              >
                {['alex-rivera-v2', 'priya-shah-field-v3', 'marcus-lee-v2', 'daniel-carter-v2'].map(
                  (portrait) => (
                    <Image
                      key={portrait}
                      src={`/marketing/avatars/${portrait}.png`}
                      alt=""
                      width={100}
                      height={100}
                      className="size-16 rounded-full border-2 border-white object-cover lg:size-[5.8em]"
                    />
                  )
                )}
              </div>
              <p className="mt-3 text-xs text-white/80 lg:text-[0.85em]">
                Trusted professionals for the work that matters.
              </p>
              <p
                aria-hidden="true"
                className="absolute -right-[1em] top-[-0.5em] hidden -rotate-12 font-[family-name:'Comic_Sans_MS',cursive] text-[1em] leading-relaxed text-trust-lime lg:block"
              >
                Trusted professionals
                <br />
                for every job
                <CornerDownLeft className="mt-2 size-[2em] stroke-white/80" />
              </p>
            </div>
          </div>
        </section>
      </main>
      <PricingFooter />
    </div>
  );
}
