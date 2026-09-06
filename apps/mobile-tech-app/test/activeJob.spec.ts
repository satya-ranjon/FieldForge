import jobReducer, {
  updateJobStatus,
  toggleChecklistItem,
  setSerialNumber,
  setPhotoBefore,
  setPhotoAfter,
  setSignature
} from '../src/store/slices/jobSlice';
import { WorkOrderStatus } from '@fieldforge/contracts';

describe('Job State Management & Deliverables (FR-MOB-001/002/003)', () => {
  const getInitialState = () => jobReducer(undefined, { type: '@@INIT' });

  it('initializes with ASSIGNED job and pending checklist items', () => {
    const state = getInitialState();
    expect(state.activeJob).not.toBeNull();
    expect(state.activeJob?.status).toBe(WorkOrderStatus.ASSIGNED);
    expect(state.deliverables.checklist.length).toBe(4);
    expect(state.deliverables.checklist.every((c) => !c.completed)).toBe(true);
  });

  it('transitions through complete FSM lifecycle (ASSIGNED -> EN_ROUTE -> ON_SITE -> COMPLETED)', () => {
    let state = getInitialState();

    state = jobReducer(state, updateJobStatus(WorkOrderStatus.EN_ROUTE));
    expect(state.activeJob?.status).toBe(WorkOrderStatus.EN_ROUTE);

    state = jobReducer(state, updateJobStatus(WorkOrderStatus.ON_SITE));
    expect(state.activeJob?.status).toBe(WorkOrderStatus.ON_SITE);

    state = jobReducer(state, updateJobStatus(WorkOrderStatus.COMPLETED));
    expect(state.activeJob?.status).toBe(WorkOrderStatus.COMPLETED);
  });

  it('toggles checklist items and updates completion flags (FR-MOB-002)', () => {
    let state = getInitialState();
    const firstItemId = state.deliverables.checklist[0].id;

    state = jobReducer(state, toggleChecklistItem(firstItemId));
    expect(state.deliverables.checklist[0].completed).toBe(true);

    state = jobReducer(state, toggleChecklistItem(firstItemId));
    expect(state.deliverables.checklist[0].completed).toBe(false);
  });

  it('records serial number and proof-of-work photos (FR-MOB-002)', () => {
    let state = getInitialState();

    state = jobReducer(state, setSerialNumber('SN-VRF-89104-X'));
    expect(state.deliverables.serialNumber).toBe('SN-VRF-89104-X');

    state = jobReducer(state, setPhotoBefore('https://media.fieldforge.dev/before.jpg'));
    state = jobReducer(state, setPhotoAfter('https://media.fieldforge.dev/after.jpg'));

    expect(state.deliverables.photoBeforeUrl).toBe('https://media.fieldforge.dev/before.jpg');
    expect(state.deliverables.photoAfterUrl).toBe('https://media.fieldforge.dev/after.jpg');
  });

  it('captures client signature with cryptographic hash and timestamp (FR-MOB-003)', () => {
    let state = getInitialState();

    state = jobReducer(
      state,
      setSignature({
        clientName: 'Alice Morgan',
        signatureSvg: '<svg>signature</svg>',
        signatureHash: 'sha256-5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
      })
    );

    expect(state.deliverables.clientSignature).not.toBeNull();
    expect(state.deliverables.clientSignature?.clientName).toBe('Alice Morgan');
    expect(state.deliverables.clientSignature?.signatureHash).toContain('sha256-');
    expect(state.deliverables.clientSignature?.signedAt).toBeDefined();
  });
});
