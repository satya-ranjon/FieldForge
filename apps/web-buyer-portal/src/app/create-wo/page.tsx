'use client';

import React from 'react';
import { BuyerPortalShell } from '../../components/layout/BuyerPortalShell';
import { SowBuilder } from '../../components/work-orders/SowBuilder';

export default function CreateWoPage(): React.JSX.Element {
  return (
    <BuyerPortalShell activeTab="create-wo">
      <SowBuilder />
    </BuyerPortalShell>
  );
}
