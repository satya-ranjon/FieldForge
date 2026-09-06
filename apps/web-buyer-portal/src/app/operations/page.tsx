'use client';

import React from 'react';
import { BuyerPortalShell } from '../../components/layout/BuyerPortalShell';
import { LiveDispatchBoard } from '../../components/dispatch/LiveDispatchBoard';

export default function OperationsPage(): React.JSX.Element {
  return (
    <BuyerPortalShell activeTab="operations">
      <LiveDispatchBoard />
    </BuyerPortalShell>
  );
}
