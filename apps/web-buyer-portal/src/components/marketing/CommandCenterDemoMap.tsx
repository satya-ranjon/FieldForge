'use client';

import React, { useId, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Crosshair, Minus, Plus, Sun } from 'lucide-react';
import { changeMapView, demoTechnicians, initialMapView, mapViewport } from './command-map-model';

const legend = [
  ['Online (12)', 'bg-marketing-check'],
  ['On the way (6)', 'bg-status-info'],
  ['At site (4)', 'bg-status-warning'],
  ['Offline (2)', 'bg-status-danger']
];
const land = [
  'M0 0H550L505 58 490 116 455 170 428 225 407 270 370 320 350 383 302 450 250 526 210 600H0Z',
  'M660 0H746L697 80 665 153 625 227 591 289 557 338 511 369 473 372 452 356 461 329 488 286 515 237 542 184 575 131 612 63Z',
  'M835 0H1000V600H365L400 548 425 494 483 438 542 400 587 366 633 307 674 248 715 178 757 119 796 50Z'
];

export function CommandCenterDemoMap(): React.JSX.Element {
  const id = useId().replace(/:/g, '');
  const [view, setView] = useState(initialMapView);
  const [selected, setSelected] = useState(0);
  const bounds = mapViewport(view);
  const tech = demoTechnicians[selected];
  const popupX = ((tech.x - bounds.x) / bounds.width) * 100;
  const popupY = ((tech.y - bounds.y) / bounds.height) * 100;
  const control =
    'grid size-11 place-items-center text-white/90 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-green disabled:opacity-35';

  return (
    <section
      aria-label="New York demo operations map"
      className="relative isolate min-h-[330px] overflow-hidden rounded-xl bg-brand-dark text-white lg:aspect-[1.69] lg:min-h-0 lg:rounded-[0.8em]"
    >
      <svg
        aria-label="Interactive technician map. Use arrow keys to pan after zooming."
        role="group"
        tabIndex={0}
        viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
        preserveAspectRatio="none"
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const directions: Record<string, [number, number]> = {
            ArrowLeft: [-40, 0],
            ArrowRight: [40, 0],
            ArrowUp: [0, -40],
            ArrowDown: [0, 40]
          };
          const direction = directions[event.key];
          if (direction) {
            event.preventDefault();
            setView((current) => changeMapView(current, 0, ...direction));
          }
        }}
        className="absolute inset-0 h-full w-full bg-brand-dark-hover focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-green"
      >
        <defs>
          <pattern
            id={`${id}-streets`}
            width="29"
            height="37"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(29)"
          >
            <path
              d="M0 0H29V37H0Z M0 13H29 M12 0V37"
              fill="none"
              stroke="var(--color-border-strong)"
              strokeOpacity="0.13"
              strokeWidth="0.7"
            />
          </pattern>
          <pattern
            id={`${id}-blocks`}
            width="96"
            height="110"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(29)"
          >
            <path
              d="M0 0H96V110"
              fill="none"
              stroke="var(--color-border-strong)"
              strokeOpacity="0.2"
              strokeWidth="2"
            />
          </pattern>
          <clipPath id={`${id}-land`}>
            {land.map((d) => (
              <path key={d} d={d} />
            ))}
          </clipPath>
        </defs>
        <g aria-hidden="true">
          {land.map((d) => (
            <path
              key={d}
              d={d}
              fill="var(--color-marketing-map)"
              stroke="var(--color-border-strong)"
              strokeOpacity="0.16"
              strokeWidth="2"
            />
          ))}
          <g clipPath={`url(#${id}-land)`}>
            <path d="M0 0H1000V600H0Z" fill={`url(#${id}-streets)`} />
            <path d="M0 0H1000V600H0Z" fill={`url(#${id}-blocks)`} />
            <path
              d="M-50 540Q225 387 375 34 M0 173Q184 216 370 315 M22 600Q252 416 321 102L354 0 M431 600Q599 343 1000 224 M518 600Q660 377 975 285 M610 600Q761 311 975 16 M455 353Q591 190 685 -20"
              stroke="var(--color-border-strong)"
              strokeOpacity="0.23"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="m602 144 38-68 23 13-37 68Z M143 285l48-55 42 28-58 55Z M723 442l45-49 46 36-54 55Z"
              fill="var(--color-brand-dark-hover)"
            />
          </g>
          <path
            d="M414 230L508 241 M492 383L587 421 M568 343L659 366 M667 175L751 197"
            stroke="var(--color-border-strong)"
            strokeOpacity="0.35"
            strokeWidth="3"
          />
          <g
            fill="var(--color-border-strong)"
            opacity="0.65"
            fontFamily="Arial, sans-serif"
            textAnchor="middle"
          >
            <text x="589" y="102" fontSize="16" letterSpacing="1">
              MANHATTAN
            </text>
            <text x="187" y="368" fontSize="20">
              Jersey City
            </text>
            <text x="443" y="351" fontSize="21">
              New York
            </text>
            <text x="632" y="560" fontSize="16" letterSpacing="1">
              BROOKLYN
            </text>
          </g>
        </g>
      </svg>
      {demoTechnicians.map((marker, index) => {
        const left = ((marker.x - bounds.x) / bounds.width) * 100;
        const top = ((marker.y - bounds.y) / bounds.height) * 100;
        if (left < 0 || left > 100 || top < 0 || top > 100) return null;
        return (
          <button
            key={marker.name}
            type="button"
            aria-label={`${marker.name}, ${marker.status}`}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
            style={{ left: `${left}%`, top: `${top}%` }}
            className={`absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-white ${marker.tone}`}
          >
            <span
              className={`grid rounded-full bg-current/25 ${selected === index ? 'size-9' : 'size-7'}`}
            >
              <span className="m-auto size-4 rounded-full border-2 border-white bg-current shadow-[0_0_12px_currentColor]" />
            </span>
          </button>
        );
      })}
      <div
        aria-live="polite"
        style={{
          left: `clamp(8px, calc(${popupX}% - 20px), calc(100% - 208px))`,
          top: `clamp(8px, calc(${popupY}% - 88px), calc(100% - 140px))`
        }}
        className="pointer-events-none absolute flex w-[200px] max-w-[calc(100%-16px)] items-center gap-2 rounded-xl border border-border-soft bg-white p-2.5 text-text-primary shadow-lg"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-green text-xs font-bold text-trust-lime-ink">
          {tech.initials}
        </span>
        <div className="min-w-0 flex-1 text-[10px]">
          <strong className="block text-xs">{tech.name}</strong>
          <span className="flex items-center gap-1 text-text-secondary">
            <span className={`size-2 rounded-full bg-current ${tech.tone}`} />
            {tech.status}
          </span>
          <p className="mt-0.5 text-text-secondary">{tech.location}</p>
        </div>
        <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
      </div>
      <ul
        aria-label="Demo technician statuses"
        className="pointer-events-none absolute left-3 top-3 space-y-1.5 rounded-lg border border-white/10 bg-brand-dark/90 p-3 text-[10px] shadow-lg lg:text-[0.7em]"
      >
        {legend.map(([label, tone]) => (
          <li key={label} className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${tone}`} />
            {label}
          </li>
        ))}
      </ul>
      <div
        aria-label="Map controls"
        className="absolute right-2 top-2 overflow-hidden rounded-lg border border-white/15 bg-brand-dark/95 shadow-lg"
      >
        <button
          type="button"
          aria-label="Zoom in"
          className={control}
          disabled={view.zoom === 3}
          onClick={() => setView((current) => changeMapView(current, 1))}
        >
          <Plus className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          className={`${control} border-y border-white/10`}
          disabled={view.zoom === 0}
          onClick={() => setView((current) => changeMapView(current, -1))}
        >
          <Minus className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Reset map view"
          className={control}
          onClick={() => {
            setView(initialMapView);
            setSelected(0);
          }}
        >
          <Crosshair className="size-5" />
        </button>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-white/10 bg-brand-dark/95 px-3 py-2 shadow-lg">
        <Sun className="size-6 text-white/80" aria-hidden="true" />
        <div className="text-[10px] lg:text-[0.7em]">
          <strong className="block text-xs lg:text-[1.2em]">24°C</strong>
          <span className="text-white/70">New York, NY</span>
        </div>
      </div>
      <Link
        href="/technicians"
        className="absolute bottom-3 right-3 flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-brand-dark/95 px-3 text-[10px] font-bold shadow-lg hover:bg-brand-dark-hover focus-visible:outline-2 focus-visible:outline-brand-green lg:text-[0.75em]"
      >
        View All Technicians <ArrowRight className="size-3" />
      </Link>
      <span className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-white/70">
        Demo map · Sample data
      </span>
    </section>
  );
}
