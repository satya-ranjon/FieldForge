import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Check,
  CircleCheck,
  FileText,
  Play,
  ShieldCheck,
  Star,
  Users
} from 'lucide-react';
import { StatusBadge } from '@fieldforge/ui';
import { heroStyles as styles } from './MarketingHero.styles';
import { TechnicianAvatar, TrackingMap, TrustedBusinesses } from './MarketingHeroArtwork';

const jobCards = [
  {
    title: 'Security Camera Install',
    status: 'Scheduled',
    location: 'Lakeside Warehouse',
    image: '/marketing/service-camera.png',
    position: 'security'
  },
  {
    title: 'Digital Signage Repair',
    status: 'Assigned',
    location: 'Downtown Branch',
    image: '/marketing/service-monitor.png',
    position: 'signage'
  },
  {
    title: 'POS Terminal Offline',
    status: 'Urgent',
    location: 'Market St. Retail',
    image: '/marketing/service-terminal.png',
    position: 'pos'
  }
] as const;

const stats = [
  { icon: Users, value: '10K+', label: 'Verified Technicians', tone: 'green' },
  { icon: FileText, value: '50K+', label: 'Work Orders Monthly', tone: 'blue' },
  { icon: ShieldCheck, value: '99.9%', label: 'Uptime & Reliability', tone: 'green' },
  { icon: Star, value: '4.8/5', label: 'Customer Satisfaction', tone: 'amber' }
] as const;

export const MarketingHero: React.FC = () => (
  <section className={styles.hero} aria-labelledby="marketing-hero-title">
    <img
      src="/marketing/hero-route-decoration.png"
      width={724}
      height={2172}
      alt=""
      className={styles.routeDecoration}
    />
    <div className={styles.frame}>
      <div className={styles.copy}>
        <div className={styles.eyebrow}>
          <span aria-hidden="true" />
          Field Service Operations Platform
        </div>
        <h1 id="marketing-hero-title" className={styles.title}>
          <span>Field service</span>
          <span className={styles.highlight}>without the</span>
          <span>field-service</span>
          <span>chaos.</span>
        </h1>
        <p className={styles.intro}>
          One operating field for staffing, dispatching, verifying and paying technician work
          orders.
        </p>
        <p className={styles.description}>
          Find qualified technicians, assign the right person and watch every job state move from
          dispatch to verified completion in one clean workflow.
        </p>
        <div className={styles.actions}>
          <Link href="/create-wo" className={styles.primaryAction}>
            Get Started <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="/resources" className={styles.secondaryAction}>
            <span className={styles.playIcon}>
              <Play aria-hidden="true" />
            </span>
            Watch Demo
          </Link>
        </div>
        <ul className={styles.benefits} aria-label="Platform benefits">
          {['Verified Technicians', 'Live ETA Tracking', 'Secure Payments'].map((item) => (
            <li key={item}>
              <CircleCheck aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <TrustedBusinesses />
      </div>
      <div className={styles.visual} aria-label="Field service platform preview">
        <img
          src="/marketing/hero-technician-refined.png"
          width={1254}
          height={1254}
          fetchPriority="high"
          alt="FieldForge technician using a tablet beside a service van"
          className={styles.technicianPhoto}
        />
        <LiveTrackingCard />
        {jobCards.map((job) => (
          <ServiceJobCard key={job.title} {...job} />
        ))}
        <ActiveJobsCard />
        <VerifiedTechnicianCard />
        <PlatformHighlights />
      </div>
    </div>
  </section>
);

const LiveTrackingCard: React.FC = () => (
  <div className={styles.tracking}>
    <h2>
      <span aria-hidden="true" />
      Live Job Tracking
    </h2>
    <div className={styles.trackingMap}>
      <TrackingMap />
      <div className={styles.technician}>
        <TechnicianAvatar />
        <div>
          <strong>Alex M.</strong>
          <span>On the way</span>
          <small>ETA 12 min</small>
        </div>
      </div>
    </div>
  </div>
);

const ActiveJobsCard: React.FC = () => (
  <div className={styles.activeJobs}>
    <div className={styles.jobsHeader}>
      <h2>4 Active Service Jobs</h2>
      <Link href="/dashboard">
        View All <ArrowRight aria-hidden="true" />
      </Link>
    </div>
    <dl>
      {[
        { value: '2', label: 'In Progress', tone: 'lime' as const },
        { value: '1', label: 'Scheduled', tone: 'cyan' as const },
        { value: '1', label: 'On Hold', tone: 'yellow' as const },
        { value: '4', label: 'This Week', tone: 'white' as const }
      ].map(({ value, label, tone }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd className={styles[tone]}>{value}</dd>
        </div>
      ))}
    </dl>
  </div>
);

function ServiceJobCard({ title, status, location, position, image }: (typeof jobCards)[number]) {
  return (
    <div className={`${styles.jobCard} ${styles[position]}`}>
      <span className={styles.jobIcon}>
        <Image src={image} width={64} height={64} sizes="48px" loading="eager" alt="" />
      </span>
      <div className={styles.jobDetails}>
        <h2>{title}</h2>
        <StatusBadge
          status={status}
          showPulse={false}
          className={`${styles.jobStatus} ${status === 'Urgent' ? styles.previewUrgent : styles.previewScheduled}`}
        />
        <p>{location}</p>
      </div>
      <ArrowRight className={styles.jobArrow} aria-hidden="true" />
    </div>
  );
}

function VerifiedTechnicianCard() {
  return (
    <div className={styles.verified}>
      <span>
        <Check aria-hidden="true" />
      </span>
      <div>
        <h2>Verified Technician</h2>
        <p>
          Background checked
          <br />
          and insured
        </p>
      </div>
    </div>
  );
}

function PlatformHighlights() {
  return (
    <dl className={styles.stats} aria-label="Platform highlights">
      {stats.map(({ icon: Icon, value, label, tone }) => (
        <div key={label} className={styles.stat}>
          <span className={`${styles.statIcon} ${styles[tone]}`}>
            <Icon aria-hidden="true" />
          </span>
          <div>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
