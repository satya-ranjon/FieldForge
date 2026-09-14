import jobReducer, {
  updateJobStatus,
  toggleChecklistItem,
  setSerialNumber,
  setMediaPending,
  setMediaUploaded,
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

  it('records serial number and manages deliverable media lifecycle (FR-MOB-002 & ISSUE-003A)', () => {
    let state = getInitialState();

    state = jobReducer(state, setSerialNumber('SN-VRF-89104-X'));
    expect(state.deliverables.serialNumber).toBe('SN-VRF-89104-X');

    // 1. Media initially pending (local capture)
    state = jobReducer(
      state,
      setMediaPending({
        type: 'BEFORE',
        file: {
          localUri: 'file:///data/user/0/app/cache/before.jpg',
          filename: 'before.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024 * 10
        }
      })
    );
    expect(state.deliverables.photoBefore?.status).toBe('PENDING');
    expect(state.deliverables.photoBeforeUrl).toBeNull(); // No fake URL generated!

    // 2. Confirmed by backend after S3 PUT
    state = jobReducer(
      state,
      setMediaUploaded({
        type: 'BEFORE',
        deliverable: {
          id: 'del-confirmed-before',
          mediaUrl: 'https://fieldforge-deliverables.s3.amazonaws.com/deliverables/wo/before.jpg',
          objectKey: 'deliverables/wo/before.jpg'
        }
      })
    );
    state = jobReducer(
      state,
      setMediaUploaded({
        type: 'AFTER',
        deliverable: {
          id: 'del-confirmed-after',
          mediaUrl: 'https://fieldforge-deliverables.s3.amazonaws.com/deliverables/wo/after.jpg',
          objectKey: 'deliverables/wo/after.jpg'
        }
      })
    );

    expect(state.deliverables.photoBefore?.status).toBe('UPLOADED');
    expect(state.deliverables.photoBeforeUrl).toBe(
      'https://fieldforge-deliverables.s3.amazonaws.com/deliverables/wo/before.jpg'
    );
    expect(state.deliverables.photoAfter?.status).toBe('UPLOADED');
    expect(state.deliverables.photoAfterUrl).toBe(
      'https://fieldforge-deliverables.s3.amazonaws.com/deliverables/wo/after.jpg'
    );
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
