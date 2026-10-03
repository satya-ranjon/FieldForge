import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, type LucideIcon } from 'lucide-react';
import { MarketingBrandMark } from '../marketing/MarketingHeroArtwork';

export const platformFrame = 'mx-auto w-[calc(100%-2.5rem)] max-w-[1440px] lg:w-[86.3%]';
export const platformFocus =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-green';
export const platformHeading =
  "font-[family-name:'FieldForge_Hero',Arial,sans-serif] font-black leading-[1.08] tracking-[-0.035em]";

export function PlatformBrand({ small = false }: { small?: boolean }): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center gap-[0.5em] font-bold tracking-tight ${small ? 'text-[1em]' : 'text-[1.7em]'}`}
    >
      <span className="block size-[1.35em] shrink-0">
        <MarketingBrandMark />
      </span>
      FieldForge
    </span>
  );
}
export function PlatformEyebrow({ children }: { children: string }): React.JSX.Element {
  return (
    <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary lg:text-[0.72em]">
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-brand-green ring-2 ring-brand-green-soft"
      />
      {children}
    </p>
  );
}
export function PlatformIcon({ icon: Icon }: { icon: LucideIcon }): React.JSX.Element {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-green-soft text-brand-dark lg:size-[3.4em]">
      <Icon className="size-[1.8em] stroke-[2.2]" aria-hidden="true" />
    </span>
  );
}
export function PlatformLink({
  href,
  children,
  secondary = false
}: {
  href: string;
  children: string;
  secondary?: boolean;
}): React.JSX.Element {
  return (
    <Link
      href={href}
      className={`${platformFocus} inline-flex min-h-11 items-center justify-center gap-[1em] whitespace-nowrap rounded-lg border px-[1.6em] py-[0.9em] text-xs font-bold shadow-sm transition lg:text-[0.9em] ${secondary ? 'border-border-default bg-white text-text-primary hover:bg-surface-soft' : 'border-brand-dark bg-brand-dark text-white hover:bg-brand-dark-hover'}`}
    >
      {secondary && <Play aria-hidden="true" className="size-[1.3em] stroke-[3]" />}
      {children}
      {!secondary && <ArrowRight aria-hidden="true" className="size-[1.3em]" />}
    </Link>
  );
}
