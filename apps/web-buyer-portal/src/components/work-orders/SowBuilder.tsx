import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addWorkOrder, type ExtendedWorkOrder } from '../../store/slices/workOrderSlice';
import { preAuthorizeEscrow } from '../../store/slices/billingSlice';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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

  return (
    <div className="space-y-6">
      {/* Toast */}
      {publishedSuccess && (
        <div className="bg-emerald-950 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{publishedSuccess}</span>
          </div>
          <button
            onClick={() => setPublishedSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Preset Banner */}
      <Card variant="glass" className="p-4 border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Enterprise SOW Template Presets
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Load standardized deliverables and certification criteria for fast dispatch
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.name}
                variant="secondary"
                size="sm"
                onClick={() => applyPreset(p)}
                className="text-xs"
              >
                {p.name.split(' ')[0]} {p.name.split(' ')[1]}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Multi-Step SOW Studio Card */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">
                Scope of Work (SOW) Standard & Work Order Creator
              </CardTitle>
              <CardDescription>
                Define mandatory deliverables, technician accreditation, GPS geofencing, and
                pre-authorized escrow
              </CardDescription>
            </div>
          </div>

          {/* Stepper Navigation Indicator */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            {[
              { num: 1, label: 'Classification' },
              { num: 2, label: 'Location & SLA' },
              { num: 3, label: 'Budget & Escrow' },
              { num: 4, label: 'Certifications' },
              { num: 5, label: 'Review & Publish' }
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`px-2.5 py-1 rounded-md transition ${
                  step === s.num
                    ? 'bg-blue-600 text-white font-bold'
                    : step > s.num
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-500'
                }`}
              >
                {s.num}. {s.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Step 1: Classification & Details */}
          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="Work Order Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. POS Pin-Pad Replacement & Cat6 Cable Termination"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Category Domain"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    { value: 'Networking & POS', label: 'Networking & POS' },
                    { value: 'Telecommunications', label: 'Telecommunications' },
                    { value: 'Hardware Maintenance', label: 'Hardware Maintenance' },
                    { value: 'HVAC & Facility IoT', label: 'HVAC & Facility IoT' },
                    { value: 'Digital Signage', label: 'Digital Signage' }
                  ]}
                />

                <Select
                  label="Priority & Urgency Level"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  options={[
                    { value: PriorityLevel.CRITICAL_SLA, label: 'CRITICAL_SLA (< 4hr Response)' },
                    { value: PriorityLevel.URGENT, label: 'URGENT (< 8hr Response)' },
                    { value: PriorityLevel.STANDARD, label: 'STANDARD (24-48hr Window)' },
                    { value: PriorityLevel.LOW, label: 'LOW (Flexible Schedule)' }
                  ]}
                />
              </div>

              <Textarea
                label="Detailed Description & Problem Statement"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Step 2: Location & Geofencing */}
          {step === 2 && (
            <div className="space-y-4">
              <Input
                label="Site Physical Address"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
                placeholder="e.g. 789 Mission St, San Francisco, CA 94103"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Site Latitude (GPS)"
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                />
                <Input
                  label="Site Longitude (GPS)"
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                />
                <Input
                  label="Geofence Tolerance (Meters)"
                  type="number"
                  value={geofenceRadius}
                  onChange={(e) => setGeofenceRadius(parseInt(e.target.value, 10) || 200)}
                  helperText="Technician must be within this radius to check in"
                />
              </div>

              <Input
                label="SLA Resolution Deadline (Hours from Publish)"
                type="number"
                value={slaHours}
                onChange={(e) => setSlaHours(parseInt(e.target.value, 10) || 6)}
                leftIcon={<Clock className="w-4 h-4" />}
              />
            </div>
          )}

          {/* Step 3: Budget & Escrow Pre-Auth */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Budget Compensation Model"
                  value={budgetType}
                  onChange={(e) => setBudgetType(e.target.value as BudgetType)}
                  options={[
                    { value: BudgetType.FIXED, label: 'Fixed Price (Pre-Authorized Escrow)' },
                    { value: BudgetType.HOURLY, label: 'Hourly Rate (with Not-To-Exceed Cap)' }
                  ]}
                />

                <Input
                  label={
                    budgetType === BudgetType.FIXED
                      ? 'Total Escrow Amount ($)'
                      : 'Hourly Rate ($/hr)'
                  }
                  type="number"
                  value={budgetDollars}
                  onChange={(e) => setBudgetDollars(parseFloat(e.target.value) || 0)}
                  leftIcon={<DollarSign className="w-4 h-4" />}
                />
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Escrow Vault Guarantee (FR-BILL-001)
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {formatMinor(toMinor(budgetDollars))} Pre-Auth
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Upon publishing, {formatMinor(toMinor(budgetDollars))} will be reserved from your
                  corporate billing account (Apex Retail Corp). Funds remain locked in escrow until
                  you approve deliverables or the 72-hour review window concludes.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Compliance & Certifications */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Mandatory Technician Accreditation & Vetting Badges (FR-AUTH-003)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {availableCerts.map((cert) => {
                    const isSelected = selectedCerts.includes(cert);
                    return (
                      <button
                        key={cert}
                        type="button"
                        onClick={() => toggleCert(cert)}
                        className={`p-3 rounded-lg border text-left text-xs font-medium transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-950/80 border-blue-500 text-blue-200'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span>{cert}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope of Work Steps */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-medium text-slate-300">
                  Scope of Work Checklist Steps ({scopeSteps.length})
                </label>
                <div className="space-y-1.5">
                  {scopeSteps.map((s, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-300"
                    >
                      <div className="flex items-start space-x-2">
                        <span className="font-mono text-blue-400 font-bold">{idx + 1}.</span>
                        <span>{s}</span>
                      </div>
                      <button
                        onClick={() => removeScopeStep(idx)}
                        className="text-slate-500 hover:text-red-400 p-1"
                        aria-label="Remove step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add step to SOW checklist..."
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addScopeStep()}
                  />
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={addScopeStep}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Publish */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-slate-400 font-mono text-[10px]">WORK ORDER PREVIEW</span>
                    <h4 className="text-base font-bold text-white">{title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-emerald-400">
                      {formatMinor(toMinor(budgetDollars))}
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{budgetType}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block mb-1">Domain Category:</span>
                    <span className="text-white font-medium">{category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Priority:</span>
                    <StatusBadge status={priority} />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Site Location & Geofence:</span>
                    <span className="text-white font-medium">{addressLine}</span>
                    <span className="text-slate-500 font-mono text-[10px] block mt-0.5">
                      GPS: {latitude}, {longitude} (Radius: {geofenceRadius}m)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">SLA Target Resolution:</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {slaHours} Hours from Publish
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1.5">
                    Required Vetting & Compliance:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCerts.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[11px] font-semibold"
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1.5">
                    Mandatory Deliverables Checklist:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {deliverables.map((d, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 p-2 rounded border border-slate-800 text-[11px] text-slate-300"
                      >
                        <span className="font-semibold text-blue-400">[{d.type}]</span> {d.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-between">
          <div>
            {step > 1 && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStep(step - 1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Previous Step
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            {step < 5 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(step + 1)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Step {step + 1}
              </Button>
            ) : (
              <Button
                variant="success"
                size="md"
                onClick={handlePublish}
                leftIcon={<Zap className="w-4 h-4" />}
              >
                Publish to Dispatch & Pre-Auth Escrow ({formatMinor(toMinor(budgetDollars))})
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
