import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CircleCheck,
  ShieldCheck,
  MapPin,
  ArrowRight,
  MoreHorizontal,
  Navigation,
  Star,
  Monitor,
  HardHat,
  Server,
  BadgeCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  ChartNoAxesColumnIncreasing,
  Target,
  Zap,
  CornerUpLeft
} from 'lucide-react';
import { marketingLayoutScale } from './MarketingHero.styles';

const verificationItems = [
  { title: 'Identity verified', desc: 'Government ID checked' },
  { title: 'Background check', desc: 'National criminal database' },
  { title: 'Certifications confirmed', desc: 'Industry and employer verified' },
  { title: 'Safety training', desc: 'OSHA, site-specific and more' },
  { title: 'Ongoing monitoring', desc: 'Keep credentials up to date' }
];
const workHistory = [
  { title: 'Network Technician', company: 'Vertex IT Solutions', period: '2022 – Present' },
  { title: 'Field Support Technician', company: 'BrightPath Technologies', period: '2019 – 2022' },
  { title: 'IT Support Specialist', company: 'Summit Communications', period: '2017 – 2019' }
];
const badges = [
  { label: 'Identity Verified', icon: ShieldCheck },
  { label: 'CompTIA A+', icon: Monitor },
  { label: 'Background Check', icon: ShieldCheck },
  { label: 'OSHA 10', icon: HardHat },
  { label: 'Cisco CCNA', icon: Server }
];
const metrics = [
  { title: '92% job match', desc: 'Skills and location align', icon: Target },
  { title: '98% response rate', desc: 'Typically replies in < 1 hour', icon: Zap },
  {
    title: '186 completed jobs',
    desc: 'Across IT, cabling, and field support',
    icon: BriefcaseBusiness
  },
  { title: '4.9 out of 5 rating', desc: 'From verified clients', icon: Star }
];
const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green';
const panel = 'min-w-0 rounded-xl bg-surface-white/90 p-4 lg:rounded-[0.8em] lg:p-[1em]';
const iconCircle =
  'grid size-7 shrink-0 place-items-center rounded-full bg-brand-green-soft text-trust-lime-ink lg:size-[calc(var(--hero-unit)*2.3)]';

export function ComplianceTrustSection(): React.JSX.Element {
  return (
    <section
      id="compliance-trust"
      aria-labelledby="compliance-trust-title"
      className={`${marketingLayoutScale} relative mx-auto w-[calc(100%-2.5rem)] max-w-marketing-page overflow-hidden rounded-2xl bg-surface-green p-5 font-[family-name:Arial,Helvetica,sans-serif] text-text-primary sm:p-7 lg:w-[calc(var(--hero-unit)*89)] lg:rounded-[1.6em] lg:px-[2.7em] lg:pt-[1.6em] lg:pb-[1.5em] lg:text-[length:var(--hero-unit)]`}
    >
      <img
        src="/marketing/trust-orbit.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-16 w-72 rotate-45 opacity-15 lg:-top-[15em] lg:-right-[5em] lg:w-[25em]"
      />
      <p className="absolute top-[3em] right-[2.7em] hidden -rotate-6 font-[family-name:'Comic_Sans_MS',cursive] text-[0.85em] leading-tight text-trust-lime-ink/50 lg:block">
        Qualified people
        <br />
        for real work.
      </p>
      <div className="relative grid gap-5 lg:grid-cols-[31%_minmax(0,1fr)] lg:gap-x-[2.7em] lg:gap-y-[1em]">
        <header className="lg:col-start-2 lg:row-start-1">
          <span className="inline-flex items-center gap-[0.7em] rounded-full bg-surface-white px-[1em] py-[0.7em] text-[0.625rem] font-bold uppercase leading-none tracking-[0.04em] lg:text-[0.65em]">
            <span className="size-[0.75em] rounded-full bg-lifecycle-active" aria-hidden="true" />
            Compliance &amp; Trust
          </span>
          <h2
            id="compliance-trust-title"
            className="mt-3 font-[family-name:'FieldForge_Hero',Arial,sans-serif] text-3xl font-black leading-[1.08] tracking-[-0.025em] lg:mt-[0.35em] lg:text-[3.3em]"
          >
            Send people you can trust.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-[1.35] text-text-secondary lg:mt-[0.6em] lg:max-w-[43em] lg:text-[1.15em]">
            Credentials, certifications, work history, identity verification, and job-fit signals
            stay connected to every technician profile.
          </p>
        </header>

        <article
          aria-label="Marcus Lee verified technician profile"
          className="flex min-w-0 flex-col rounded-xl bg-surface-white p-4 shadow-sm lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-[1.5em] lg:rounded-[1em] lg:p-[1.4em]"
        >
          <div className="grid grid-cols-[40%_minmax(0,1fr)] items-start gap-3 lg:gap-[1.3em]">
            <div className="relative aspect-[0.74] overflow-hidden rounded-lg lg:rounded-[0.6em]">
              <Image
                src="/marketing/avatars/marcus-lee-v2.png"
                alt="Marcus Lee"
                fill
                sizes="(min-width: 1500px) 150px, (min-width: 1024px) 110px, 40vw"
                className="object-cover"
              />
              <span className="absolute bottom-[0.7em] left-[0.6em] inline-flex items-center gap-[0.4em] rounded-full bg-brand-green-soft px-[0.7em] py-[0.5em] text-[9px] font-medium lg:text-[0.65em]">
                <CircleCheck
                  className="size-[1.2em] fill-marketing-check text-white"
                  aria-hidden="true"
                />
                Verified
              </span>
            </div>
            <div className="min-w-0 pt-1 lg:pt-[0.5em]">
              <h3 className="text-lg font-bold leading-tight lg:text-[1.4em]">Marcus Lee</h3>
              <p className="mt-1.5 flex items-center gap-1 text-xs lg:mt-[0.6em] lg:text-[0.8em]">
                <Star className="size-[1.1em] fill-amber-400 text-amber-400" aria-hidden="true" />
                4.9 <span>(186 jobs)</span>
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs lg:mt-[0.8em] lg:text-[0.8em]">
                <MapPin className="size-[1em] shrink-0" aria-hidden="true" />
                3.2 mi away
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] lg:mt-[0.7em] lg:text-[0.75em]">
                <Navigation className="size-[1em] shrink-0" aria-hidden="true" />
                Available this week
              </p>
              <p className="mt-3 border-t border-border-soft pt-2 text-[11px] leading-[1.4] text-text-secondary lg:mt-[1.1em] lg:pt-[1em] lg:text-[0.7em]">
                Network and infrastructure technician with 6+ years of field experience. Reliable,
                detail-oriented, and safety focused.
              </p>
            </div>
          </div>
          <ul
            aria-label="Verified credentials"
            className="mt-5 grid grid-cols-2 gap-1.5 lg:mt-[2.2em] lg:gap-[0.5em]"
          >
            {badges.map(({ label, icon: Icon }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-full bg-brand-green-subtle px-2 py-1.5 text-[10px] lg:min-h-[2.8em] lg:gap-[0.8em] lg:px-[1em] lg:py-[0.4em] lg:text-[0.7em]"
              >
                <Icon className="size-[1.5em] shrink-0 text-trust-lime-ink" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-2 lg:mt-auto lg:gap-[0.7em] lg:pt-[1.5em]">
            <Link
              href="/technicians"
              className={`${focus} flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-surface-dark px-3 text-xs font-bold text-white hover:bg-brand-dark-hover lg:min-h-0 lg:rounded-[0.6em] lg:py-[1.1em] lg:text-[1em]`}
            >
              Invite to job <ArrowRight className="size-[1em]" aria-hidden="true" />
            </Link>
            <Link
              href="/technicians"
              aria-label="More about Marcus Lee"
              className={`${focus} grid size-11 place-items-center rounded-lg border border-border-soft lg:size-[3.2em] lg:rounded-[0.6em]`}
            >
              <MoreHorizontal className="size-[45%]" aria-hidden="true" />
            </Link>
          </div>
        </article>

        <div
          aria-label="Technician trust details"
          className="grid min-w-0 gap-3 md:grid-cols-3 lg:col-start-2 lg:row-start-2 lg:grid-cols-[29%_39%_minmax(0,1fr)] lg:gap-[0.7em]"
        >
          <section aria-labelledby="verification-title" className={panel}>
            <h3
              id="verification-title"
              className="mb-4 flex items-center gap-2 text-xs font-bold lg:mb-[1.3em] lg:gap-[0.75em] lg:text-[0.78em]"
            >
              <span className={iconCircle}>
                <ShieldCheck className="size-[55%]" aria-hidden="true" />
              </span>
              Verification &amp; Compliance
            </h3>
            <ul className="space-y-4 lg:space-y-[1em]">
              {verificationItems.map(({ title, desc }, index) => (
                <li
                  key={title}
                  className={`relative flex items-start gap-2 lg:gap-[1em] ${index < 4 ? "after:absolute after:top-[1.4em] after:left-[0.6em] after:h-[2.4em] after:border-l after:border-lifecycle-active-border after:content-['']" : ''}`}
                >
                  <CircleCheck
                    className="relative z-10 mt-0.5 size-4 shrink-0 rounded-full bg-surface-white fill-brand-green-active text-white lg:size-[1.4em]"
                    aria-hidden="true"
                  />
                  <div>
                    <h4 className="text-xs font-medium lg:text-[0.75em]">{title}</h4>
                    <p className="text-[11px] leading-tight text-text-secondary lg:text-[0.65em]">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="credentials-title" className={panel}>
            <div className="mb-4 flex items-center justify-between gap-1 lg:mb-[1.2em]">
              <h3
                id="credentials-title"
                className="flex items-center gap-2 text-xs font-bold lg:gap-[0.7em] lg:text-[0.78em]"
              >
                <span className={iconCircle}>
                  <ClipboardCheck className="size-[55%]" aria-hidden="true" />
                </span>
                Credentials &amp; Experience
              </h3>
              <Link
                href="/technicians"
                className={`${focus} flex min-h-11 shrink-0 items-center gap-1 text-[10px] text-trust-lime-ink lg:min-h-0 lg:text-[0.65em]`}
              >
                View all <ArrowRight className="size-[1em]" aria-hidden="true" />
              </Link>
            </div>
            <h4 className="flex items-center gap-2 text-xs font-medium lg:text-[0.8em]">
              <BadgeCheck className="size-[1.1em]" aria-hidden="true" />
              Certifications
            </h4>
            <ul className="mt-2 ml-5 flex flex-wrap gap-1 lg:mt-[0.6em] lg:ml-[1.8em] lg:gap-[0.4em]">
              {['Cisco CCNA', 'CompTIA A+', 'OSHA 10', 'First Aid/CPR'].map((cert) => (
                <li
                  key={cert}
                  className="rounded-full bg-brand-green-subtle px-[1.2em] py-[0.5em] text-[10px] leading-none lg:text-[0.65em]"
                >
                  {cert}
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border-soft pt-3 lg:mt-[1em] lg:pt-[1em]">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-medium lg:mb-[0.8em] lg:text-[0.8em]">
                <BriefcaseBusiness className="size-[1.1em]" aria-hidden="true" />
                Work History
              </h4>
              <ul className="space-y-2 pl-3 lg:space-y-[0.6em] lg:pl-[1.8em]">
                {workHistory.map(({ title, company, period }) => (
                  <li key={title} className="list-disc text-[11px] lg:text-[0.7em]">
                    <div className="flex flex-wrap items-baseline justify-between gap-1">
                      <h5 className="font-medium">{title}</h5>
                      <span className="text-[9px] text-text-secondary lg:text-[0.8em]">
                        {period}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-secondary lg:text-[0.9em]">{company}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section aria-labelledby="reliability-title" className={panel}>
            <h3
              id="reliability-title"
              className="mb-2 flex items-center gap-2 text-xs font-bold lg:mb-[0.8em] lg:gap-[0.7em] lg:text-[0.8em]"
            >
              <span className={iconCircle}>
                <ChartNoAxesColumnIncreasing className="size-[55%]" aria-hidden="true" />
              </span>
              Job Fit &amp; Reliability
            </h3>
            <ul className="divide-y divide-border-soft">
              {metrics.map(({ title, desc, icon: Icon }) => (
                <li
                  key={title}
                  className="flex items-center gap-2 py-3 lg:min-h-[4.2em] lg:gap-[0.8em] lg:py-[0.6em]"
                >
                  <span className={iconCircle}>
                    <Icon className="size-[55%]" aria-hidden="true" />
                  </span>
                  <div>
                    <h4 className="text-xs font-medium lg:text-[0.8em]">{title}</h4>
                    <p className="text-[11px] leading-tight text-text-secondary lg:text-[0.7em]">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <footer className="relative mt-5 flex items-center justify-between gap-4 lg:mt-[1.6em]">
        <div className="flex items-center gap-3 lg:gap-[1.6em]">
          <div className="flex shrink-0 -space-x-2 lg:-space-x-[0.6em]">
            {['marcus-lee-v2', 'priya-shah-v2', 'daniel-carter-v2', 'alex-rivera-v2'].map(
              (image) => (
                <Image
                  key={image}
                  src={`/marketing/avatars/${image}.png`}
                  alt=""
                  width={40}
                  height={40}
                  className="size-7 rounded-full border-2 border-surface-white object-cover lg:size-[2.5em]"
                />
              )
            )}
          </div>
          <div>
            <p className="text-xs font-medium lg:text-[0.8em]">
              Trusted by leading facilities, IT and field operations teams
            </p>
            <p className="mt-0.5 text-[11px] text-text-secondary lg:text-[0.75em]">
              10,000+ verified technicians nationwide
            </p>
          </div>
        </div>
        <p className="hidden -rotate-6 items-start gap-[1em] font-[family-name:'Comic_Sans_MS',cursive] text-[0.8em] leading-tight text-trust-lime-ink lg:flex">
          <CornerUpLeft className="size-[3em] stroke-1" aria-hidden="true" />
          <span>
            Real people.
            <br />
            Real qualifications.
            <br />
            Real results.
          </span>
        </p>
      </footer>
    </section>
  );
}
