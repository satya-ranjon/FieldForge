import React from 'react';
import Image from 'next/image';
import {
  FileText,
  AlertTriangle,
  Clock,
  Database,
  Maximize2,
  Navigation,
  Zap,
  Eye,
  ShieldCheck,
  ChartNoAxesColumnIncreasing,
  House,
  Users,
  UserRound,
  ClipboardCheck,
  Settings,
  Bell,
  Info,
  CornerDownLeft
} from 'lucide-react';
import { marketingLayoutScale } from './MarketingHero.styles';
import { MarketingBrandMark } from './MarketingHeroArtwork';
import { CommandCenterDemoMap } from './CommandCenterDemoMap';

const kpiCards = [
  {
    icon: FileText,
    count: '18',
    label: 'Open Jobs',
    delta: '↑ 12%',
    tone: 'bg-status-success-soft text-status-success'
  },
  {
    icon: AlertTriangle,
    count: '04',
    label: 'At Risk',
    delta: '↑ 8%',
    tone: 'bg-status-warning-soft text-status-warning'
  },
  {
    icon: Clock,
    count: '09',
    label: 'Pending Approval',
    delta: '↓ 3%',
    tone: 'bg-status-info-soft text-status-info'
  },
  {
    icon: Database,
    count: '$42K',
    label: 'Total Spend',
    delta: '↑ 16%',
    tone: 'bg-brand-green-soft text-status-success'
  }
];
const navigation = [
  { label: 'Command Center', icon: House },
  { label: 'Work Orders', icon: FileText },
  { label: 'Technicians', icon: Users },
  { label: 'Customers', icon: UserRound },
  { label: 'Assets', icon: ClipboardCheck },
  { label: 'Approvals', icon: ShieldCheck },
  { label: 'Reports', icon: ChartNoAxesColumnIncreasing },
  { label: 'Settings', icon: Settings }
];
const alerts = [
  {
    title: 'Network Down',
    desc: '1200 Market St, NY',
    time: '2 min ago',
    icon: AlertTriangle,
    tone: 'bg-status-danger-soft text-status-danger'
  },
  {
    title: 'Delayed Arrival',
    desc: 'Technician running late',
    time: '12 min ago',
    icon: AlertTriangle,
    tone: 'bg-status-warning-soft text-status-warning'
  },
  {
    title: 'Invoice Pending Approval',
    desc: '#INV-7842',
    time: '28 min ago',
    icon: Info,
    tone: 'bg-status-info-soft text-status-info'
  }
];
const technicians = [
  {
    name: 'Alex Morgan',
    status: 'On Site',
    dist: '1.2 km',
    avatar: 'marcus-lee-v2',
    dot: 'bg-status-success'
  },
  {
    name: 'Priya Shah',
    status: 'In Transit',
    dist: '2.4 km',
    avatar: 'priya-shah-v2',
    dot: 'bg-status-info'
  },
  {
    name: 'Daniel Lee',
    status: 'Available',
    dist: '3.1 km',
    avatar: 'daniel-carter-v2',
    dot: 'bg-status-success'
  }
];
const benefits = [
  { title: 'Faster Response', desc: 'Solve issues quickly', icon: Zap },
  { title: 'Full Visibility', desc: 'Track everything in real time', icon: Eye },
  { title: 'Trusted & Secure', desc: 'Role based access & audit logs', icon: ShieldCheck },
  {
    title: 'Higher Productivity',
    desc: 'More jobs, less downtime',
    icon: ChartNoAxesColumnIncreasing
  }
];

export function CommandCenterPreview(): React.JSX.Element {
  return (
    <section
      id="command-center"
      aria-labelledby="command-center-title"
      className={`${marketingLayoutScale} relative isolate overflow-hidden bg-surface-marketing py-12 font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:py-[2.6em] lg:pb-[4.8em] lg:text-[length:var(--hero-unit)]`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-radial-[at_50%_65%] from-brand-green-soft/70 via-surface-marketing to-surface-page"
      />
      <img
        src="/marketing/trust-orbit.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-20 -z-10 w-72 opacity-50 lg:-left-[5em] lg:top-[8em] lg:w-[32em]"
      />
      <img
        src="/marketing/trust-orbit.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-48 -z-10 w-80 rotate-90 opacity-50 lg:-right-[10em] lg:-top-[26em] lg:w-[43em]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[3.3em] left-[2.6em] hidden text-[0.65em] font-bold leading-relaxed tracking-widest text-text-muted/40 lg:block"
      >
        PEOPLE
        <br />
        IN THE FIELD
        <br />
        POWER TOMORROW
        <span className="mt-2 block h-px w-6 bg-border-strong" />
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none absolute top-[3.3em] right-[2.6em] hidden text-right text-[0.65em] font-bold leading-relaxed tracking-widest text-text-muted/40 lg:block"
      >
        OPERATIONS
        <br />
        MADE SMARTER
      </p>

      <div className="relative mx-auto w-[calc(100%-2.5rem)] max-w-marketing-page lg:w-[calc(var(--hero-unit)*89)]">
        <header className="mx-auto max-w-3xl text-center lg:max-w-[60em]">
          <span className="inline-flex items-center gap-[0.8em] rounded-full border border-border-soft bg-surface-white px-[1.2em] py-[0.65em] text-[10px] font-bold uppercase shadow-sm lg:text-[0.85em]">
            <span className="size-[0.75em] rounded-full bg-marketing-check" aria-hidden="true" />
            Command Center
          </span>
          <h2
            id="command-center-title"
            className="mt-3 font-[family-name:'FieldForge_Hero',Arial,sans-serif] text-3xl font-black leading-[1.05] tracking-[-0.025em] sm:text-4xl lg:mt-[0.32em] lg:text-[3.5em]"
          >
            One command center for every
            <br className="hidden sm:block" />{' '}
            <span className="relative inline-block">
              field operation.
              <img
                src="/marketing/hero-underline.png"
                alt=""
                aria-hidden="true"
                className="absolute -bottom-[0.12em] left-0 h-[0.16em] w-full"
              />
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-[1.3] text-text-secondary lg:mt-[1em] lg:max-w-[40em] lg:text-[1.25em]">
            A product-led view of work orders, technician positions, emergency work, approvals,
            spend and operational alerts — all in real time.
          </p>
        </header>
        <div
          aria-hidden="true"
          className="absolute right-[-1em] top-[10em] hidden -rotate-12 font-[family-name:'Comic_Sans_MS',cursive] text-[1.2em] leading-tight text-text-secondary lg:block"
        >
          Real-time
          <br />
          visibility.
          <br />
          Better decisions.
          <CornerDownLeft className="mx-auto mt-[0.5em] size-[2.5em] -rotate-12 stroke-1 text-marketing-check" />
        </div>

        <ul
          aria-label="Operations summary"
          className="mx-auto mt-6 grid grid-cols-2 gap-3 lg:mt-[2em] lg:max-w-[75em] lg:grid-cols-4 lg:gap-[1.4em]"
        >
          {kpiCards.map(({ icon: Icon, ...kpi }) => (
            <li
              key={kpi.label}
              className="flex items-center gap-3 rounded-2xl bg-surface-white/85 p-3 lg:gap-[1.1em] lg:rounded-[1.4em] lg:px-[1.25em] lg:py-[0.75em]"
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full lg:size-[4em] ${kpi.tone}`}
              >
                <Icon className="size-5 lg:size-[2em]" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-1">
                  <strong className="text-xl leading-tight lg:text-[1.7em]">{kpi.count}</strong>
                  <span
                    className={`text-[10px] font-bold lg:text-[0.8em] ${kpi.label === 'Pending Approval' ? 'text-status-info' : 'text-status-success'}`}
                  >
                    {kpi.delta}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-text-secondary lg:text-[0.9em]">
                  {kpi.label}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div
          aria-label="Field operations dashboard preview"
          className="mt-4 grid rounded-2xl border border-border-soft bg-surface-white/90 p-2 shadow-lg shadow-brand-green/10 lg:mt-[1.2em] lg:grid-cols-[14em_minmax(0,1fr)] lg:rounded-[1.4em] lg:p-[0.8em]"
        >
          <aside
            aria-label="Dashboard navigation preview"
            className="hidden flex-col rounded-l-[0.8em] bg-brand-dark px-[0.8em] py-[1.3em] text-white lg:flex"
          >
            <div className="mb-[1.5em] flex items-center gap-[0.7em] px-[0.6em]">
              <span className="block size-[2em] text-marketing-check [&>svg]:size-full">
                <MarketingBrandMark />
              </span>
              <span className="text-[1.2em] font-bold">FieldForge</span>
            </div>
            <ul className="space-y-[0.25em]">
              {navigation.map(({ label, icon: Icon }, index) => (
                <li
                  key={label}
                  className={`flex items-center gap-[1em] rounded-[0.6em] px-[1em] py-[0.8em] text-[0.8em] ${index === 0 ? 'bg-brand-dark-hover text-white' : 'text-white/85'}`}
                >
                  <Icon
                    className={`size-[1.3em] shrink-0 ${index === 0 ? 'text-marketing-check' : ''}`}
                    aria-hidden="true"
                  />
                  {label}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-center gap-[0.8em] rounded-[0.6em] bg-brand-dark-hover px-[1em] py-[0.8em]">
              <span className="size-[1.3em] shrink-0 rounded-full bg-marketing-check" />
              <div>
                <p className="text-[0.8em]">System Online</p>
                <p className="mt-[0.3em] text-[0.7em] text-white/65">All systems operational</p>
              </div>
            </div>
          </aside>
          <div className="min-w-0 rounded-r-[0.8em] bg-surface-white p-2 sm:p-3 lg:px-[1.5em] lg:py-[1em]">
            <header className="mb-3 flex flex-wrap items-center justify-between gap-3 lg:mb-[0.9em] lg:gap-[1em]">
              <div>
                <h3 className="text-sm font-bold lg:text-[1.2em]">Field Operations</h3>
                <p className="mt-0.5 text-[10px] text-text-secondary lg:text-[0.85em]">
                  Live view of technicians, work orders and operational status.
                </p>
              </div>
              <div className="flex items-center gap-2 lg:gap-[1em]">
                <div
                  aria-label="Preview time range: Live"
                  className="flex items-center rounded-full border border-border-soft bg-surface-soft p-0.5 text-[8px] lg:text-[0.65em]"
                >
                  {['Live', 'Today', 'This Week', 'This Month'].map((label, index) => (
                    <span
                      key={label}
                      className={`rounded-full px-[1.5em] py-[0.65em] ${index === 0 ? 'bg-marketing-check font-bold text-white' : 'text-text-secondary'}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <Maximize2
                  aria-hidden="true"
                  className="size-5 rounded-md border border-border-soft p-1 lg:size-[2.2em] lg:p-[0.45em]"
                />
              </div>
            </header>
            <div className="grid items-stretch gap-3 lg:grid-cols-[1.87fr_1fr] lg:gap-[1em]">
              <CommandCenterDemoMap />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 lg:gap-[0.6em]">
                <section
                  aria-labelledby="command-alerts-title"
                  className="min-w-0 rounded-xl border border-border-soft bg-surface-white p-3 shadow-sm lg:rounded-[1em] lg:p-[0.85em]"
                >
                  <div className="mb-2 flex items-center justify-between gap-1 lg:mb-[0.7em]">
                    <h4
                      id="command-alerts-title"
                      className="flex items-center gap-[0.6em] text-xs font-bold lg:text-[0.85em]"
                    >
                      <Bell className="size-[1.2em]" aria-hidden="true" />
                      Operational Alerts
                    </h4>
                    <span className="whitespace-nowrap text-[9px] font-bold text-marketing-status-green lg:text-[0.7em]">
                      View all →
                    </span>
                  </div>
                  <ul className="divide-y divide-border-soft">
                    {alerts.map(({ icon: Icon, ...alert }) => (
                      <li
                        key={alert.title}
                        className="flex items-center gap-2 py-1.5 lg:gap-[0.6em] lg:py-[0.3em]"
                      >
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-md lg:size-[2.5em] ${alert.tone}`}
                        >
                          <Icon className="size-[1.5em]" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-[10px] font-bold lg:text-[0.75em]">{alert.title}</p>
                            <span className="shrink-0 text-[8px] text-text-muted lg:text-[0.65em]">
                              {alert.time}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[9px] text-text-secondary lg:text-[0.7em]">
                            {alert.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
                <section
                  aria-labelledby="command-technicians-title"
                  className="min-w-0 rounded-xl border border-border-soft bg-surface-white p-3 shadow-sm lg:rounded-[1em] lg:p-[0.85em]"
                >
                  <div className="mb-2 flex items-center justify-between gap-1 lg:mb-[0.6em]">
                    <h4
                      id="command-technicians-title"
                      className="flex items-center gap-[0.6em] text-xs font-bold lg:text-[0.85em]"
                    >
                      <Users className="size-[1.2em]" aria-hidden="true" />
                      Technicians Nearby
                    </h4>
                    <span className="whitespace-nowrap text-[9px] font-bold text-marketing-status-green lg:text-[0.7em]">
                      View all →
                    </span>
                  </div>
                  <ul className="space-y-1.5 lg:space-y-[0.5em]">
                    {technicians.map((tech) => (
                      <li key={tech.name} className="flex items-center gap-2 lg:gap-[0.7em]">
                        <Image
                          src={`/marketing/avatars/${tech.avatar}.png`}
                          alt=""
                          width={64}
                          height={64}
                          className="size-7 shrink-0 rounded-full object-cover lg:size-[2.4em]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold lg:text-[0.8em]">{tech.name}</p>
                          <p className="flex items-center gap-1 text-[9px] text-text-secondary lg:text-[0.7em]">
                            <span className={`size-[0.65em] rounded-full ${tech.dot}`} />
                            {tech.status}
                          </p>
                        </div>
                        <span className="text-[9px] text-text-secondary lg:text-[0.7em]">
                          {tech.dist}
                        </span>
                        <span className="grid size-7 place-items-center rounded-full bg-surface-soft lg:size-[2.5em]">
                          <Navigation className="size-3 lg:size-[1em]" aria-hidden="true" />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>

        <ul
          aria-label="Command center benefits"
          className="mt-4 grid grid-cols-1 gap-5 rounded-2xl border border-border-soft bg-surface-white/85 p-5 sm:grid-cols-2 lg:mt-[1.4em] lg:grid-cols-4 lg:gap-0 lg:rounded-[1.4em] lg:px-[1.2em] lg:py-[1.2em]"
        >
          {benefits.map(({ title, desc, icon: Icon }) => (
            <li
              key={title}
              className="flex items-center gap-3 lg:gap-[1.2em] lg:px-[2em] lg:not-first:border-l lg:border-border-default"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-green-soft text-trust-lime-ink lg:size-[4.2em]">
                <Icon className="size-6 lg:size-[2.3em]" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-xs font-bold lg:text-[0.95em]">{title}</h3>
                <p className="mt-0.5 text-[10px] leading-tight text-text-secondary lg:text-[0.85em]">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
