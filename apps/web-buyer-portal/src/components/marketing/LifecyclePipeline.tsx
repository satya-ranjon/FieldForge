import type { ReactElement } from 'react';
import {
  FileText,
  Users,
  Send,
  Settings,
  CheckCircle2,
  ClipboardCheck,
  Wallet,
  GitFork,
  Layers,
  ArrowRight
} from 'lucide-react';
import { marketingLayoutScale } from './MarketingHero.styles';

const pipelineStages = [
  { num: '01', title: 'CREATE', desc: 'Define work', icon: FileText },
  { num: '02', title: 'MATCH', desc: 'Find talent', icon: Users },
  { num: '03', title: 'DISPATCH', desc: 'Send tech', icon: Send },
  { num: '04', title: 'EXECUTE', desc: 'Capture data', icon: Settings },
  { num: '05', title: 'VERIFY', desc: 'Confirm proof', icon: CheckCircle2 },
  { num: '06', title: 'APPROVE', desc: 'Buyer sign-off', icon: ClipboardCheck },
  { num: '07', title: 'PAY', desc: 'Release payout', icon: Wallet }
] as const;

const summaries = [
  { value: '07', lines: ['active workflow', 'stages'], icon: GitFork },
  { value: '1', lines: ['single operational', 'thread'], icon: Layers }
] as const;

export function LifecyclePipeline(): ReactElement {
  return (
    <section
      id="lifecycle"
      aria-labelledby="lifecycle-title"
      className={`${marketingLayoutScale} relative mx-auto w-[calc(100%-2.5rem)] pt-6 pb-4 font-[family-name:Arial,Helvetica,sans-serif] text-text-primary lg:w-[calc(var(--hero-unit)*86.4)] lg:pt-[2em] lg:pb-[1em] lg:text-[length:var(--hero-unit)]`}
    >
      <div className="grid gap-6 lg:grid-cols-[33%_minmax(0,1fr)] lg:gap-[2em]">
        <div>
          <span className="inline-flex items-center gap-[0.6em] rounded-full border border-border-soft bg-surface-white px-[1em] py-[0.5em] text-[0.625rem] font-bold uppercase leading-none lg:text-[0.8em]">
            <span className="size-[0.8em] rounded-full bg-brand-green" aria-hidden="true" />
            Lifecycle
          </span>
          <h2
            id="lifecycle-title"
            className="mt-3 font-[family-name:'FieldForge_Hero',Arial,sans-serif] text-[clamp(1.75rem,4vw,2.5rem)] font-black leading-[1.1] tracking-[-0.025em] lg:mt-[0.3em] lg:text-[3em]"
          >
            <span className="block">One platform.</span>
            <span className="block lg:whitespace-nowrap">Every step of the job.</span>
          </h2>
          <p className="mt-3 max-w-[30em] text-sm leading-[1.35] text-text-secondary lg:mt-[0.6em] lg:text-[1.2em]">
            From the first work order to verified completion and payout, FieldForge keeps every
            handoff visible, accountable and ready for action.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:gap-[1.9em] lg:pt-[1.3em]">
          <dl
            aria-label="Workflow summary"
            className="grid grid-cols-2 gap-3 sm:ml-auto sm:w-[35.5em] lg:w-[35.5em] lg:gap-[1.5em]"
          >
            {summaries.map(({ value, lines, icon: Icon }) => (
              <div
                key={value}
                className="flex min-w-0 items-center justify-between gap-2 rounded-[0.9em] border border-border-soft bg-surface-white p-3 lg:h-[6.7em] lg:px-[1.3em] lg:py-[1em]"
              >
                <div className="flex min-w-0 flex-col">
                  <dt className="text-xs leading-[1.15] text-text-secondary lg:text-[1.1em]">
                    {lines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </dt>
                  <dd className="order-first text-2xl font-bold leading-none tracking-tight lg:text-[2.3em]">
                    {value}
                  </dd>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-[1em] bg-surface-soft text-trust-lime-ink lg:size-[4.5em]">
                  <Icon
                    className={`size-[60%] stroke-[2.2] ${value === '07' ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </span>
              </div>
            ))}
          </dl>

          <ol
            aria-label="Work order lifecycle"
            className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-7 lg:gap-[1.3em]"
          >
            {pipelineStages.map(({ num, title, desc, icon: Icon }, index) => {
              const active = title === 'DISPATCH';
              return (
                <li
                  key={num}
                  className="relative min-w-0"
                  aria-current={active ? 'step' : undefined}
                >
                  <div
                    className={`relative flex h-full min-h-28 flex-col items-start rounded-[0.9em] border p-3 lg:min-h-[7.4em] lg:px-[1.05em] lg:py-[0.8em] ${
                      active
                        ? "border-lifecycle-active-border bg-lifecycle-active after:absolute after:bottom-0 after:left-[1.4em] after:h-px after:w-[2.4em] after:bg-trust-lime-ink after:content-['']"
                        : 'border-border-soft bg-surface-white'
                    }`}
                  >
                    <span className="text-xs font-bold leading-[1.2] text-text-secondary lg:text-[0.85em]">
                      {num}
                    </span>
                    <Icon
                      className="mt-1 mb-1.5 size-5 stroke-[2.5] lg:mt-[0.4em] lg:mb-[0.55em] lg:size-[1.65em]"
                      aria-hidden="true"
                    />
                    <h3 className="text-xs font-bold leading-[1.15] lg:text-[0.85em]">{title}</h3>
                    <p className="mt-0.5 text-[0.6875rem] leading-[1.15] text-text-secondary lg:mt-[0.2em] lg:whitespace-nowrap lg:text-[0.8em]">
                      {desc}
                    </p>
                  </div>
                  {index < pipelineStages.length - 1 && (
                    <ArrowRight
                      className="pointer-events-none absolute top-1/2 -right-[1.2em] hidden size-[1.1em] -translate-y-1/2 text-text-muted lg:block"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
