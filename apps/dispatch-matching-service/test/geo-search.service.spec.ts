import { EventType, createEvent } from '@fieldforge/contracts';
import { GeoSearchService } from '../src/modules/geo-search/geo-search.service';
import { WorkOrderCreatedConsumer } from '../src/modules/consumers/work-order-created.consumer';

const CORRELATION_ID = '7f2b1c9e-0a41-4d3f-9c11-8b6d5e4a3210';
const SF = { latitude: 37.7749, longitude: -122.4194 };

/**
 * Real Redis GEOSEARCH matching arrives in Phase 4 of
 * docs/DEVELOPMENT_PLAN.md; `findNearbyTechnicians` currently returns a fixed
 * pair. These tests pin the parts of the contract Phase 4 must keep: the shape
 * dispatch hands to scoring, and the fact that a match is expressed relative to
 * the *work order's* coordinates rather than the technician's own claim.
 */
describe('GeoSearchService', () => {
  let geo: GeoSearchService;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    geo = new GeoSearchService();
  });

  it('returns technicians with a plausible distance, rating, and availability', async () => {
    const matches = await geo.findNearbyTechnicians(SF.latitude, SF.longitude);

    expect(matches.length).toBeGreaterThan(0);
    for (const tech of matches) {
      expect(tech.distanceMiles).toBeGreaterThanOrEqual(0);
      expect(tech.rating).toBeGreaterThan(0);
      expect(tech.rating).toBeLessThanOrEqual(5);
      expect(tech.completedJobsCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(tech.certifications)).toBe(true);
    }
  });

  it('keeps every match inside the requested radius', async () => {
    // FR-DISP-003 auto-routes within five miles, so a matcher that returns
    // technicians outside the radius it was asked for would silently dispatch
    // someone two hours away.
    const matches = await geo.findNearbyTechnicians(SF.latitude, SF.longitude, 25);
    for (const tech of matches) {
      expect(tech.distanceMiles).toBeLessThanOrEqual(25);
    }
  });

  it('returns coordinates near the searched point', async () => {
    const matches = await geo.findNearbyTechnicians(SF.latitude, SF.longitude);
    for (const tech of matches) {
      // One degree of latitude is ~69 miles, so a match 25 miles out cannot be
      // more than half a degree away in either axis.
      expect(Math.abs(tech.latitude - SF.latitude)).toBeLessThan(0.5);
      expect(Math.abs(tech.longitude - SF.longitude)).toBeLessThan(0.5);
    }
  });

  it('does not return the same technician twice', async () => {
    const ids = (await geo.findNearbyTechnicians(SF.latitude, SF.longitude)).map((t) => t.techId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('WorkOrderCreatedConsumer', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  const publishedEvent = () =>
    createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      {
        workOrderId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        buyerId: 'b0000000-0000-4000-8000-000000000001',
        title: 'Emergency POS Terminal Swap',
        maxBudgetMinor: 45000,
        ...SF
      },
      CORRELATION_ID
    );

  it('searches at the coordinates carried in the event payload', async () => {
    const geo = new GeoSearchService();
    const find = jest.spyOn(geo, 'findNearbyTechnicians').mockResolvedValue([]);

    await new WorkOrderCreatedConsumer(geo).handleWorkOrderPublished(publishedEvent());

    // Reading the position from anywhere but the event would match against a
    // stale or attacker-supplied location.
    expect(find).toHaveBeenCalledWith(SF.latitude, SF.longitude);
  });

  it('carries the correlationId into its log line', async () => {
    const log = jest.spyOn(console, 'log');
    const geo = new GeoSearchService();
    jest.spyOn(geo, 'findNearbyTechnicians').mockResolvedValue([]);

    await new WorkOrderCreatedConsumer(geo).handleWorkOrderPublished(publishedEvent());

    // FR-OBS-002: one buyer action has to be traceable across services, and the
    // envelope is the only place downstream can learn the id from.
    expect(String(log.mock.calls.at(-1)?.[0])).toContain(CORRELATION_ID);
  });

  it('tolerates a work order with no eligible technicians', async () => {
    const geo = new GeoSearchService();
    jest.spyOn(geo, 'findNearbyTechnicians').mockResolvedValue([]);

    // An empty radius is normal, not exceptional: throwing here would send the
    // message to the DLQ and lose the work order once Phase 3 binds the queue.
    await expect(
      new WorkOrderCreatedConsumer(geo).handleWorkOrderPublished(publishedEvent())
    ).resolves.toBeUndefined();
  });
});
