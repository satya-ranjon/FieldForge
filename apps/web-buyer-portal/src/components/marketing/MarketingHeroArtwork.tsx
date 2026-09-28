import type { ReactElement } from 'react';
import { Asterisk, CarFront, MapPin } from 'lucide-react';
import Image from 'next/image';
import { heroStyles as styles } from './MarketingHero.styles';

/** Small graphics stay vector-based so they remain sharp at any browser zoom. */
export function MarketingBrandMark(): ReactElement {
  return (
    <svg viewBox="0 0 30 30" aria-hidden="true" className={styles.brandMark}>
      <rect width="30" height="30" rx="8" fill="currentColor" />
      <path
        d="M11 9.5h10M10.5 15h7M10.5 15 9 22"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TrackingMap(): ReactElement {
  return (
    <>
      <img
        src="/marketing/hero-tracking-map.png"
        width={1774}
        height={887}
        className={styles.mapImage}
        alt=""
      />
      <MapPin className={styles.mapPin} aria-hidden="true" />
      <span className={styles.mapCar}>
        <CarFront aria-hidden="true" />
      </span>
    </>
  );
}

export function TechnicianAvatar(): ReactElement {
  return (
    <Image
      className={styles.technicianAvatar}
      src="/marketing/hero-tracking-avatar.png"
      sizes="34px"
      loading="eager"
      width={64}
      height={64}
      alt=""
    />
  );
}

export function TrustedBusinesses(): ReactElement {
  return (
    <div className={styles.trust}>
      <p>Trusted by modern businesses</p>
      <ul aria-label="Trusted businesses">
        <li aria-label="cisco" className={styles.cisco}>
          <svg viewBox="0 0 48 12" aria-hidden="true">
            <path
              d="M4 8V6M9 8V3M14 10V1M19 8V3M24 8V6M29 8V3M34 10V1M39 8V3M44 8V6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>cisco</span>
        </li>
        <li className={styles.walmart}>
          Walmart <Asterisk aria-hidden="true" />
        </li>
        <li className={styles.cbre}>CBRE</li>
        <li className={styles.siemens}>SIEMENS</li>
        <li className={styles.verizon}>verizon</li>
      </ul>
    </div>
  );
}
