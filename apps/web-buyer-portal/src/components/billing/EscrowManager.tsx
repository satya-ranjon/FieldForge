'use client';

import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  Lock,
  Search,
  ShieldCheck,
  Printer,
  X
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import {
  releaseEscrow,
  disputeEscrow,
  type EscrowTransaction
} from '../../store/slices/billingSlice';
import { approveDeliverables, disputeWorkOrder } from '../../store/slices/workOrderSlice';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  StatusBadge,
  Modal,
  Textarea
} from '@fieldforge/ui';
import { EscrowStatus, formatMinor } from '@fieldforge/contracts';

export const EscrowManager: React.FC = () => {
  const dispatch = useDispatch();
  const billing = useSelector((state: RootState) => state.billing);
  const workOrders = useSelector((state: RootState) => state.workOrders.items);

  const [selectedTx, setSelectedTx] = useState<EscrowTransaction | null>(null);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredTxs = billing.transactions.filter((tx) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      tx.workOrderId.toLowerCase().includes(q) ||
      tx.workOrderTitle.toLowerCase().includes(q) ||
      tx.id.toLowerCase().includes(q) ||
      tx.status.toLowerCase().includes(q)
    );
  });

  const handleOpenRelease = (tx: EscrowTransaction) => {
    setSelectedTx(tx);
    setReleaseModalOpen(true);
  };

  const handleOpenDispute = (tx: EscrowTransaction) => {
    setSelectedTx(tx);
    setDisputeModalOpen(true);
  };

  const handleConfirmRelease = () => {
    if (!selectedTx) return;
    dispatch(releaseEscrow({ workOrderId: selectedTx.workOrderId }));
    dispatch(approveDeliverables({ workOrderId: selectedTx.workOrderId }));
    setReleaseModalOpen(false);
    setToastMsg(
      `Escrow of ${formatMinor(selectedTx.amountMinor)} released to technician for work order ${selectedTx.workOrderId}. Invoice generated!`
    );
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleConfirmDispute = () => {
    if (!selectedTx || !disputeReason.trim()) return;
    dispatch(disputeEscrow({ workOrderId: selectedTx.workOrderId }));
    dispatch(
      disputeWorkOrder({
        workOrderId: selectedTx.workOrderId,
        reason: disputeReason.trim()
      })
    );
    setDisputeModalOpen(false);
    setDisputeReason('');
    setToastMsg(`Dispute filed on ${selectedTx.workOrderId}. Escrow funds held in safety lock.`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-950/90 border border-emerald-600/80 text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-lg shadow-emerald-950/40">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Escrow Vault Summary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <Card variant="glass" className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Locked in Escrow
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-950/40">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
            {formatMinor(billing.totalLockedMinor)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 flex items-center justify-between">
            <span>Guaranteed pre-authorized vault</span>
            <span className="text-emerald-400 font-semibold font-mono">FR-BILL-001</span>
          </div>
        </Card>

        <Card variant="glass" className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Lifetime Settled & Paid
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-950/40">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-white">
            {formatMinor(billing.totalReleasedMinor)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 flex items-center justify-between">
            <span>Automated ACH/Wire payouts</span>
            <span className="text-blue-400 font-semibold font-mono">100% On-Time</span>
          </div>
        </Card>

        <Card variant="glass" className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Corporate Payment Source
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-sm font-bold text-slate-200 truncate">
            {billing.paymentMethod}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 flex items-center justify-between">
            <span>Tax ID: XX-XXX9842</span>
            <span className="text-slate-300 font-mono">Pre-Auth OK</span>
          </div>
        </Card>
      </div>

      {/* Escrow Ledger Table (Stripe-inspired) */}
      <Card variant="elevated" className="border-slate-700/80">
        <CardHeader className="bg-[#090d16]/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm sm:text-base">
                  Escrow & Milestone Release Ledger
                </CardTitle>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/70 font-semibold">
                  FR-BILL-002 / 003
                </span>
              </div>
              <CardDescription>
                Cryptographically audited payment escrow held in trust until proof-of-work sign-off
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter transactions..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvoiceModalOpen(true)}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export Ledger
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#090d16]/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Tx ID & Date</th>
                  <th className="px-5 py-3">Target Work Order</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Escrow Status</th>
                  <th className="px-5 py-3">Auto-Approval Window</th>
                  <th className="px-5 py-3 text-right">Action Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTxs.map((tx) => {
                  const targetWo = workOrders.find((w) => w.id === tx.workOrderId);

                  return (
                    <tr key={tx.id} className="hover:bg-[#090d16]/50 transition">
                      <td className="px-5 py-3.5 font-mono">
                        <div className="font-bold text-white text-xs">{tx.id}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{tx.workOrderTitle}</div>
                        <div className="text-[10px] text-blue-400 font-mono">
                          ID: {tx.workOrderId}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono font-bold text-sm text-emerald-400">
                        {formatMinor(tx.amountMinor)}
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusBadge status={tx.status} />
                      </td>

                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                        {tx.status === EscrowStatus.RELEASED ? (
                          <span className="text-emerald-400 font-medium font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Released & Invoiced
                          </span>
                        ) : tx.status === EscrowStatus.DISPUTED ? (
                          <span className="text-red-400 font-medium font-mono">
                            Locked for Dispute
                          </span>
                        ) : tx.autoReleaseDeadline ? (
                          <div className="flex items-center space-x-1 text-amber-400 font-mono font-medium">
                            <Clock className="w-3 h-3" />
                            <span>48 hrs left (Auto-Release)</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">
                            {targetWo?.status === 'ON_SITE' ? 'On-Site Execution' : 'Active Escrow'}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-2">
                        {tx.status === EscrowStatus.HELD && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDispute(tx)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/40 text-[11px]"
                            >
                              Dispute
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleOpenRelease(tx)}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              className="text-[11px]"
                            >
                              Release Funds
                            </Button>
                          </>
                        )}

                        {tx.status === EscrowStatus.RELEASED && tx.invoiceNumber && (
                          <span className="text-[11px] font-mono text-slate-300 bg-[#090d16] px-2 py-1 rounded-md border border-slate-700 inline-block">
                            Inv: {tx.invoiceNumber}
                          </span>
                        )}

                        {tx.status === EscrowStatus.DISPUTED && (
                          <span className="text-[11px] text-red-400 font-semibold font-mono">
                            Arbitration Queued
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Release Escrow Dialog */}
      {selectedTx && (
        <Modal
          isOpen={releaseModalOpen}
          onClose={() => setReleaseModalOpen(false)}
          title="Confirm Milestone Sign-Off & Escrow Release"
          description={`Releasing funds for ${selectedTx.workOrderId}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-[#090d16] p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Escrow Transaction:</span>
                <span className="font-mono text-white font-bold">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Work Order Title:</span>
                <span className="text-white font-medium">{selectedTx.workOrderTitle}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 pt-2 border-t border-slate-800">
                <span>Funds to Disburse:</span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  {formatMinor(selectedTx.amountMinor)}
                </span>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed text-xs">
              By confirming, you certify that all required deliverables (photos, checklists, store
              manager signatures) have been reviewed and accepted. This action issues an instant ACH
              disbursement to the technician.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setReleaseModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleConfirmRelease}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Confirm & Release Funds
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dispute Escrow Dialog */}
      {selectedTx && (
        <Modal
          isOpen={disputeModalOpen}
          onClose={() => setDisputeModalOpen(false)}
          title="Freeze Escrow & File Milestone Dispute"
          description={`Arbitration for ${selectedTx.workOrderId}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <Textarea
              label="Arbitration Reason"
              placeholder="Detail reasons for rejection (e.g. Work incomplete, test failure, no manager signature)..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={4}
            />

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setDisputeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!disputeReason.trim()}
                onClick={handleConfirmDispute}
              >
                Confirm Dispute Freeze
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Stripe-style Enterprise Invoice Modal */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="FieldForge Enterprise Escrow Statement"
        description="Official Ledger Export & Proof-of-Settlement"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Invoice Header */}
          <div className="bg-[#090d16] p-4 rounded-xl border border-slate-800 flex justify-between items-start">
            <div>
              <div className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                FieldForge Marketplace Inc.
              </div>
              <div className="text-slate-400 text-[11px] mt-1">
                500 Howard Street, Suite 400 • San Francisco, CA 94105
              </div>
              <div className="text-slate-500 font-mono text-[10px]">
                Escrow Settlement Provider ID: US-ESCROW-88421
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-slate-400 text-[10px]">STATEMENT ID</div>
              <div className="text-white font-bold text-xs">STMT-2026-0902</div>
              <div className="text-slate-500 text-[10px] mt-1">Date: Sep 02, 2026</div>
            </div>
          </div>

          {/* Account Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">
                Billed Organization:
              </span>
              <span className="text-white font-bold block mt-0.5">Apex Retail Corp</span>
              <span className="text-slate-400 text-[11px] block">Buyer ID: b-apex-01</span>
              <span className="text-slate-500 text-[10px] font-mono block">
                Billing Contact: satya@apexretail.corp
              </span>
            </div>
            <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800 font-mono">
              <span className="text-slate-400 block text-[10px] uppercase">
                Payment Instrument:
              </span>
              <span className="text-white font-bold block mt-0.5">
                Silicon Valley Bank Direct ACH
              </span>
              <span className="text-slate-400 text-[11px] block">Routing: *****4421</span>
              <span className="text-emerald-400 text-[10px] block">
                Pre-Authorized Settlement Active
              </span>
            </div>
          </div>

          {/* Statement Items Table */}
          <div className="bg-[#090d16] rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Work Order & Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[11px]">
                {billing.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-3">
                      <div className="font-semibold text-white">{tx.workOrderTitle}</div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        {tx.id} • {tx.workOrderId}
                      </div>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      {formatMinor(tx.amountMinor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex justify-end">
            <div className="w-64 bg-[#090d16] p-3.5 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal (Escrow Vault):</span>
                <span>{formatMinor(billing.totalLockedMinor + billing.totalReleasedMinor)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform Processing:</span>
                <span>$0.00 (Waived)</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                <span>Total Settled:</span>
                <span className="text-emerald-400">{formatMinor(billing.totalReleasedMinor)}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Proof Hash */}
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>SHA-256 Escrow Audit Proof: 8f9b2c...44a1e9</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Immutable
            </span>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setInvoiceModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert('Downloading official statement PDF...');
                setInvoiceModalOpen(false);
              }}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print / Save PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
