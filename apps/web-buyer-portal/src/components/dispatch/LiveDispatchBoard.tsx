import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Camera,
  FileSignature,
  Radio,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import {
  selectWorkOrder,
  updateWorkOrderStatus,
  approveDeliverables,
  disputeWorkOrder,
  setStatusFilter,
  setPriorityFilter,
  setSearchQuery,
  type ExtendedWorkOrder
} from '../../store/slices/workOrderSlice';
import { releaseEscrow, disputeEscrow } from '../../store/slices/billingSlice';
import {
  StatusBadge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Modal,
  Textarea
} from '@fieldforge/ui';
import { formatMinor, WorkOrderStatus } from '@fieldforge/contracts';

export const LiveDispatchBoard: React.FC = () => {
  const dispatch = useDispatch();
  const workOrders = useSelector((state: RootState) => state.workOrders.items);
  const selectedId = useSelector((state: RootState) => state.workOrders.selectedId);
  const filters = useSelector((state: RootState) => state.workOrders.filters);

  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReasonInput, setDisputeReasonInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const selectedOrder = workOrders.find((w) => w.id === selectedId) || workOrders[0];

  // SLA Countdown calculation helper
  const getSlaTimeRemaining = (expirationIso: string) => {
    const diffMs = new Date(expirationIso).getTime() - Date.now();
    if (diffMs <= 0) return { text: 'SLA BREACHED', isUrgent: true, isBreached: true };
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return {
      text: `${hours}h ${mins}m left`,
      isUrgent: hours < 4,
      isBreached: false
    };
  };

  // Filter items
  const filteredWorkOrders = workOrders.filter((wo) => {
    if (filters.status !== 'ALL' && wo.status !== filters.status) return false;
    if (filters.category !== 'ALL' && wo.category !== filters.category) return false;
    if (filters.priority !== 'ALL' && wo.priority !== filters.priority) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = wo.title.toLowerCase().includes(q);
      const matchDesc = wo.description.toLowerCase().includes(q);
      const matchAddr = wo.addressLine.toLowerCase().includes(q);
      const matchId = wo.id.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchAddr || matchId;
    }
    return true;
  });

  const statuses = [
    'ALL',
    'DRAFT',
    'PUBLISHED',
    'ASSIGNED',
    'EN_ROUTE',
    'ON_SITE',
    'COMPLETED',
    'APPROVED',
    'DISPUTED'
  ];
  const priorities = ['ALL', 'CRITICAL_SLA', 'URGENT', 'STANDARD', 'LOW'];

  const handleApprove = (wo: ExtendedWorkOrder) => {
    dispatch(approveDeliverables({ workOrderId: wo.id }));
    dispatch(releaseEscrow({ workOrderId: wo.id }));
    setActionSuccessMsg(
      `Work Order ${wo.id} approved! Escrow funds ${formatMinor(wo.budgetAmountMinor)} released to technician.`
    );
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const handleRaiseDispute = () => {
    if (!selectedOrder || !disputeReasonInput.trim()) return;
    dispatch(
      disputeWorkOrder({ workOrderId: selectedOrder.id, reason: disputeReasonInput.trim() })
    );
    dispatch(disputeEscrow({ workOrderId: selectedOrder.id }));
    setDisputeModalOpen(false);
    setDisputeReasonInput('');
    setActionSuccessMsg(`Dispute flagged on ${selectedOrder.id}. Escrow locked for review.`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="bg-emerald-950 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control & Filter Header */}
      <Card variant="default" className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Live Dispatch & FSM Radar
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-semibold">
                Redis GeoStream Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time work order lifecycle telemetry, technician geofence radar, and deliverable
              sign-offs
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative min-w-[220px] flex-1 lg:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ticket, address, SOW..."
                value={filters.searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => dispatch(setStatusFilter(e.target.value))}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by Status"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  Status: {s}
                </option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => dispatch(setPriorityFilter(e.target.value))}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by Priority"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  Priority: {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Main Grid: Work Order Master List & Detail Telemetry Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left Column: Work Order Cards List (7 cols) */}
        <div className="xl:col-span-7 space-y-3">
          {filteredWorkOrders.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-slate-700">
              <Layers className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                No work orders match the selected filters.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try resetting the status or search query.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  dispatch(setStatusFilter('ALL'));
                  dispatch(setPriorityFilter('ALL'));
                  dispatch(setSearchQuery(''));
                }}
              >
                Reset All Filters
              </Button>
            </Card>
          ) : (
            filteredWorkOrders.map((wo) => {
              const isSelected = selectedOrder?.id === wo.id;
              const sla = getSlaTimeRemaining(wo.slaExpirationTime);

              return (
                <div
                  key={wo.id}
                  onClick={() => dispatch(selectWorkOrder(wo.id))}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500 shadow-md shadow-blue-950/40 ring-1 ring-blue-500/30'
                      : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          {wo.id}
                        </span>
                        <StatusBadge status={wo.status} />
                        {wo.priority === 'CRITICAL_SLA' && <StatusBadge status="CRITICAL_SLA" />}
                        {wo.priority === 'URGENT' && <StatusBadge status="URGENT" />}
                        <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 bg-slate-800/60 rounded border border-slate-700/60">
                          {wo.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white tracking-tight">{wo.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{wo.description}</p>
                    </div>

                    <div className="text-right space-y-1 flex-shrink-0">
                      <div className="text-base font-bold font-mono text-emerald-400">
                        {formatMinor(wo.budgetAmountMinor)}
                        <span className="text-[10px] text-slate-400 font-normal">
                          {' '}
                          ({wo.budgetType})
                        </span>
                      </div>

                      <div
                        className={`text-[11px] font-mono font-medium flex items-center justify-end gap-1 ${
                          sla.isBreached
                            ? 'text-red-400 font-bold'
                            : sla.isUrgent
                              ? 'text-amber-400'
                              : 'text-slate-400'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{sla.text}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Telemetry Strip */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-[280px]">{wo.addressLine}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {wo.assignedTechnicianName ? (
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                          {wo.assignedTechnicianName}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <Radio className="w-3 h-3 animate-ping" />
                          Awaiting Technician Bid
                        </span>
                      )}

                      {wo.geofenceVerified && (
                        <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono">
                          Geofence Check-in: {wo.geofenceCheckInDistanceMeters}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Work Order Detail Inspector (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          {selectedOrder ? (
            <Card variant="elevated" className="border-slate-700/80">
              <CardHeader className="bg-slate-950/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-400 font-bold">
                      {selectedOrder.id}
                    </span>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <CardTitle className="mt-1 text-sm">{selectedOrder.title}</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectModalOpen(true)}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                >
                  Full Modal
                </Button>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                {/* Finite State Machine Progression */}
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>FSM State Machine Lifecycle</span>
                    <span className="text-slate-500 font-mono">FR-WO-002</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                    {[
                      { s: WorkOrderStatus.PUBLISHED, label: '1. Published' },
                      { s: WorkOrderStatus.ASSIGNED, label: '2. Assigned' },
                      { s: WorkOrderStatus.ON_SITE, label: '3. On-Site' },
                      { s: WorkOrderStatus.APPROVED, label: '4. Approved' }
                    ].map((step) => {
                      const isCurrent = selectedOrder.status === step.s;
                      const isDone =
                        (step.s === WorkOrderStatus.PUBLISHED &&
                          selectedOrder.status !== WorkOrderStatus.DRAFT) ||
                        (step.s === WorkOrderStatus.ASSIGNED &&
                          ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED', 'APPROVED'].includes(
                            selectedOrder.status
                          )) ||
                        (step.s === WorkOrderStatus.ON_SITE &&
                          ['ON_SITE', 'COMPLETED', 'APPROVED'].includes(selectedOrder.status)) ||
                        (step.s === WorkOrderStatus.APPROVED &&
                          selectedOrder.status === WorkOrderStatus.APPROVED);

                      return (
                        <div
                          key={step.s}
                          className={`p-1.5 rounded border font-medium ${
                            isCurrent
                              ? 'bg-blue-600/30 text-blue-300 border-blue-500 ring-1 ring-blue-500/50'
                              : isDone
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}
                        >
                          {step.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assigned Technician Profile & Contact */}
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>Assigned Field Technician</span>
                    <span className="text-emerald-400 font-mono">
                      {selectedOrder.assignedTechnicianRating
                        ? `★ ${selectedOrder.assignedTechnicianRating}`
                        : 'Unassigned'}
                    </span>
                  </div>

                  {selectedOrder.assignedTechnicianName ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold">
                          {selectedOrder.assignedTechnicianName}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          Phone: {selectedOrder.assignedTechnicianPhone || '+1 (415) 555-0142'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          Vetted Tech
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs">
                      No technician assigned yet. Evaluating bids on radar queue.
                    </p>
                  )}
                </div>

                {/* Geofence Check-in Telemetry */}
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>Geofence Check-In Radar</span>
                    <span className="text-slate-500 font-mono">FR-MOB-001</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Target Radius:</span>
                    <span className="font-mono text-white">
                      {selectedOrder.geofenceRadiusMeters}m radius
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Recorded Distance:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {selectedOrder.geofenceCheckInDistanceMeters !== undefined
                        ? `${selectedOrder.geofenceCheckInDistanceMeters}m (Verified)`
                        : 'Awaiting Check-in'}
                    </span>
                  </div>
                </div>

                {/* Scope of Work Steps */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Scope of Work (SOW) Standard
                  </div>
                  <div className="space-y-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                    {selectedOrder.scopeOfWorkSteps?.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-2 text-slate-300 text-[11px]"
                      >
                        <span className="font-mono text-blue-400 font-bold">{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    )) || <p className="text-slate-500 text-xs">Standard SOP applies.</p>}
                  </div>
                </div>

                {/* Deliverables & Evidence Review */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>
                      Proof of Work Deliverables ({selectedOrder.deliverables?.length || 0})
                    </span>
                    <span className="text-slate-500 font-mono">FR-MOB-002 / 003</span>
                  </div>

                  {selectedOrder.deliverables && selectedOrder.deliverables.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedOrder.deliverables.map((del) => (
                        <div
                          key={del.id}
                          className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            {del.type === 'PHOTO_BEFORE' || del.type === 'PHOTO_AFTER' ? (
                              <Camera className="w-3.5 h-3.5 text-blue-400" />
                            ) : del.type === 'SIGNATURE' ? (
                              <FileSignature className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                            <div>
                              <div className="font-medium text-slate-200 text-[11px]">
                                {del.title}
                              </div>
                              {del.signatureHash && (
                                <div className="text-[9px] font-mono text-slate-500 truncate max-w-[200px]">
                                  SHA-256: {del.signatureHash}
                                </div>
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                              del.status === 'VERIFIED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : del.status === 'REJECTED'
                                  ? 'bg-red-950 text-red-300 border border-red-800'
                                  : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {del.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 bg-slate-950/30 p-3 rounded text-center">
                      No deliverables submitted yet.
                    </div>
                  )}
                </div>

                {/* Dispute Reason Banner if any */}
                {selectedOrder.status === WorkOrderStatus.DISPUTED &&
                  selectedOrder.disputeReason && (
                    <div className="bg-red-950/60 border border-red-800 p-3 rounded-lg space-y-1">
                      <div className="flex items-center space-x-1.5 text-red-400 font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Active Dispute Reason:</span>
                      </div>
                      <p className="text-red-200 text-xs">{selectedOrder.disputeReason}</p>
                    </div>
                  )}

                {/* Action Toolbar */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 justify-end">
                  {selectedOrder.status === WorkOrderStatus.COMPLETED && (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDisputeModalOpen(true)}
                        leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                      >
                        Dispute Deliverables
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(selectedOrder)}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Approve & Release Escrow ({formatMinor(selectedOrder.budgetAmountMinor)})
                      </Button>
                    </>
                  )}

                  {selectedOrder.status === WorkOrderStatus.PUBLISHED && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        dispatch(
                          updateWorkOrderStatus({
                            id: selectedOrder.id,
                            status: WorkOrderStatus.ASSIGNED
                          })
                        );
                        setActionSuccessMsg(
                          `Work Order ${selectedOrder.id} transitioned to ASSIGNED.`
                        );
                      }}
                      leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                    >
                      Fast-Track Auto Assign
                    </Button>
                  )}

                  {selectedOrder.status === WorkOrderStatus.DISPUTED && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        dispatch(
                          updateWorkOrderStatus({
                            id: selectedOrder.id,
                            status: WorkOrderStatus.ON_SITE
                          })
                        );
                        setActionSuccessMsg(`Dispute cleared for re-work on ${selectedOrder.id}.`);
                      }}
                    >
                      Re-Open for Technician Re-Work
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-400">
              Select a work order to inspect telemetry.
            </Card>
          )}
        </div>
      </div>

      {/* Full Modal Inspector */}
      {selectedOrder && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title={`Work Order Telemetry Audit: ${selectedOrder.id}`}
          description={selectedOrder.title}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Address & Geofence:</span>
                <span className="text-white font-medium block">{selectedOrder.addressLine}</span>
                <span className="text-slate-500 font-mono text-[10px] block mt-1">
                  Lat: {selectedOrder.latitude}, Lng: {selectedOrder.longitude} (Tolerance:{' '}
                  {selectedOrder.geofenceRadiusMeters}m)
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1">Financial Escrow & SLA:</span>
                <span className="text-emerald-400 font-bold font-mono text-sm block">
                  {formatMinor(selectedOrder.budgetAmountMinor)} ({selectedOrder.budgetType})
                </span>
                <span className="text-slate-400 text-[11px] block mt-1">
                  SLA Deadline: {new Date(selectedOrder.slaExpirationTime).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-white mb-2">Required Certifications & Badges:</h5>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.requiredCertifications?.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800 text-xs font-semibold"
                  >
                    ✓ {c}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-bold text-white mb-2">Scope of Work SOP:</h5>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                {selectedOrder.scopeOfWorkSteps?.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setInspectModalOpen(false)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dispute Modal */}
      <Modal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        title="Raise Milestone Dispute"
        description="Disputing a milestone halts automatic escrow release and flags the ticket for supervisor mediation."
        maxWidth="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Reason for Dispute"
            placeholder="e.g. Missing required serial number photos, or equipment failed post-installation check..."
            value={disputeReasonInput}
            onChange={(e) => setDisputeReasonInput(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" size="sm" onClick={() => setDisputeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!disputeReasonInput.trim()}
              onClick={handleRaiseDispute}
            >
              Confirm Dispute & Lock Escrow
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
