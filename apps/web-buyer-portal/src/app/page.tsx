'use client';

import React, { useState } from 'react';
import { BuyerPortalShell } from '../components/layout/BuyerPortalShell';
import type { NavTab } from '../components/layout/Header';
import { LiveDispatchBoard } from '../components/dispatch/LiveDispatchBoard';
import { TechnicianMatchingRadar } from '../components/dispatch/TechnicianMatchingRadar';
import { SowBuilder } from '../components/work-orders/SowBuilder';
import { EscrowManager } from '../components/billing/EscrowManager';
import { SlaAuditView } from '../components/audit/SlaAuditView';

export default function BuyerPortalPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<NavTab>('operations');

  return (
    <BuyerPortalShell activeTab={activeTab} onSelectTab={setActiveTab}>
      {activeTab === 'operations' && <LiveDispatchBoard />}
      {activeTab === 'create-wo' && <SowBuilder />}
      {activeTab === 'technicians' && <TechnicianMatchingRadar />}
      {activeTab === 'billing' && <EscrowManager />}
      {activeTab === 'audit' && <SlaAuditView />}
    </BuyerPortalShell>
  );
}
