'use client';

import React from 'react';
import { BuyerPortalShell } from '../../components/layout/BuyerPortalShell';
import { SlaAuditView } from '../../components/audit/SlaAuditView';

export default function AuditPage(): React.JSX.Element {
  return (
    <BuyerPortalShell activeTab="audit">
      <SlaAuditView />
    </BuyerPortalShell>
  );
}
