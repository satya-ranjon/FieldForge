'use client';

import React, { useId, useState } from 'react';
import { Crosshair, MapPin, Minus, Plus } from 'lucide-react';
import { changeMapView, initialMapView, mapViewport } from './command-map-model';

const dispatchPoints = [
  { name: 'Alex Morgan', x: 225, y: 215, distance: '1.8 mi', eta: '4 min' },
  { name: 'Daniel Lee', x: 260, y: 495, distance: '3.1 mi', eta: '8 min' },
  { name: 'Priya Shah', x: 760, y: 475, distance: '4.0 mi', eta: '11 min' },
  { name: 'Jordan Kim', x: 855, y: 130, distance: '4.9 mi', eta: '12 min' }
];
const texasPoints = [
  { name: 'Dallas', x: 290, y: 100, distance: 'Available', eta: 'North region' },
  { name: 'Austin', x: 395, y: 310, distance: '18 mi', eta: 'Best match' },
  { name: 'San Antonio', x: 190, y: 425, distance: 'Available', eta: 'South region' }
];

export function DispatchDemoMap({ compact = false }: { compact?: boolean }): React.JSX.Element {
  const id = useId().replace(/:/g, '');
  const [view, setView] = useState(initialMapView);
  const [selected, setSelected] = useState<number | null>(null);
  const bounds = mapViewport(view);
  const points = compact ? texasPoints : dispatchPoints;
  const selectedPoint = selected === null ? null : points[selected];
  const incident = compact ? { x: 610, y: 255 } : { x: 535, y: 355 };
  const position = (x: number, y: number) => ({
    left: `${((x - bounds.x) / bounds.width) * 100}%`,
    top: `${((y - bounds.y) / bounds.height) * 100}%`
  });
  const control =
    'grid size-11 place-items-center rounded-md text-white/90 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-brand-green disabled:opacity-30';

  return (
    <section
      aria-label={compact ? 'Texas demo dispatch map' : 'San Francisco demo dispatch map'}
      className={`relative isolate overflow-hidden border border-white/10 bg-brand-dark text-white ${compact ? 'aspect-[1.28] min-h-[250px] rounded-lg lg:min-h-0 lg:rounded-[0.7em]' : 'aspect-[1.55] min-h-[340px] rounded-2xl lg:min-h-0 lg:rounded-[1.4em]'}`}
    >
      <svg
        role="group"
        aria-label="Dispatch map. Use arrow keys to pan after zooming."
        tabIndex={0}
        viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-green"
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const movement: Record<string, [number, number]> = {
            ArrowLeft: [-40, 0],
            ArrowRight: [40, 0],
            ArrowUp: [0, -40],
            ArrowDown: [0, 40]
          };
          const delta = movement[event.key];
          if (delta) {
            event.preventDefault();
            setView((current) => changeMapView(current, 0, ...delta));
          }
        }}
      >
        <defs>
          <pattern
            id={`${id}-roads`}
            width={compact ? 120 : 33}
            height={compact ? 95 : 37}
            patternUnits="userSpaceOnUse"
            patternTransform={compact ? 'rotate(-18)' : 'rotate(-3)'}
          >
            <path
              d={
                compact
                  ? 'M0 0L35 18 78 10 120 0 M35 18L51 51 42 95 M51 51L95 70 120 95'
                  : 'M0 0H33V37H0 M13 0V37 M0 16H33'
              }
              fill="none"
              stroke="var(--color-border-strong)"
              strokeOpacity={compact ? 0.17 : 0.09}
              strokeWidth="1"
            />
          </pattern>
          <clipPath id={`${id}-shore`}>
            <path
              d={
                compact
                  ? 'M0 0H1000V325L913 359 826 429 756 500 724 600H0Z'
                  : 'M0 0H975L925 75 944 136 909 171 948 236 899 302 912 357 939 414 903 472 931 543 940 600H0Z'
              }
            />
          </clipPath>
        </defs>
        <g aria-hidden="true">
          <g clipPath={`url(#${id}-shore)`}>
            <path d="M0 0H1000V600H0Z" fill="var(--color-marketing-map)" opacity="0.52" />
            <path d="M0 0H1000V600H0Z" fill={`url(#${id}-roads)`} />
            <path
              d={
                compact
                  ? 'M305 -20Q235 70 346 198T421 360 367 550 M0 571Q160 399 341 440T727 398 1050 266 M13 50Q137 173 398 235T880 600 M0 357Q241 239 626 122T1050 77'
                  : 'M70 650Q213 353 186 -50 M400 650Q398 366 391 -50 M684 650Q652 416 713 209T819 -50 M-20 125Q263 187 430 113T948 60 M-20 455Q288 465 563 410T957 451 M15 577Q302 471 436 287T890 265'
              }
              fill="none"
              stroke="var(--color-border-strong)"
              strokeOpacity="0.19"
              strokeWidth="2"
            />
            {Array.from({ length: 24 }, (_, index) => (
              <circle
                key={index}
                cx={45 + ((index * 137) % 870)}
                cy={25 + ((index * 97) % 540)}
                r="2"
                fill="var(--color-border-strong)"
                opacity="0.3"
              />
            ))}
          </g>
          {compact ? (
            <g fill="var(--color-border-strong)" fontSize="21" fontFamily="Arial, sans-serif">
              <text x="610" y="78">
                Dallas
              </text>
              <text x="370" y="375">
                Austin
              </text>
              <text x="650" y="455">
                Houston
              </text>
              <text x="270" y="530">
                San Antonio
              </text>
            </g>
          ) : (
            points.map((point) => (
              <path
                key={point.name}
                d={`M${point.x} ${point.y} Q${(point.x + incident.x) / 2} ${Math.min(point.y, incident.y) - 75} ${incident.x} ${incident.y}`}
                fill="none"
                stroke="var(--color-brand-green)"
                strokeOpacity="0.65"
                strokeWidth="2"
                strokeDasharray="4 6"
              />
            ))
          )}
        </g>
      </svg>
      {points.map((point, index) => (
        <div key={point.name} className="absolute" style={position(point.x, point.y)}>
          <button
            type="button"
            aria-label={`${point.name}, ${point.distance}, ${point.eta}`}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
            className={`absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-white ${index === points.length - 1 && !compact ? 'text-status-warning' : 'text-brand-green'}`}
          >
            <span className="grid size-9 place-items-center rounded-full bg-current/15">
              <span className="size-4 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
            </span>
          </button>
          {!compact && (
            <div
              className={`pointer-events-none absolute top-0 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/20 bg-brand-dark/90 px-2 py-1 text-[10px] leading-tight lg:text-[0.75em] ${index === 3 ? '-left-6 -translate-x-full' : 'left-6'}`}
            >
              <strong className="block">{point.distance}</strong>
              {point.eta}
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        aria-label="Show emergency network outage"
        onClick={() => setSelected(null)}
        style={position(incident.x, incident.y)}
        className="absolute grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-status-danger/20 text-status-danger ring-8 ring-status-danger/10 focus-visible:outline-2 focus-visible:outline-white"
      >
        <span className="size-6 rounded-full border-[3px] border-white bg-status-danger shadow-[0_0_20px_currentColor]" />
      </button>
      <div
        aria-live="polite"
        className={`pointer-events-none absolute rounded-xl border border-border-soft bg-white p-3 text-text-primary shadow-lg after:absolute after:-bottom-2 after:left-6 after:size-4 after:rotate-45 after:bg-white ${compact ? 'left-[43%] top-[28%] w-[54%] text-[10px]' : 'left-[45%] top-[31%] w-[42%] max-w-[185px] text-xs lg:text-[0.85em]'}`}
      >
        <span
          className={`font-bold ${selectedPoint ? 'text-marketing-status-green' : 'text-marketing-status-red'}`}
        >
          {selectedPoint ? 'Nearby technician' : 'Emergency'}
        </span>
        <strong className="mt-0.5 block">{selectedPoint?.name ?? 'Network Down'}</strong>
        <p className="mt-1 text-text-secondary">
          {selectedPoint
            ? `${selectedPoint.distance} · ${selectedPoint.eta}`
            : compact
              ? '#3287 · Austin, TX'
              : '1200 Market St'}
        </p>
        {!compact && !selectedPoint && <p className="text-text-secondary">San Francisco, CA</p>}
      </div>
      {!compact && (
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 text-[10px] sm:text-xs lg:text-[0.85em]">
          <span className="flex items-center gap-2 rounded-full border border-white/25 bg-brand-dark/80 px-3 py-2">
            <span className="size-2 rounded-full bg-brand-green" />
            Live view
          </span>
          <span className="text-white/65">4 technicians nearby</span>
        </div>
      )}
      <div
        className={`absolute bottom-3 flex overflow-hidden rounded-lg border border-white/20 bg-brand-dark/95 ${compact ? 'left-2 flex-col' : 'right-3'}`}
      >
        <button
          type="button"
          aria-label="Zoom in"
          className={control}
          disabled={view.zoom === 3}
          onClick={() => setView((current) => changeMapView(current, 1))}
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          className={control}
          disabled={view.zoom === 0}
          onClick={() => setView((current) => changeMapView(current, -1))}
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Reset map view"
          className={control}
          onClick={() => {
            setView(initialMapView);
            setSelected(null);
          }}
        >
          <Crosshair className="size-4" />
        </button>
      </div>
      <span
        className={`pointer-events-none absolute bottom-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-brand-dark/90 px-2 py-2 text-[9px] lg:text-[0.7em] ${compact ? 'right-2' : 'left-3'}`}
      >
        {compact ? (
          <span className="size-2 rounded-full bg-brand-green" />
        ) : (
          <MapPin className="size-3" />
        )}
        {compact ? '12 active jobs' : 'San Francisco, CA'}
      </span>
      <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] text-white/65">
        Demo map · Sample data
      </span>
    </section>
  );
}
