import React from 'react';
import Image from 'next/image';
import { MapPin, Layers, Zap, ShieldCheck, ChevronRight, Users } from 'lucide-react';
import { DispatchDemoMap } from './DispatchDemoMap';
import { marketingLayoutScale } from './MarketingHero.styles';

const candidates = [
  {
    name: 'Alex Morgan',
    meta: '1.8 mi · 4 min · CCNA · Available',
    avatar: '/marketing/avatars/marcus-lee-v2.png',
    bestMatch: true
  },
  {
    name: 'Daniel Lee',
    meta: '3.1 mi · 8 min · A+',
    avatar: '/marketing/avatars/daniel-carter-v2.png',
    bestMatch: false
  },
  {
    name: 'Priya Shah',
    meta: '4.0 mi · 11 min · OSHA',
    avatar: '/marketing/avatars/priya-shah-field-v3.png',
    bestMatch: false
  }
];

const features = [
  { label: 'Real-time location', icon: MapPin },
  { label: 'Smart matching', icon: Layers },
  { label: 'Emergency routing', icon: Zap },
  { label: 'Priority dispatch', icon: ShieldCheck }
];

export function SmartDispatchSection(): React.JSX.Element {
  return (
    <section
      id="smart-dispatch"
      aria-labelledby="smart-dispatch-title"
      className={`${marketingLayoutScale} relative isolate overflow-hidden bg-surface-green py-12 font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:pt-[calc(var(--hero-unit)*4)] lg:pb-[calc(var(--hero-unit)*10)]`}
    >
      <img
        src="/marketing/trust-orbit.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-20 w-60 -rotate-35 opacity-20 lg:-top-[calc(var(--hero-unit)*22)] lg:-right-[calc(var(--hero-unit)*9)] lg:w-[calc(var(--hero-unit)*27)]"
      />
      <div className="relative mx-auto w-[calc(100%-2.5rem)] max-w-marketing-page lg:w-[calc(var(--hero-unit)*89)] lg:text-[length:var(--hero-unit)]">
        <header className="mb-7 grid gap-5 px-1 lg:mb-[2.8em] lg:grid-cols-2 lg:items-end lg:gap-[4em] lg:px-[2.7em]">
          <div>
            <span className="inline-flex items-center gap-[0.7em] rounded-full bg-surface-white/80 px-[1.1em] py-[0.8em] text-[0.625rem] font-bold uppercase leading-none tracking-[0.06em] lg:text-[0.8em]">
              <span className="size-[0.7em] rounded-full bg-brand-green" aria-hidden="true" />
              Smart dispatch
            </span>
            <h2
              id="smart-dispatch-title"
              className="mt-4 font-[family-name:'FieldForge_Hero',Arial,sans-serif] text-3xl font-black leading-[1.08] tracking-[-0.025em] sm:text-4xl lg:mt-[0.4em] lg:text-[3.7em]"
            >
              Dispatch faster.
              <br />
              Without guessing.
            </h2>
          </div>
          <p className="max-w-lg text-base leading-[1.45] text-text-secondary lg:mb-[0.6em] lg:text-[1.3em]">
            Automatically identify nearby qualified technicians using location, availability,
            performance and verified credentials.
          </p>
        </header>

        <div className="grid gap-5 rounded-3xl bg-surface-white/65 p-4 sm:p-6 lg:grid-cols-[1.69fr_1fr] lg:gap-[2em] lg:rounded-[2.4em] lg:p-[2.2em]">
          <DispatchDemoMap />

          <div className="flex min-w-0 flex-col gap-4 lg:gap-[1.6em]">
            <div
              aria-labelledby="dispatch-candidates-title"
              className="rounded-2xl bg-surface-dark p-4 text-white lg:rounded-[1.4em] lg:p-[1.3em]"
            >
              <div className="flex items-center justify-between gap-2 lg:py-[0.3em]">
                <h3
                  id="dispatch-candidates-title"
                  className="flex items-center gap-2 text-sm font-bold lg:gap-[0.7em] lg:text-[1.1em]"
                >
                  <Users className="size-[1.25em] shrink-0 text-brand-green" aria-hidden="true" />
                  Dispatch candidates
                </h3>
                <span className="text-[10px] text-white/65 lg:text-[0.85em]">
                  Sorted by best match
                </span>
              </div>
              <ul className="mt-4 space-y-2 lg:mt-[1.3em] lg:space-y-[0.8em]">
                {candidates.map(({ name, meta, avatar, bestMatch }) => (
                  <li
                    key={name}
                    className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 lg:min-h-[5em] lg:gap-[1em] lg:rounded-[1em] lg:px-[1em] lg:py-[0.8em] ${bestMatch ? 'bg-lifecycle-active text-brand-dark' : 'bg-white/5 text-white'}`}
                  >
                    <Image
                      src={avatar}
                      alt=""
                      width={96}
                      height={96}
                      sizes="(min-width: 1500px) 52px, 40px"
                      className="size-9 shrink-0 rounded-full object-cover lg:size-[3.3em]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 lg:gap-[0.5em]">
                        <h4 className="text-xs font-bold leading-tight lg:text-[1em]">{name}</h4>
                        {bestMatch && (
                          <span className="rounded-full bg-trust-lime-ink px-[0.8em] py-[0.5em] text-[7px] font-bold leading-none tracking-[0.06em] text-white lg:text-[0.6em]">
                            BEST MATCH
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-1 text-[10px] leading-tight lg:mt-[0.35em] lg:text-[0.9em] ${bestMatch ? 'text-brand-dark' : 'text-white/65'}`}
                      >
                        {meta}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 lg:size-[1.3em]" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            </div>
            <ul
              aria-label="Smart dispatch features"
              className="grid grid-cols-2 gap-2.5 lg:gap-x-[1em] lg:gap-y-[0.9em]"
            >
              {features.map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="flex min-w-0 items-center gap-2 rounded-full bg-brand-green-soft px-3 py-3 text-[11px] font-bold lg:min-h-[4em] lg:gap-[0.8em] lg:px-[1.3em] lg:py-[1em] lg:text-[1em]"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-lifecycle-active text-trust-lime-ink lg:size-[1.8em]">
                    <Icon className="size-[80%] stroke-[2.3]" aria-hidden="true" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
