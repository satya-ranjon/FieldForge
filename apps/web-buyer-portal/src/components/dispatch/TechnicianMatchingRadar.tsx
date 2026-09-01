import React, { useState } from 'react';
import { Radio, Star, Zap, CheckCircle2, Clock, Sliders } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import {
  acceptBid,
  rejectBid,
  setRadarRadius,
  type ExtendedBid
} from '../../store/slices/dispatchSlice';
import { assignTechnician } from '../../store/slices/workOrderSlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@fieldforge/ui';
import type { NearbyTechnicianDto } from '@fieldforge/contracts';
import { WorkOrderStatus, BidStatus } from '@fieldforge/contracts';

export const TechnicianMatchingRadar: React.FC = () => {
  const dispatch = useDispatch();
  const technicians = useSelector((state: RootState) => state.dispatch.nearbyTechnicians);
  const bids = useSelector((state: RootState) => state.dispatch.activeBids);
  const radarRadius = useSelector((state: RootState) => state.dispatch.radarRadiusMiles);
  const workOrders = useSelector((state: RootState) => state.workOrders.items);

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const pendingBids = bids.filter((b) => b.status === BidStatus.PENDING);
  const openWorkOrders = workOrders.filter(
    (wo) => wo.status === WorkOrderStatus.PUBLISHED || wo.status === WorkOrderStatus.DRAFT
  );

  const handleAcceptBid = (bid: ExtendedBid) => {
    // 1. Accept bid in dispatch slice
    dispatch(acceptBid({ bidId: bid.id }));

    // 2. Assign technician to the work order in work order slice
    dispatch(
      assignTechnician({
        workOrderId: bid.workOrderId,
        techId: bid.techId,
        techName: bid.technicianName,
        techRating: bid.technicianRating,
        techPhone: '+1 (415) 890-2341'
      })
    );

    setSuccessToast(
      `Bid from ${bid.technicianName} accepted for $${bid.proposedAmount.toFixed(2)}! Work order assigned & technician notified via WebSocket.`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleRejectBid = (bid: ExtendedBid) => {
    dispatch(rejectBid({ bidId: bid.id }));
    setSuccessToast(`Bid from ${bid.technicianName} rejected.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleDirectDispatch = (tech: NearbyTechnicianDto) => {
    const targetWo = openWorkOrders[0] || workOrders[0];
    if (!targetWo) return;

    dispatch(
      assignTechnician({
        workOrderId: targetWo.id,
        techId: tech.techId,
        techName: tech.fullName,
        techRating: tech.rating,
        techPhone: '+1 (415) 555-0198'
      })
    );

    setSuccessToast(
      `Direct dispatch issued! ${tech.fullName} auto-assigned to ticket ${targetWo.id} (Emergency SLA).`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-950 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Radar Control & Live Telemetry Banner */}
      <Card variant="glass" className="p-4 border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-ping" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Geospatial Technician Radar & Bids Matrix
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                FR-DISP-001 / 002
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Redis GEOSEARCH matching certified freelance technicians within coverage radius
            </p>
          </div>

          {/* Radar Radius Controls */}
          <div className="flex items-center space-x-3 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700/80">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-slate-300 font-medium">Search Radius:</span>
            <div className="flex items-center space-x-1">
              {[5, 10, 25, 50].map((miles) => (
                <button
                  key={miles}
                  onClick={() => dispatch(setRadarRadius(miles))}
                  className={`px-2 py-0.5 text-xs font-mono rounded ${
                    radarRadius === miles
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {miles}mi
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: Incoming Bids Matrix & Nearby Certified Techs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Incoming Technician Bids Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-base">
                    Incoming Technician Bids ({pendingBids.length})
                  </CardTitle>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                    Action Required
                  </span>
                </div>
                <CardDescription>
                  Evaluate proposed rates, estimated arrival times, and specialized tooling notes
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-slate-800">
              {pendingBids.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="font-semibold text-sm text-slate-200">
                    All pending bids processed!
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    New technician proposals will appear here in real-time as they are broadcasted.
                  </p>
                </div>
              ) : (
                pendingBids.map((bid) => {
                  const targetWo = workOrders.find((w) => w.id === bid.workOrderId);

                  return (
                    <div key={bid.id} className="p-4 hover:bg-slate-850/60 transition space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">
                              {bid.technicianName}
                            </span>
                            <span className="flex items-center text-[11px] text-amber-400 font-semibold">
                              <Star className="w-3 h-3 fill-current mr-0.5" />
                              {bid.technicianRating}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              ({bid.technicianJobsCount} jobs completed)
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="text-blue-400 font-mono font-semibold">
                              Target Ticket: {bid.workOrderId}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[280px]">{targetWo?.title}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-bold font-mono text-emerald-400">
                            ${bid.proposedAmount.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center justify-end gap-1 font-mono">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>ETA: {bid.estimatedArrivalMinutes} mins</span>
                          </div>
                        </div>
                      </div>

                      {/* Technician Counter Note */}
                      {bid.counterNote && (
                        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-300">
                          <span className="text-slate-400 font-semibold">Technician Note: </span>"
                          {bid.counterNote}"
                        </div>
                      )}

                      {/* Certification Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {bid.technicianCertifications.map((cert) => (
                            <span
                              key={cert}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              ✓ {cert}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRejectBid(bid)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                          >
                            Decline
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAcceptBid(bid)}
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            Accept Bid & Assign
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Nearby Qualified Technicians Radar List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-base">Nearby Qualified Field Technicians</CardTitle>
                <CardDescription>
                  Vetted technicians currently active within {radarRadius} miles
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-slate-800">
              {technicians.map((tech) => (
                <div key={tech.techId} className="p-4 hover:bg-slate-850/60 transition space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">{tech.fullName}</span>
                        {tech.isAvailable ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                            Available Now
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            On Job
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="flex items-center text-amber-400">
                          <Star className="w-3 h-3 fill-current mr-0.5" />
                          {tech.rating}
                        </span>
                        <span>•</span>
                        <span>{tech.completedJobsCount} jobs</span>
                        <span>•</span>
                        <span className="text-cyan-400 font-mono">
                          {tech.distanceMiles} mi away
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDirectDispatch(tech)}
                      leftIcon={<Zap className="w-3 h-3 text-amber-400" />}
                      className="text-xs"
                    >
                      Auto-Dispatch
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {tech.certifications.map((c) => (
                      <span
                        key={c}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
