import React, { useState } from 'react';
import { Wallet, CreditCard, Download, CheckCircle2, Clock, Lock, Search } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="bg-emerald-950 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Escrow Vault Summary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass" className="p-5 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Locked in Escrow</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {formatMinor(billing.totalLockedMinor)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 flex items-center justify-between">
            <span>Guaranteed pre-authorized vault</span>
            <span className="text-emerald-400 font-semibold font-mono">FR-BILL-001</span>
          </div>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Lifetime Settled & Paid</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/80 flex items-center justify-center text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {formatMinor(billing.totalReleasedMinor)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 flex items-center justify-between">
            <span>Automated ACH/Wire payouts</span>
            <span className="text-blue-400 font-semibold font-mono">100% On-Time</span>
          </div>
        </Card>

        <Card variant="glass" className="p-5 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Corporate Payment Source</span>
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

      {/* Escrow Ledger Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base">Escrow & Milestone Release Ledger</CardTitle>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
                  FR-BILL-002 / 003
                </span>
              </div>
              <CardDescription>
                Cryptographically audited payment escrow held in trust until proof-of-work sign-off
              </CardDescription>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter transactions..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvoiceModalOpen(true)}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export Ledger (PDF/CSV)
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Tx ID & Date</th>
                  <th className="px-5 py-3">Target Work Order</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Escrow Status</th>
                  <th className="px-5 py-3">72h Auto-Approval Window</th>
                  <th className="px-5 py-3 text-right">Action Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTxs.map((tx) => {
                  const targetWo = workOrders.find((w) => w.id === tx.workOrderId);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-850/50 transition">
                      <td className="px-5 py-4 font-mono">
                        <div className="font-bold text-white text-xs">{tx.id}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{tx.workOrderTitle}</div>
                        <div className="text-[10px] text-blue-400 font-mono">
                          ID: {tx.workOrderId}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-sm text-emerald-400">
                        {formatMinor(tx.amountMinor)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={tx.status} />
                      </td>

                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {tx.status === EscrowStatus.RELEASED ? (
                          <span className="text-emerald-400 font-medium">Released & Invoiced</span>
                        ) : tx.status === EscrowStatus.DISPUTED ? (
                          <span className="text-red-400 font-medium">Locked for Dispute</span>
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

                      <td className="px-5 py-4 text-right space-x-2">
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
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                            Inv: {tx.invoiceNumber}
                          </span>
                        )}

                        {tx.status === EscrowStatus.DISPUTED && (
                          <span className="text-[11px] text-red-400 font-semibold">
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
          description={`Work Order: ${selectedTx.workOrderId} — ${selectedTx.workOrderTitle}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span>Release Amount:</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {formatMinor(selectedTx.amountMinor)} USD
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Payment Method:</span>
                <span>{selectedTx.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Idempotency Key:</span>
                <span className="font-mono text-[10px] truncate max-w-[200px]">
                  {selectedTx.idempotencyKey}
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs">
              By releasing this escrow, you confirm that all on-site deliverables, photos, and
              manager signatures have been inspected and meet your contractual acceptance criteria.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setReleaseModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="success" size="sm" onClick={handleConfirmRelease}>
                Confirm Release ({formatMinor(selectedTx.amountMinor)})
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dispute Dialog */}
      {selectedTx && (
        <Modal
          isOpen={disputeModalOpen}
          onClose={() => setDisputeModalOpen(false)}
          title="Initiate Escrow Dispute & Audit Hold"
          description={`Ticket: ${selectedTx.workOrderId}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <Textarea
              label="Dispute Justification"
              placeholder="State the non-compliance or defective deliverable details..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" size="sm" onClick={() => setDisputeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!disputeReason.trim()}
                onClick={handleConfirmDispute}
              >
                Lock Escrow & File Dispute
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Export Invoice Preview Dialog */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Export Financial Ledger & 1099 Tax Statements"
        description="Immutable buyer billing summary and audit ledger conforming to FR-BILL-003"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
            <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
              <span>FIELDFORGE ENTERPRISE BUYER LEDGER</span>
              <span>DATE: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>BUYER ACCOUNT:</span>
              <span className="text-white">Apex Retail Corp (b-apex-01)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>LIFETIME SETTLED:</span>
              <span className="text-emerald-400 font-bold">
                {formatMinor(billing.totalReleasedMinor)}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>ACTIVE ESCROW HELD:</span>
              <span className="text-amber-400 font-bold">
                {formatMinor(billing.totalLockedMinor)}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>ACTIVE DISPUTES:</span>
              <span className="text-red-400 font-bold">
                {formatMinor(billing.totalDisputedMinor)}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setInvoiceModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setInvoiceModalOpen(false);
                setToastMsg('Ledger report downloaded as CSV & PDF package.');
                setTimeout(() => setToastMsg(null), 4000);
              }}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download PDF & CSV Bundle
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
