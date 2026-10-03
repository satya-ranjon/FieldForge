import type { ReactElement } from 'react';
import {
  ChartNoAxesColumnIncreasing,
  CreditCard,
  Navigation,
  Shield,
  UserRound
} from 'lucide-react';
import { marketingLayoutScale } from './MarketingHero.styles';

const assurances = [
  { icon: UserRound, lines: ['Verified', 'Professionals'], tone: 'lime' },
  { icon: Navigation, lines: ['GPS Verified', 'Arrival'], tone: 'teal' },
  { icon: CreditCard, lines: ['Protected', 'Payments'], tone: 'lime' },
  { icon: Shield, lines: ['Compliance', 'Ready'], tone: 'teal' },
  { icon: ChartNoAxesColumnIncreasing, lines: ['Real-Time', 'Operations'], tone: 'lime' }
] as const;

const toneClasses = {
  lime: 'bg-trust-lime text-trust-lime-ink',
  teal: 'bg-trust-teal text-trust-teal-ink'
} as const;

const orbitClasses =
  'pointer-events-none absolute top-1/2 z-0 h-[14rem] w-28 -translate-y-1/2 object-contain opacity-20 sm:w-[clamp(5rem,8.4vw,11.4rem)] sm:opacity-30 lg:h-[clamp(8.5rem,11.5vw,13.65rem)] lg:w-[calc(var(--hero-unit)*8)] lg:opacity-60';

export function MarketingTrustStrip(): ReactElement {
  return (
    <section
      id="platform-assurances"
      className={`${marketingLayoutScale} relative isolate mt-4 w-full overflow-hidden py-10 font-[family-name:Arial,Helvetica,sans-serif] text-text-primary sm:mt-8 sm:py-[clamp(3rem,4.05vw,5.5rem)]`}
      aria-label="Platform assurances"
    >
      <div className="relative mx-auto w-[min(22rem,calc(100%-3rem))] max-w-marketing-page sm:w-[min(52rem,calc(100%-6rem))] lg:w-[calc(var(--hero-unit)*86.4)]">
        <img
          className={`${orbitClasses} -left-16 lg:-left-[calc(var(--hero-unit)*9)]`}
          src="/marketing/trust-orbit.png"
          width={971}
          height={1619}
          alt=""
        />
        <ul className="relative z-1 m-0 grid w-full list-none grid-cols-1 gap-0 p-0 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-8 lg:grid-cols-5 lg:gap-0">
          {assurances.map(({ icon: Icon, lines, tone }) => (
            <li
              key={lines.join(' ')}
              className="relative flex min-w-0 items-center gap-6 border-border-default py-4 not-last:border-b after:absolute after:top-1/2 after:right-0 after:hidden after:h-[90%] after:w-px after:-translate-y-1/2 after:bg-border-default after:content-[''] last:after:hidden sm:gap-[clamp(1rem,1.25vw,1.7rem)] sm:py-0 sm:not-last:border-b-0 sm:after:block sm:max-lg:even:after:hidden sm:max-lg:last:col-span-full sm:max-lg:last:justify-self-center lg:justify-center lg:gap-[calc(var(--hero-unit)*1.2)] lg:first:justify-start lg:last:justify-end"
            >
              <span
                className={`grid aspect-square w-[clamp(3rem,3.684vw,5rem)] shrink-0 place-items-center rounded-full lg:w-[calc(var(--hero-unit)*4)] ${toneClasses[tone]}`}
              >
                <Icon className="h-[46%] w-[46%]" aria-hidden="true" strokeWidth={2} />
              </span>
              <h2 className="m-0 text-lg leading-[1.2] font-bold tracking-tight lg:text-[length:max(0.875rem,calc(var(--hero-unit)*1.25))]">
                {lines.map((line) => (
                  <span key={line} className="block whitespace-nowrap">
                    {line}
                  </span>
                ))}
              </h2>
            </li>
          ))}
        </ul>
        <img
          className={`${orbitClasses} -right-16 rotate-180 lg:-right-[calc(var(--hero-unit)*9)]`}
          src="/marketing/trust-orbit.png"
          width={971}
          height={1619}
          alt=""
        />
      </div>
    </section>
  );
}
