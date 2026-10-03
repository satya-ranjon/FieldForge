import { marketingPanelFrame } from '../../components/marketing/MarketingHero.styles';
import { MarketingNavbar } from '../../components/marketing/MarketingNavbar';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import React from 'react';
import type { Metadata } from 'next';
import {
  Activity,
  ArrowRight,
  Building2,
  CreditCard,
  Eye,
  FileCheck2,
  MapPin,
  Navigation,
  ShieldCheck,
  UserRound,
  Users
} from 'lucide-react';
import {
  PlatformDevicePreview,
  PlatformWorkOrders
} from '../../components/platform/PlatformDashboardPreview';
import {
  PlatformEyebrow,
  PlatformIcon,
  PlatformLink,
  platformFrame,
  platformHeading
} from '../../components/platform/PlatformPrimitives';
import { MarketingBrandMark } from '../../components/marketing/MarketingHeroArtwork';

export const metadata: Metadata = {
  title: 'Platform | FieldForge',
  description:
    'One connected platform to find technicians, dispatch work, track execution, verify proof, and release payment.'
};
const capabilities = [
  {
    title: 'Technician Marketplace',
    description: 'Find and engage qualified technicians on demand.',
    icon: Users
  },
  {
    title: 'Smart Dispatch',
    description: 'Match the right technician to the right work.',
    icon: Navigation
  },
  { title: 'Live Tracking', description: 'See real-time progress from anywhere.', icon: MapPin },
  {
    title: 'Proof & Verification',
    description: 'Validate work with photos, notes and sign-offs.',
    icon: FileCheck2
  },
  {
    title: 'Payments',
    description: 'Release payments securely, after completion.',
    icon: CreditCard
  }
];
const benefits = [
  {
    title: 'Operational visibility',
    description: 'Track every work order across your organization.',
    icon: Eye
  },
  {
    title: 'Real-time activity',
    description: 'See status updates as work happens in the field.',
    icon: Activity
  },
  {
    title: 'Controlled approvals',
    description: 'Review proof and approve before payment.',
    icon: ShieldCheck
  }
];

export default function PlatformPage(): React.JSX.Element {
  return (
    <div className="min-h-screen overflow-x-clip bg-white font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:text-[clamp(12px,1.02vw,16px)]">
      <MarketingNavbar compact activePage="/platform" />
      <main>
        <section
          aria-labelledby="platform-title"
          className="bg-surface-marketing pb-10 pt-8 lg:pb-[2em] lg:pt-[0.7em]"
        >
          <div
            className={`${platformFrame} grid items-center gap-8 [&>*]:min-w-0 lg:grid-cols-[36%_64%] lg:gap-0`}
          >
            <div className="relative z-10 lg:py-[2em]">
              <PlatformEyebrow>Platform</PlatformEyebrow>
              <h1
                id="platform-title"
                className={`${platformHeading} mt-5 max-w-xl text-5xl sm:text-6xl lg:mt-[0.35em] lg:text-[3.8em]`}
              >
                One platform for
                <br className="hidden xl:block" />{' '}
                <span className="text-marketing-heading-accent">connected</span> field operations.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-[1.35] text-text-secondary lg:mt-[1.1em] lg:text-[1.2em]">
                FieldForge helps businesses find technicians, dispatch work, track execution, verify
                proof, and release payment in one operational workflow.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 lg:mt-[1.6em] lg:gap-[1em]">
                <PlatformLink href="/solutions">Explore solutions</PlatformLink>
                <PlatformLink href="/operations" secondary>
                  View command center
                </PlatformLink>
              </div>
            </div>
            <div className="min-w-0 lg:ml-[1.5em]">
              <PlatformDevicePreview />
            </div>
          </div>
        </section>

        <section
          id="capabilities"
          aria-labelledby="capabilities-title"
          className="bg-surface-marketing/35 py-10 lg:py-[2em]"
        >
          <div
            className={`${platformFrame} grid gap-7 [&>*]:min-w-0 lg:grid-cols-[32%_68%] lg:gap-0`}
          >
            <div className="lg:pr-[2em] lg:pt-[0.6em]">
              <PlatformEyebrow>Core capabilities</PlatformEyebrow>
              <h2
                id="capabilities-title"
                className={`${platformHeading} mt-5 max-w-md text-3xl lg:mt-[0.6em] lg:text-[2.3em]`}
              >
                Everything you need
                <br className="hidden lg:block" /> for field operations.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-[1.5] text-text-secondary lg:text-[1em]">
                A complete platform to source talent, move work forward, and close the loop — built
                for how field work really happens.
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-[0.8em]">
              {capabilities.map(({ title, description, icon }) => (
                <li
                  key={title}
                  className="rounded-xl border border-border-soft bg-white px-5 py-6 shadow-sm shadow-brand-green/5 lg:px-[1.3em] lg:py-[1.5em]"
                >
                  <PlatformIcon icon={icon} />
                  <h3 className="mt-4 text-base font-bold leading-tight lg:mt-[1.3em] lg:text-[1em]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-[1.4] text-text-secondary lg:text-[0.95em]">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="ecosystem" aria-labelledby="ecosystem-title" className="py-10 lg:py-[2.3em]">
          <div
            className={`${platformFrame} grid items-center gap-10 lg:grid-cols-[32%_68%] lg:gap-0`}
          >
            <div className="lg:pr-[2em]">
              <PlatformEyebrow>A connected ecosystem</PlatformEyebrow>
              <h2
                id="ecosystem-title"
                className={`${platformHeading} mt-5 max-w-md text-3xl lg:mt-[0.6em] lg:text-[2.3em]`}
              >
                Built to bring buyers and technicians together.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-[1.5] text-text-secondary lg:text-[1em]">
                FieldForge connects companies that need work done with skilled technicians across
                the country. From request to payment, everyone stays aligned in a single platform.
              </p>
              <div className="mt-5">
                <PlatformLink href="/marketing#lifecycle">See how it works</PlatformLink>
              </div>
            </div>
            <div
              aria-label="Businesses and technicians connected through FieldForge"
              className="relative grid gap-5 pt-14 sm:grid-cols-[1fr_0.8fr_1fr] sm:items-center sm:gap-8 lg:gap-[4em] lg:pl-[1em] lg:pt-[6em]"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-[12%] top-5 hidden h-[8em] rounded-t-[6em] border-t border-x border-brand-green/50 sm:block"
              />
              <p className="absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface-green px-6 py-3 text-[9px] font-bold uppercase tracking-[0.13em] lg:top-[1.5em] lg:text-[0.75em]">
                Same platform. Real progress.
              </p>
              <div className="relative rounded-xl border border-border-default bg-white p-5 text-center shadow-sm lg:p-[1.3em]">
                <span className="flex justify-center">
                  <PlatformIcon icon={Building2} />
                </span>
                <h3 className="mt-3 font-bold lg:text-[1.05em]">Businesses</h3>
                <p className="mt-1 text-sm leading-[1.4] text-text-secondary lg:text-[0.95em]">
                  Post work, get matched, and manage execution.
                </p>
                <ArrowRight
                  aria-hidden="true"
                  className="absolute -bottom-8 left-1/2 size-6 -translate-x-1/2 rotate-90 text-text-muted sm:-right-7 sm:bottom-auto sm:left-auto sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2 sm:rotate-0 lg:-right-[3em]"
                />
              </div>
              <div className="relative py-3 text-center">
                <span className="mx-auto block size-16 lg:size-[4.4em]">
                  <MarketingBrandMark />
                </span>
                <h3 className="mt-3 text-xl font-bold lg:text-[1.35em]">FieldForge</h3>
                <p className="mt-2 text-sm leading-[1.4] text-text-secondary lg:text-[1em]">
                  Connects. Coordinates.
                  <br />
                  Keeps work moving.
                </p>
                <ArrowRight
                  aria-hidden="true"
                  className="absolute -bottom-6 left-1/2 size-6 -translate-x-1/2 rotate-90 text-text-muted sm:-right-7 sm:bottom-auto sm:left-auto sm:top-1/3 sm:translate-x-0 sm:rotate-0 lg:-right-[3em]"
                />
              </div>
              <div className="rounded-xl border border-border-default bg-white p-5 text-center shadow-sm lg:p-[1.3em]">
                <span className="flex justify-center">
                  <PlatformIcon icon={UserRound} />
                </span>
                <h3 className="mt-3 font-bold lg:text-[1.05em]">Technicians</h3>
                <p className="mt-1 text-sm leading-[1.4] text-text-secondary lg:text-[0.95em]">
                  Find work, complete
                  <br />
                  jobs, and get paid.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="platform-command-center"
          aria-labelledby="platform-command-title"
          className="py-10 lg:pb-[1.6em] lg:pt-[1.7em]"
        >
          <div className={`${platformFrame} grid gap-8 lg:grid-cols-[29%_71%] lg:gap-0`}>
            <div className="lg:pr-[3em] lg:pt-[1.2em]">
              <PlatformEyebrow>Command center</PlatformEyebrow>
              <h2
                id="platform-command-title"
                className={`${platformHeading} mt-5 text-3xl lg:mt-[0.6em] lg:text-[2.3em]`}
              >
                Total visibility.
                <br />
                From anywhere.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-[1.5] text-text-secondary lg:text-[1em]">
                Manage work orders, track technician activity, monitor progress, and keep projects
                on schedule — all from a single, intuitive workspace.
              </p>
              <div className="mt-5">
                <PlatformLink href="/operations">Explore the command center</PlatformLink>
              </div>
            </div>
            <div className="min-w-0">
              <PlatformWorkOrders />
              <ul
                aria-label="Command center capabilities"
                className="mt-5 grid gap-5 sm:grid-cols-3 sm:gap-0 lg:mt-[1.5em]"
              >
                {benefits.map(({ title, description, icon }) => (
                  <li
                    key={title}
                    className="flex gap-3 sm:px-4 sm:not-first:border-l sm:border-border-default sm:first:pl-0 lg:gap-[1.2em] lg:px-[1.8em]"
                  >
                    <PlatformIcon icon={icon} />
                    <div>
                      <h3 className="text-sm font-bold lg:text-[0.95em]">{title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-text-secondary lg:text-[0.95em]">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="platform-cta-title"
          className={`${marketingPanelFrame} max-lg:w-[calc(100%-2.5rem)] mb-4 mt-2 rounded-2xl bg-surface-marketing px-6 py-7 lg:mb-[1em] lg:px-[3em] lg:py-[2em]`}
        >
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <h2 id="platform-cta-title" className={`${platformHeading} text-2xl lg:text-[2em]`}>
                See how FieldForge fits your operations.
              </h2>
              <p className="mt-2 text-sm text-text-secondary lg:text-[1em]">
                Get a personalized walkthrough of the platform and see what it can do for your team.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <PlatformLink href="/solutions">Explore solutions</PlatformLink>
              <PlatformLink href="/operations" secondary>
                View command center
              </PlatformLink>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
