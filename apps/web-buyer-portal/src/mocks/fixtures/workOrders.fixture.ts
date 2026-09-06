import type { ExtendedWorkOrder } from '../../store/slices/workOrderSlice';
import { WorkOrderStatus, BudgetType, PriorityLevel } from '@fieldforge/contracts';

// Fixed baseline timestamp for deterministic SSR hydration and testing parity
const now = 1772496000000;

export const mockWorkOrders: ExtendedWorkOrder[] = [
  {
    id: 'wo-101',
    buyerId: 'buyer-apex-01',
    title: 'Emergency POS Terminal Swap & Cat6 Cabling',
    description:
      'Replace 4 failed Ingenico Lane/7000 pin-pads and terminate 2 Cat6 drop lines behind front registers 1-4. Validate network connectivity to main store switch.',
    category: 'Networking & POS',
    status: WorkOrderStatus.PUBLISHED,
    priority: PriorityLevel.CRITICAL_SLA,
    budgetType: BudgetType.FIXED,
    budgetAmountMinor: 45_000,
    addressLine: '789 Mission St, San Francisco, CA 94103',
    latitude: 37.7847,
    longitude: -122.4068,
    geofenceRadiusMeters: 200,
    requiredCertifications: ['CompTIA A+', 'OSHA 10', 'Background Checked'],
    scheduledStartTime: new Date(now + 2 * 3600000).toISOString(),
    scheduledEndTime: new Date(now + 6 * 3600000).toISOString(),
    slaExpirationTime: new Date(now + 4 * 3600000).toISOString(),
    createdAt: new Date(now - 3600000).toISOString(),
    updatedAt: new Date(now - 1800000).toISOString(),
    scopeOfWorkSteps: [
      'Check in within 200m geofence and take photo of storefront',
      'Unbox 4x Ingenico Lane/7000 units and record serial numbers',
      'Swap terminal mounts, re-terminate Cat6 RJ45 connectors with T568B pinout',
      'Run Fluke network cable continuity test and verify merchant portal handshake',
      'Obtain store manager digital signature on mobile app'
    ],
    deliverables: [
      {
        id: 'del-1',
        type: 'PHOTO_BEFORE',
        title: 'Damaged POS wiring & register bank',
        status: 'PENDING'
      },
      {
        id: 'del-2',
        type: 'PHOTO_AFTER',
        title: 'Installed & tested POS terminals with cable combs',
        status: 'PENDING'
      },
      {
        id: 'del-3',
        type: 'CHECKLIST',
        title: 'Cable tester pass report (Fluke MicroScanner)',
        status: 'PENDING'
      },
      {
        id: 'del-4',
        type: 'SIGNATURE',
        title: 'Store Operations Manager Sign-off',
        status: 'PENDING'
      }
    ]
  },
  {
    id: 'wo-102',
    buyerId: 'buyer-apex-01',
    assignedTechnicianId: 'tech-marcus-01',
    assignedTechnicianName: 'Marcus Vance, CCNA',
    assignedTechnicianRating: 4.98,
    assignedTechnicianPhone: '+1 (415) 890-2341',
    title: 'Fiber Optic Patching & Core Switch SFP+ Replacement',
    description:
      'Replace failed 10GbE Cisco SFP+ transceiver on Core Switch B (Rack 4, Unit 22) and splice single-mode fiber patch cord LC-LC.',
    category: 'Telecommunications',
    status: WorkOrderStatus.ON_SITE,
    priority: PriorityLevel.URGENT,
    budgetType: BudgetType.FIXED,
    budgetAmountMinor: 62_000,
    addressLine: '1000 4th St, San Francisco, CA 94158',
    latitude: 37.7712,
    longitude: -122.3921,
    geofenceRadiusMeters: 150,
    geofenceCheckInDistanceMeters: 28,
    geofenceVerified: true,
    requiredCertifications: ['Cisco CCNA', 'Fiber Splicing Cert', 'Background Checked'],
    scheduledStartTime: new Date(now - 7200000).toISOString(),
    scheduledEndTime: new Date(now + 1800000).toISOString(),
    slaExpirationTime: new Date(now + 10800000).toISOString(),
    createdAt: new Date(now - 14400000).toISOString(),
    updatedAt: new Date(now - 1200000).toISOString(),
    scopeOfWorkSteps: [
      'Present badge to security guard at dock 2',
      'Locate Rack 4 Unit 22, ESD wristband required',
      'Remove faulty SFP+ module serial #FNS213409',
      'Insert OEM Cisco SFP-10G-LR and clean fiber ferrule with IBC cleaner',
      'Verify green link status on port Te1/0/24 and report optical dBm loss'
    ],
    deliverables: [
      {
        id: 'del-102-1',
        type: 'PHOTO_BEFORE',
        title: 'Amber LED error code on switch port Te1/0/24',
        url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=60',
        submittedAt: new Date(now - 3600000).toISOString(),
        status: 'VERIFIED'
      },
      {
        id: 'del-102-2',
        type: 'PHOTO_AFTER',
        title: 'Clean link green LED + optical power level readout (-2.4 dBm)',
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60',
        submittedAt: new Date(now - 1800000).toISOString(),
        status: 'VERIFIED'
      },
      {
        id: 'del-102-3',
        type: 'CHECKLIST',
        title: 'Optical light loss meter readout sheet',
        submittedAt: new Date(now - 900000).toISOString(),
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'wo-103',
    buyerId: 'buyer-apex-01',
    assignedTechnicianId: 'tech-elena-02',
    assignedTechnicianName: 'Elena Rostova',
    assignedTechnicianRating: 4.92,
    assignedTechnicianPhone: '+1 (510) 772-9104',
    title: 'Self-Checkout Barcode Scanner & Scale Calibration',
    description:
      'Datalogic Magellan 9800i bi-optic scanner scale drifting out of calibration on Lane 3. Recalibrate certified weights and clean laser optics.',
    category: 'Hardware Maintenance',
    status: WorkOrderStatus.EN_ROUTE,
    priority: PriorityLevel.STANDARD,
    budgetType: BudgetType.FIXED,
    budgetAmountMinor: 38_000,
    addressLine: '2300 16th St, San Francisco, CA 94103',
    latitude: 37.7663,
    longitude: -122.4116,
    geofenceRadiusMeters: 200,
    geofenceCheckInDistanceMeters: 850,
    geofenceVerified: false,
    requiredCertifications: ['Weights & Measures State Cert', 'CompTIA A+'],
    scheduledStartTime: new Date(now + 1800000).toISOString(),
    scheduledEndTime: new Date(now + 7200000).toISOString(),
    slaExpirationTime: new Date(now + 14400000).toISOString(),
    createdAt: new Date(now - 18000000).toISOString(),
    updatedAt: new Date(now - 900000).toISOString(),
    scopeOfWorkSteps: [
      'Arrive on-site, report to front-end supervisor',
      'Zero balance scale with 5lb and 25lb certified NIST weights',
      'Clean top and vertical sapphire glass scanner platters',
      'Print calibration certification sticker'
    ],
    deliverables: [
      {
        id: 'del-103-1',
        type: 'PHOTO_BEFORE',
        title: 'Scale error error code E-04 on display',
        status: 'PENDING'
      },
      {
        id: 'del-103-2',
        type: 'PHOTO_AFTER',
        title: 'Completed NIST calibration certificate attached to unit',
        status: 'PENDING'
      }
    ]
  },
  {
    id: 'wo-104',
    buyerId: 'buyer-apex-01',
    assignedTechnicianId: 'tech-darnell-03',
    assignedTechnicianName: 'Darnell Jenkins, CCNP',
    assignedTechnicianRating: 4.88,
    assignedTechnicianPhone: '+1 (408) 555-0199',
    title: 'HVAC Server Room Temperature Sensor Replacement & IoT Gateway',
    description:
      'Installed 2x Schneider Electric Zigbee IoT humidity/temp sensors in Server Room B. Calibrated alerts to FieldForge buyer monitoring API.',
    category: 'HVAC & Facility IoT',
    status: WorkOrderStatus.COMPLETED,
    priority: PriorityLevel.STANDARD,
    budgetType: BudgetType.FIXED,
    budgetAmountMinor: 55_000,
    addressLine: '555 Market St, San Francisco, CA 94105',
    latitude: 37.7904,
    longitude: -122.4005,
    geofenceRadiusMeters: 100,
    geofenceCheckInDistanceMeters: 12,
    geofenceVerified: true,
    requiredCertifications: ['OSHA 10', 'HVAC Controls Spec'],
    scheduledStartTime: new Date(now - 28800000).toISOString(),
    scheduledEndTime: new Date(now - 14400000).toISOString(),
    slaExpirationTime: new Date(now - 7200000).toISOString(),
    createdAt: new Date(now - 86400000).toISOString(),
    updatedAt: new Date(now - 7200000).toISOString(),
    scopeOfWorkSteps: [
      'Check in within geofence',
      'Mount sensors at rack intake and exhaust (hot aisle/cold aisle)',
      'Pair Zigbee nodes with local IoT gateway',
      'Verify live telemetry push to buyer dashboard',
      'Capture facility manager sign-off'
    ],
    deliverables: [
      {
        id: 'del-104-1',
        type: 'PHOTO_BEFORE',
        title: 'Empty sensor mounting bracket Rack A4',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
        submittedAt: new Date(now - 21600000).toISOString(),
        status: 'VERIFIED'
      },
      {
        id: 'del-104-2',
        type: 'PHOTO_AFTER',
        title: 'Mounted Schneider Zigbee sensor with active green LED',
        url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60',
        submittedAt: new Date(now - 18000000).toISOString(),
        status: 'VERIFIED'
      },
      {
        id: 'del-104-3',
        type: 'SIGNATURE',
        title: 'Facility Manager Sign-off',
        signerName: 'David Chen (Facility Lead)',
        signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        submittedAt: new Date(now - 14400000).toISOString(),
        status: 'VERIFIED'
      }
    ]
  },
  {
    id: 'wo-105',
    buyerId: 'buyer-apex-01',
    title: 'Meraki Wireless AP Deployment (6 Units, Ceiling Grid)',
    description:
      'Install 6x Cisco Meraki MR46 Access Points across showroom floor ceiling T-bars. Connect to PoE+ Gigabit switch ports and confirm cloud dashboard provisioning.',
    category: 'Networking & POS',
    status: WorkOrderStatus.DRAFT,
    priority: PriorityLevel.LOW,
    budgetType: BudgetType.HOURLY,
    budgetAmountMinor: 7_500,
    addressLine: '1200 Potrero Ave, San Francisco, CA 94110',
    latitude: 37.7533,
    longitude: -122.4065,
    geofenceRadiusMeters: 200,
    requiredCertifications: ['Cisco CCNA', 'OSHA 10'],
    scheduledStartTime: new Date(now + 172800000).toISOString(),
    scheduledEndTime: new Date(now + 190000000).toISOString(),
    slaExpirationTime: new Date(now + 259200000).toISOString(),
    createdAt: new Date(now - 43200000).toISOString(),
    updatedAt: new Date(now - 43200000).toISOString(),
    scopeOfWorkSteps: [
      'Survey ceiling drop tile mounting locations',
      'Install Meraki drop-ceiling grid brackets',
      'Patch Cat6 Plenum cabling to PoE switch',
      'Scan QR codes to buyer Meraki organization network'
    ],
    deliverables: []
  },
  {
    id: 'wo-106',
    buyerId: 'buyer-apex-01',
    assignedTechnicianId: 'tech-sarah-04',
    assignedTechnicianName: 'Sarah Lin',
    assignedTechnicianRating: 4.95,
    assignedTechnicianPhone: '+1 (415) 302-8819',
    title: 'Drive-Thru Digital Menu Board High-Voltage Inverter Check',
    description:
      'Samsung outdoor high-brightness display black screen. Technician reported power supply board failure but deliverables missing serial photo.',
    category: 'Digital Signage',
    status: WorkOrderStatus.DISPUTED,
    priority: PriorityLevel.URGENT,
    budgetType: BudgetType.FIXED,
    budgetAmountMinor: 35_000,
    addressLine: '3251 20th Ave, San Francisco, CA 94132',
    latitude: 37.7285,
    longitude: -122.4768,
    geofenceRadiusMeters: 200,
    geofenceCheckInDistanceMeters: 45,
    geofenceVerified: true,
    requiredCertifications: ['Outdoor Display Cert', 'OSHA 10'],
    scheduledStartTime: new Date(now - 86400000).toISOString(),
    scheduledEndTime: new Date(now - 79200000).toISOString(),
    slaExpirationTime: new Date(now - 50000000).toISOString(),
    createdAt: new Date(now - 120000000).toISOString(),
    updatedAt: new Date(now - 36000000).toISOString(),
    disputeReason:
      'Technician left site without uploading photo evidence of defective power inverter serial number or obtaining manager sign-off.',
    scopeOfWorkSteps: [
      'Inspect weather seal and open rear maintenance hatch',
      'Check 24V DC auxiliary rail with multimeter',
      'Photograph part serial numbers before closing hatch'
    ],
    deliverables: [
      {
        id: 'del-106-1',
        type: 'PHOTO_BEFORE',
        title: 'Dark display face at Drive-thru lane 2',
        url: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=60',
        submittedAt: new Date(now - 82800000).toISOString(),
        status: 'VERIFIED'
      },
      {
        id: 'del-106-2',
        type: 'PHOTO_AFTER',
        title: 'Missing replacement inverter serial photo',
        status: 'REJECTED'
      }
    ]
  }
];
