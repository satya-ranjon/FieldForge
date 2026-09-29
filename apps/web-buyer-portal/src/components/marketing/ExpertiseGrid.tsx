import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { marketingLayoutScale } from './MarketingHero.styles';
import { ArrowRight } from 'lucide-react';

const row1Cards = [
  {
    category: 'IT INFRASTRUCTURE',
    title: 'Networking',
    desc: 'Switches, routers and enterprise network support.',
    img: '/marketing/service-networking-v2.png',
    href: '/solutions'
  },
  {
    category: 'CABLING & INFRASTRUCTURE',
    title: 'Structured Cabling',
    desc: 'Cable runs, rack cleanup and infrastructure work.',
    img: '/marketing/service-cabling-v2.png',
    href: '/solutions'
  },
  {
    category: 'RETAIL & HOSPITALITY',
    title: 'Point of Sale',
    desc: 'Retail POS installs and service calls.',
    img: '/marketing/service-pos-v2.png',
    href: '/solutions'
  }
];

const row2Cards = [
  {
    category: 'SECURITY',
    title: 'Security & Surveillance',
    desc: 'Cameras, NVRs and site security systems.',
    img: '/marketing/service-security-v2.png',
    href: '/solutions'
  },
  {
    category: 'COMPUTER HARDWARE',
    title: 'Computer Hardware',
    desc: 'On-site IT hardware repair and refresh.',
    img: '/marketing/service-hardware-v2.png',
    href: '/solutions'
  },
  {
    category: 'AUDIO VISUAL',
    title: 'AV & Digital Signage',
    desc: 'Displays, signage and workplace media systems.',
    img: '/marketing/service-av-v2.png',
    href: '/solutions'
  },
  {
    category: 'ENTERPRISE',
    title: 'Enterprise Locations',
    desc: 'Distributed field service across business sites.',
    img: '/marketing/service-enterprise-map-v2.png',
    href: '/solutions'
  }
];

function ExpertiseCard({
  card,
  featured = false
}: {
  card: (typeof row1Cards)[number];
  featured?: boolean;
}): React.JSX.Element {
  return (
    <Link
      href={card.href}
      aria-label={`Explore ${card.title}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl bg-surface-white transition hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marketing-check lg:rounded-[0.8em]"
    >
      <div
        className={`relative w-full overflow-hidden bg-surface-soft ${featured ? 'aspect-[2.6] lg:aspect-auto lg:h-[11.3em]' : 'aspect-[2] lg:aspect-auto lg:h-[10.8em]'}`}
      >
        <Image
          src={card.img}
          alt={card.title}
          fill
          sizes={
            featured
              ? '(min-width: 1500px) 460px, (min-width: 1200px) 380px, (min-width: 768px) 300px, 90vw'
              : '(min-width: 1500px) 340px, (min-width: 1200px) 280px, (min-width: 1024px) 215px, (min-width: 640px) 45vw, 90vw'
          }
          className="object-cover object-center transition duration-300 group-hover:scale-105 motion-reduce:transform-none"
        />
        <span className="absolute top-3 left-3 rounded-full bg-surface-white/95 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.02em] text-text-primary lg:top-[1.5em] lg:left-[1.5em] lg:px-[1.5em] lg:py-[0.75em] lg:text-[0.65em]">
          {card.category}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3 lg:gap-[1em] lg:px-[1.4em] lg:py-[1em]">
        <div className="min-w-0">
          <h3 className="text-sm font-bold leading-tight lg:text-[1.15em]">{card.title}</h3>
          <p className="mt-1 text-xs leading-[1.35] text-text-secondary lg:mt-[0.3em] lg:text-[0.85em]">
            {card.desc}
          </p>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-green-subtle text-brand-dark transition group-hover:bg-brand-green lg:size-[2.8em]">
          <ArrowRight className="size-4 lg:size-[1.3em]" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function ExpertiseGrid(): React.JSX.Element {
  return (
    <section
      id="expertise"
      aria-labelledby="expertise-title"
      className={`${marketingLayoutScale} mx-auto w-[calc(100%-2.5rem)] font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:w-[calc(var(--hero-unit)*89)] lg:text-[length:var(--hero-unit)]`}
    >
      <header className="mx-auto mb-5 text-center lg:mb-[1.7em]">
        <h2
          id="expertise-title"
          className="font-[family-name:'FieldForge_Hero',Arial,sans-serif] text-3xl font-black leading-[1.1] tracking-[-0.025em] lg:text-[2.8em]"
        >
          Expertise for the work your business needs.
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-[1.3] text-text-secondary lg:mt-[0.5em] lg:max-w-[46em] lg:text-[1.2em]">
          From infrastructure to installations, FieldForge connects you with skilled technicians
          across the IT and physical tech space.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:gap-[1.4em]">
        {row1Cards.map((card) => (
          <ExpertiseCard key={card.title} card={card} featured />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-[1.1em] lg:grid-cols-4 lg:gap-[1.2em]">
        {row2Cards.map((card) => (
          <ExpertiseCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
}
