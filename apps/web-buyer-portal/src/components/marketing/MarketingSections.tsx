'use client';

import React from 'react';
import { MarketingTrustStrip } from './MarketingTrustStrip';
import { LifecyclePipeline } from './LifecyclePipeline';
import { RealWorkSection } from './RealWorkSection';
import { TechnicianMarketplace } from './TechnicianMarketplace';
import { SmartDispatchSection } from './SmartDispatchSection';
import { FieldOperationsSection } from './FieldOperationsSection';
import { SecurePaymentsSection } from './SecurePaymentsSection';
import { ComplianceTrustSection } from './ComplianceTrustSection';
import { CommandCenterPreview } from './CommandCenterPreview';
import { TwoSidedAudience } from './TwoSidedAudience';
import { ExpertiseGrid } from './ExpertiseGrid';
import { EnterpriseReliability } from './EnterpriseReliability';
import { DarkBottomCtaBanner } from './DarkBottomCtaBanner';

export const MarketingSections: React.FC = () => {
  return (
    <div className="flex flex-col gap-y-12 sm:gap-y-16">
      {/* 1. Platform assurances */}
      <MarketingTrustStrip />

      <div className="space-y-3 lg:space-y-0">
        {/* 2. 7-Stage Lifecycle Pipeline */}
        <LifecyclePipeline />

        {/* 3. Real Work, All Industries */}
        <RealWorkSection />
      </div>

      {/* 4. Technician Marketplace Directory & Filter */}
      <TechnicianMarketplace />

      {/* 5. Smart Dispatch Tactical Map & Matching */}
      <SmartDispatchSection />

      <div className="space-y-6 bg-surface-marketing pb-10 lg:space-y-6">
        {/* 6. Field Operations Live Proof & Mobile App */}
        <FieldOperationsSection />

        {/* 7. Secure Payments & Escrow Settlement */}
        <SecurePaymentsSection />
      </div>

      {/* 8. Compliance & Trust Verification Matrix */}
      <ComplianceTrustSection />

      {/* 9. One Command Center Live Operations Window */}
      <CommandCenterPreview />

      <div className="space-y-8 bg-surface-green py-9 lg:space-y-7">
        {/* 10. For Businesses vs For Technicians Split Section */}
        <TwoSidedAudience />

        {/* 11. Expertise & 7 Service Cards Taxonomy */}
        <ExpertiseGrid />
      </div>

      <div className="relative isolate space-y-5 overflow-hidden bg-surface-page pt-5 pb-5">
        <img
          src="/marketing/trust-orbit.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-20 -z-10 w-64 opacity-10"
        />
        <img
          src="/marketing/trust-orbit.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-12 -z-10 w-64 rotate-180 opacity-10"
        />
        {/* 12. Enterprise Reliability Guarantees */}
        <EnterpriseReliability />

        {/* 13. Dark Bottom Call To Action Banner */}
        <DarkBottomCtaBanner />
      </div>
    </div>
  );
};
