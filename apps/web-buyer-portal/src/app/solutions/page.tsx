import { marketingPanelFrame } from '../../components/marketing/MarketingHero.styles';
import { MarketingNavbar } from '../../components/marketing/MarketingNavbar';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  ChartNoAxesColumnIncreasing,
  CreditCard,
  FileText,
  MapPin,
  Monitor,
  Network,
  Send,
  Shield,
  ShoppingCart,
  Workflow,
  type LucideIcon
} from 'lucide-react';
import {
  PlatformEyebrow as Eyebrow,
  PlatformIcon,
  PlatformLink,
  platformFrame as frame,
  platformHeading as heading,
  platformFocus as focus
} from '../../components/platform/PlatformPrimitives';
import { TalkToSales } from '../../components/solutions/SolutionsChrome';
import {
  SolutionsHeroPreview,
  MarketplacePreview,
  DispatchPreview,
  ProofPreview
} from '../../components/solutions/SolutionsPreviews';

export const metadata: Metadata = {
  title: 'Solutions | FieldForge',
  description:
    'Connect your field operations with technician sourcing, dispatch, work tracking, proof, and payments in one workflow.'
};

const solutions: { icon: LucideIcon; title: string; description: string; href: string }[] = [
  {
    icon: Workflow,
    title: 'Technician Marketplace',
    description: 'Find and hire qualified technicians, fast.',
    href: '#marketplace'
  },
  {
    icon: Send,
    title: 'Smart Dispatch',
    description: 'Match the right technician to the right job.',
    href: '#dispatch'
  },
  {
    icon: MapPin,
    title: 'Live Work Tracking',
    description: 'Get real-time visibility from anywhere.',
    href: '#dispatch'
  },
  {
    icon: FileText,
    title: 'Proof & Verification',
    description: 'Validate completed work with photos, notes and checklists.',
    href: '#proof-payments'
  },
  {
    icon: CreditCard,
    title: 'Payments & Approvals',
    description: 'Automate approvals and release payments with confidence.',
    href: '#proof-payments'
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: 'Command Center',
    description: 'See everything across locations, teams and vendors.',
    href: '/platform#platform-command-center'
  }
];
const industries = [
  { title: 'Retail & POS', icon: ShoppingCart },
  { title: 'Networking', icon: Network },
  { title: 'Security', icon: Shield },
  { title: 'AV & Signage', icon: Monitor },
  { title: 'Facilities', icon: Building2 },
  { title: 'Multi-location Operations', icon: Workflow }
];

function LearnMore({ href, label }: { href: string; label: string }): React.JSX.Element {
  return (
    <Link
      href={href}
      aria-label={`Learn more about ${label}`}
      className={`${focus} mt-3 inline-flex min-h-11 items-center gap-3 text-sm font-bold lg:mt-[0.8em] lg:text-[0.95em]`}
    >
      Learn more <ArrowRight className="size-[1.3em]" />
    </Link>
  );
}

export default function SolutionsPage(): React.JSX.Element {
  return (
    <div className="min-h-screen overflow-x-clip bg-white font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:text-[clamp(12px,1.02vw,16px)]">
      <MarketingNavbar compact activePage="/solutions" />
      <main>
        <section className="bg-linear-to-b from-white to-surface-marketing/65">
          <div
            className={`${frame} grid items-center gap-8 py-10 lg:grid-cols-[40%_60%] lg:gap-0 lg:py-[1.4em]`}
          >
            <div className="relative z-10 lg:py-[1.4em]">
              <Eyebrow>Solutions</Eyebrow>
              <h1
                className={`${heading} mt-4 max-w-[12em] text-[clamp(36px,5.3vw,56px)] lg:mt-[0.35em] lg:text-[3.65em]`}
              >
                Solutions built for <span className="text-marketing-heading-accent">connected</span>{' '}
                field operations.
              </h1>
              <p className="mt-5 max-w-[32em] text-sm leading-[1.5] text-text-secondary lg:mt-[1em] lg:text-[1.08em]">
                FieldForge helps businesses find technicians, dispatch work, track execution, verify
                proof, and release payment — all in one seamless workflow.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 lg:mt-[1.4em] lg:gap-[1.2em]">
                <PlatformLink href="/platform">Explore platform</PlatformLink>
                <TalkToSales />
              </div>
            </div>
            <SolutionsHeroPreview />
          </div>
        </section>

        <section
          id="our-solutions"
          className={`${frame} scroll-mt-8 py-9 lg:pb-[1.7em] lg:pt-[1.5em]`}
        >
          <Eyebrow>Our solutions</Eyebrow>
          <h2 className={`${heading} mt-3 text-3xl lg:mt-[0.4em] lg:text-[2.45em]`}>
            Everything you need for field success.
          </h2>
          <p className="mt-2 max-w-[46em] text-sm leading-relaxed text-text-secondary lg:text-[1.05em]">
            A complete set of solutions to power your field operations, from finding the right
            people to final payment.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 lg:mt-[1.3em] lg:grid-cols-6 lg:gap-[0.8em]">
            {solutions.map(({ icon, title, description, href }) => (
              <Link
                href={href}
                key={title}
                className={`${focus} group rounded-lg border border-border-soft bg-white p-4 shadow-xs transition hover:border-brand-green lg:min-h-[13.9em] lg:p-[1.15em]`}
              >
                <PlatformIcon icon={icon} />
                <h3 className="mb-2 mt-4 text-sm font-bold leading-tight lg:mb-[0.5em] lg:mt-[1em] lg:text-[1.03em]">
                  {title}
                </h3>
                <p className="text-xs leading-[1.45] text-text-secondary lg:text-[0.92em]">
                  {description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section
          id="marketplace"
          className="scroll-mt-6 border-y border-border-soft/60 bg-surface-marketing/60"
        >
          <div
            className={`${frame} grid items-center gap-8 py-9 lg:grid-cols-[36%_58%] lg:justify-between lg:gap-0 lg:py-[1.65em]`}
          >
            <div className="lg:max-w-[25em]">
              <Eyebrow>Technician marketplace</Eyebrow>
              <h2 className={`${heading} mt-3 max-w-[10em] text-3xl lg:text-[2.5em]`}>
                Find the right technicians faster.
              </h2>
              <p className="mt-3 text-sm leading-[1.5] text-text-secondary lg:text-[1.05em]">
                Access a large network of qualified, vetted technicians with the skills and
                experience you need. Fill open jobs quickly and keep your operations moving.
              </p>
              <LearnMore href="/technicians" label="the technician marketplace" />
            </div>
            <MarketplacePreview />
          </div>
        </section>

        <section
          id="dispatch"
          className={`${frame} grid scroll-mt-6 items-center gap-8 py-9 lg:grid-cols-[50%_42%] lg:justify-between lg:gap-0 lg:py-[1.5em]`}
        >
          <div className="order-2 lg:order-1">
            <DispatchPreview />
          </div>
          <div className="order-1 lg:order-2 lg:max-w-[29em]">
            <Eyebrow>Smart dispatch</Eyebrow>
            <h2 className={`${heading} mt-3 max-w-[11em] text-3xl lg:text-[2.5em]`}>
              Dispatch and track every job in real time.
            </h2>
            <p className="mt-3 text-sm leading-[1.5] text-text-secondary lg:text-[1.05em]">
              Automatically match jobs with the best technicians, track progress as work happens,
              and keep everyone in the loop — from field to office.
            </p>
            <LearnMore href="/operations" label="smart dispatch" />
          </div>
        </section>

        <section
          id="proof-payments"
          className="scroll-mt-6 border-y border-border-soft/60 bg-surface-marketing/60"
        >
          <div
            className={`${frame} grid items-center gap-8 py-9 lg:grid-cols-[36%_58%] lg:justify-between lg:gap-0 lg:py-[1.5em]`}
          >
            <div className="lg:max-w-[27em]">
              <Eyebrow>Proof & payments</Eyebrow>
              <h2 className={`${heading} mt-3 max-w-[10em] text-3xl lg:text-[2.5em]`}>
                Verify work and release payment with confidence.
              </h2>
              <p className="mt-3 text-sm leading-[1.5] text-text-secondary lg:text-[1.05em]">
                Ensure every job is completed as expected with photos, notes and checklists.
                Automate approvals and payments to keep your business moving.
              </p>
              <LearnMore href="/billing" label="proof and payments" />
            </div>
            <ProofPreview />
          </div>
        </section>

        <section
          className={`${frame} grid items-center gap-5 py-7 lg:grid-cols-[36%_62%] lg:justify-between lg:gap-0 lg:py-[1.2em]`}
        >
          <div>
            <Eyebrow>Built for your industry</Eyebrow>
            <h2 className={`${heading} mt-3 text-2xl lg:mt-[0.4em] lg:text-[2em]`}>
              Trusted across industries.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary lg:text-[0.95em]">
              The same powerful solutions, tailored to the unique needs of your business.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {industries.map(({ title, icon: Icon }) => (
              <Link
                key={title}
                href="/industries"
                className={`${focus} flex flex-col items-center justify-start gap-2 rounded-lg border border-border-soft bg-white px-2 py-4 text-center text-xs font-bold hover:bg-surface-green lg:min-h-[7em] lg:gap-[0.8em] lg:py-[1em] lg:text-[0.82em]`}
              >
                <span className="rounded-full bg-surface-green p-1">
                  <Icon className="size-6 lg:size-[2em]" />
                </span>
                {title}
              </Link>
            ))}
          </div>
        </section>

        <section
          className={`${marketingPanelFrame} relative mb-3 overflow-hidden rounded-2xl bg-surface-green/70 px-5 py-7 lg:px-[2.8em] lg:py-[1.2em]`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[11em] left-[54%] h-[17em] w-[20em] rotate-[-25deg] rounded-[50%] border border-brand-green/30"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div>
              <Eyebrow>Ready to connect your operations?</Eyebrow>
              <h2 className={`${heading} mt-2 text-2xl lg:text-[2em]`}>
                See FieldForge in action.
              </h2>
              <p className="mt-1 text-sm text-text-secondary lg:text-[0.98em]">
                Discover how our solutions can help you operate faster, simpler and more reliably.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:gap-[1.3em]">
              <PlatformLink href="/platform">Explore platform</PlatformLink>
              <TalkToSales />
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
