'use client';

import React from 'react';
import { HowItWorksSteps } from './HowItWorksSteps';
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
      {/* 1. 5-Step How It Works Banner */}
      <HowItWorksSteps />

      {/* 2. 7-Stage Lifecycle Pipeline */}
      <LifecyclePipeline />

      {/* 3. Real Work, All Industries */}
      <RealWorkSection />

      {/* 4. Technician Marketplace Directory & Filter */}
      <TechnicianMarketplace />

      {/* 5. Smart Dispatch Tactical Map & Matching */}
      <SmartDispatchSection />

      {/* 6. Field Operations Live Proof & Mobile App */}
      <FieldOperationsSection />

      {/* 7. Secure Payments & Escrow Settlement */}
      <SecurePaymentsSection />

      {/* 8. Compliance & Trust Verification Matrix */}
      <ComplianceTrustSection />

      {/* 9. One Command Center Live Operations Window */}
      <CommandCenterPreview />

      {/* 10. For Businesses vs For Technicians Split Section */}
      <TwoSidedAudience />

      {/* 11. Expertise & 7 Service Cards Taxonomy */}
      <ExpertiseGrid />

      {/* 12. Enterprise Reliability Guarantees */}
      <EnterpriseReliability />

      {/* 13. Dark Bottom Call To Action Banner */}
      <DarkBottomCtaBanner />
    </div>
  );
};
