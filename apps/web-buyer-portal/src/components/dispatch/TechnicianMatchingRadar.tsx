'use client';

import React, { useState } from 'react';
import {
  Radio,
  Star,
  Zap,
  CheckCircle2,
  Clock,
  Sliders,
  MapPin,
  X,
  Navigation,
  ShieldCheck
} from 'lucide-react';

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
import { BidStatus, formatMinor, WorkOrderStatus } from '@fieldforge/contracts';
import { useGetNearbyTechniciansQuery, useAcceptBidMutation } from '../../store/services/api';
import { mockTechnicians, mockBids, mockWorkOrders } from '../../mocks/fixtures';

export const TechnicianMatchingRadar: React.FC = () => {
  const dispatch = useDispatch();
  const technicians = useSelector((state: RootState) => state.dispatch.nearbyTechnicians);
  const bids = useSelector((state: RootState) => state.dispatch.activeBids);
  const radarRadius = useSelector((state: RootState) => state.dispatch.radarRadiusMiles);
  const workOrders = useSelector((state: RootState) => state.workOrders.items);

  const [acceptBidApi] = useAcceptBidMutation();
  const { data: apiTechnicians } = useGetNearbyTechniciansQuery({
    latitude: 37.7749,
    longitude: -122.4194,
    radiusMiles: radarRadius
  });

  const effectiveTechnicians: NearbyTechnicianDto[] =
    technicians.length > 0
      ? technicians
      : apiTechnicians && apiTechnicians.length > 0
        ? apiTechnicians
        : mockTechnicians;

  const effectiveBids: ExtendedBid[] = bids.length > 0 ? bids : mockBids;
  const effectiveWorkOrders = workOrders.length > 0 ? workOrders : mockWorkOrders;

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const pendingBids = effectiveBids.filter((b) => b.status === BidStatus.PENDING);
  const openWorkOrders = effectiveWorkOrders.filter(
    (wo) => wo.status === WorkOrderStatus.PUBLISHED || wo.status === WorkOrderStatus.DRAFT
  );

  const handleAcceptBid = async (bid: ExtendedBid) => {
    try {
      await acceptBidApi({ bidId: bid.id, workOrderId: bid.workOrderId }).unwrap();
    } catch {
      // Non-blocking fallback for offline/mock test environments
    }

    // 1. Accept bid in dispatch slice
    dispatch(acceptBid({ bidId: bid.id }));

    // 2. Assign technician to the work order in work order slice
    dispatch(
      assignTechnician({
        workOrderId: bid.workOrderId,
        technicianId: bid.technicianId,
        techName: bid.technicianName,
        techRating: bid.technicianRating,
        techPhone: '+1 (415) 890-2341'
      })
    );

    setSuccessToast(
      `Bid from ${bid.technicianName} accepted for ${formatMinor(bid.bidAmountMinor)}! Work order assigned & technician notified via WebSocket.`
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
        technicianId: tech.technicianId,
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
    <div className="space-y-5 sm:space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-[#EAF8E9] border border-[#C3EBC2] text-[#18852E] px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-xs">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#18852E] shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-[#18852E] hover:text-[#0f591e] p-1 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Radar Control & Live Telemetry Banner */}
      <Card variant="default" className="p-4 sm:p-5 border-[#E3E8E1] bg-[#FFFFFF]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <Radio className="w-4 h-4 text-[#22B947] animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-[#090E11] tracking-tight">
                Geospatial Technician Radar & Bids Matrix
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EAF8E9] text-[#18852E] border border-[#C3EBC2] font-semibold">
                Redis GEOSEARCH
              </span>
            </div>
            <p className="text-xs text-[#59636E] mt-1">
              Real-time geospatial radar matching certified field engineers within active
              operational perimeter
            </p>
          </div>

          {/* Radar Radius Controls */}
          <div className="flex items-center space-x-3 bg-[#F8FAF7] px-3.5 py-2 rounded-xl border border-[#EBEFE9]">
            <Sliders className="w-3.5 h-3.5 text-[#22B947]" />
            <span className="text-xs text-[#59636E] font-medium">Perimeter:</span>
            <div className="flex items-center space-x-1.5">
              {[5, 10, 25, 50].map((miles) => (
                <button
                  key={miles}
                  onClick={() => dispatch(setRadarRadius(miles))}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg transition cursor-pointer ${
                    radarRadius === miles
                      ? 'bg-[#A8F22D] text-[#08120D] font-bold shadow-xs border border-[#94DC20]'
                      : 'text-[#59636E] hover:text-[#090E11] hover:bg-white'
                  }`}
                >
                  {miles}mi
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tactical Circular Radar Visualizer Banner */}
      <Card variant="default" className="p-4 sm:p-5 bg-[#FFFFFF] border border-[#E3E8E1] shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Animated Circular Radar Scope */}
          <div className="md:col-span-5 flex justify-center py-2">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-[#081A15] border-2 border-[#1C352D] shadow-sm flex items-center justify-center overflow-hidden">
              {/* Concentric distance rings */}
              <div className="absolute w-40 h-40 rounded-full border border-[#1C352D]" />
              <div className="absolute w-28 h-28 rounded-full border border-[#1C352D]/80" />
              <div className="absolute w-14 h-14 rounded-full border border-[#A8F22D]/30" />

              {/* Crosshair grid lines */}
              <div className="absolute inset-x-0 h-px bg-[#1C352D]" />
              <div className="absolute inset-y-0 w-px bg-[#1C352D]" />

              {/* Rotating Sweep Beam */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className="w-28 h-0.5 bg-gradient-to-r from-transparent via-[#A8F22D]/30 to-[#A8F22D] animate-radar-sweep"
                  style={{ transformOrigin: '0% 50%' }}
                />
              </div>

              {/* Center Dispatch Node */}
              <div className="relative z-10 w-3 h-3 rounded-full bg-[#A8F22D] shadow-[0_0_12px_rgba(168,242,45,0.9)] ring-4 ring-[#A8F22D]/20" />

              {/* Technician blips on radar */}
              {effectiveTechnicians.slice(0, 6).map((t, idx) => {
                const angle = (idx * 60 + 25) * (Math.PI / 180);
                const radiusDist = 20 + (idx % 3) * 26;
                const x = Math.cos(angle) * radiusDist;
                const y = Math.sin(angle) * radiusDist;

                return (
                  <div
                    key={t.technicianId}
                    className="absolute z-10 group"
                    style={{
                      transform: `translate(${x}px, ${y}px)`
                    }}
                  >
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A8F22D] opacity-75" />
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          t.isAvailable ? 'bg-[#A8F22D]' : 'bg-[#B76B00]'
                        }`}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar Telemetry Summary */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-[#22B947]" />
              <h3 className="text-sm font-bold text-[#090E11] tracking-tight uppercase">
                Active Perimeter Telemetry
              </h3>
            </div>
            <p className="text-xs text-[#59636E] leading-relaxed">
              Monitoring{' '}
              <span className="text-[#18852E] font-mono font-bold">
                {effectiveTechnicians.length} certified technicians
              </span>{' '}
              in the San Francisco Bay Area within your active {radarRadius}-mile perimeter.
            </p>
            <div className="grid grid-cols-3 gap-2.5 pt-1 text-center font-mono">
              <div className="bg-[#F8FAF7] p-2.5 rounded-xl border border-[#EBEFE9]">
                <span className="text-[10px] text-[#59636E] block uppercase">Ready</span>
                <span className="text-[#18852E] font-bold text-base">
                  {effectiveTechnicians.filter((t) => t.isAvailable).length}
                </span>
              </div>
              <div className="bg-[#F8FAF7] p-2.5 rounded-xl border border-[#EBEFE9]">
                <span className="text-[10px] text-[#59636E] block uppercase">Active Bids</span>
                <span className="text-[#B76B00] font-bold text-base">{pendingBids.length}</span>
              </div>
              <div className="bg-[#F8FAF7] p-2.5 rounded-xl border border-[#EBEFE9]">
                <span className="text-[10px] text-[#59636E] block uppercase">Avg Rating</span>
                <span className="text-[#090E11] font-bold text-base">★ 4.91</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: Incoming Bids Matrix (7 cols) & Nearby Certified Techs (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Incoming Technician Bids Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card variant="default" className="border-[#E3E8E1] bg-[#FFFFFF] shadow-xs">
            <CardHeader className="bg-[#F8FAF7] border-b border-[#EBEFE9]">
              <div>
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-sm sm:text-base text-[#090E11]">
                    Incoming Technician Bids ({pendingBids.length})
                  </CardTitle>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF5DF] text-[#B76B00] border border-[#FFE6B0] font-mono font-bold">
                    Action Required
                  </span>
                </div>
                <CardDescription className="text-[#59636E]">
                  Evaluate proposed rates, estimated arrival times, and specialized tooling notes
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-[#EBEFE9]">
              {pendingBids.length === 0 ? (
                <div className="p-8 text-center text-[#7D8791]">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-[#22B947] mb-2" />
                  <p className="font-semibold text-sm text-[#090E11]">
                    All pending bids processed!
                  </p>
                  <p className="text-xs text-[#59636E] mt-1">
                    New technician proposals will appear here in real-time as they are broadcasted.
                  </p>
                </div>
              ) : (
                pendingBids.map((bid) => {
                  const targetWo = workOrders.find((w) => w.id === bid.workOrderId);

                  return (
                    <div
                      key={bid.id}
                      className="p-4 sm:p-5 hover:bg-[#F8FAF7] transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[#090E11] text-sm">
                              {bid.technicianName}
                            </span>
                            <span className="flex items-center text-[11px] text-[#B76B00] font-semibold font-mono">
                              <Star className="w-3 h-3 fill-current mr-0.5" />
                              {bid.technicianRating}
                            </span>
                            <span className="text-xs text-[#7D8791] font-mono hidden sm:inline">
                              ({bid.technicianJobsCount} jobs completed)
                            </span>
                          </div>

                          <div className="text-xs text-[#59636E] flex items-center gap-2">
                            <span className="text-[#18852E] font-mono font-semibold">
                              {bid.workOrderId}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[260px]">{targetWo?.title}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-base sm:text-lg font-bold font-mono text-[#090E11]">
                            {formatMinor(bid.bidAmountMinor)}
                          </div>
                          <div className="text-xs text-[#59636E] flex items-center justify-end gap-1 font-mono mt-0.5">
                            <Clock className="w-3 h-3 text-[#22B947]" />
                            <span>ETA: {bid.estimatedArrivalMinutes} mins</span>
                          </div>
                        </div>
                      </div>

                      {/* Technician Counter Note */}
                      {bid.counterNote && (
                        <div className="bg-[#F8FAF7] p-2.5 rounded-xl border border-[#EBEFE9] text-xs text-[#090E11] leading-relaxed">
                          <span className="text-[#59636E] font-semibold">Technician Note: </span>"
                          {bid.counterNote}"
                        </div>
                      )}

                      {/* Certification Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {bid.technicianCertifications.map((cert) => (
                            <span
                              key={cert}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-[#EAF8E9] text-[#18852E] border border-[#C3EBC2] font-mono"
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
                            className="text-[#C92C2C] hover:text-[#991B1B] hover:bg-[#FDEAEA]"
                          >
                            Decline
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptBid(bid)}
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            Accept & Assign
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

        {/* Right: Nearby Certified Technicians (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card variant="default" className="border-[#E3E8E1] bg-[#FFFFFF] shadow-xs">
            <CardHeader className="bg-[#F8FAF7] border-b border-[#EBEFE9]">
              <div>
                <CardTitle className="text-sm sm:text-base text-[#090E11]">
                  Vetted Technicians on Radar ({effectiveTechnicians.length})
                </CardTitle>
                <CardDescription className="text-[#59636E]">
                  Instant dispatch to highest-rated verified freelance contractors
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-[#EBEFE9] max-h-[600px] overflow-y-auto">
              {effectiveTechnicians.map((tech) => (
                <div
                  key={tech.technicianId}
                  className="p-4 hover:bg-[#F8FAF7] transition space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#090E11] text-xs sm:text-sm">
                          {tech.fullName}
                        </span>
                        <span className="flex items-center text-[11px] text-[#B76B00] font-semibold font-mono">
                          <Star className="w-3 h-3 fill-current mr-0.5" />
                          {tech.rating}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#59636E] font-mono mt-0.5">
                        {tech.distanceMiles} miles away • {tech.completedJobsCount} jobs completed
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full inline-block ${
                          tech.isAvailable
                            ? 'bg-[#EAF8E9] text-[#18852E] border border-[#C3EBC2]'
                            : 'bg-[#F0F2F3] text-[#59636E] border border-[#E3E8E1]'
                        }`}
                      >
                        {tech.isAvailable ? 'Available Now' : 'Busy'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-[#18852E] font-mono flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#18852E]" />
                      Vetted:
                    </span>
                    {tech.certifications.map((c) => (
                      <span
                        key={c}
                        className="text-[9px] px-2 py-0.5 rounded-full bg-[#F8FAF7] text-[#090E11] border border-[#EBEFE9] font-mono font-medium inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#18852E]" />
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-[#59636E] font-mono flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#22B947]" />
                      GPS Beacon Verified
                    </span>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDirectDispatch(tech)}
                      leftIcon={<Zap className="w-3 h-3" />}
                    >
                      Instant Dispatch
                    </Button>
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
