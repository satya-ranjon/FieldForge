import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  List,
  Camera,
  Signature,
  FileText,
  CircleCheck,
  ChevronDown,
  Navigation,
  Zap,
  Eye,
  ShieldCheck,
  ChartNoAxesColumnIncreasing,
  ArrowRight,
  ArrowLeft,
  Menu,
  Circle,
  Signal,
  Wifi,
  BatteryFull,
  Clock3,
  CornerDownRight
} from 'lucide-react';
import { marketingLayoutScale } from './MarketingHero.styles';

const deliverables = [
  { icon: MapPin, title: 'Live Location', desc: 'Track technicians in real time' },
  { icon: List, title: 'Job Progress', desc: 'See each step as it happens' },
  { icon: Camera, title: 'Photo Proof', desc: 'Images from the site' },
  { icon: Signature, title: 'Digital Signature', desc: 'Customer confirmation' },
  { icon: FileText, title: 'Instant Reports', desc: 'Field data, no delays' }
];
const benefits = [
  { icon: Zap, title: 'Faster Resolution', desc: 'Solve issues quickly' },
  { icon: Eye, title: 'Full Visibility', desc: 'Real-time field insights' },
  { icon: ShieldCheck, title: 'Trusted & Compliant', desc: 'Verified work & proof' },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: 'Higher Productivity',
    desc: 'More jobs, less downtime'
  }
];
const focus =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green';
const action = `${focus} flex min-h-11 items-center justify-center gap-1 rounded-full px-2 py-[0.85em] text-[0.72em] font-bold lg:min-h-0`;
const phone =
  'relative rounded-[2.2em] border-[0.3em] border-brand-dark bg-surface-white p-[0.65em] text-text-primary shadow-lg ring-2 ring-trust-lime';

function AssignmentPhone(): React.JSX.Element {
  return (
    <div
      aria-label="Technician assignment preview"
      className={`${phone} mx-auto flex w-[16.5em] max-w-full flex-col lg:h-[29em] lg:w-full`}
    >
      <div className="relative mb-[0.9em] flex items-center justify-between text-[0.6em] font-bold">
        <span>9:41</span>
        <span
          className="absolute top-0 left-1/2 h-[1.5em] w-[6em] -translate-x-1/2 rounded-full bg-text-primary"
          aria-hidden="true"
        />
        <span className="flex gap-[0.3em]" aria-hidden="true">
          <Signal className="size-[1em]" />
          <Wifi className="size-[1em]" />
          <BatteryFull className="size-[1.1em]" />
        </span>
      </div>
      <div className="mb-[1em] flex items-center justify-between text-[0.8em] font-bold">
        <span className="flex items-center gap-1">
          <Zap className="size-[1em] rounded bg-lifecycle-active" aria-hidden="true" />
          TechCare
        </span>
        <Menu className="size-[1.2em]" aria-hidden="true" />
      </div>
      <div className="flex items-center justify-between rounded-[0.8em] bg-surface-dark-secondary p-[1em] text-white">
        <div>
          <p className="text-[0.65em] text-white/70">Current Job</p>
          <p className="mt-0.5 text-[1.2em] font-bold">En Route</p>
          <p className="mt-0.5 text-[0.65em] text-white/80">ETA 12 min · 2.8 km</p>
        </div>
        <Navigation
          className="size-[2.5em] rounded-full bg-white/5 p-[0.5em] text-brand-green"
          aria-hidden="true"
        />
      </div>
      <ol className="my-[1.4em] ml-[0.5em] space-y-[1.2em] lg:my-[1em] lg:flex lg:flex-1 lg:flex-col lg:justify-between lg:space-y-0">
        {['Job Assigned', 'En Route', 'Arrived on Site', 'Work in Progress', 'Complete Job'].map(
          (step, index) => (
            <li
              key={step}
              className={`relative flex items-start gap-[0.8em] text-[0.75em] ${index === 1 ? 'font-bold text-trust-lime-ink' : 'text-text-secondary'} ${index < 4 ? "after:absolute after:top-[1.2em] after:left-[0.45em] after:h-[2.4em] after:border-l after:border-border-strong after:content-['']" : ''}`}
            >
              <Circle
                className={`relative z-10 mt-0.5 size-[1.1em] shrink-0 bg-surface-white ${index === 1 ? 'fill-brand-green text-marketing-check' : index === 0 ? 'text-marketing-status-green' : 'text-border-strong'}`}
                aria-hidden="true"
              />
              <div>
                {step}
                {index < 2 && (
                  <span className="block text-[0.8em] font-normal">
                    {index === 0 ? '10:14 AM' : '10:32 AM'}
                  </span>
                )}
              </div>
            </li>
          )
        )}
      </ol>
      <Link href="/dashboard" className={`${action} bg-lifecycle-active text-brand-dark`}>
        View Job Details <ArrowRight className="size-[1em]" aria-hidden="true" />
      </Link>
    </div>
  );
}

function CompletionPhone(): React.JSX.Element {
  return (
    <div className="relative mx-auto mt-14 w-[15em] max-w-full lg:mt-0 lg:w-full">
      <div
        aria-label="Job completion notification"
        className="absolute -top-[6em] left-1/2 flex w-[19em] max-w-[calc(100vw-3rem)] -translate-x-1/2 items-start gap-[0.8em] rounded-[1.3em] bg-surface-white p-[1.2em] shadow-sm lg:-top-[5.7em]"
      >
        <CircleCheck
          className="size-[2.4em] shrink-0 rounded-full bg-brand-green-soft p-[0.3em] text-green-700"
          aria-hidden="true"
        />
        <div className="flex-1">
          <div className="flex justify-between gap-1">
            <strong className="text-[0.75em]">Job Completed!</strong>
            <span className="text-[0.6em] text-text-secondary">2m ago</span>
          </div>
          <p className="mt-0.5 text-[0.7em] leading-[1.3] text-text-secondary">
            Priya Shah has completed the job at 1200 Market St.
          </p>
        </div>
      </div>
      <div aria-label="Completed job summary preview" className={`${phone} rounded-[1.8em]`}>
        <div className="flex items-center justify-between px-[0.4em] py-[0.5em] text-[0.75em] font-bold">
          <ArrowLeft className="size-[1em]" aria-hidden="true" />
          Job Summary
          <Menu className="size-[1em]" aria-hidden="true" />
        </div>
        <div className="py-[1.8em] text-center">
          <CircleCheck
            className="mx-auto size-[2em] fill-green-600 text-white"
            aria-hidden="true"
          />
          <h3 className="mt-[0.7em] text-[1.1em] font-bold">Completed</h3>
          <p className="mt-1 text-[0.65em] text-text-secondary">Today, 12:41 PM</p>
        </div>
        <ul className="space-y-[1.4em] rounded-[0.9em] bg-surface-soft p-[0.8em]">
          {['Arrived on Site', 'Work Completed', 'Customer Signature'].map((label, index) => (
            <li key={label} className="flex items-start gap-[0.5em]">
              <CircleCheck
                className="size-[1.3em] shrink-0 fill-marketing-check text-white"
                aria-hidden="true"
              />
              <div>
                <h4 className="text-[0.72em] font-bold">{label}</h4>
                <p className="text-[0.65em] text-text-secondary">
                  {['10:24 AM', '12:10 PM', '12:14 PM'][index]}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/audit" className={`${action} mt-[1em] bg-surface-dark-secondary text-white`}>
          View Report <ArrowRight className="size-[1em]" aria-hidden="true" />
        </Link>
        <Link href="/dashboard" className={`${action} mt-[0.5em] bg-status-neutral-soft`}>
          Add Note
        </Link>
      </div>
    </div>
  );
}

export function FieldOperationsSection(): React.JSX.Element {
  return (
    <section
      id="field-operations"
      aria-labelledby="field-operations-title"
      className={`${marketingLayoutScale} relative mx-auto w-[calc(100%-2.5rem)] max-w-marketing-page pt-8 pb-6 font-[family-name:Arial,Helvetica,sans-serif] text-sm text-text-primary lg:w-[calc(var(--hero-unit)*89)] lg:pt-[2em] lg:pb-[2em] lg:text-[length:var(--hero-unit)]`}
    >
      <header className="mx-auto max-w-3xl text-center lg:max-w-[62em]">
        <span className="inline-flex items-center gap-[0.7em] rounded-full bg-surface-white px-[1.1em] py-[0.7em] text-[0.7em] font-bold uppercase shadow-xs">
          <span className="size-[0.75em] rounded-full bg-marketing-check" aria-hidden="true" />
          Field operations
        </span>
        <h2
          id="field-operations-title"
          className="mt-3 text-3xl font-bold leading-[1.08] tracking-[-0.025em] lg:mt-[0.4em] lg:text-[2.7em]"
        >
          <span className="block">Know what is happening in the field —</span>
          <span className="relative inline-block text-green-800">
            then prove it.
            <img
              src="/marketing/hero-underline.png"
              alt=""
              aria-hidden="true"
              className="absolute -bottom-[0.15em] left-0 h-[0.12em] w-full"
            />
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-[1.4] text-text-secondary lg:mt-[1.2em] lg:max-w-[38em] lg:text-[1.05em]">
          Get real-time updates from the field, track technician location, job progress, photos,
          signatures and more — all in one place.
        </p>
      </header>
      <div className="relative mt-8 grid items-end gap-8 md:grid-cols-2 lg:mt-[1.5em] lg:grid-cols-[17%_41%_16%_16%] lg:gap-[3.333%]">
        <p className="absolute -top-[5em] -left-[2em] hidden -rotate-12 text-center font-[family-name:'Comic_Sans_MS',cursive] text-[1em] text-text-secondary lg:block">
          From assignment
          <br />
          to completion
          <CornerDownRight
            className="ml-auto size-[2.5em] rotate-12 stroke-1 text-marketing-check"
            aria-hidden="true"
          />
        </p>
        <AssignmentPhone />
        <div
          aria-label="Live technician dashboard preview"
          className="min-w-0 rounded-2xl bg-surface-white p-3 shadow-sm lg:rounded-[1.3em] lg:p-[1em]"
        >
          <div className="mb-[1em] flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-[0.5em] text-[0.85em] font-bold">
              <span className="size-[0.55em] rounded-full bg-marketing-check" aria-hidden="true" />
              Live Technicians{' '}
              <span className="rounded-full bg-brand-green-soft px-[0.5em] py-[0.25em]">12</span>
            </h3>
            <Link
              href="/technicians"
              className={`${focus} flex min-h-11 items-center gap-[1em] rounded-full border border-border-soft px-[1em] text-[0.6em] lg:min-h-0 lg:py-[0.5em]`}
            >
              All Technicians
              <ChevronDown className="size-[1em]" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-[1.8fr_1fr] gap-2 lg:gap-[0.8em]">
            <div className="relative min-h-60 overflow-hidden rounded-lg lg:min-h-[23em]">
              <Image
                src="/marketing/map-field-operations-v2.png"
                alt="Map showing technician locations, job statuses, and a network issue"
                fill
                sizes="(min-width: 1500px) 360px, (min-width: 1024px) 240px, 50vw"
                className="bg-surface-soft object-contain lg:object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-col rounded-lg bg-surface-soft p-1.5 lg:p-[0.6em]">
              <div className="relative mb-[0.7em] aspect-[1.8] overflow-hidden rounded-lg">
                <Image
                  src="/marketing/photo-server-rack-v2.png"
                  alt="Server racks at the job site"
                  fill
                  sizes="(min-width: 1500px) 190px, 120px"
                  className="object-cover"
                />
                <span className="absolute right-1 bottom-1 rounded-full bg-surface-white px-[0.6em] text-[0.6em]">
                  Live
                </span>
              </div>
              <h4 className="text-[0.8em] font-bold">Site Visit</h4>
              <p className="text-[0.7em] text-text-secondary">1200 Market St, NY</p>
              <div className="mt-[1.2em] flex items-center gap-[0.5em]">
                <Image
                  src="/marketing/avatars/priya-shah-field-v3.png"
                  alt="Priya Shah"
                  width={96}
                  height={96}
                  className="size-[1.8em] rounded-full object-cover"
                />
                <div className="text-[0.7em]">
                  <p className="text-text-secondary">Technician</p>
                  <p className="font-bold">Priya Shah</p>
                </div>
              </div>
              <div className="mt-[1.3em] flex items-center gap-[0.6em]">
                <CircleCheck
                  className="size-[1.7em] rounded-full bg-brand-green-soft p-[0.3em] text-green-700"
                  aria-hidden="true"
                />
                <div className="text-[0.7em]">
                  <p className="text-text-secondary">Status</p>
                  <p className="font-bold text-green-700">On Site</p>
                </div>
              </div>
              <div className="mt-[1.3em] mb-[1em] flex items-center gap-[0.6em]">
                <Clock3
                  className="size-[1.7em] rounded-full bg-brand-green-soft p-[0.3em] text-green-700"
                  aria-hidden="true"
                />
                <div className="text-[0.7em]">
                  <p className="text-text-secondary">Started</p>
                  <p className="font-bold">10:24 AM</p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className={`${action} mt-auto bg-surface-dark-secondary text-white`}
              >
                View Details <ArrowRight className="size-[1em]" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
        <ul
          aria-label="Field operation capabilities"
          className="grid grid-cols-2 gap-4 md:grid-cols-1 lg:min-h-[26em] lg:content-between lg:gap-[1em] lg:pb-[0.6em]"
        >
          {deliverables.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex items-start gap-2 lg:gap-[1em]">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-green-soft text-trust-lime-ink lg:size-[3.2em]">
                <Icon className="size-[50%] stroke-[2.3]" aria-hidden="true" />
              </span>
              <div className="pt-0.5">
                <h3 className="text-xs font-bold lg:text-[0.8em]">{title}</h3>
                <p className="mt-0.5 text-[11px] leading-tight text-text-secondary lg:text-[0.8em]">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <CompletionPhone />
      </div>
      <ul
        aria-label="Field operations benefits"
        className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-surface-white/75 p-5 shadow-sm lg:mt-[2em] lg:w-[95%] lg:grid-cols-4 lg:gap-0 lg:rounded-[1.8em] lg:py-[1.5em] lg:px-[2em]"
      >
        {benefits.map(({ icon: Icon, title, desc }, index) => (
          <li
            key={title}
            className={`flex items-center gap-3 lg:justify-center lg:gap-[1.2em] ${index ? 'lg:border-l lg:border-border-default' : ''}`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-green-soft text-trust-lime-ink lg:size-[3.3em]">
              <Icon className="size-[50%] stroke-[2.5]" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-xs font-bold lg:text-[0.95em]">{title}</h3>
              <p className="mt-0.5 text-[11px] text-text-secondary lg:text-[0.85em]">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
