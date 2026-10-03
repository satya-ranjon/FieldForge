/** Tailwind utilities preserve the existing em-based reference composition. */
export const marketingLayoutScale =
  '[--hero-unit:0.625rem] min-[75rem]:[--hero-unit:0.8125rem] min-[93.75rem]:[--hero-unit:0.975rem]';
// Match the compact homepage navbar/hero without changing page typography.
export const marketingContentFrame = `${marketingLayoutScale} mx-auto w-[calc(100%-2.5rem)] max-w-marketing-page min-[56.25rem]:w-[calc(var(--hero-unit)*86.4)]`;
// Homepage panels intentionally sit slightly wider than its text/navigation frame.
export const marketingPanelFrame = `${marketingLayoutScale} mx-auto w-[calc(100%-2rem)] max-w-marketing-page lg:w-[calc(var(--hero-unit)*89)]`;
const scale = `${marketingLayoutScale} font-[family-name:Arial,Helvetica,sans-serif] text-[length:var(--hero-unit)]`;
const whiteCard =
  'absolute z-1 rounded-[1.2em] border border-border-soft bg-[rgb(255_255_255/97%)] shadow-[0_10px_30px_rgb(10_20_15/8%)]';
const darkCard =
  'absolute z-1 rounded-[1.15em] border border-[rgb(255_255_255/20%)] bg-[color-mix(in_srgb,var(--color-text-primary)_25%,var(--color-marketing-glass))] text-white shadow-[0_12px_30px_rgb(10_20_15/18%)] backdrop-blur-[12px]';
const action =
  'inline-flex items-center justify-center gap-[0.9em] min-h-[3.5em] rounded-[1em] px-[1.9em] py-[0.9em] text-[1em] font-bold transition-[background] duration-150 ease-[ease] max-[56.249rem]:min-h-11 max-[56.249rem]:px-[1.5em] max-[56.249rem]:text-[1.2em]';
const cardHeading =
  '[&_h2]:text-[0.9em] [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:leading-[1.4] [&_h2]:whitespace-nowrap [&_p]:mt-[0.5em] [&_p]:text-[0.8em] [&_p]:leading-[1.35] [&_p]:text-text-secondary';
const businessPill =
  '[&_li]:flex [&_li]:items-center [&_li]:justify-center [&_li]:w-[calc(var(--hero-unit)*5.45)] [&_li]:min-w-[calc(var(--hero-unit)*5.45)] [&_li]:h-[calc(var(--hero-unit)*2.4)] [&_li]:px-[0.8em] [&_li]:border [&_li]:border-border-soft [&_li]:rounded-[999px] [&_li]:bg-surface-white [&_li]:text-[1em] [&_li]:font-[750] [&_li]:tracking-[-0.04em] [&_li:nth-child(2)]:text-[0.8em] [&_li:nth-child(4)]:text-[0.8em]';

export const heroStyles = {
  hero: `${scale} relative overflow-hidden text-text-primary [&_a:focus-visible]:outline-[3px] [&_a:focus-visible]:outline-solid [&_a:focus-visible]:outline-brand-green-active [&_a:focus-visible]:outline-offset-4`,
  frame:
    'relative mx-auto grid w-[calc(var(--hero-unit)*86.4)] max-w-marketing-page min-h-[59.5em] grid-cols-[38.95%_61.05%] max-[56.249rem]:flex max-[56.249rem]:w-[calc(100%-2.5rem)] max-[56.249rem]:flex-col',
  copy: 'relative z-2 pt-[2.6em] min-[56.25rem]:min-h-[59.5em] max-[56.249rem]:pt-[2em]',
  eyebrow:
    'inline-flex items-center gap-[0.9em] rounded-[999px] border border-border-default bg-surface-white px-[1.2em] py-[0.78em] text-[0.76em] font-[750] uppercase shadow-[0_2px_6px_rgb(10_20_15/4%)] [&>span]:size-[0.85em] [&>span]:rounded-[50%] [&>span]:bg-brand-green-hover min-[56.25rem]:absolute min-[56.25rem]:top-[calc(var(--hero-unit)*2.6)] min-[56.25rem]:left-0 max-[56.249rem]:text-[0.9em]',
  title:
    "m-0 font-[family-name:'FieldForge_Hero',Arial,sans-serif] text-[5.05em] font-black leading-[0.91] tracking-[-0.02em] [&>span]:block min-[56.25rem]:absolute min-[56.25rem]:top-[calc(var(--hero-unit)*6.9)] min-[56.25rem]:left-0 max-[56.249rem]:mt-[0.5em] max-[56.249rem]:text-[clamp(2.5rem,calc(1.75rem+3vw),4rem)]",
  highlight:
    "relative w-fit text-marketing-heading-accent no-underline after:absolute after:left-[-0.04em] after:bottom-[-0.05em] after:h-[0.18em] after:w-[70%] after:bg-[url('/marketing/hero-underline.png')] after:bg-size-[100%_500%] after:bg-center after:bg-no-repeat after:content-['']",
  intro:
    'mt-[1.45em] max-w-[25em] text-[1.3em] leading-[1.35] tracking-normal min-[56.25rem]:absolute min-[56.25rem]:top-[calc(var(--hero-unit)*26.8)] min-[56.25rem]:left-0 min-[56.25rem]:m-0 min-[56.25rem]:w-[calc(var(--hero-unit)*33)] max-[56.249rem]:max-w-[30em] max-[56.249rem]:text-[1.5em]',
  description:
    'mt-[0.85em] max-w-[27em] text-[1.2em] leading-[1.4] tracking-[-0.015em] text-text-secondary min-[56.25rem]:absolute min-[56.25rem]:top-[calc(var(--hero-unit)*31.4)] min-[56.25rem]:left-0 min-[56.25rem]:m-0 min-[56.25rem]:w-[calc(var(--hero-unit)*33)] max-[56.249rem]:max-w-[32em] max-[56.249rem]:text-[1.4em]',
  actions:
    'mt-[2em] flex gap-[0.9em] [&_svg]:size-[1.4em] min-[56.25rem]:absolute min-[56.25rem]:top-[calc(var(--hero-unit)*38.2)] min-[56.25rem]:left-0 min-[56.25rem]:m-0 max-[56.249rem]:mt-[2.4em]',
  primaryAction: `${action} bg-marketing-lime text-brand-dark hover:bg-brand-green-hover`,
  secondaryAction: `${action} border border-border-default bg-surface-page hover:bg-surface-white`,
  playIcon:
    'grid size-[1.7em] place-items-center rounded-[50%] bg-text-primary text-white [&_svg]:size-[0.85em]! [&_svg]:fill-current',
  benefits:
    'mt-[2.2em] flex list-none gap-[3em] p-0 text-[0.82em] text-text-secondary [&_li]:flex [&_li]:items-center [&_li]:gap-[0.95em] [&_li]:whitespace-nowrap [&_svg]:size-[1.5em] [&_svg]:shrink-0 [&_svg]:fill-current [&_svg]:stroke-white [&_svg]:text-marketing-check min-[56.25rem]:absolute min-[56.25rem]:top-[calc(var(--hero-unit)*43.7)] min-[56.25rem]:left-0 min-[56.25rem]:m-0 max-[56.249rem]:flex-wrap max-[56.249rem]:gap-x-[1.5em] max-[56.249rem]:gap-y-[1em] max-[56.249rem]:text-[0.95em]',
  trust: `${businessPill} mt-[6.2em] text-text-secondary [&_p]:mb-[0.8em] [&_p]:text-[0.95em] [&_ul]:flex [&_ul]:list-none [&_ul]:gap-[0.95em] [&_ul]:p-0 min-[56.25rem]:absolute min-[56.25rem]:top-[calc(var(--hero-unit)*51.2)] min-[56.25rem]:left-0 min-[56.25rem]:m-0 max-[56.249rem]:mt-[3em] max-[56.249rem]:[&_p]:text-[1.1em] max-[56.249rem]:[&_ul]:flex-wrap`,
  cisco:
    'flex-col gap-0 text-[0.9em]! leading-[0.8] tracking-[0.12em]! [&_svg]:h-[0.9em] [&_svg]:w-[3.5em]',
  walmart:
    'gap-[0.25em] tracking-[-0.05em]! [&_span]:text-[1.6em] [&_svg]:size-[1.2em] [&_svg]:shrink-0',
  cbre: 'text-[1.1em]! font-black!',
  siemens: 'font-extrabold! tracking-[0.025em]!',
  verizon: 'font-[750]!',
  visual:
    'relative h-[59.5em] min-w-0 max-[56.249rem]:[--hero-unit:clamp(0.375rem,calc(0.125rem+1.13vw),0.6875rem)] max-[56.249rem]:mt-[2em] max-[56.249rem]:h-auto max-[56.249rem]:w-full max-[56.249rem]:aspect-[1/1.15] max-[56.249rem]:text-[length:var(--hero-unit)]',
  technicianPhoto:
    'absolute -left-[4em] -top-[3.2em] size-[64em] max-w-none object-contain max-[56.249rem]:left-0 max-[56.249rem]:top-0 max-[56.249rem]:h-auto max-[56.249rem]:w-full',
  jobCard: `${whiteCard} flex min-h-[6.5em] w-[15.5em] items-start gap-[0.85em] p-[1em]`,
  security:
    'left-[35em] top-[8.4em] max-[56.249rem]:left-auto max-[56.249rem]:right-0 max-[56.249rem]:top-[15%]',
  signage:
    'w-[15.2em]! left-[37.6em] top-[20.6em] max-[56.249rem]:left-auto max-[56.249rem]:right-0 max-[56.249rem]:top-[39%]',
  pos: 'w-[15.1em]! left-[0.2em] top-[20.2em] max-[56.249rem]:left-0 max-[56.249rem]:top-[35%]',
  jobIcon:
    'grid size-[3em] shrink-0 place-items-center rounded-[0.7em] bg-surface-soft text-marketing-glass [&_svg]:size-[2.2em] [&_svg]:stroke-[1.6] [&_img]:size-full [&_img]:object-contain',
  jobDetails: `min-w-0 ${cardHeading}`,
  jobStatus:
    "h-auto! min-h-0 mt-[0.35em] px-[0.6em]! py-[0.2em]! text-[0.72em]! tracking-normal! border-0! gap-[0.45em]! font-normal! before:size-[0.65em] before:rounded-[50%] before:bg-current before:content-['']",
  previewScheduled: 'bg-marketing-status-soft! text-marketing-status-green!',
  previewUrgent: 'bg-status-danger-soft! text-marketing-status-red!',
  jobArrow: 'absolute right-[1.1em] bottom-[1.1em] size-[1em]',
  tracking: `${darkCard} left-[2.9em] top-[5.1em] w-[17.3em] p-[1em] [&_h2]:flex [&_h2]:items-center [&_h2]:gap-[0.8em] [&_h2]:mb-[0.6em] [&_h2]:text-[1em] [&_h2]:font-semibold [&_h2>span]:size-[0.65em] [&_h2>span]:rounded-[50%] [&_h2>span]:bg-marketing-lime max-[56.249rem]:left-0 max-[56.249rem]:top-[7%]`,
  trackingMap: 'relative h-[8em] overflow-hidden rounded-[0.7em] bg-marketing-map',
  mapImage: 'block size-full object-fill opacity-90',
  mapPin:
    'absolute right-[0.5em] bottom-[2.5em] h-[2.4em] w-[2em] fill-current text-marketing-check [&_circle]:fill-white [&_circle]:stroke-white',
  mapCar:
    'absolute -bottom-[0.1em] left-[5em] grid size-[2.6em] place-items-center rounded-[50%] bg-marketing-lime text-brand-dark shadow-[0_0_1em_color-mix(in_srgb,var(--color-marketing-lime)_30%,transparent)] [&_svg]:size-[1.5em]',
  technician:
    'absolute top-[0.9em] left-[0.7em] flex items-start gap-[0.8em] [&_strong]:block [&_strong]:text-[0.8em] [&_strong]:leading-[1.5] [&_span]:block [&_span]:text-[0.8em] [&_span]:leading-[1.5] [&_span]:text-marketing-lime [&_small]:block [&_small]:text-[0.8em] [&_small]:leading-[1.5] [&_small]:text-[rgb(255_255_255/80%)]',
  technicianAvatar:
    'grid size-[2.1em] place-items-center rounded-[50%] bg-surface-soft object-cover text-marketing-glass [&_svg]:size-[1.9em]',
  activeJobs: `${darkCard} left-[1.55em] top-[34.6em] h-[8.5em] w-[23.1em] p-[1.35em] [&_dl]:mt-[0.7em] [&_dl]:grid [&_dl]:grid-cols-4 [&_dl]:gap-[0.5em] [&_dl>div]:flex [&_dl>div]:flex-col [&_dl>div]:pl-[0.7em] [&_dl>div]:border-l [&_dl>div]:border-[rgb(255_255_255/9%)] [&_dl>div:first-child]:pl-0 [&_dl>div:first-child]:border-0 [&_dt]:text-[0.8em] [&_dt]:leading-[1.2] [&_dt]:whitespace-nowrap [&_dd]:order-first [&_dd]:text-[1.7em] [&_dd]:font-[650] [&_dd]:leading-[1.3] max-[56.249rem]:left-0 max-[56.249rem]:top-[65%]`,
  jobsHeader:
    'flex items-center justify-between border-b border-[rgb(255_255_255/14%)] pb-[0.7em] [&_h2]:text-[0.95em] [&_h2]:font-semibold [&_h2]:leading-[1.2] [&_a]:flex [&_a]:items-center [&_a]:gap-[0.5em] [&_a]:text-[0.8em] [&_svg]:size-[1.2em] max-[56.249rem]:[&_a]:min-h-11 max-[56.249rem]:[&_a]:-my-[1em]',
  lime: 'text-marketing-lime',
  cyan: 'text-status-info',
  yellow: 'text-status-warning',
  white: 'text-white',
  verified: `${whiteCard} ${cardHeading} left-[39.7em] top-[39.9em] flex w-[14.3em] items-center gap-[1em] p-[1.1em] [&>span]:grid [&>span]:size-[2.5em] [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-[50%] [&>span]:bg-marketing-check [&>span]:text-white [&_svg]:size-[1.5em] max-[56.249rem]:left-auto max-[56.249rem]:right-0 max-[56.249rem]:top-[70%]`,
  stats: `${whiteCard} left-[1.05em] top-[49.4em] grid min-h-[6.3em] w-[53.5em] grid-cols-[23%_25.5%_26%_25.5%] items-center px-[1.5em] py-[1.4em] max-[56.249rem]:relative max-[56.249rem]:left-auto max-[56.249rem]:top-auto max-[56.249rem]:w-full max-[56.249rem]:mt-[110%] max-[56.249rem]:mb-[3em] max-[56.249rem]:p-[1.5em] max-[56.249rem]:grid-cols-2 max-[56.249rem]:gap-x-0 max-[56.249rem]:gap-y-[1.5em] max-[56.249rem]:text-[1.5em]`,
  stat: "flex items-center gap-[0.8em] px-[1em] border-r border-border-soft first:pl-0 last:pr-0 last:border-0 [&>div]:flex [&>div]:flex-col [&_dt]:mt-[0.3em] [&_dt]:text-[0.75em] [&_dt]:leading-[1.2] [&_dt]:text-text-secondary [&_dt]:whitespace-nowrap [&_dd]:font-[family-name:'FieldForge_Hero',Arial,sans-serif] [&_dd]:order-first [&_dd]:text-[1.4em] [&_dd]:font-[750] [&_dd]:leading-[1.1] [&_dd]:tracking-[-0.04em] max-[56.249rem]:nth-2:border-0 max-[56.249rem]:nth-3:pl-0",
  statIcon: 'grid size-[3em] shrink-0 place-items-center rounded-[50%] [&_svg]:size-[1.6em]',
  green: 'bg-brand-green-soft text-status-success',
  blue: 'bg-status-info-soft text-status-info',
  amber: 'bg-status-warning-soft text-status-warning',
  referenceNavbar: `${scale} [&>div:first-child]:w-[calc(var(--hero-unit)*86.4)] [&>div:first-child]:max-w-marketing-page [&>div:first-child]:mx-auto [&>div:first-child]:h-[calc(var(--hero-unit)*6.1)] [&>div:first-child]:px-0 [&>div:first-child]:gap-[2em] [&_a[aria-label='FieldForge_home']]:gap-[1em] [&_a[aria-label='FieldForge_home']>span:first-child]:size-[2.9em] [&_a[aria-label='FieldForge_home']>span:first-child]:rounded-[0.8em] [&_a[aria-label='FieldForge_home']>span:first-child]:shadow-none [&_a[aria-label='FieldForge_home']>span:last-child]:text-[1.85em] [&>div:first-child>nav]:flex [&>div:first-child>nav]:gap-[2.8em] [&>div:first-child>nav]:mr-auto [&>div:first-child>nav]:ml-[2em] [&>div:first-child>nav_a]:text-[0.9em] [&>div:first-child>div]:flex [&>div:first-child>div]:gap-[0.9em] [&>div:first-child>div>button]:h-[3.5em] [&>div:first-child>div>button]:min-h-9 [&>div:first-child>div>button]:px-[1.4em] [&>div:first-child>div>button]:rounded-[1em] [&>div:first-child>div>button]:text-[0.95em] [&>div:first-child>div>button]:whitespace-nowrap [&>div:first-child>div>button]:shadow-none [&>div:first-child>div>a]:h-[3.5em] [&>div:first-child>div>a]:min-h-9 [&>div:first-child>div>a]:px-[1.3em] [&>div:first-child>div>a]:rounded-[1em] [&>div:first-child>div>a]:text-[0.95em] [&>div:first-child>div>a]:whitespace-nowrap [&>div:first-child>div>a]:shadow-none [&>div:first-child>div>a]:gap-[0.6em] [&>div:first-child>div>a_svg]:size-[1.3em] [&>div:first-child>div>button[aria-label=Search]]:w-[3em] [&>div:first-child>div>button[aria-label=Search]]:p-0 [&>div:first-child>div>button[aria-label=Search]_svg]:size-[1.5em] [&>div>button]:hidden max-[56.249rem]:[&>div:first-child]:w-[calc(100%-2.5rem)] max-[56.249rem]:[&>div:first-child]:h-[68px] max-[56.249rem]:[&>div:first-child>nav]:hidden max-[56.249rem]:[&>div:first-child>div]:hidden max-[56.249rem]:[&>div>button]:flex max-[56.249rem]:[&>nav_a]:min-h-11 max-[56.249rem]:[&>nav_button]:min-h-11`,
  referenceBrand: 'shrink-0',
  brandMark: 'block size-full text-marketing-lime',
  joinAccent: 'text-marketing-lime',
  routeDecoration:
    'pointer-events-none absolute left-0 -top-[2em] h-[42em] w-[14em] object-contain opacity-50 max-[56.249rem]:hidden'
} as const;
