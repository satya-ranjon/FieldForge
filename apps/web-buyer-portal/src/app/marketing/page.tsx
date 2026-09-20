'use client';

import React from 'react';
import { MarketingNavbar } from '../../components/marketing/MarketingNavbar';
import { MarketingHero } from '../../components/marketing/MarketingHero';
import { MarketingSections } from '../../components/marketing/MarketingSections';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';

export default function MarketingHomePage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-[#fbfcf8] text-[#111827]">
      <MarketingNavbar />
      <main className="flex-1">
        <MarketingHero />
        <MarketingSections />
      </main>
      <MarketingFooter />
    </div>
  );
}
