import { marketingPanelFrame } from '../../components/marketing/MarketingHero.styles';
import { MarketingNavbar } from '../../components/marketing/MarketingNavbar';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BedDouble,
  Building2,
  Hospital,
  Network,
  ShoppingCart,
  Truck,
  Utensils,
  CornerDownRight,
  type LucideIcon
} from 'lucide-react';
import { TalkToSales } from '../../components/solutions/SolutionsChrome';
import {
  PlatformEyebrow as Eyebrow,
  platformFrame as frame,
  platformHeading as heading,
  platformFocus as focus
} from '../../components/platform/PlatformPrimitives';
import { IndustrySignup } from '../../components/industries/IndustrySignup';

export const metadata: Metadata = {
  title: 'Industries | FieldForge',
  description:
    'Field service support for retail, restaurants, hospitality, offices, warehouses, healthcare, property management, and multi-location businesses.'
};

const industries: {
  title: string;
  description: string;
  image: string;
  alt: string;
  icon: LucideIcon;
  href: string;
}[] = [
  {
    title: 'Retail & POS',
    description: 'Keep your stores and systems running with on-demand technicians.',
    image: 'retail',
    alt: 'Modern retail store with a point-of-sale checkout counter',
    icon: ShoppingCart,
    href: '/solutions#marketplace'
  },
  {
    title: 'Restaurants & Cafés',
    description: 'Minimize downtime and keep your locations serving customers.',
    image: 'restaurant',
    alt: 'Bright restaurant with warm wooden tables and tan seating',
    icon: Utensils,
    href: '/solutions#dispatch'
  },
  {
    title: 'Hospitality',
    description: 'Maintain guest experiences with reliable technical support.',
    image: 'hospitality',
    alt: 'Contemporary hotel room with a white bed and warm neutral furnishings',
    icon: BedDouble,
    href: '/solutions#marketplace'
  },
  {
    title: 'Offices & Corporate',
    description: 'Get fast help for IT, facilities, and workspace equipment.',
    image: 'office',
    alt: 'Modern corporate office with workstations and floor-to-ceiling windows',
    icon: Building2,
    href: '/solutions#dispatch'
  },
  {
    title: 'Warehouses & Logistics',
    description: 'Keep operations moving with reliable field support.',
    image: 'warehouse',
    alt: 'Warehouse aisle with tall orange racks and neatly stored boxes',
    icon: Truck,
    href: '/solutions#dispatch'
  },
  {
    title: 'Healthcare & Clinics',
    description: 'Ensure critical systems stay up and running.',
    image: 'healthcare',
    alt: 'Bright clinic with blue examination seating and medical equipment',
    icon: Hospital,
    href: '/solutions#marketplace'
  },
  {
    title: 'Facilities & Property Management',
    description: 'Simplify maintenance across multiple locations.',
    image: 'property',
    alt: 'Commercial property with a tan stone facade and large blue windows',
    icon: Building2,
    href: '/solutions#proof-payments'
  },
  {
    title: 'Multi-location Chains',
    description: 'Standardize service across all your locations.',
    image: 'chains',
    alt: 'A row of coordinated retail storefronts at a shopping center',
    icon: Network,
    href: '/solutions#dispatch'
  }
];

function IndustryHero(): React.JSX.Element {
  return (
    <div
      aria-label="Field service across industries"
      className="relative mx-auto aspect-[1.45] w-full max-w-[650px] text-[clamp(10px,1.1vw,18px)] lg:max-w-none lg:text-[1em]"
    >
      <div className="absolute left-[17%] top-[4%] h-[82%] w-[54%] overflow-hidden rounded-[1.4em] shadow-sm [clip-path:polygon(0_9%,100%_0,100%_100%,0_91%)]">
        <Image
          src="/marketing/industries-rooftop.png"
          alt="Commercial rooftop HVAC equipment overlooking the city"
          fill
          sizes="(max-width: 1023px) 50vw, 26vw"
          priority
          className="object-cover object-center"
        />
      </div>
      <div className="absolute right-0 top-[18%] h-[43%] w-[27%] overflow-hidden rounded-[1em] [clip-path:polygon(0_12%,100%_0,100%_82%,0_100%)]">
        <Image
          src="/marketing/industries-technician.png"
          alt="Field technician servicing commercial equipment"
          fill
          sizes="(max-width: 1023px) 25vw, 13vw"
          priority
          className="object-cover object-[55%_center]"
        />
      </div>
      <div className="absolute left-[50%] top-[48%] flex w-[30%] items-center gap-[0.65em] rounded-[0.9em] border border-border-soft bg-white p-[0.9em] shadow-sm">
        <span className="grid size-[2.7em] shrink-0 place-items-center rounded-lg bg-brand-green-soft text-trust-lime-ink">
          <Building2 className="size-[1.8em]" />
        </span>
        <p className="text-[0.75em] font-bold leading-snug">
          Across multiple
          <br />
          industries
        </p>
      </div>
      <div className="absolute bottom-[4%] right-0 flex h-[35%] w-[27%] flex-col justify-center rounded-[1.2em] bg-surface-green px-[1.8em] py-[1.4em]">
        <p className="text-[0.95em] font-bold leading-[1.5]">
          One platform.
          <br />
          Limitless
          <br />
          possibilities.
        </p>
        <span aria-hidden="true" className="mt-[0.9em] h-0.5 w-[2.1em] bg-brand-green" />
      </div>
      <div
        aria-hidden="true"
        className="absolute -left-[5%] top-[37%] rotate-[-14deg] font-[family-name:'Comic_Sans_MS',cursive] text-[1.3em] leading-snug text-text-secondary"
      >
        Real work.
        <br />
        Real impact.
        <CornerDownRight className="ml-auto mt-[0.4em] size-[2em] rotate-[20deg] stroke-brand-green stroke-[1.3]" />
      </div>
    </div>
  );
}

export default function IndustriesPage(): React.JSX.Element {
  return (
    <div className="min-h-screen overflow-x-clip bg-white font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:text-[clamp(12px,1.13vw,18px)]">
      <MarketingNavbar compact activePage="/industries" />
      <main>
        <section className="bg-surface-soft/35">
          <div
            className={`${frame} grid items-center gap-8 py-10 lg:min-h-[29.5em] lg:grid-cols-[49%_48%] lg:justify-between lg:gap-0 lg:py-[2em]`}
          >
            <div className="relative z-10 pb-2">
              <Eyebrow>Industries</Eyebrow>
              <h1
                className={`${heading} mt-5 max-w-[12em] text-[clamp(36px,5.3vw,58px)] lg:mt-[0.55em] lg:text-[3.5em]`}
              >
                Built for the industries that keep the world{' '}
                <span className="text-marketing-heading-accent">running.</span>
              </h1>
              <p className="mt-6 max-w-[34em] text-base leading-[1.45] text-text-secondary lg:mt-[1.5em] lg:text-[1.17em]">
                FieldForge helps businesses across industries find, dispatch, and manage field
                technicians — faster, simpler, and more reliably.
                <br />
                Different challenges. Same solution.
              </p>
            </div>
            <IndustryHero />
          </div>
        </section>

        <section id="industries" className={`${frame} py-10 lg:pb-[3.5em] lg:pt-[2.2em]`}>
          <Eyebrow>Industries we serve</Eyebrow>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 lg:mt-[0.85em] lg:flex-nowrap lg:gap-[3em]">
            <h2 className={`${heading} text-3xl lg:whitespace-nowrap lg:text-[2.35em]`}>
              Every industry. A more reliable operation.
            </h2>
            <p className="max-w-[28em] text-sm leading-[1.45] text-text-secondary lg:text-[0.97em]">
              From single-site operations to multi-location enterprises, FieldForge adapts to the
              unique needs of your industry.
            </p>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:mt-[2.4em] lg:grid-cols-4 lg:gap-x-[1.9em] lg:gap-y-[1.6em]">
            {industries.map(({ title, description, image, alt, icon: Icon, href }) => (
              <article
                key={image}
                className="group flex flex-col rounded-xl border border-border-soft bg-white p-1 shadow-xs transition hover:border-border-strong hover:shadow-sm lg:p-[0.3em]"
              >
                <div className="relative aspect-[1.85] overflow-hidden rounded-lg">
                  <Image
                    src={`/marketing/industries-${image}.png`}
                    alt={alt}
                    fill
                    sizes="(max-width: 639px) 90vw, (max-width: 1023px) 43vw, 22vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
                  />
                </div>
                <div className="relative z-10 -mt-6 flex flex-1 flex-col px-4 pb-3 lg:-mt-[1.65em] lg:px-[1.15em] lg:pb-[0.7em]">
                  <span className="mb-2 grid size-14 place-items-center rounded-2xl border-4 border-white bg-brand-green-subtle text-trust-lime-ink lg:mb-[0.4em] lg:size-[4.2em]">
                    <Icon className="size-7 stroke-[2] lg:size-[2em]" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-bold leading-[1.2] tracking-tight lg:text-[1.12em]">
                    {title}
                  </h3>
                  <p className="mb-2 mt-2 max-w-[15em] text-sm leading-[1.4] text-text-secondary lg:mb-[0.8em] lg:mt-[0.6em] lg:min-h-[4.2em] lg:text-[1.03em]">
                    {description}
                  </p>
                  <Link
                    href={href}
                    aria-label={`Learn more about ${title}`}
                    className={`${focus} mt-auto inline-flex min-h-11 w-fit items-center gap-3 text-sm font-bold lg:text-[0.95em]`}
                  >
                    Learn more <ArrowRight className="size-[1.2em]" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="industry-cta-title"
          className={`${marketingPanelFrame} relative mb-5 overflow-hidden rounded-2xl bg-surface-marketing lg:py-[2.8em]`}
        >
          <Image
            src="/marketing/industries-cta-route.png"
            alt=""
            fill
            sizes="100vw"
            className="pointer-events-none object-contain object-right opacity-50"
          />
          <div className="relative grid items-center gap-8 p-7 lg:mx-auto lg:w-[91.3%] lg:grid-cols-[49%_51%] lg:gap-0 lg:p-0">
            <div>
              <Eyebrow>Ready to get started?</Eyebrow>
              <h2
                id="industry-cta-title"
                className={`${heading} mt-4 max-w-[14em] text-3xl lg:mt-[0.4em] lg:text-[2.35em]`}
              >
                Find the right technicians for your industry.
              </h2>
              <p className="mt-4 max-w-[27em] text-sm leading-snug text-text-secondary lg:mt-[0.9em] lg:text-[1.12em]">
                Join thousands of businesses already keeping their operations powered with
                FieldForge.
              </p>
              <div className="mt-5 flex flex-wrap gap-4 lg:mt-[1.2em] lg:gap-[1.3em]">
                <IndustrySignup />
                <TalkToSales />
              </div>
            </div>
            <div className="relative flex min-h-32 items-end justify-center gap-4 pb-5 pr-0 lg:min-h-[14.5em] lg:gap-[1.2em] lg:pb-[2em] lg:pr-[8.3em]">
              <div
                aria-label="Illustrative customer community"
                className="flex shrink-0 -space-x-3 lg:-space-x-[0.7em]"
              >
                {['marcus-lee-v2', 'daniel-carter-v2', 'alex-rivera-v2', 'priya-shah-field-v3'].map(
                  (portrait) => (
                    <Image
                      key={portrait}
                      src={`/marketing/avatars/${portrait}.png`}
                      alt=""
                      width={80}
                      height={80}
                      className="size-10 rounded-full border-2 border-white object-cover lg:size-[3.3em]"
                    />
                  )
                )}
                <span className="grid size-10 place-items-center rounded-full border-2 border-white bg-trust-lime text-xs font-bold lg:size-[3.3em] lg:text-[1em]">
                  +1K
                </span>
              </div>
              <p className="pb-1 text-xs leading-relaxed text-text-secondary lg:text-[0.93em]">
                Trusted by businesses
                <br />
                across industries
              </p>
              <p
                aria-hidden="true"
                className="absolute -right-[1em] top-[0.6em] hidden rotate-[-14deg] text-center font-[family-name:'Comic_Sans_MS',cursive] text-[1.4em] leading-[1.4] text-text-secondary lg:block"
              >
                Different
                <br />
                industries.
                <br />
                Same reliable
                <br />
                solution.
                <span className="ml-auto mr-3 mt-2 block h-0.5 w-[2.7em] -rotate-12 bg-brand-green" />
              </p>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
