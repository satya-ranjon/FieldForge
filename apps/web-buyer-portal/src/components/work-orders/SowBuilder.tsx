'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  DollarSign
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addWorkOrder, type ExtendedWorkOrder } from '../../store/slices/workOrderSlice';
import { preAuthorizeEscrow } from '../../store/slices/billingSlice';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
  Textarea,
  Select,
  StatusBadge
} from '@fieldforge/ui';
import {
  BudgetType,
  formatMinor,
  PriorityLevel,
  toMinor,
  WorkOrderStatus
} from '@fieldforge/contracts';

interface SowTemplatePreset {
  name: string;
  category: string;
  priority: PriorityLevel;
  budgetDollars: number;
  budgetType: BudgetType;
  description: string;
  certifications: string[];
  scopeSteps: string[];
  deliverables: {
    type: 'PHOTO_BEFORE' | 'PHOTO_AFTER' | 'CHECKLIST' | 'SIGNATURE';
    title: string;
  }[];
}

const PRESETS: SowTemplatePreset[] = [
  {
    name: 'POS Terminal Emergency Swap & Cat6',
    category: 'Networking & POS',
    priority: PriorityLevel.CRITICAL_SLA,
    budgetDollars: 450,
    budgetType: BudgetType.FIXED,
    description:
      'Emergency replacement of 4x Ingenico POS terminals and re-termination of Cat6 drop cables to store back-office switch.',
    certifications: ['CompTIA A+', 'OSHA 10', 'Background Checked'],
    scopeSteps: [
      'Check in within 200m geofence and take photo of storefront',
      'Unbox 4x Ingenico Lane/7000 units and record serial numbers',
      'Swap terminal mounts, re-terminate Cat6 RJ45 connectors with T568B pinout',
      'Run Fluke network cable continuity test and verify merchant portal handshake',
      'Obtain store manager digital signature on mobile app'
    ],
    deliverables: [
      { type: 'PHOTO_BEFORE', title: 'Damaged POS wiring & register bank' },
      { type: 'PHOTO_AFTER', title: 'Installed & tested POS terminals with cable combs' },
      { type: 'CHECKLIST', title: 'Fluke cable tester continuity pass' },
      { type: 'SIGNATURE', title: 'Store Operations Manager Sign-off' }
    ]
  },
  {
    name: 'Fiber Optic Splice & SFP+ Replacement',
    category: 'Telecommunications',
    priority: PriorityLevel.URGENT,
    budgetDollars: 620,
    budgetType: BudgetType.FIXED,
    description:
      'Single-mode fiber core fusion splicing, optical power dBm loss verification, and Cisco SFP-10G-LR transceiver hot swap.',
    certifications: ['Cisco CCNA', 'Fiber Splicing Cert', 'Background Checked'],
    scopeSteps: [
      'Check in on-site and present ID to data center security',
      'Locate server rack and put on anti-static ESD wristband',
      'Fusion splice 2 strands LC-LC single-mode fiber patch cord',
      'Clean ferrule faces with fiber click-cleaner and measure optical loss (target < 0.5dB)',
      'Install SFP+ transceiver and verify green link light on core switch'
    ],
    deliverables: [
      { type: 'PHOTO_BEFORE', title: 'Faulty optical transceivers and broken patch cord' },
      { type: 'PHOTO_AFTER', title: 'Completed fusion splice and green link LEDs' },
      { type: 'CHECKLIST', title: 'OTDR optical loss meter printout' },
      { type: 'SIGNATURE', title: 'Data Center Shift Supervisor Sign-off' }
    ]
  },
  {
    name: 'Meraki Wireless AP Cloud Deployment',
    category: 'Networking & POS',
    priority: PriorityLevel.STANDARD,
    budgetDollars: 75,
    budgetType: BudgetType.HOURLY,
    description:
      'Mount 6x Cisco Meraki MR46 Access Points across ceiling grid, connect to PoE+ Gigabit switch, and verify cloud mesh connectivity.',
    certifications: ['Cisco CCNA', 'OSHA 10'],
    scopeSteps: [
      'Survey floorplan and mount ceiling grid drop brackets',
      'Run Cat6 Plenum cable to PoE switch ports 1-6',
      'Scan AP QR codes into Meraki mobile provisioning app',
      'Perform RF heat map signal check with Wi-Fi Analyzer'
    ],
    deliverables: [
      { type: 'PHOTO_BEFORE', title: 'Ceiling mounting locations survey' },
      { type: 'PHOTO_AFTER', title: 'Mounted APs with active solid green LEDs' },
      { type: 'CHECKLIST', title: 'Meraki cloud dashboard online check' },
      { type: 'SIGNATURE', title: 'Store Manager Acceptance Sign-off' }
    ]
  }
];

export const SowBuilder: React.FC = () => {
  const dispatch = useDispatch();

  const [step, setStep] = useState<number>(1);
  const [publishedSuccess, setPublishedSuccess] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('Emergency POS Terminal Swap & Cat6 Cabling');
  const [category, setCategory] = useState('Networking & POS');
  const [priority, setPriority] = useState<PriorityLevel>(PriorityLevel.URGENT);
  const [description, setDescription] = useState(
    'Replace 4 failed Ingenico POS pin-pads and terminate 2 Cat6 drop lines behind register bank.'
  );
  const [addressLine, setAddressLine] = useState('789 Mission St, San Francisco, CA 94103');
  const [latitude, setLatitude] = useState(37.7847);
  const [longitude, setLongitude] = useState(-122.4068);
  const [geofenceRadius, setGeofenceRadius] = useState(200);
  const [budgetType, setBudgetType] = useState<BudgetType>(BudgetType.FIXED);
  const [budgetDollars, setBudgetDollars] = useState<number>(450);
  const [slaHours, setSlaHours] = useState<number>(6);

  // Certifications
  const availableCerts = [
    'CompTIA A+',
    'CompTIA Network+',
    'Cisco CCNA',
    'Cisco CCNP',
    'OSHA 10',
    'Background Checked',
    'Fiber Splicing Cert',
    'Weights & Measures State Cert',
    'Outdoor Display Cert'
  ];
  const [selectedCerts, setSelectedCerts] = useState<string[]>([
    'CompTIA A+',
    'OSHA 10',
    'Background Checked'
  ]);

  // Scope Steps
  const [scopeSteps, setScopeSteps] = useState<string[]>([
    'Check in within 200m geofence and take photo of storefront',
    'Unbox 4x Ingenico Lane/7000 units and record serial numbers',
    'Swap terminal mounts, re-terminate Cat6 RJ45 connectors with T568B pinout',
    'Run Fluke network cable continuity test and verify merchant portal handshake',
    'Obtain store manager digital signature on mobile app'
  ]);
  const [newStepText, setNewStepText] = useState('');

  // Deliverables
  const [deliverables, setDeliverables] = useState<
    { type: 'PHOTO_BEFORE' | 'PHOTO_AFTER' | 'CHECKLIST' | 'SIGNATURE'; title: string }[]
  >([
    { type: 'PHOTO_BEFORE', title: 'Damaged POS wiring & register bank' },
    { type: 'PHOTO_AFTER', title: 'Installed & tested POS terminals with cable combs' },
    { type: 'CHECKLIST', title: 'Fluke cable tester continuity pass' },
    { type: 'SIGNATURE', title: 'Store Operations Manager Sign-off' }
  ]);

  const applyPreset = (preset: SowTemplatePreset) => {
    setTitle(preset.name);
    setCategory(preset.category);
    setPriority(preset.priority);
    setBudgetDollars(preset.budgetDollars);
    setBudgetType(preset.budgetType);
    setDescription(preset.description);
    setSelectedCerts(preset.certifications);
    setScopeSteps(preset.scopeSteps);
    setDeliverables(preset.deliverables);
  };

  const toggleCert = (cert: string) => {
    if (selectedCerts.includes(cert)) {
      setSelectedCerts(selectedCerts.filter((c) => c !== cert));
    } else {
      setSelectedCerts([...selectedCerts, cert]);
    }
  };

  const addScopeStep = () => {
    if (!newStepText.trim()) return;
    setScopeSteps([...scopeSteps, newStepText.trim()]);
    setNewStepText('');
  };

  const removeScopeStep = (index: number) => {
    setScopeSteps(scopeSteps.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    const newId = `wo-${Math.floor(100 + Math.random() * 900)}`;
    const now = Date.now();

    const newWorkOrder: ExtendedWorkOrder = {
      id: newId,
      buyerId: 'buyer-apex-01',
      title,
      description,
      category,
      status: WorkOrderStatus.PUBLISHED,
      priority,
      budgetType,
      budgetAmountMinor: toMinor(budgetDollars),
      addressLine,
      latitude,
      longitude,
      geofenceRadiusMeters: geofenceRadius,
      requiredCertifications: selectedCerts,
      scheduledStartTime: new Date(now + 3600000).toISOString(),
      scheduledEndTime: new Date(now + slaHours * 3600000).toISOString(),
      slaExpirationTime: new Date(now + slaHours * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scopeOfWorkSteps: scopeSteps,
      deliverables: deliverables.map((d, i) => ({
        id: `del-${newId}-${i + 1}`,
        type: d.type,
        title: d.title,
        status: 'PENDING'
      }))
    };

    // 1. Dispatch to work order slice
    dispatch(addWorkOrder(newWorkOrder));

    // 2. Pre-authorize escrow funds
    dispatch(
      preAuthorizeEscrow({
        workOrderId: newId,
        workOrderTitle: title,
        amountMinor: toMinor(budgetDollars)
      })
    );

    setPublishedSuccess(
      `Work Order ${newId} published to dispatch queue! ${formatMinor(toMinor(budgetDollars))} escrow pre-authorized and broadcasted to nearby technicians.`
    );
    setStep(1);
    setTimeout(() => setPublishedSuccess(null), 6000);
  };

  const platformFee = Math.round(budgetDollars * 0.08);
  const totalEscrowDollars = budgetDollars + platformFee;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Toast */}
      {publishedSuccess && (
        <div className="bg-emerald-950/90 border border-emerald-600/80 text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-lg shadow-emerald-950/40">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{publishedSuccess}</span>
          </div>
          <button
            onClick={() => setPublishedSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preset Banner Cards */}
      <Card variant="glass" className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Enterprise SOW Template Presets
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click a verified blueprint to pre-populate industry-standard scope, certifications,
              and escrow terms
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((preset) => {
            const isMatch = title === preset.name;
            return (
              <div
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer relative ${
                  isMatch
                    ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/40 ring-1 ring-blue-500/30'
                    : 'bg-[#090d16]/80 border-slate-800/80 hover:bg-[#090d16] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {preset.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ${preset.budgetDollars}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mt-2 leading-snug">{preset.name}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {preset.description}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{preset.scopeSteps.length} Steps</span>
                  <span className="text-blue-400 font-medium">Click to Load →</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main Studio Grid: Form Wizard (7 cols) + Live Escrow Preview (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left Wizard Column */}
        <div className="xl:col-span-7 space-y-4">
          <Card variant="elevated" className="border-slate-700/80">
            {/* Step Navigation Bar */}
            <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-[#090d16]/60 flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
              {[
                { num: 1, label: 'Scope & Category' },
                { num: 2, label: 'Geo & Location' },
                { num: 3, label: 'SLA & Escrow' },
                { num: 4, label: 'Deliverables' }
              ].map((s) => {
                const isCurrent = step === s.num;
                const isPassed = step > s.num;

                return (
                  <button
                    key={s.num}
                    onClick={() => setStep(s.num)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : isPassed
                          ? 'text-emerald-400 hover:text-white bg-slate-900/60 border border-emerald-800/40'
                          : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-white text-blue-700'
                          : isPassed
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-3 h-3" /> : s.num}
                    </span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Step 1: Scope & Category */}
            {step === 1 && (
              <CardContent className="space-y-4">
                <Input
                  label="Work Order Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. POS Terminal Emergency Swap"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Work Order Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={[
                      { value: 'Networking & POS', label: 'Networking & POS' },
                      { value: 'Telecommunications', label: 'Telecommunications' },
                      { value: 'EV Charging & Power', label: 'EV Charging & Power' },
                      { value: 'HVAC & Refrigeration', label: 'HVAC & Refrigeration' },
                      { value: 'CCTV & Security', label: 'CCTV & Security' }
                    ]}
                  />

                  <Select
                    label="Priority & SLA Urgency"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    options={[
                      { value: PriorityLevel.CRITICAL_SLA, label: 'CRITICAL_SLA (< 4hr SLA)' },
                      { value: PriorityLevel.URGENT, label: 'URGENT (< 8hr SLA)' },
                      { value: PriorityLevel.STANDARD, label: 'STANDARD (< 24hr SLA)' },
                      { value: PriorityLevel.LOW, label: 'LOW (Flexible)' }
                    ]}
                  />
                </div>

                <Textarea
                  label="Detailed Scope Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe root-cause, target assets, serial numbers, and equipment model..."
                />

                {/* Scope Steps Builder */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="block text-xs font-medium text-slate-300">
                    Step-by-Step SOP Checklist ({scopeSteps.length})
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {scopeSteps.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#090d16] border border-slate-800 text-xs"
                      >
                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                          <span className="font-mono text-blue-400 font-bold shrink-0">
                            {idx + 1}.
                          </span>
                          <span className="text-slate-200 truncate">{s}</span>
                        </div>
                        <button
                          onClick={() => removeScopeStep(idx)}
                          className="text-slate-500 hover:text-red-400 p-1 cursor-pointer shrink-0"
                          aria-label="Remove step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="text"
                      placeholder="Add an SOP step..."
                      value={newStepText}
                      onChange={(e) => setNewStepText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addScopeStep()}
                      className="flex-1 bg-[#090d16] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={addScopeStep}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}

            {/* Step 2: Location & Geofence */}
            {step === 2 && (
              <CardContent className="space-y-4">
                <Input
                  label="Site Street Address"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. 789 Mission St, San Francisco, CA"
                  leftIcon={<MapPin className="w-4 h-4" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">Geofence Radius Tolerance</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {geofenceRadius} meters
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="25"
                    value={geofenceRadius}
                    onChange={(e) => setGeofenceRadius(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Technician mobile check-in will strictly require GPS coordinates within this
                    boundary before unlocking on-site milestone status.
                  </p>
                </div>
              </CardContent>
            )}

            {/* Step 3: SLA & Escrow */}
            {step === 3 && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Budget Billing Model"
                    value={budgetType}
                    onChange={(e) => setBudgetType(e.target.value as BudgetType)}
                    options={[
                      { value: BudgetType.FIXED, label: 'Fixed Price Milestones' },
                      { value: BudgetType.HOURLY, label: 'Hourly Blended Rate' }
                    ]}
                  />

                  <Input
                    label="Target Budget ($ USD)"
                    type="number"
                    value={budgetDollars}
                    onChange={(e) =>
                      setBudgetDollars(Math.max(1, parseInt(e.target.value, 10) || 0))
                    }
                    leftIcon={<DollarSign className="w-4 h-4" />}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    SLA Response & Resolution Window
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { hours: 2, label: '2 Hours (Critical)' },
                      { hours: 6, label: '6 Hours (Urgent)' },
                      { hours: 24, label: '24 Hours (Std)' },
                      { hours: 72, label: '72 Hours (Low)' }
                    ].map((sla) => (
                      <button
                        key={sla.hours}
                        onClick={() => setSlaHours(sla.hours)}
                        className={`p-2 rounded-lg border text-xs font-medium font-mono text-center cursor-pointer transition ${
                          slaHours === sla.hours
                            ? 'bg-blue-600/30 border-blue-500 text-blue-300 ring-1 ring-blue-500/40'
                            : 'bg-[#090d16] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {sla.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Required Certifications */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="block text-xs font-medium text-slate-300">
                    Required Technician Vetting & Badges
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableCerts.map((cert) => {
                      const isSelected = selectedCerts.includes(cert);
                      return (
                        <button
                          key={cert}
                          onClick={() => toggleCert(cert)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center space-x-1.5 ${
                            isSelected
                              ? 'bg-blue-950/80 text-blue-300 border-blue-700 shadow-sm'
                              : 'bg-[#090d16] text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{cert}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            )}

            {/* Step 4: Deliverables Checklist */}
            {step === 4 && (
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    Mandatory Proof-of-Work Deliverables ({deliverables.length})
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">FR-MOB-002</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deliverables.map((del, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#090d16] border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
                          {del.type}
                        </span>
                        <span className="text-slate-200 font-medium truncate">{del.title}</span>
                      </div>
                      <button
                        onClick={() => setDeliverables(deliverables.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400 p-1 cursor-pointer shrink-0"
                        aria-label="Delete deliverable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/50 flex items-start space-x-2.5 text-xs text-blue-300">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Escrow funds are safeguarded in the Smart Vault and are only released upon buyer
                    verification of all {deliverables.length} deliverables or dispute clearance.
                  </p>
                </div>
              </CardContent>
            )}

            {/* Step Navigation Actions */}
            <CardFooter className="justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>

              {step < 4 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setStep(step + 1)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handlePublish}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Publish & Lock Escrow
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Right Live Preview Column */}
        <div className="xl:col-span-5 space-y-4">
          <Card variant="elevated" className="border-slate-700/80 sticky top-24">
            <CardHeader className="bg-[#090d16]/50">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Live Dispatch Preview
                </span>
                <CardTitle className="mt-1 text-sm sm:text-base">
                  {title || 'Untitled Ticket'}
                </CardTitle>
              </div>
              <StatusBadge status="PUBLISHED" />
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  {category}
                </span>
                <StatusBadge status={priority} />
                <span className="text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {slaHours}h Target
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed text-xs">
                {description || 'No description provided.'}
              </p>

              {/* Site location snippet */}
              <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-300 font-semibold text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Site Address:</span>
                </div>
                <div className="text-slate-200 pl-5">{addressLine}</div>
                <div className="text-[10px] font-mono text-slate-500 pl-5">
                  Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)} • {geofenceRadius}m
                  geofence
                </div>
              </div>

              {/* Transparent Escrow Vault Breakdown (Stripe-inspired) */}
              <div className="bg-[#090d16] p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-300 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Escrow Vault Pre-Authorization
                  </span>
                  <span className="font-mono text-slate-500">AES-256</span>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Base Technician Payout ({budgetType}):</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      ${budgetDollars}.00
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>FieldForge Platform Service Fee (8%):</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      ${platformFee}.00
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-white font-bold pt-1.5 border-t border-slate-800 font-mono text-sm">
                    <span>Total Escrow Vault Pre-Auth:</span>
                    <span className="text-emerald-400">${totalEscrowDollars}.00</span>
                  </div>
                </div>
              </div>

              {/* Required Badges Preview */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Required Vetting ({selectedCerts.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCerts.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-900/50 text-[10px] font-semibold font-mono"
                    >
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="success"
                  size="md"
                  className="w-full shadow-lg shadow-emerald-950/50"
                  onClick={handlePublish}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Publish Ticket & Authorize ${totalEscrowDollars}.00
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
