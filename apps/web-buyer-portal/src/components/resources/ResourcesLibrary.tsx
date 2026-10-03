'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleDot,
  CircleHelp,
  FileText,
  LayoutGrid,
  MapPin,
  Megaphone,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
  type LucideIcon
} from 'lucide-react';
import { Input } from '@fieldforge/ui';
import { PlatformNavigation } from '../platform/PlatformChrome';
import {
  PlatformBrand,
  PlatformEyebrow as Eyebrow,
  platformFrame as frame,
  platformHeading as heading,
  platformFocus as focus
} from '../platform/PlatformPrimitives';
import { Linkedin, SocialX, Youtube } from '../platform/PlatformSocialIcons';
import {
  resources,
  resourceTypes,
  resourceTopics,
  filterResources,
  resourceLabel,
  type ResourceArticle,
  type ResourceType,
  type ResourceTopic
} from './resource-model';

const typeIcons: Record<ResourceType, LucideIcon> = {
  All: LayoutGrid,
  Guides: BookOpen,
  'Case Studies': FileText,
  'Help Center': CircleHelp,
  'Product Updates': Megaphone,
  Templates: FileText
};
const topicIcons = [MapPin, CalendarDays, Users, ShieldCheck, Settings, FileText];
const actionClass = `${focus} inline-flex min-h-11 items-center gap-[0.9em] text-left text-sm font-bold text-brand-dark-hover lg:min-h-[2.5em] lg:text-[0.95em]`;

function ResourceBadge({ type }: { type: ResourceArticle['type'] }): React.JSX.Element {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold lg:text-[0.72em] ${type === 'Case Studies' ? 'bg-purple-100 text-purple-800' : type === 'Templates' || type === 'Product Updates' ? 'bg-status-info-soft text-blue-700' : 'bg-brand-green-soft text-trust-lime-ink'}`}
    >
      <CircleDot aria-hidden="true" className="size-[1em] stroke-[3]" />
      {resourceLabel(type)}
    </span>
  );
}

function ResourceCard({
  resource,
  featured = false,
  onRead
}: {
  resource: ResourceArticle;
  featured?: boolean;
  onRead: (resource: ResourceArticle) => void;
}): React.JSX.Element {
  const label = resource.download
    ? featured
      ? 'Download template'
      : 'Download'
    : resource.type === 'Guides'
      ? featured
        ? 'Read the guide'
        : 'Read guide'
      : resource.type === 'Case Studies'
        ? featured
          ? 'Read the case study'
          : 'Read case study'
        : 'Read article';
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border-soft bg-white shadow-xs transition hover:border-border-strong hover:shadow-sm">
      <div className={`relative overflow-hidden ${featured ? 'aspect-[2]' : 'aspect-[2.1]'}`}>
        <Image
          src={`/marketing/resources-${resource.image}.png`}
          alt={resource.alt}
          fill
          sizes={
            featured
              ? '(max-width: 767px) 90vw, 30vw'
              : '(max-width: 639px) 90vw, (max-width: 1023px) 43vw, 22vw'
          }
          className="object-cover"
        />
      </div>
      <div className={`flex flex-1 flex-col p-4 ${featured ? 'lg:p-[1.4em]' : 'lg:p-[1.2em]'}`}>
        <ResourceBadge type={resource.type} />
        <h3
          className={`mb-1 mt-2 font-bold leading-[1.17] tracking-tight ${featured ? 'text-xl lg:text-[1.35em]' : 'text-base lg:text-[1.05em]'}`}
        >
          {resource.title}
        </h3>
        {featured && (
          <p className="text-sm leading-[1.4] text-text-secondary lg:text-[1em]">
            {resource.description}
          </p>
        )}
        <div className={`mt-auto ${featured ? 'pt-3 lg:pt-[0.9em]' : 'pt-5 lg:pt-[1.3em]'}`}>
          {resource.download ? (
            <a
              href={resource.download}
              download
              className={actionClass}
              aria-label={`Download ${resource.title} CSV`}
            >
              {label}
              <ArrowRight className="size-[1.1em]" />
            </a>
          ) : (
            <button
              type="button"
              className={actionClass}
              onClick={() => onRead(resource)}
              aria-label={`${label}: ${resource.title}`}
            >
              {label}
              <ArrowRight className="size-[1.1em]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function ArticleReader({
  resource,
  onClose
}: {
  resource: ResourceArticle | null;
  onClose: () => void;
}): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (resource && !dialog.current?.open) dialog.current?.showModal();
    if (!resource && dialog.current?.open) dialog.current.close();
  }, [resource]);
  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="resource-reader-title"
      className="fixed inset-0 m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-border-default bg-white text-text-primary shadow-xl backdrop:bg-brand-dark/60"
    >
      {resource && (
        <>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border-soft bg-white px-6 py-3">
            <ResourceBadge type={resource.type} />
            <button
              type="button"
              autoFocus
              aria-label="Close resource"
              onClick={() => dialog.current?.close()}
              className={`${focus} grid size-11 place-items-center rounded-full bg-surface-soft`}
            >
              <X className="size-5" />
            </button>
          </div>
          <article className="p-6 sm:p-9">
            <h2 id="resource-reader-title" className={`${heading} text-3xl`}>
              {resource.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              {resource.description}
            </p>
            {resource.illustrative && (
              <p className="mt-5 rounded-lg bg-surface-green p-4 text-sm text-trust-lime-ink">
                Illustrative case study. This example is not a verified customer story or a claim of
                measured results.
              </p>
            )}
            <div className="mt-7 space-y-7">
              {resource.sections.map((section) => (
                <section key={section.title}>
                  <h3 className="text-lg font-bold">{section.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-text-secondary">{section.body}</p>
                </section>
              ))}
            </div>
            <Link href="/solutions" className={`${actionClass} mt-8`}>
              Explore FieldForge solutions <ArrowRight className="size-4" />
            </Link>
          </article>
        </>
      )}
    </dialog>
  );
}

function ResourcesFooter({
  onFilter
}: {
  onFilter: (type: ResourceType) => void;
}): React.JSX.Element {
  const groups = [
    {
      title: 'Platform',
      links: [
        ['Overview', '/platform'],
        ['Features', '/platform#capabilities'],
        ['Security', '/platform'],
        ['Integrations', '/platform#ecosystem']
      ]
    },
    {
      title: 'Solutions',
      links: [
        ['For Enterprises', '/solutions'],
        ['For Growing Teams', '/solutions'],
        ['For Technicians', '/technicians'],
        ['Pricing', '/pricing']
      ]
    },
    {
      title: 'Industries',
      links: [
        ['Retail & POS', '/industries'],
        ['Restaurants & Cafés', '/industries'],
        ['Hospitality', '/industries'],
        ['Warehouses & Logistics', '/industries'],
        ['All Industries', '/industries']
      ]
    }
  ];
  return (
    <footer className="bg-brand-dark text-white">
      <div className={`${frame} py-8 lg:py-[2em]`}>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-[1.7fr_0.95fr_1.05fr_1.2fr_0.8fr_1.35fr] lg:gap-[2em]">
          <div>
            <Link href="/marketing" aria-label="FieldForge home" className={focus}>
              <PlatformBrand small />
            </Link>
            <p className="mt-3 max-w-[16em] text-xs leading-relaxed text-white/75 lg:text-[0.8em]">
              Built for the industries that cannot lose track of work.
            </p>
            <div className="mt-3 flex gap-2">
              {[
                { name: 'LinkedIn', href: 'https://linkedin.com', Icon: Linkedin },
                { name: 'X', href: 'https://twitter.com', Icon: SocialX },
                { name: 'YouTube', href: 'https://youtube.com', Icon: Youtube }
              ].map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  aria-label={name}
                  target="_blank"
                  rel="noreferrer"
                  className={`${focus} grid size-11 place-items-center rounded-full border border-white/40 text-white/85 lg:size-[2em]`}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold text-trust-lime lg:text-[0.85em]">{group.title}</h3>
              <ul className="mt-3 space-y-1 text-xs text-white/80 lg:text-[0.8em]">
                {group.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className={`${focus} inline-flex min-h-11 items-center hover:text-white lg:min-h-[1.5em]`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="text-xs font-bold text-trust-lime lg:text-[0.85em]">Resources</h3>
            <ul className="mt-3 space-y-1 text-xs text-white/80 lg:text-[0.8em]">
              {(['Guides', 'Case Studies', 'Templates', 'Help Center'] as ResourceType[]).map(
                (type) => (
                  <li key={type}>
                    <button
                      type="button"
                      onClick={() => onFilter(type)}
                      className={`${focus} min-h-11 text-left hover:text-white lg:min-h-[1.5em]`}
                    >
                      {type}
                    </button>
                  </li>
                )
              )}
              <li>
                <button
                  type="button"
                  onClick={() => onFilter('All')}
                  className={`${focus} min-h-11 lg:min-h-[1.5em]`}
                >
                  Blog
                </button>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 lg:border-l lg:border-white/15 lg:pl-[2em]">
            <Link
              href="/technicians"
              className={`${focus} inline-flex min-h-11 items-center justify-center gap-3 whitespace-nowrap rounded-lg bg-brand-green px-4 text-xs font-bold text-brand-dark lg:min-h-[2.8em] lg:text-[0.85em]`}
            >
              Find Technicians <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/technicians"
              className={`${focus} inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-white/70 px-4 text-xs font-bold lg:min-h-[2.8em] lg:text-[0.85em]`}
            >
              Join as Technician
            </Link>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5 text-[10px] text-white/70 lg:mt-[2em] lg:text-[0.75em]">
          <p>© {new Date().getFullYear()} FieldForge. All rights reserved.</p>
          <p className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </p>
          <p>Field work moves the world forward. So do you.</p>
        </div>
      </div>
    </footer>
  );
}

export function ResourcesLibrary(): React.JSX.Element {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ResourceType>('All');
  const [topic, setTopic] = useState<ResourceTopic>();
  const [expanded, setExpanded] = useState(false);
  const [article, setArticle] = useState<ResourceArticle | null>(null);
  const [newsletter, setNewsletter] = useState('');
  const library = useRef<HTMLElement>(null);
  const filtered = filterResources(query, type, topic);
  const filtering = Boolean(query || type !== 'All' || topic);
  const displayed =
    filtering || expanded ? filtered : resources.filter((resource) => resource.latest);
  function showLibrary() {
    requestAnimationFrame(() => library.current?.scrollIntoView({ block: 'start' }));
  }
  function viewAll() {
    setInput('');
    setQuery('');
    setType('All');
    setTopic(undefined);
    setExpanded(true);
    showLibrary();
  }
  function chooseType(next: ResourceType) {
    setType(next);
    setTopic(undefined);
    setExpanded(true);
    showLibrary();
  }
  return (
    <div className="min-h-screen overflow-x-clip bg-white font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:text-[clamp(12px,1.12vw,18px)]">
      <PlatformNavigation activePage="/resources" />
      <main>
        <section className="bg-surface-marketing/40">
          <div
            className={`${frame} grid items-center gap-9 py-9 lg:grid-cols-[50%_43%] lg:justify-between lg:gap-0 lg:py-[2.5em]`}
          >
            <div>
              <Eyebrow>Resources</Eyebrow>
              <h1
                className={`${heading} mt-4 max-w-[12em] text-[clamp(36px,5vw,60px)] lg:mt-[0.45em] lg:text-[3.7em]`}
              >
                Field knowledge
                <br className="hidden lg:block" /> for real operations.
              </h1>
              <p className="mt-5 max-w-[30em] text-base leading-[1.4] text-text-secondary lg:mt-[1em] lg:text-[1.18em]">
                Practical guides, case studies and templates to help you build more efficient,
                reliable and scalable field operations.
              </p>
              <form
                role="search"
                className="mt-6 flex items-center gap-2 rounded-xl border border-border-default bg-white p-1 lg:mt-[2em]"
                onSubmit={(event) => {
                  event.preventDefault();
                  setQuery(input.trim());
                  setExpanded(true);
                  showLibrary();
                }}
              >
                <Search aria-hidden="true" className="ml-3 size-5 shrink-0 text-text-secondary" />
                <input
                  type="search"
                  aria-label="Search resources"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Search guides, case studies, templates..."
                  className={`${focus} h-11 min-w-0 flex-1 rounded bg-white px-1 text-xs placeholder:text-text-secondary lg:text-[0.88em]`}
                />
                <button
                  type="submit"
                  className={`${focus} min-h-11 rounded-lg bg-brand-green px-5 text-xs font-bold text-brand-dark hover:bg-brand-green-hover lg:px-[1.7em] lg:text-[0.9em]`}
                >
                  Search
                </button>
              </form>
            </div>
            <div className="relative">
              <div className="relative aspect-[1.55] overflow-hidden rounded-xl">
                <Image
                  src="/marketing/resources-technician.png"
                  alt="Field technician reviewing work on a tablet outside a commercial building"
                  fill
                  sizes="(max-width: 1023px) 90vw, 40vw"
                  priority
                  className="object-cover"
                />
              </div>
              <p className="absolute -right-[4%] top-[7%] rotate-[-5deg] rounded-xl bg-surface-marketing/95 px-[1.2em] py-[0.9em] text-[clamp(14px,1.65vw,25px)] font-medium leading-[1.3] shadow-sm lg:text-[1.35em]">
                Real insights.
                <br />
                Real operations.
                <br />
                Real results.
              </p>
            </div>
          </div>
        </section>

        <div className={`${frame} border-b border-border-soft py-3 lg:py-[1.1em]`}>
          <div
            role="group"
            aria-label="Resource types"
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-[0.7fr_1fr_1.2fr_1.15fr_1.4fr_1.1fr] lg:gap-[1.5em]"
          >
            {resourceTypes.map((item) => {
              const Icon = typeIcons[item];
              return (
                <button
                  type="button"
                  key={item}
                  aria-pressed={type === item && !topic}
                  onClick={() => chooseType(item)}
                  className={`${focus} flex min-h-12 items-center justify-center gap-3 rounded-lg px-2 text-xs lg:min-h-[3.4em] lg:gap-[1em] lg:text-[0.92em] ${type === item && !topic ? 'bg-brand-green-soft font-bold' : 'text-text-secondary hover:bg-surface-soft'}`}
                >
                  <Icon aria-hidden="true" className="size-5 lg:size-[1.6em]" />
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {!filtering && (
          <section id="featured-resources" className={`${frame} pt-9 lg:pt-[3.2em]`}>
            <Eyebrow>Featured resources</Eyebrow>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className={`${heading} text-3xl lg:text-[2.7em]`}>Editor’s picks</h2>
              <button type="button" onClick={viewAll} className={actionClass}>
                View all resources <ArrowRight className="size-[1.1em]" />
              </button>
            </div>
            <p className="mt-1 text-sm text-text-secondary lg:text-[1.05em]">
              Practical resources for your next step in the field.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-3 lg:mt-[2.2em] lg:gap-[1.7em]">
              {resources
                .filter((resource) => resource.featured)
                .map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    featured
                    onRead={setArticle}
                  />
                ))}
            </div>
          </section>
        )}

        <section
          ref={library}
          id="resource-library"
          className={`${frame} scroll-mt-6 pt-10 lg:pt-[3em]`}
        >
          <Eyebrow>Resource library</Eyebrow>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className={`${heading} text-3xl lg:text-[2.5em]`}>
              {filtering ? 'Search results' : expanded ? 'All resources' : 'Latest resources'}
            </h2>
            <button type="button" onClick={viewAll} className={actionClass}>
              View all resources <ArrowRight className="size-[1.1em]" />
            </button>
          </div>
          {(filtering || expanded) && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <p role="status">
                {displayed.length} {displayed.length === 1 ? 'resource' : 'resources'}
                {query ? ` matching “${query}”` : ''}
                {type !== 'All' ? ` · ${type}` : ''}
                {topic ? ` · ${topic}` : ''}
              </p>
              {filtering && (
                <button
                  type="button"
                  onClick={viewAll}
                  className={`${focus} min-h-11 rounded-lg bg-surface-green px-3 text-xs font-bold text-trust-lime-ink`}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
          {displayed.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:mt-[1.8em] lg:grid-cols-4 lg:gap-[2em]">
              {displayed.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} onRead={setArticle} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-border-default bg-surface-soft px-6 py-12 text-center">
              <h3 className="text-lg font-bold">No resources found</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Try another keyword or clear your filters to explore the library.
              </p>
            </div>
          )}
        </section>

        <section className={`${frame} py-10 lg:pb-[2.7em] lg:pt-[2.8em]`}>
          <Eyebrow>Browse by topic</Eyebrow>
          <h2 className={`${heading} mt-3 text-2xl lg:text-[2em]`}>Explore by category</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-[1.3em] lg:grid-cols-6 lg:gap-[0.8em]">
            {resourceTopics.map((item, index) => {
              const Icon = topicIcons[index];
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={topic === item}
                  onClick={() => {
                    setInput('');
                    setQuery('');
                    setType('All');
                    setTopic(item);
                    setExpanded(true);
                    showLibrary();
                  }}
                  className={`${focus} flex min-h-24 flex-col items-center justify-center gap-3 rounded-lg border p-3 text-center text-xs lg:min-h-[7em] lg:text-[0.9em] ${topic === item ? 'border-brand-green bg-surface-green' : 'border-border-soft bg-white hover:bg-surface-soft'}`}
                >
                  <span className="rounded-full bg-surface-marketing p-2 text-brand-dark-hover">
                    <Icon className="size-6 lg:size-[1.8em]" />
                  </span>
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="resource-newsletter-title"
          className="mx-auto mb-3 w-[calc(100%-2rem)] max-w-[1530px] rounded-3xl bg-surface-marketing px-6 py-8 lg:w-[94.2%] lg:px-[3.2em] lg:py-[2.3em]"
        >
          <div className="grid items-center gap-6 lg:grid-cols-[51%_43%] lg:justify-between">
            <div>
              <Eyebrow>Stay in the loop</Eyebrow>
              <h2
                id="resource-newsletter-title"
                className={`${heading} mt-4 text-2xl lg:mt-[0.6em] lg:text-[2.2em]`}
              >
                Get the latest field insights.
              </h2>
              <p className="mt-2 max-w-[31em] text-sm leading-snug text-text-secondary lg:text-[1.05em]">
                New guides, product updates and operational best practices delivered to your inbox.
              </p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setNewsletter(
                  'Newsletter subscriptions are not available yet. Please check back soon.'
                );
              }}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Input
                  aria-label="Newsletter email address"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="h-12! min-w-0! bg-white! text-xs!"
                />
                <button
                  type="submit"
                  className={`${focus} min-h-12 rounded-lg bg-brand-green px-7 text-xs font-bold text-brand-dark hover:bg-brand-green-hover lg:px-[2.5em] lg:text-[0.9em]`}
                >
                  Subscribe
                </button>
              </div>
              <p className="mt-2 text-xs text-text-secondary lg:text-[0.8em]">
                No spam. Unsubscribe anytime.
              </p>
              <p role="status" className="mt-2 text-xs text-trust-lime-ink">
                {newsletter}
              </p>
            </form>
          </div>
        </section>
      </main>
      <ResourcesFooter
        onFilter={(next) => {
          setInput('');
          setQuery('');
          chooseType(next);
        }}
      />
      <ArticleReader resource={article} onClose={() => setArticle(null)} />
    </div>
  );
}
