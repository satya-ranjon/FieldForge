'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Calculator,
  Minus,
  Percent,
  Plus,
  UserRound
} from 'lucide-react';
import { platformFocus as focus } from '../platform/PlatformPrimitives';
import {
  calculatePricingPreview,
  formatPreviewMoney,
  parseJobAmount,
  pricingFaqs
} from './pricing-model';

export function PricingExample(): React.JSX.Element {
  const [amount, setAmount] = useState('100');
  const cents = parseJobAmount(amount);
  const preview = cents === null ? null : calculatePricingPreview(cents);
  return (
    <div className="mt-5">
      <div className="grid items-center gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1.2fr_auto_1.3fr_1.7fr] lg:gap-[1.2em]">
        <div className="flex min-h-28 items-center gap-3 rounded-xl border border-border-soft bg-white p-4 lg:min-h-[7em] lg:gap-[0.8em] lg:p-[0.9em]">
          <BriefcaseBusiness className="size-11 shrink-0 rounded-lg bg-brand-green-subtle p-2 text-trust-lime-ink lg:size-[3em]" />
          <div className="min-w-0">
            <label
              htmlFor="pricing-job-amount"
              className="block text-xs text-text-secondary lg:text-[0.8em]"
            >
              Job amount
            </label>
            <div className="mt-1 flex items-center text-xl font-bold lg:text-[1.3em]">
              <span aria-hidden="true">$</span>
              <input
                id="pricing-job-amount"
                aria-label="Example job amount in dollars"
                aria-describedby="pricing-example-note pricing-example-error"
                aria-invalid={cents === null}
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                maxLength={10}
                className={`${focus} min-h-11 w-full min-w-0 rounded border-b border-border-strong bg-transparent text-inherit font-bold lg:min-h-[1.7em]`}
              />
            </div>
          </div>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="hidden size-[1.1em] text-text-secondary lg:block"
        />
        <div className="flex min-h-28 items-center gap-3 rounded-xl border border-border-soft p-4 lg:min-h-[7em] lg:gap-[0.8em] lg:p-[0.9em]">
          <Percent className="size-11 shrink-0 rounded-lg bg-brand-green-subtle p-2 text-trust-lime-ink lg:size-[3em]" />
          <div>
            <p className="text-xs text-text-secondary lg:text-[0.8em]">Platform fee (12%)</p>
            <output
              data-testid="platform-fee"
              className="mt-1 block text-xl font-bold lg:text-[1.3em]"
            >
              {preview ? formatPreviewMoney(preview.platformFeeCents) : '—'}
            </output>
          </div>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="hidden size-[1.1em] text-text-secondary lg:block"
        />
        <div className="flex min-h-28 items-center gap-3 rounded-xl border border-border-soft p-4 lg:min-h-[7em] lg:gap-[0.8em] lg:p-[0.9em]">
          <UserRound className="size-11 shrink-0 rounded-lg bg-brand-green-subtle p-2 text-trust-lime-ink lg:size-[3em]" />
          <div>
            <p className="text-xs text-text-secondary lg:text-[0.8em]">Technician earnings</p>
            <output
              data-testid="technician-earnings"
              className="mt-1 block text-xl font-bold lg:text-[1.3em]"
            >
              {preview ? formatPreviewMoney(preview.technicianCents) : '—'}
            </output>
          </div>
        </div>
        <div className="flex min-h-28 items-center gap-4 rounded-xl bg-surface-marketing p-5 lg:min-h-[8em] lg:gap-[1em] lg:p-[1em]">
          <Calculator className="size-12 shrink-0 rounded-lg bg-white p-2 text-trust-lime-ink lg:size-[3.5em]" />
          <div>
            <p className="text-xs font-semibold lg:text-[0.9em]">Your total cost</p>
            <output
              data-testid="customer-total"
              className="mt-1 block text-xl font-bold lg:text-[1.4em]"
            >
              {preview ? formatPreviewMoney(preview.customerTotalCents) : '—'}
            </output>
            <p className="mt-2 max-w-[14em] text-xs leading-relaxed text-text-secondary lg:text-[0.75em]">
              Job amount plus the platform fee, with no deduction from technician earnings.
            </p>
          </div>
        </div>
      </div>
      <p id="pricing-example-note" className="mt-3 text-xs text-text-secondary lg:text-[0.72em]">
        Illustrative USD calculation, excluding any applicable taxes. Edit the job amount to explore
        the example.
      </p>
      <p id="pricing-example-error" role="status" className="mt-1 text-xs text-red-700">
        {cents === null
          ? 'Enter an amount from $1 to $1,000,000 with up to two decimal places.'
          : ''}
      </p>
    </div>
  );
}
export function PricingFaq(): React.JSX.Element {
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(pricingFaqs.map((_, index) => index))
  );
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 lg:gap-x-[2em] lg:gap-y-[0.6em]">
      {pricingFaqs.map((faq, index) => {
        const open = expanded.has(index);
        return (
          <div
            key={faq.question}
            className="rounded-lg border border-border-soft bg-white px-4 py-2 lg:px-[0.9em] lg:py-[0.65em]"
          >
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`pricing-answer-${index}`}
                onClick={() =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(index)) next.delete(index);
                    else next.add(index);
                    return next;
                  })
                }
                className={`${focus} flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-bold lg:min-h-[1.7em] lg:text-[0.9em]`}
              >
                {faq.question}
                <span className="grid size-6 shrink-0 place-items-center rounded bg-brand-green-soft text-trust-lime-ink">
                  {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
                </span>
              </button>
            </h3>
            <p
              id={`pricing-answer-${index}`}
              hidden={!open}
              className="pb-1 pr-6 text-xs leading-[1.45] text-text-secondary lg:text-[0.86em]"
            >
              {faq.answer}
            </p>
          </div>
        );
      })}
    </div>
  );
}
