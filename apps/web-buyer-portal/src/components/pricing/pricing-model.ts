// Marketing preview only; not consumed by billing or payment services.
export const PREVIEW_FEE_PERCENT = 12;
export const MAX_PREVIEW_JOB_CENTS = 100_000_000;

export function parseJobAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return null;
  const [dollars, decimal = ''] = trimmed.split('.');
  const cents = Number(dollars) * 100 + Number(decimal.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents >= 100 && cents <= MAX_PREVIEW_JOB_CENTS
    ? cents
    : null;
}

export function calculatePricingPreview(jobCents: number) {
  if (!Number.isSafeInteger(jobCents) || jobCents < 100 || jobCents > MAX_PREVIEW_JOB_CENTS) {
    throw new RangeError('Preview job amount must be between $1 and $1,000,000 in whole cents.');
  }
  const platformFeeCents = Math.round((jobCents * PREVIEW_FEE_PERCENT) / 100);
  return {
    jobCents,
    platformFeeCents,
    technicianCents: jobCents,
    customerTotalCents: jobCents + platformFeeCents
  };
}
export function formatPreviewMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}
export const pricingFaqs = [
  {
    question: 'When do I pay the 12% fee?',
    answer:
      'The platform fee applies after the job is successfully completed and the work is approved. A separate authorization or hold for the job amount may be required before work begins.'
  },
  {
    question: 'What if I’m not satisfied with the work?',
    answer:
      'Raise the issue before approving completion. Keep the work order, photos and notes together so the concern can be reviewed through the dispute process.'
  },
  {
    question: 'Is there any subscription for customers?',
    answer:
      'There is no subscription in this pricing model. The platform fee is based on the completed job amount.'
  },
  {
    question: 'Is the 12% fee included in the job amount?',
    answer:
      'No. The platform fee is added separately. For a $100 job, the fee is $12 and the customer total is $112; the technician receives the full $100 job amount.'
  },
  {
    question: 'Do technicians pay any fees?',
    answer:
      'Technicians can join and use the platform for free under this model. The customer pays the platform fee, so it is not deducted from technician earnings.'
  },
  {
    question: 'Are there any hidden charges?',
    answer:
      'The example shows the job amount and platform fee separately. Review the final payment breakdown, including any applicable taxes or payment terms, before confirming work.'
  }
] as const;
