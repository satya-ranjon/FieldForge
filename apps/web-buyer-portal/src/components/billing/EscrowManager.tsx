import React from 'react';
import { Button } from '@fieldforge/ui';

export const EscrowManager: React.FC = () => {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Escrow & Payout Ledger</h3>
        <span className="text-xs px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-md font-mono">
          Locked in Escrow: $450.00
        </span>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        Funds are securely held in escrow until deliverables and manager sign-offs are verified.
      </p>
      <div className="flex space-x-3">
        <Button variant="primary" size="sm">
          Pre-Authorize Funds
        </Button>
        <Button variant="secondary" size="sm">
          Download Tax Invoices
        </Button>
      </div>
    </div>
  );
};
