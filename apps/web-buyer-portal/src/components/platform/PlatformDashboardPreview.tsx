'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserRound,
  MapPin,
  ChartNoAxesColumnIncreasing,
  CreditCard,
  Settings,
  CalendarDays,
  ChevronDown,
  Bell,
  Search,
  ListFilter,
  Plus,
  MessageSquare,
  CircleDollarSign,
  Menu
} from 'lucide-react';
import { platformOrders as orders, filterPlatformOrders } from './platform-preview-model';
import { StatusBadge } from '@fieldforge/ui';
import { PlatformBrand, platformFocus } from './PlatformPrimitives';

const sidebarItems = [
  ['Command Center', LayoutDashboard],
  ['Work Orders', ClipboardList],
  ['Technicians', Users],
  ['Customers', UserRound],
  ['Map', MapPin],
  ['Reports', ChartNoAxesColumnIncreasing],
  ['Payments', CreditCard],
  ['Settings', Settings]
] as const;
const portraits = [
  'marcus-lee-v2',
  'priya-shah-field-v3',
  'daniel-carter-v2',
  'alex-rivera-v2',
  'marcus-lee-v2'
];
function PreviewSidebar(): React.JSX.Element {
  return (
    <aside
      aria-label="Illustrative dashboard navigation"
      className="flex h-full flex-col bg-brand-dark p-[1em] text-white"
    >
      <PlatformBrand small />
      <ul className="mt-[1.5em] space-y-[0.2em]">
        {sidebarItems.map(([label, Icon], index) => (
          <li
            key={label}
            className={`flex items-center gap-[0.7em] rounded-md px-[0.6em] py-[0.65em] text-[0.85em] ${index === 0 ? 'bg-white/10 text-brand-green-soft' : 'text-white/80'}`}
          >
            <Icon className="size-[1.2em] shrink-0" />
            {label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
export function PlatformDevicePreview(): React.JSX.Element {
  return (
    <div
      aria-label="Platform desktop and mobile preview"
      className="relative mx-auto aspect-[1.72] w-full max-w-[880px] text-[clamp(8px,1.02vw,16px)] lg:max-w-none lg:text-[1em]"
    >
      <div className="absolute left-[13%] right-0 top-[2%] bottom-[10%] rounded-t-[1.2em] border-[0.5em] border-text-heading bg-text-heading p-[0.3em] shadow-xl ring-2 ring-slate-400/70">
        <div className="grid h-full grid-cols-[20%_80%] overflow-hidden bg-surface-white text-[0.72em]">
          <PreviewSidebar />
          <div className="flex min-w-0 flex-col p-[1.3em]">
            <div className="flex items-start justify-between gap-1">
              <div>
                <h3 className="font-bold text-[1.2em]">Command Center</h3>
                <p className="mt-0.5 text-text-secondary">Live operations across all regions</p>
              </div>
              <div className="flex items-center gap-[1em]">
                <span className="flex items-center gap-1 rounded border border-border-soft p-[0.5em]">
                  <CalendarDays className="size-[1em]" />
                  This week
                  <ChevronDown className="size-[1em]" />
                </span>
                <Bell className="size-[1.2em]" />
                <span className="grid size-[2em] place-items-center rounded-full bg-brand-dark text-[0.7em] text-white">
                  SR
                </span>
              </div>
            </div>
            <ul
              aria-label="Sample platform metrics"
              className="my-[1.1em] grid grid-cols-4 gap-[0.6em]"
            >
              {[
                ['247', 'Active Work Orders'],
                ['36', 'Technicians On Site'],
                ['92%', 'On-Time Rate'],
                ['$48.2K', 'Pending Payments']
              ].map(([value, label]) => (
                <li
                  key={label}
                  className="rounded-lg border border-border-soft bg-white p-[0.8em] shadow-sm"
                >
                  <strong className="block text-[1.35em]">{value}</strong>
                  <span className="mt-[0.4em] block text-[0.7em] text-text-secondary">{label}</span>
                </li>
              ))}
            </ul>
            <div className="grid min-h-0 flex-1 grid-cols-[1.5fr_1fr] gap-[1em]">
              <div className="relative overflow-hidden rounded-md bg-surface-soft">
                <Image
                  src="/marketing/platform-street-map.png"
                  alt="Illustrative street map behind sample work-order markers"
                  fill
                  sizes="(min-width: 1024px) 360px, 45vw"
                  className="object-cover"
                />
                {[
                  { x: 32, y: 10, tone: 'text-status-danger' },
                  { x: 12, y: 34, tone: 'text-status-success' },
                  { x: 20, y: 51, tone: 'text-status-info' },
                  { x: 38, y: 69, tone: 'text-status-success' },
                  { x: 88, y: 41, tone: 'text-status-success' },
                  { x: 67, y: 78, tone: 'text-status-danger' },
                  { x: 55, y: 90, tone: 'text-status-info' }
                ].map(({ x, y, tone }) => (
                  <MapPin
                    key={x}
                    aria-hidden="true"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className={`absolute size-[2.7em] -translate-x-1/2 -translate-y-1/2 fill-current stroke-white drop-shadow ${tone}`}
                  />
                ))}
                <div className="absolute left-[34%] top-[20%] w-[51%] rounded-lg bg-white p-[0.8em] shadow-lg">
                  <div className="flex gap-[0.6em]">
                    <Image
                      src="/marketing/avatars/marcus-lee-v2.png"
                      alt=""
                      width={48}
                      height={48}
                      className="size-[2.3em] rounded-full object-cover"
                    />
                    <div>
                      <strong className="text-[0.9em]">WO-2847</strong>
                      <p className="text-[0.65em] text-text-secondary">HVAC Maintenance</p>
                      <p className="mt-1 text-[0.65em] text-marketing-status-green">In progress</p>
                    </div>
                  </div>
                </div>
                <span className="absolute bottom-1 left-1 rounded bg-white/80 px-1 text-[0.6em] text-text-secondary">
                  Illustrative map
                </span>
              </div>
              <div className="rounded-lg border border-border-soft p-[0.8em]">
                <h4 className="font-bold">Recent Activity</h4>
                <ul className="mt-[1.2em] space-y-[1.5em]">
                  {[
                    'Completed work order',
                    'Arrived on site',
                    'Uploaded proof',
                    'Payment released'
                  ].map((action, i) => (
                    <li key={action} className="flex items-center gap-[0.7em]">
                      <Image
                        src={`/marketing/avatars/${portraits[i]}.png`}
                        alt=""
                        width={64}
                        height={64}
                        className="size-[2.5em] shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <strong className="text-[0.8em]">{orders[i].technician}</strong>
                        <p className="mt-[0.3em] text-[0.65em] text-text-secondary">{action}</p>
                      </div>
                      <span className="text-[0.6em] text-text-secondary">
                        {['2m', '12m', '28m', '1h'][i]} ago
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-[6%] left-[9%] h-[4%] w-[95%] rounded-b-[50%_65%] border-b-[0.3em] border-slate-400 bg-slate-300 shadow-md"
      >
        <span className="absolute inset-x-[39%] top-0 h-1/2 rounded-b-lg bg-slate-400" />
      </div>
      <div className="absolute bottom-[1%] left-0 h-[74%] w-[19%] overflow-hidden rounded-[2.5em] border-[0.28em] border-text-heading bg-white p-[0.9em] shadow-xl ring-2 ring-slate-400/80">
        <div className="flex items-center justify-between text-[0.4em] font-bold">
          <span>9:41</span>
          <span className="h-[1.4em] w-[38%] rounded-full bg-text-heading" />
          <span>5G</span>
        </div>
        <div className="mt-[0.7em] flex justify-between">
          <span className="text-[0.6em]">
            <PlatformBrand small />
          </span>
          <Menu className="size-[0.8em]" />
        </div>
        <p className="mt-[1em] text-[0.6em]">Good morning,</p>
        <strong className="block text-[1em]">Taylor</strong>
        <p className="mt-[1em] text-[0.6em] leading-relaxed text-text-secondary">
          You have 3 active jobs today.
        </p>
        <div className="mt-[0.8em] rounded-lg border border-border-default p-[0.6em]">
          <span className="block text-[0.5em] text-text-secondary">Next job</span>
          <strong className="block text-[0.58em]">HVAC Maintenance</strong>
          <p className="mt-1 text-[0.45em] text-text-secondary">120 Market St, Austin, TX</p>
          <span className="mt-[0.7em] block rounded bg-lifecycle-active py-[0.6em] text-center text-[0.55em] font-bold">
            View details
          </span>
        </div>
        <ul className="mt-[1em] space-y-[0.75em]">
          {[
            [ClipboardList, 'My work orders'],
            [MessageSquare, 'Messages'],
            [CircleDollarSign, 'Earnings'],
            [UserRound, 'Profile']
          ].map(([Icon, label]) => {
            const ItemIcon = Icon as typeof ClipboardList;
            return (
              <li
                key={String(label)}
                className="flex items-center gap-[0.8em] text-[0.58em] text-text-secondary"
              >
                <ItemIcon className="size-[1.25em]" />
                {String(label)}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function PlatformWorkOrders(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const filtered = filterPlatformOrders(query, status);
  return (
    <div
      aria-label="Sample work orders preview"
      className="rounded-2xl border border-border-default bg-surface-soft p-2 shadow-sm"
    >
      <div className="grid overflow-hidden rounded-xl border border-border-soft bg-white sm:grid-cols-[17%_83%] text-[11px] lg:text-[0.72em]">
        <div className="hidden sm:block">
          <PreviewSidebar />
        </div>
        <div className="min-w-0 p-3 lg:p-[1.1em]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold lg:text-[1.4em]">Work Orders</h3>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex min-h-11 items-center gap-1 rounded-md border border-border-default px-2 lg:min-h-8">
                <Search className="size-3 text-text-secondary" />
                <input
                  aria-label="Search sample work orders"
                  placeholder="Search work orders..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-28 bg-transparent py-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-green lg:w-[12em]"
                />
              </label>
              <label className="flex min-h-11 items-center gap-1 rounded-md border border-border-default px-2 lg:min-h-8">
                <ListFilter className="size-3" />
                <select
                  aria-label="Filter sample work orders"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="max-w-28 bg-transparent py-2 focus-visible:outline-brand-green"
                >
                  <option value="All">Filters</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Scheduled</option>
                </select>
              </label>
              <Link
                href="/create-wo"
                className={`${platformFocus} flex min-h-11 items-center gap-1 rounded-md bg-lifecycle-active px-3 font-bold lg:min-h-8`}
              >
                <Plus className="size-3" />
                New Work Order
              </Link>
            </div>
          </div>
          <div role="group" aria-label="Work order status" className="mt-2 flex flex-wrap gap-1">
            {['All', 'In Progress', 'Completed', 'Scheduled'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setStatus(name)}
                aria-pressed={status === name}
                className={`${platformFocus} min-h-11 rounded-md px-2 lg:min-h-8 ${status === name ? 'bg-brand-green-soft font-bold text-trust-lime-ink' : 'bg-surface-soft text-text-secondary'}`}
              >
                {name} (
                {name === 'All'
                  ? orders.length
                  : orders.filter((order) => order.status === name).length}
                )
              </button>
            ))}
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left">
              <caption className="sr-only">
                Illustrative work orders. Search and filter this sample list.
              </caption>
              <thead className="bg-surface-soft text-text-secondary">
                <tr>
                  {['ID', 'Title', 'Location', 'Technician', 'Status', 'Updated'].map((label) => (
                    <th key={label} scope="col" className="whitespace-nowrap px-2 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border-soft last:border-0">
                    <td className="whitespace-nowrap px-2 py-3">{order.id}</td>
                    <td className="px-2 py-3">{order.title}</td>
                    <td className="whitespace-nowrap px-2 py-3">{order.location}</td>
                    <td className="px-2 py-3">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Image
                          src={`/marketing/avatars/${portraits[orders.indexOf(order)]}.png`}
                          alt=""
                          width={48}
                          height={48}
                          className="size-5 rounded-full object-cover"
                        />
                        {order.technician}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge
                        status={order.status}
                        showPulse={false}
                        className={`h-auto! whitespace-nowrap border-0! px-2! py-1! text-[9px]! tracking-normal! ${order.status === 'Scheduled' ? 'bg-status-info-soft! text-blue-700!' : 'bg-status-success-soft! text-marketing-status-green!'}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-2 py-3">{order.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <p role="status" className="py-8 text-center text-text-secondary">
                No sample work orders match your search.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
