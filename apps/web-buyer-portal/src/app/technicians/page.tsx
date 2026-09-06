'use client';

import React from 'react';
import { BuyerPortalShell } from '../../components/layout/BuyerPortalShell';
import { TechnicianMatchingRadar } from '../../components/dispatch/TechnicianMatchingRadar';

export default function TechniciansPage(): React.JSX.Element {
  return (
    <BuyerPortalShell activeTab="technicians">
      <TechnicianMatchingRadar />
    </BuyerPortalShell>
  );
}
