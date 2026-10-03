'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  MapPin,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Star,
  UserRound,
  Users
} from 'lucide-react';
import { StatusBadge } from '@fieldforge/ui';
import { PlatformBrand, platformFocus as focus } from '../platform/PlatformPrimitives';
import {
  findSolutionTechnicians,
  solutionJobs,
  getSolutionJobs,
  type DispatchView,
  type SolutionJob
} from './solutions-preview-model';

function Avatar({
  name,
  portrait,
  className = ''
}: {
  name: string;
  portrait: string;
  className?: string;
}): React.JSX.Element {
  return (
    <Image
      src={`/marketing/avatars/${portrait}.png`}
      alt={name}
      width={80}
      height={80}
      className={`size-[3em] shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
function JobStatus({ status = 'In Progress' }: { status?: string }): React.JSX.Element {
  return (
    <StatusBadge
      status={status}
      showPulse={false}
      className={`h-auto! rounded-md! border-0! px-[0.7em]! py-[0.35em]! text-[0.85em]! normal-case! tracking-normal! ${status === 'In Progress' ? 'bg-status-info-soft! text-blue-700!' : 'bg-status-warning-soft! text-amber-800!'}`}
    />
  );
}

function StreetMap({ hero = false }: { hero?: boolean }): React.JSX.Element {
  const markers = [
    [18, 28, 'green'],
    [42, 16, 'blue'],
    [71, 35, 'green'],
    [28, 65, 'green'],
    [58, 77, 'blue'],
    [84, 66, 'green'],
    [56, 42, 'red']
  ] as const;
  return (
    <div
      aria-label="Illustrative field operations map"
      className="absolute inset-0 overflow-hidden rounded-[0.7em] bg-surface-green"
    >
      <Image
        src="/marketing/platform-street-map.png"
        alt=""
        fill
        sizes="(max-width: 1023px) 85vw, 40vw"
        className="object-cover"
        priority={hero}
      />
      {markers.map(([x, y, color], index) => (
        <span
          key={index}
          className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-sm"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <MapPin
            aria-hidden="true"
            className={`size-[2.1em] stroke-white stroke-[1.8] ${color === 'blue' ? 'fill-status-info' : color === 'red' ? 'fill-status-danger' : 'fill-status-success'}`}
          />
        </span>
      ))}
    </div>
  );
}

const sidebar = [
  ['Overview', LayoutDashboard],
  ['Dispatch', Send],
  ['Work Orders', ClipboardList],
  ['Technicians', Users],
  ['Customers', UserRound],
  ['Payments', CreditCard],
  ['Reports', ChartNoAxesColumnIncreasing],
  ['Settings', Settings]
] as const;

export function SolutionsHeroPreview(): React.JSX.Element {
  return (
    <div
      aria-label="Solutions laptop preview"
      className="relative mx-auto aspect-[1.75] w-full max-w-[820px] text-[clamp(7px,1.2vw,13px)] lg:max-w-none lg:text-[0.85em]"
    >
      <div
        aria-hidden="true"
        className="absolute -left-[3%] top-[2%] h-[88%] w-full rotate-[-8deg] rounded-[48%] bg-surface-green"
      />
      <p
        aria-hidden="true"
        className="absolute -right-[6%] top-[9%] hidden rotate-[-12deg] text-center font-[family-name:'Comic_Sans_MS',cursive] text-[1.35em] leading-tight text-text-secondary xl:block"
      >
        From dispatch
        <br />
        to done.<span className="ml-5 block rotate-[-15deg] text-[2em] text-brand-green">⤵</span>
      </p>
      <div className="absolute inset-x-[6%] bottom-[7%] top-[7%] rounded-t-[1.4em] border-[0.55em] border-text-heading bg-text-heading p-[0.35em] shadow-lg ring-2 ring-text-secondary/50">
        <div className="grid h-full grid-cols-[23%_77%] overflow-hidden rounded-[0.3em] bg-white">
          <aside className="bg-brand-dark px-[1em] py-[1.2em] text-[0.72em] text-white">
            <PlatformBrand small />
            <ul className="mt-[1.3em] space-y-[0.25em]">
              {sidebar.map(([name, Icon], index) => (
                <li
                  key={name}
                  className={`flex items-center gap-[0.7em] rounded px-[0.5em] py-[0.75em] ${index === 0 ? 'bg-white/10' : 'text-white/75'}`}
                >
                  <Icon className="size-[1.2em] shrink-0" />
                  {name}
                </li>
              ))}
            </ul>
          </aside>
          <div className="flex min-w-0 flex-col">
            <div className="flex gap-[1.4em] border-b border-border-soft px-[1.3em] py-[1.2em] text-[0.55em] text-text-secondary">
              <span>Operations</span>
              <span className="text-trust-lime-ink">Realtime</span>
              <span>Locations</span>
              <span>Workforce</span>
              <span>Console</span>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-[60%_40%] gap-[0.4em] p-[0.7em]">
              <div className="flex flex-col gap-[0.7em]">
                <h3 className="text-[0.9em] font-bold">Live Operations</h3>
                <div className="relative flex-1">
                  <StreetMap hero />
                </div>
              </div>
              <div className="border-l border-border-soft pl-[0.8em]">
                <div className="flex justify-between text-[0.8em] font-bold">
                  <span>Technicians</span>
                  <span className="text-[0.8em] font-normal text-text-secondary">See all</span>
                </div>
                {[
                  { name: 'Taylor Kim', portrait: 'alex-rivera-v2', status: 'Available' },
                  { name: 'Marcus Lee', portrait: 'marcus-lee-v2', status: 'On site' },
                  { name: 'Priya Shah', portrait: 'priya-shah-field-v3', status: 'On route' },
                  { name: 'Jordan Miles', portrait: 'daniel-carter-v2', status: 'Available' }
                ].map(({ name, portrait, status }) => (
                  <div
                    key={name}
                    className="mt-[1.55em] flex items-center gap-[0.7em] text-[0.72em]"
                  >
                    <Avatar name={name} portrait={portrait} />
                    <div>
                      <p className="font-bold">{name}</p>
                      <StatusBadge
                        status={status}
                        showPulse={false}
                        className={`mt-1 h-auto! border-0! bg-transparent! p-0! text-[0.8em]! normal-case! tracking-normal! ${status === 'On route' ? 'text-amber-800!' : status === 'On site' ? 'text-blue-700!' : 'text-marketing-status-green!'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[3.5%] h-[3.5%] rounded-b-[70%_100%] bg-linear-to-b from-slate-300 via-slate-400 to-slate-600 shadow-md"
      >
        <span className="absolute left-[41%] top-0 h-[40%] w-[18%] rounded-b-lg bg-slate-500/60" />
      </div>
      <div className="absolute bottom-[4%] left-[29%] w-[31%] rounded-[1em] border border-border-soft bg-white p-[1.4em] text-[0.8em] shadow-lg">
        <p className="font-bold">#WO-2847</p>
        <p className="mt-[0.4em] text-text-secondary">Store Equipment Install</p>
        <div className="my-[0.9em]">
          <JobStatus />
        </div>
        <div className="flex items-center gap-[0.7em]">
          <Avatar name="Alex Martinez" portrait="priya-shah-field-v3" className="size-[2.6em]" />
          <div>
            <p className="text-text-secondary">Denver, CO</p>
            <p className="font-bold">Alex Martinez</p>
          </div>
        </div>
        <div className="mt-[0.8em] rounded bg-lifecycle-active py-[0.6em] text-center font-bold">
          View Details
        </div>
      </div>
    </div>
  );
}

export function MarketplacePreview(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const technicians = findSolutionTechnicians(query);
  return (
    <div
      aria-label="Technician marketplace preview"
      className="relative mx-auto w-full max-w-[820px] pb-4 sm:aspect-[2.16] sm:pb-0 lg:max-w-none"
    >
      <div
        aria-hidden="true"
        className="absolute -right-[5%] top-[6%] h-[87%] w-[72%] rounded-[45%] bg-surface-green"
      />
      <div className="relative ml-[25%] aspect-[1.45] overflow-hidden rounded-xl sm:absolute sm:inset-y-0 sm:right-0 sm:ml-0 sm:w-[61%]">
        <Image
          src="/marketing/solutions-technician-marketplace.png"
          alt="Field technician reviewing a tablet beside a service van"
          fill
          sizes="(max-width: 639px) 75vw, (max-width: 1023px) 55vw, 33vw"
          className="object-cover object-[60%_center]"
        />
      </div>
      <div className="relative -mt-12 w-[91%] rounded-xl border border-border-default bg-white p-4 shadow-card sm:absolute sm:inset-y-[5%] sm:left-0 sm:mt-0 sm:w-[52%] sm:p-[1.2em]">
        <h3 className="text-sm font-bold lg:text-[1em]">Find Technicians</h3>
        <div className="relative my-2">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-text-secondary"
          />
          <input
            aria-label="Search sample technicians"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by skill, location, or keyword"
            className={`${focus} h-11 w-full rounded-md border border-border-soft bg-surface-soft/40 pl-7 pr-2 text-[10px] lg:h-[2.5em] lg:text-[0.65em]`}
          />
        </div>
        <ul className="space-y-2 lg:space-y-[0.65em]">
          {technicians.map((tech) => (
            <li key={tech.name} className="flex items-center gap-2 lg:gap-[0.7em]">
              <Avatar name={tech.name} portrait={tech.avatar} className="size-9 lg:size-[2.7em]" />
              <div className="min-w-0 flex-1 text-[10px] lg:text-[0.7em]">
                <p className="font-bold">{tech.name}</p>
                <p className="flex items-center gap-1 text-text-secondary">
                  <Star className="size-[1em] fill-status-warning stroke-status-warning" />{' '}
                  {tech.rating} ({tech.jobs} jobs)
                </p>
                <p className="mt-1 flex flex-wrap gap-1 text-[0.8em] text-text-secondary">
                  {tech.skills.map((skill) => (
                    <span key={skill} className="rounded bg-surface-soft px-1">
                      {skill}
                    </span>
                  ))}
                </p>
              </div>
              <Link
                href="/technicians"
                aria-label={`Invite ${tech.name}`}
                className={`${focus} inline-flex min-h-11 items-center rounded-md bg-lifecycle-active px-3 text-[10px] font-bold lg:min-h-[2.3em] lg:text-[0.65em]`}
              >
                Invite
              </Link>
            </li>
          ))}
        </ul>
        {technicians.length === 0 && (
          <p role="status" className="py-6 text-xs text-text-secondary">
            No sample technicians match your search.
          </p>
        )}
      </div>
      <div
        aria-label="Illustrative network size"
        className="relative ml-auto mt-3 flex w-fit items-center gap-3 rounded-xl border border-border-soft bg-white p-3 shadow-sm sm:absolute sm:-right-[4%] sm:bottom-[3%] sm:mt-0 sm:gap-[0.8em] sm:p-[0.7em]"
      >
        <span className="grid size-11 place-items-center rounded-full bg-brand-green-soft lg:size-[3em]">
          <Users className="size-[1.7em]" />
        </span>
        <div>
          <p className="text-lg font-bold lg:text-[1.5em]">10,000+</p>
          <p className="text-xs text-text-secondary lg:text-[0.75em]">Qualified technicians</p>
        </div>
      </div>
    </div>
  );
}

export function DispatchPreview(): React.JSX.Element {
  const [view, setView] = useState<DispatchView>('Map');
  const [selected, setSelected] = useState<SolutionJob>(solutionJobs[0]);
  const jobs = getSolutionJobs(view);
  return (
    <div
      aria-label="Dispatch preview"
      className="mx-auto grid w-full max-w-[820px] gap-3 sm:relative sm:block sm:aspect-[1.9] lg:max-w-none"
    >
      <div className="relative flex min-h-72 flex-col overflow-hidden rounded-xl border border-border-default bg-white p-[0.8em] shadow-card sm:absolute sm:inset-y-[5%] sm:left-0 sm:w-[79%] sm:min-h-0">
        <div className="flex items-center gap-3 px-1 py-1 text-xs font-bold lg:text-[0.95em]">
          <ArrowLeft className="size-[1.5em] rounded-full bg-surface-soft p-0.5" /> Dispatch
        </div>
        <div aria-label="Dispatch views" className="mb-2 mt-1 flex justify-center gap-1">
          {(['Map', 'List', 'Unassigned'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={view === tab}
              onClick={() => {
                setView(tab);
                if (tab === 'Unassigned') setSelected(solutionJobs[1]);
                if (tab === 'Map') setSelected(solutionJobs[0]);
              }}
              className={`${focus} min-h-11 rounded border-b-2 px-4 text-[10px] font-bold lg:min-h-[2.3em] lg:text-[0.7em] ${view === tab ? 'border-brand-green bg-surface-green text-trust-lime-ink' : 'border-transparent bg-surface-soft text-text-secondary'}`}
            >
              {tab}
              {tab === 'Unassigned' && <span className="ml-1 text-red-700">3</span>}
            </button>
          ))}
        </div>
        <div className="relative min-h-0 flex-1">
          {view === 'Map' ? (
            <>
              <StreetMap />
              <div className="absolute left-[29%] top-[22%] rounded-lg border border-border-soft bg-white p-[0.9em] text-[10px] shadow-sm lg:text-[0.75em]">
                <div className="flex items-center gap-2">
                  <Avatar name="Marcus Lee" portrait="marcus-lee-v2" className="size-[2.5em]" />
                  <div>
                    <p className="font-bold">#WO-2847</p>
                    <p className="text-text-secondary">Store Repair</p>
                    <div className="mt-1">
                      <JobStatus />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto sm:absolute sm:inset-0 sm:pr-[16%]">
              {jobs.map((job) => (
                <li key={job.id}>
                  <button
                    type="button"
                    aria-pressed={selected.id === job.id}
                    onClick={() => setSelected(job)}
                    className={`${focus} flex min-h-11 w-full items-center justify-between gap-2 rounded-lg p-2 text-left text-xs lg:text-[0.75em] ${selected.id === job.id ? 'bg-surface-green' : 'bg-surface-soft'}`}
                  >
                    <span>
                      <strong>{job.id}</strong>
                      <span className="block">{job.title}</span>
                    </span>
                    <span className="text-text-secondary">{job.location}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div
        aria-label="Sample job details"
        className="relative rounded-2xl border border-border-default bg-white p-4 shadow-card sm:absolute sm:inset-y-[2%] sm:right-0 sm:w-[31%] sm:p-[1.1em]"
      >
        <p className="flex items-center gap-2 border-b border-border-soft pb-[1.2em] text-xs font-bold lg:text-[0.75em]">
          <ArrowLeft className="size-[1.1em]" /> Job Details
        </p>
        <div className="py-[1em] text-xs lg:text-[0.8em]">
          <p className="font-bold">#{selected.id}</p>
          <p className="mb-2 text-text-secondary">{selected.title}</p>
          <JobStatus status={selected.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-1 lg:gap-[1em] lg:text-[0.7em]">
          <div className="flex items-center gap-2">
            {selected.technician ? (
              <Avatar
                name={selected.technician}
                portrait="marcus-lee-v2"
                className="size-[2.7em]"
              />
            ) : (
              <UserRound className="size-[2.7em] rounded-full bg-surface-soft p-1" />
            )}
            <div>
              <p className="text-text-secondary">Technician</p>
              <p>{selected.technician || 'Awaiting assignment'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-[2.5em] rounded-full bg-surface-soft p-[0.5em]" />
            <div>
              <p className="text-text-secondary">Location</p>
              <p>{selected.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-[2.5em] rounded-full bg-surface-soft p-[0.5em]" />
            <div>
              <p className="text-text-secondary">Scheduled</p>
              <p>Today, 10:00 AM</p>
            </div>
          </div>
        </div>
        <Link
          href="/operations"
          className={`${focus} mt-3 flex min-h-11 items-center justify-center rounded-md bg-lifecycle-active text-xs font-bold lg:mt-[1em] lg:min-h-[2.7em] lg:text-[0.7em]`}
        >
          View Job
        </Link>
      </div>
    </div>
  );
}

export function ProofPreview(): React.JSX.Element {
  return (
    <div
      aria-label="Proof and payments preview"
      className="relative mx-auto aspect-[1.95] w-full max-w-[820px] text-[clamp(7px,1.4vw,14px)] lg:max-w-none lg:text-[1em]"
    >
      <div className="absolute inset-y-[3%] left-[16%] right-[23%] overflow-hidden rounded-xl">
        <Image
          src="/marketing/solutions-technician-payment.png"
          alt="Technician smiling while reviewing completed work on a tablet"
          fill
          sizes="(max-width: 1023px) 60vw, 32vw"
          className="object-cover object-[58%_center]"
        />
      </div>
      <p
        aria-hidden="true"
        className="absolute -right-[3%] top-[1%] rotate-[-10deg] font-[family-name:'Comic_Sans_MS',cursive] text-[1.25em] leading-snug text-text-secondary"
      >
        Work done.
        <br />
        People paid.
        <br />
        Operations forward.
        <span className="ml-8 mt-1 block h-0.5 w-12 -rotate-12 bg-brand-green" />
      </p>
      <div className="absolute inset-y-[2%] left-[2%] flex w-[24%] flex-col rounded-[2em] border-[0.35em] border-text-heading bg-white px-[0.7em] pb-[0.9em] pt-[1.3em] shadow-md ring-1 ring-border-strong">
        <span
          aria-hidden="true"
          className="absolute left-[32%] top-0 h-[0.55em] w-[36%] rounded-b-lg bg-text-heading"
        />
        <p className="mb-[0.8em] text-[0.65em] font-bold">Job Completed</p>
        <div className="relative aspect-[1.6] overflow-hidden rounded-md">
          <Image
            src="/marketing/photo-server-rack-v2.png"
            alt="Completed equipment installation proof"
            fill
            sizes="160px"
            className="object-cover"
          />
        </div>
        <ul className="mt-[1em] space-y-[0.65em] text-[0.55em] text-text-secondary">
          {[
            'Photos uploaded',
            'Checklist completed',
            'Customer signature',
            'Ready for approval'
          ].map((label) => (
            <li key={label} className="flex items-center gap-[0.5em]">
              <CheckCircle2 className="size-[1.3em] fill-status-success stroke-white" />
              {label}
            </li>
          ))}
        </ul>
        <span className="mt-auto rounded-md bg-lifecycle-active px-1 py-[0.8em] text-center text-[0.55em] font-bold">
          Submit for Approval
        </span>
        <span
          aria-hidden="true"
          className="absolute bottom-[0.25em] left-[35%] h-[0.15em] w-[30%] rounded-full bg-brand-green"
        />
      </div>
      <div className="absolute bottom-[11%] right-0 flex w-[39%] items-start gap-[1em] rounded-xl border border-border-soft bg-white p-[1.5em] shadow-sm">
        <span className="grid size-[2.8em] shrink-0 place-items-center rounded-full bg-status-success text-white">
          <Check className="size-[1.8em]" />
        </span>
        <div>
          <p className="text-[0.9em] font-bold">Payment Approved</p>
          <p className="mt-[0.7em] text-[0.7em] leading-relaxed text-text-secondary">
            Payment has been released to the technician.
          </p>
        </div>
      </div>
      <ShieldCheck
        aria-hidden="true"
        className="absolute bottom-[7%] right-[2%] size-[1.4em] text-status-success"
      />
    </div>
  );
}
