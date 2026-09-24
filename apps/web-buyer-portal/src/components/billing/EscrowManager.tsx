'use client';

import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
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
import { useReleaseEscrowMutation } from '../../store/services/api';
import { mockTransactions } from '../../mocks/fixtures';
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

  const [releaseEscrowApi, { isLoading: isReleasing }] = useReleaseEscrowMutation();

  const [selectedTx, setSelectedTx] = useState<EscrowTransaction | null>(null);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const effectiveTransactions =
    billing.transactions.length > 0 ? billing.transactions : mockTransactions;

  const totalLocked =
    billing.totalLockedMinor > 0
      ? billing.totalLockedMinor
      : effectiveTransactions
          .filter((t) => t.status === EscrowStatus.HELD)
          .reduce((acc, t) => acc + t.amountMinor, 0);

  const totalReleased =
    billing.totalReleasedMinor > 0
      ? billing.totalReleasedMinor
      : effectiveTransactions
          .filter((t) => t.status === EscrowStatus.RELEASED)
          .reduce((acc, t) => acc + t.amountMinor, 0);

  const filteredTxs = effectiveTransactions.filter((tx) => {
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
    setReleaseError(null);
    setReleaseModalOpen(true);
  };

  const handleCloseRelease = () => {
    if (!isReleasing) {
      setReleaseModalOpen(false);
      setReleaseError(null);
    }
  };

  const handleOpenDispute = (tx: EscrowTransaction) => {
    setSelectedTx(tx);
    setDisputeModalOpen(true);
  };

  const handleConfirmRelease = async () => {
    if (!selectedTx || isReleasing) return;
    setReleaseError(null);
    try {
      await releaseEscrowApi({ workOrderId: selectedTx.workOrderId }).unwrap();
      dispatch(releaseEscrow({ workOrderId: selectedTx.workOrderId }));
      dispatch(approveDeliverables({ workOrderId: selectedTx.workOrderId }));
      setReleaseModalOpen(false);
      setToastMsg(
        `Escrow of ${formatMinor(selectedTx.amountMinor)} released to technician for work order ${selectedTx.workOrderId}. Invoice generated!`
      );
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: unknown) {
      let msg = 'Failed to release escrow funds. Please verify order status and try again.';
      if (err && typeof err === 'object' && 'data' in err) {
        const errorData = (err as { data: { message?: string | string[] } }).data;
        if (errorData?.message) {
          msg = Array.isArray(errorData.message) ? errorData.message.join('; ') : errorData.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setReleaseError(msg);
    }
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
      {/* Success Toast Notification */}
      {toastMsg && (
        <div
          data-testid="escrow-release-success-toast"
          className="bg-[#EAF8E9] border border-[#C3EBC2] text-[#18852E] px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-xs"
        >
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#18852E] shrink-0" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-[#18852E] hover:text-[#0f591e] p-1 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Toast Notification (when modal is closed) */}
      {releaseError && !releaseModalOpen && (
        <div
          data-testid="escrow-release-error-toast"
          className="bg-[#FDF2F2] border border-[#F87171] text-[#991B1B] px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-xs"
        >
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-[#991B1B] shrink-0" />
            <span className="font-semibold">{releaseError}</span>
          </div>
          <button
            onClick={() => setReleaseError(null)}
            className="text-[#991B1B] hover:text-[#7f1d1d] p-1 cursor-pointer"
            aria-label="Dismiss error toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Escrow Vault Summary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <Card variant="default" className="p-4 sm:p-5 border-[#E3E8E1] bg-[#FFFFFF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#59636E] uppercase tracking-wider">
              Total Locked in Escrow
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EAF8E9] border border-[#C3EBC2] flex items-center justify-center text-[#18852E] shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#090E11]">
            {formatMinor(totalLocked)}
          </div>
          <div className="mt-2 text-[11px] text-[#59636E] border-t border-[#EBEFE9] pt-2 flex items-center justify-between">
            <span>Guaranteed pre-authorized vault</span>
            <span className="text-[#18852E] font-semibold font-mono">FR-BILL-001</span>
          </div>
        </Card>

        <Card variant="default" className="p-4 sm:p-5 border-[#E3E8E1] bg-[#FFFFFF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#59636E] uppercase tracking-wider">
              Lifetime Settled & Paid
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EAF8E9] border border-[#C3EBC2] flex items-center justify-center text-[#18852E] shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#090E11]">
            {formatMinor(totalReleased)}
          </div>
          <div className="mt-2 text-[11px] text-[#59636E] border-t border-[#EBEFE9] pt-2 flex items-center justify-between">
            <span>Automated ACH/Wire payouts</span>
            <span className="text-[#18852E] font-semibold font-mono">100% On-Time</span>
          </div>
        </Card>

        <Card variant="default" className="p-4 sm:p-5 border-[#E3E8E1] bg-[#FFFFFF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#59636E] uppercase tracking-wider">
              Corporate Payment Source
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F8FAF7] border border-[#EBEFE9] flex items-center justify-center text-[#59636E]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-sm font-bold text-[#090E11] truncate">
            {billing.paymentMethod}
          </div>
          <div className="mt-2 text-[11px] text-[#59636E] border-t border-[#EBEFE9] pt-2 flex items-center justify-between">
            <span>Tax ID: XX-XXX9842</span>
            <span className="text-[#090E11] font-mono">Pre-Auth OK</span>
          </div>
        </Card>
      </div>

      {/* Escrow Ledger Table */}
      <Card variant="default" className="border-[#E3E8E1] bg-[#FFFFFF] shadow-xs">
        <CardHeader className="bg-[#F8FAF7] border-b border-[#EBEFE9]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm sm:text-base text-[#090E11]">
                  Escrow & Milestone Release Ledger
                </CardTitle>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EAF8E9] text-[#18852E] border border-[#C3EBC2] font-semibold">
                  FR-BILL-002 / 003
                </span>
              </div>
              <CardDescription className="text-[#59636E]">
                Cryptographically audited payment escrow held in trust until proof-of-work sign-off
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#7D8791] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter transactions..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DDE4DA] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#090E11] placeholder-[#7D8791] focus:outline-none focus:ring-2 focus:ring-[#A8F22D]/40 focus:border-[#A8F22D] shadow-xs"
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
            <table className="w-full text-left text-xs text-[#090E11]">
              <thead className="bg-[#F8FAF7] text-[#59636E] uppercase text-[10px] font-mono border-b border-[#EBEFE9]">
                <tr>
                  <th className="px-5 py-3">Tx ID & Date</th>
                  <th className="px-5 py-3">Target Work Order</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Escrow Status</th>
                  <th className="px-5 py-3">Auto-Approval Window</th>
                  <th className="px-5 py-3 text-right">Action Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEFE9]">
                {filteredTxs.map((tx) => {
                  const targetWo = workOrders.find((w) => w.id === tx.workOrderId);

                  return (
                    <tr key={tx.id} className="hover:bg-[#F8FAF7] transition">
                      <td className="px-5 py-3.5 font-mono">
                        <div className="font-bold text-[#090E11] text-xs">{tx.id}</div>
                        <div className="text-[10px] text-[#7D8791]">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#090E11]">{tx.workOrderTitle}</div>
                        <div className="text-[10px] text-[#18852E] font-mono">
                          ID: {tx.workOrderId}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono font-bold text-sm text-[#090E11]">
                        {formatMinor(tx.amountMinor)}
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusBadge status={tx.status} />
                      </td>

                      <td className="px-5 py-3.5 text-[#59636E] text-xs">
                        {tx.status === EscrowStatus.RELEASED ? (
                          <span className="text-[#18852E] font-medium font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Released & Invoiced
                          </span>
                        ) : tx.status === EscrowStatus.DISPUTED ? (
                          <span className="text-[#C92C2C] font-medium font-mono">
                            Locked for Dispute
                          </span>
                        ) : tx.autoReleaseDeadline ? (
                          <div className="flex items-center space-x-1 text-[#B76B00] font-mono font-medium">
                            <Clock className="w-3 h-3" />
                            <span>48 hrs left (Auto-Release)</span>
                          </div>
                        ) : (
                          <span className="text-[#7D8791]">
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
                              className="text-[#C92C2C] hover:text-[#991B1B] hover:bg-[#FDEAEA] text-[11px]"
                            >
                              Dispute
                            </Button>
                            <Button
                              variant="primary"
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
                          <span className="text-[11px] font-mono text-[#090E11] bg-[#F0F2F3] px-2 py-1 rounded-md border border-[#E3E8E1] inline-block">
                            Inv: {tx.invoiceNumber}
                          </span>
                        )}

                        {tx.status === EscrowStatus.DISPUTED && (
                          <span className="text-[11px] text-[#C92C2C] font-semibold font-mono">
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
          onClose={handleCloseRelease}
          title="Confirm Milestone Sign-Off & Escrow Release"
          description={`Releasing funds for ${selectedTx.workOrderId}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {/* In-Modal Error Notification */}
            {releaseError && (
              <div
                data-testid="escrow-release-error-toast"
                className="bg-[#FDF2F2] border border-[#F87171] text-[#991B1B] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-xs"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-[#991B1B] shrink-0" />
                  <span className="font-semibold">{releaseError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReleaseError(null)}
                  className="text-[#991B1B] hover:text-[#7f1d1d] p-0.5 cursor-pointer"
                  aria-label="Dismiss error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="bg-[#F8FAF7] p-3.5 rounded-xl border border-[#EBEFE9] space-y-2">
              <div className="flex justify-between items-center text-[#59636E]">
                <span>Escrow Transaction:</span>
                <span className="font-mono text-[#090E11] font-bold">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between items-center text-[#59636E]">
                <span>Work Order Title:</span>
                <span className="text-[#090E11] font-medium">{selectedTx.workOrderTitle}</span>
              </div>
              <div className="flex justify-between items-center text-[#59636E] pt-2 border-t border-[#EBEFE9]">
                <span>Funds to Disburse:</span>
                <span className="font-mono font-bold text-base text-[#18852E]">
                  {formatMinor(selectedTx.amountMinor)}
                </span>
              </div>
            </div>

            <p className="text-[#59636E] leading-relaxed text-xs">
              By confirming, you certify that all required deliverables (photos, checklists, store
              manager signatures) have been reviewed and accepted. This action issues an instant ACH
              disbursement to the technician.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isReleasing}
                onClick={handleCloseRelease}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isReleasing}
                isLoading={isReleasing}
                onClick={handleConfirmRelease}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                {isReleasing ? 'Releasing Funds...' : 'Confirm & Release Funds'}
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
          <div className="bg-[#F8FAF7] p-4 rounded-xl border border-[#EBEFE9] flex justify-between items-start">
            <div>
              <div className="text-lg font-bold text-[#090E11] tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#22B947]" />
                FieldForge Marketplace Inc.
              </div>
              <div className="text-[#59636E] text-[11px] mt-1">
                500 Howard Street, Suite 400 • San Francisco, CA 94105
              </div>
              <div className="text-[#7D8791] font-mono text-[10px]">
                Escrow Settlement Provider ID: US-ESCROW-88421
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[#59636E] text-[10px]">STATEMENT ID</div>
              <div className="text-[#090E11] font-bold text-xs">STMT-2026-0902</div>
              <div className="text-[#7D8791] text-[10px] mt-1">Date: Sep 02, 2026</div>
            </div>
          </div>

          {/* Account Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F8FAF7] p-3 rounded-xl border border-[#EBEFE9]">
              <span className="text-[#59636E] block text-[10px] uppercase font-mono">
                Billed Organization:
              </span>
              <span className="text-[#090E11] font-bold block mt-0.5">Apex Retail Corp</span>
              <span className="text-[#59636E] text-[11px] block">Buyer ID: b-apex-01</span>
              <span className="text-[#7D8791] text-[10px] font-mono block">
                Billing Contact: satya@apexretail.corp
              </span>
            </div>
            <div className="bg-[#F8FAF7] p-3 rounded-xl border border-[#EBEFE9] font-mono">
              <span className="text-[#59636E] block text-[10px] uppercase">
                Payment Instrument:
              </span>
              <span className="text-[#090E11] font-bold block mt-0.5">
                Silicon Valley Bank Direct ACH
              </span>
              <span className="text-[#59636E] text-[11px] block">Routing: *****4421</span>
              <span className="text-[#18852E] text-[10px] block font-semibold">
                Pre-Authorized Settlement Active
              </span>
            </div>
          </div>

          {/* Statement Items Table */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#EBEFE9] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF7] text-[#59636E] font-mono text-[10px] uppercase border-b border-[#EBEFE9]">
                <tr>
                  <th className="p-3">Work Order & Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEFE9] text-[11px]">
                {billing.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-3">
                      <div className="font-semibold text-[#090E11]">{tx.workOrderTitle}</div>
                      <div className="text-[#7D8791] font-mono text-[10px]">
                        {tx.id} • {tx.workOrderId}
                      </div>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#090E11]">
                      {formatMinor(tx.amountMinor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex justify-end">
            <div className="w-64 bg-[#F8FAF7] p-3.5 rounded-xl border border-[#EBEFE9] space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-[#59636E]">
                <span>Subtotal (Escrow Vault):</span>
                <span className="text-[#090E11]">{formatMinor(totalLocked + totalReleased)}</span>
              </div>
              <div className="flex justify-between text-[#59636E]">
                <span>Platform Processing:</span>
                <span className="text-[#090E11]">$0.00 (Waived)</span>
              </div>
              <div className="flex justify-between text-[#090E11] font-bold text-sm pt-2 border-t border-[#EBEFE9]">
                <span>Total Settled:</span>
                <span className="text-[#18852E]">{formatMinor(totalReleased)}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Proof Hash */}
          <div className="p-2.5 rounded-lg bg-[#F8FAF7] border border-[#EBEFE9] text-[10px] font-mono text-[#7D8791] flex items-center justify-between">
            <span>SHA-256 Escrow Audit Proof: 8f9b2c...44a1e9</span>
            <span className="text-[#18852E] flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              Verified Immutable
            </span>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#EBEFE9]">
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
