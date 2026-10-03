import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Wrench,
  BadgeCheck,
  CalendarDays,
  Star,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  Navigation,
  Clock3,
  CornerDownRight
} from 'lucide-react';
import { marketingLayoutScale } from './MarketingHero.styles';

const technicians = [
  {
    name: 'Priya Shah',
    image: 'priya-shah-v2',
    rating: '4.9',
    reviews: 221,
    jobs: 480,
    city: 'San Jose, CA',
    distance: '12 mi away',
    tags: ['POS Systems', 'IT Hardware', 'CompTIA A+', 'Cisco CCNA'],
    position: 'lg:left-[2%] lg:top-[29%] lg:w-[24.5%] lg:min-h-[15em]'
  },
  {
    name: 'Marcus Lee',
    image: 'marcus-lee-v2',
    rating: '4.9',
    reviews: 126,
    jobs: 320,
    city: 'Austin, TX',
    distance: '3.2 mi away',
    tags: ['Cisco CCNA', 'CompTIA A+', 'Structured Cabling', 'OSHA 10'],
    position:
      'order-first sm:col-span-2 lg:left-[28.5%] lg:top-[9.5%] lg:w-[37.5%] lg:min-h-[27em]',
    featured: true
  },
  {
    name: 'Daniel Carter',
    image: 'daniel-carter-v2',
    rating: '4.8',
    reviews: 98,
    jobs: 210,
    city: 'Dallas, TX',
    distance: '8 mi away',
    tags: ['Security Systems', 'OSHA 10', 'Access Control', 'Network Setup'],
    position: 'lg:left-[70%] lg:top-[6%] lg:w-[26%] lg:min-h-[14.5em]',
    delayed: true
  },
  {
    name: 'Alex Rivera',
    image: 'alex-rivera-v2',
    rating: '4.7',
    reviews: 64,
    jobs: 150,
    city: 'Orlando, FL',
    distance: '25 mi away',
    tags: ['IT Hardware', 'Structured Cabling', 'CompTIA A+', 'OSHA 10'],
    position: 'lg:left-[74%] lg:top-[47%] lg:w-[24%] lg:min-h-[13.5em]'
  }
];

const filters = [
  { label: 'Location', icon: MapPin },
  { label: 'Skill', icon: Wrench },
  { label: 'Certification', icon: BadgeCheck },
  { label: 'Availability', icon: CalendarDays },
  { label: 'Rating', icon: Star }
];
const benefits = [
  { label: 'Verified professionals', icon: Users },
  { label: 'Validated credentials', icon: ShieldCheck },
  { label: 'Faster job completion', icon: Zap }
];
const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-green';

function TechnicianCard({ technician }: { technician: (typeof technicians)[number] }) {
  const { name, image, rating, reviews, jobs, city, distance, tags, featured, delayed } =
    technician;
  return (
    <article
      aria-label={name}
      className={`flex flex-col rounded-xl bg-surface-white p-4 shadow-sm lg:absolute ${technician.position} ${featured ? 'z-10 lg:rounded-[1.5em] lg:p-[1.65em] lg:shadow-xl' : 'lg:rounded-[1.1em] lg:p-[1.15em]'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="relative shrink-0">
          <Image
            src={`/marketing/avatars/${image}.png`}
            alt=""
            width={1254}
            height={1254}
            sizes={
              featured
                ? '(min-width: 1500px) 112px, (min-width: 1200px) 96px, 80px'
                : '(min-width: 1500px) 64px, 48px'
            }
            className={`rounded-full object-cover ${featured ? 'size-20 lg:size-[7.1em]' : 'size-12 lg:size-[3.9em]'}`}
          />
          {!delayed && (
            <span
              className={`absolute right-0 bottom-0 rounded-full border-2 border-surface-white bg-status-success ${featured ? 'size-3.5 lg:size-[1.15em]' : 'size-2.5 lg:size-[0.8em]'}`}
            />
          )}
        </div>
        <span
          className={`mt-0.5 inline-flex items-center gap-[0.4em] whitespace-nowrap rounded-full px-[0.9em] py-[0.5em] text-[10px] font-bold lg:text-[0.65em] ${delayed ? 'bg-surface-soft text-text-secondary' : 'bg-brand-green-soft text-brand-dark'}`}
        >
          {delayed ? (
            <Clock3 className="size-[1em]" aria-hidden="true" />
          ) : (
            <span className="size-[0.65em] rounded-full bg-status-success" aria-hidden="true" />
          )}
          {delayed ? 'In 2 days' : 'Available'}
        </span>
      </div>
      <h3
        className={`mt-2 font-bold leading-tight ${featured ? 'text-xl lg:mt-[0.55em] lg:text-[1.5em]' : 'text-sm lg:mt-[0.55em] lg:text-[0.95em]'}`}
      >
        {name}
      </h3>
      <div
        className={`${featured ? 'lg:text-[0.95em]' : 'lg:text-[0.65em]'} mt-1 flex flex-wrap items-center gap-[0.45em] whitespace-nowrap text-[11px] lg:flex-nowrap text-text-secondary`}
      >
        <span className="flex items-center gap-[0.25em]">
          <Star className="size-[1em] fill-amber-400 text-amber-400" aria-hidden="true" />
          {rating}
        </span>
        <span>({reviews} reviews)</span>
        <span className="ml-[0.35em] flex items-center gap-[0.5em] border-l border-border-default pl-[0.7em]">
          <BriefcaseBusiness className="size-[1.1em]" aria-hidden="true" />
          {jobs} jobs
        </span>
      </div>
      <div
        className={`${featured ? 'lg:text-[0.95em]' : 'lg:text-[0.65em]'} mt-[0.6em] flex flex-wrap items-center gap-[0.5em] whitespace-nowrap text-[11px] lg:flex-nowrap text-text-secondary`}
      >
        <MapPin className="size-[1.1em]" aria-hidden="true" />
        {city}
        <span className="ml-[0.35em] flex items-center gap-[0.4em] border-l border-border-default pl-[0.7em]">
          <Navigation className="size-[1em]" aria-hidden="true" />
          {distance}
        </span>
      </div>
      <ul
        className={`${featured ? 'mt-3 border-t border-border-soft pt-3 lg:mt-[1em] lg:gap-[0.5em] lg:pt-[0.8em] lg:text-[0.8em]' : 'mt-2 lg:mt-[1em] lg:text-[0.65em]'} flex flex-wrap gap-1 text-[11px]`}
      >
        {tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-brand-green-subtle px-[1em] py-[0.45em] leading-none"
          >
            {tag}
          </li>
        ))}
      </ul>
      {featured && (
        <div className="mt-4 flex gap-2 lg:mt-auto lg:pt-[1.2em] lg:gap-[0.8em]">
          <Link
            href="/technicians"
            className={`${focus} flex min-h-11 flex-1 items-center justify-center gap-[0.8em] rounded-full bg-text-primary px-[1em] text-[11px] text-white hover:bg-brand-dark-hover lg:min-h-0 lg:py-[1.1em] lg:text-[0.8em]`}
          >
            Invite to job{' '}
            <ArrowRight
              className="h-[1em] w-[1.6em] rounded-full bg-brand-green text-brand-dark"
              aria-hidden="true"
            />
          </Link>
          <Link
            href="/technicians"
            className={`${focus} flex min-h-11 items-center justify-center rounded-full border border-border-soft bg-surface-soft px-[1.5em] text-[11px] hover:bg-brand-green-subtle lg:min-h-0 lg:text-[0.8em]`}
          >
            View profile
          </Link>
        </div>
      )}
    </article>
  );
}

export function TechnicianMarketplace(): React.JSX.Element {
  return (
    <section
      id="technician-marketplace"
      aria-labelledby="marketplace-title"
      className={`${marketingLayoutScale} relative mx-auto grid w-[calc(100%-2.5rem)] max-w-marketing-page gap-8 py-6 font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:w-[calc(var(--hero-unit)*89)] lg:grid-cols-[30%_minmax(0,1fr)] lg:items-center lg:gap-[3.3em] lg:py-[3em] lg:text-[length:var(--hero-unit)]`}
    >
      <div>
        <span className="inline-flex items-center gap-[0.6em] rounded-full border border-border-soft bg-surface-white px-[1em] py-[0.7em] text-[0.625rem] font-bold uppercase leading-none lg:text-[0.7em]">
          <span className="size-[0.65em] rounded-full bg-brand-green" aria-hidden="true" />
          Technician marketplace
        </span>
        <h2
          id="marketplace-title"
          className="mt-4 font-[family-name:'FieldForge_Hero',Arial,sans-serif] text-4xl font-black leading-[1.02] tracking-[-0.025em] lg:mt-[0.45em] lg:text-[3.9em]"
        >
          <span className="block">The right</span>
          <span className="block">technician for</span>
          <span className="block">every job.</span>
        </h2>
        <p className="mt-4 max-w-sm text-base leading-[1.25] text-text-secondary lg:mt-[1.2em] lg:text-[1.25em]">
          Find qualified professionals based on location, experience, ratings and verified
          credentials. Get the right tech on site, faster.
        </p>
        <Link
          href="/technicians"
          className={`${focus} mt-5 inline-flex min-h-11 items-center gap-[1.2em] rounded-full bg-text-primary px-[1.5em] text-sm text-white hover:bg-brand-dark-hover lg:mt-[1.6em] lg:min-h-0 lg:py-[1em] lg:text-[1.05em]`}
        >
          Explore Technician Network
          <ArrowRight
            className="h-[1em] w-[1.7em] rounded-full bg-brand-green text-brand-dark"
            aria-hidden="true"
          />
        </Link>
        <ul className="mt-6 grid grid-cols-3 gap-3 lg:mt-[2.6em] lg:gap-[1.2em]">
          {benefits.map(({ label, icon: Icon }) => (
            <li key={label} className="flex items-center gap-2 lg:gap-[0.8em]">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-green-soft text-trust-lime-ink lg:size-[2.2em]">
                <Icon className="size-[1.1em]" aria-hidden="true" />
              </span>
              <span className="text-[10px] leading-tight text-text-secondary lg:text-[0.8em]">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div
        aria-label="Technician network preview"
        className="relative overflow-hidden rounded-2xl bg-surface-green p-4 lg:h-[38.5em] lg:rounded-[1.4em] lg:p-0"
      >
        <img
          src="/marketing/marketplace-map.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
        <div className="relative mb-5 w-fit -rotate-[8deg] text-base leading-tight text-text-secondary lg:absolute lg:top-[7%] lg:left-[5%] lg:m-0 lg:text-[1.3em] font-[family-name:'Comic_Sans_MS',cursive]">
          Skilled technicians.
          <br />
          Where you need them.
          <CornerDownRight className="ml-auto size-8 stroke-1 lg:size-[2.8em]" aria-hidden="true" />
        </div>
        <div className="relative grid gap-4 sm:grid-cols-2 lg:static lg:block">
          {technicians.map((technician) => (
            <TechnicianCard key={technician.name} technician={technician} />
          ))}
        </div>
        <nav
          aria-label="Browse technician network"
          className="relative mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-surface-white p-3 lg:absolute lg:right-[3%] lg:bottom-[4%] lg:left-[3%] lg:mt-0 lg:flex-nowrap lg:gap-0 lg:rounded-[1em] lg:px-[1.1em] lg:py-[1em]"
        >
          {filters.map(({ label, icon: Icon }, index) => (
            <Link
              href="/technicians"
              key={label}
              aria-label={`Browse technicians by ${label.toLowerCase()}`}
              className={`${focus} flex min-h-11 items-center gap-1.5 px-2 text-xs text-text-secondary hover:text-brand-dark lg:min-h-0 lg:gap-[0.65em] lg:px-[1.2em] lg:text-[0.8em] ${index ? 'lg:border-l lg:border-border-default' : 'lg:pl-0'}`}
            >
              <Icon className="size-[1.5em]" aria-hidden="true" />
              {label}
              <ChevronDown className="size-[1em]" aria-hidden="true" />
            </Link>
          ))}
          <span className="ml-auto whitespace-nowrap rounded-full bg-brand-green-soft px-[1.1em] py-[0.8em] text-[10px] font-medium lg:text-[0.75em]">
            150+ technicians
          </span>
        </nav>
      </div>
    </section>
  );
}
