'use client';

import React from 'react';
import { BuyerPortalShell } from '../../components/layout/BuyerPortalShell';
import { EscrowManager } from '../../components/billing/EscrowManager';

export default function BillingPage(): React.JSX.Element {
  return (
    <BuyerPortalShell activeTab="billing">
      <EscrowManager />
    </BuyerPortalShell>
  );
}
