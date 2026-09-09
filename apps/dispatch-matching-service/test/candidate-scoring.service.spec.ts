import {
  CandidateScoringService,
  DEFAULT_CANDIDATE_SCORING_WEIGHTS,
  CandidateScoringInput
} from '../src/modules/scoring';

describe('CandidateScoringService', () => {
  let service: CandidateScoringService;

  beforeEach(() => {
    service = new CandidateScoringService();
  });

  describe('Weights Configuration', () => {
    it('has default weights that sum strictly to 100 points', () => {
      const { distanceWeight, ratingWeight, experienceWeight, certificationWeight } =
        DEFAULT_CANDIDATE_SCORING_WEIGHTS;
      expect(distanceWeight + ratingWeight + experienceWeight + certificationWeight).toBe(100);
      expect(distanceWeight).toBe(40);
      expect(ratingWeight).toBe(30);
      expect(experienceWeight).toBe(15);
      expect(certificationWeight).toBe(15);
    });
  });

  describe('Distance / Proximity Scoring (40 pts max)', () => {
    const baseInput: CandidateScoringInput = {
      technicianId: 'tech-1',
      distanceMiles: 0,
      radiusMiles: 25,
      rating: 0,
      completedJobsCount: 0,
      certifications: [],
      requiredCertifications: ['ANY'] // zero cert points
    };

    it('awards maximum 40 points when technician is at 0 miles', () => {
      const score = service.score({ ...baseInput, distanceMiles: 0 });
      expect(score.distanceScore).toBe(40);
    });

    it('awards half distance points when technician is at half radius', () => {
      const score = service.score({ ...baseInput, distanceMiles: 12.5, radiusMiles: 25 });
      expect(score.distanceScore).toBe(20);
    });

    it('awards 0 distance points when technician is at boundary distance', () => {
      const score = service.score({ ...baseInput, distanceMiles: 25, radiusMiles: 25 });
      expect(score.distanceScore).toBe(0);
    });

    it('clamps distance points to 0 when distance exceeds search radius', () => {
      const score = service.score({ ...baseInput, distanceMiles: 30, radiusMiles: 25 });
      expect(score.distanceScore).toBe(0);
    });

    it('safely handles non-positive radius by defaulting effective radius to 1', () => {
      const score = service.score({ ...baseInput, distanceMiles: 0.5, radiusMiles: 0 });
      expect(score.distanceScore).toBe(20); // 40 * (1 - 0.5 / 1) = 20
    });
  });

  describe('Rating Scoring (30 pts max)', () => {
    const baseInput: CandidateScoringInput = {
      technicianId: 'tech-1',
      distanceMiles: 25, // 0 dist points
      radiusMiles: 25,
      rating: 5.0,
      completedJobsCount: 0,
      certifications: [],
      requiredCertifications: ['ANY'] // 0 cert points
    };

    it('awards 30 points for a perfect 5.0 rating', () => {
      const score = service.score({ ...baseInput, rating: 5.0 });
      expect(score.ratingScore).toBe(30);
    });

    it('awards 15 points for a 2.5 rating', () => {
      const score = service.score({ ...baseInput, rating: 2.5 });
      expect(score.ratingScore).toBe(15);
    });

    it('awards 0 points for a 0.0 rating', () => {
      const score = service.score({ ...baseInput, rating: 0 });
      expect(score.ratingScore).toBe(0);
    });

    it('clamps rating score to 30 if rating exceeds 5.0', () => {
      const score = service.score({ ...baseInput, rating: 6.0 });
      expect(score.ratingScore).toBe(30);
    });

    it('clamps rating score to 0 if rating is negative', () => {
      const score = service.score({ ...baseInput, rating: -1.0 });
      expect(score.ratingScore).toBe(0);
    });
  });

  describe('Experience Scoring (15 pts max, 100 jobs cap)', () => {
    const baseInput: CandidateScoringInput = {
      technicianId: 'tech-1',
      distanceMiles: 25,
      radiusMiles: 25,
      rating: 0,
      completedJobsCount: 100,
      certifications: [],
      requiredCertifications: ['ANY']
    };

    it('awards 15 points for 100 completed jobs', () => {
      const score = service.score({ ...baseInput, completedJobsCount: 100 });
      expect(score.experienceScore).toBe(15);
    });

    it('awards 7.5 points for 50 completed jobs', () => {
      const score = service.score({ ...baseInput, completedJobsCount: 50 });
      expect(score.experienceScore).toBe(7.5);
    });

    it('awards 0 points for 0 completed jobs', () => {
      const score = service.score({ ...baseInput, completedJobsCount: 0 });
      expect(score.experienceScore).toBe(0);
    });

    it('caps experience score at 15 points when completed jobs exceed 100', () => {
      const score = service.score({ ...baseInput, completedJobsCount: 350 });
      expect(score.experienceScore).toBe(15);
    });
  });

  describe('Certification Matching Scoring (15 pts max)', () => {
    const baseInput: CandidateScoringInput = {
      technicianId: 'tech-1',
      distanceMiles: 25,
      radiusMiles: 25,
      rating: 0,
      completedJobsCount: 0
    };

    it('awards full 15 points when no certifications are required', () => {
      const score = service.score({
        ...baseInput,
        certifications: [],
        requiredCertifications: []
      });
      expect(score.certificationScore).toBe(15);
    });

    it('awards full 15 points when all required certifications are matched', () => {
      const score = service.score({
        ...baseInput,
        certifications: ['FIBER_OPTIC', 'OSHA_10', 'HVAC_LEVEL_1'],
        requiredCertifications: ['FIBER_OPTIC', 'OSHA_10']
      });
      expect(score.certificationScore).toBe(15);
    });

    it('awards proportional points for partial certification match', () => {
      const score = service.score({
        ...baseInput,
        certifications: ['FIBER_OPTIC'],
        requiredCertifications: ['FIBER_OPTIC', 'OSHA_10']
      });
      expect(score.certificationScore).toBe(7.5);
    });

    it('awards 0 points when zero required certifications are held', () => {
      const score = service.score({
        ...baseInput,
        certifications: ['NETWORKING_PLUS'],
        requiredCertifications: ['FIBER_OPTIC', 'OSHA_10']
      });
      expect(score.certificationScore).toBe(0);
    });
  });

  describe('Composite Score & Custom Weights', () => {
    it('accurately calculates a perfect 100 total score', () => {
      const score = service.score({
        technicianId: 'tech-ideal',
        distanceMiles: 0,
        radiusMiles: 25,
        rating: 5.0,
        completedJobsCount: 100,
        certifications: ['OSHA_10'],
        requiredCertifications: ['OSHA_10']
      });

      expect(score.distanceScore).toBe(40);
      expect(score.ratingScore).toBe(30);
      expect(score.experienceScore).toBe(15);
      expect(score.certificationScore).toBe(15);
      expect(score.totalScore).toBe(100);
    });

    it('supports custom weight overrides for specialized dispatch policies', () => {
      const score = service.score(
        {
          technicianId: 'tech-custom',
          distanceMiles: 0,
          radiusMiles: 25,
          rating: 5.0,
          completedJobsCount: 100,
          certifications: [],
          requiredCertifications: []
        },
        {
          distanceWeight: 60,
          ratingWeight: 20,
          experienceWeight: 10,
          certificationWeight: 10
        }
      );

      expect(score.distanceScore).toBe(60);
      expect(score.ratingScore).toBe(20);
      expect(score.experienceScore).toBe(10);
      expect(score.certificationScore).toBe(10);
      expect(score.totalScore).toBe(100);
    });
  });

  describe('Candidate Ranking (rankCandidates)', () => {
    it('ranks candidates in descending order of composite total score', () => {
      const candidateA: CandidateScoringInput = {
        technicianId: 'tech-A',
        distanceMiles: 20, // low distance score
        radiusMiles: 25,
        rating: 4.0,
        completedJobsCount: 20
      };

      const candidateB: CandidateScoringInput = {
        technicianId: 'tech-B',
        distanceMiles: 2, // high distance score
        radiusMiles: 25,
        rating: 4.9,
        completedJobsCount: 80
      };

      const ranked = service.rankCandidates([candidateA, candidateB]);

      expect(ranked[0].candidate.technicianId).toBe('tech-B');
      expect(ranked[1].candidate.technicianId).toBe('tech-A');
      expect(ranked[0].totalScore).toBeGreaterThan(ranked[1].totalScore);
    });

    it('uses distance as secondary tie-breaker when composite scores match', () => {
      const candidateFar: CandidateScoringInput = {
        technicianId: 'tech-far',
        distanceMiles: 10,
        radiusMiles: 25,
        rating: 5.0,
        completedJobsCount: 50
      };

      const candidateNear: CandidateScoringInput = {
        technicianId: 'tech-near',
        distanceMiles: 5,
        radiusMiles: 25,
        rating: 5.0,
        completedJobsCount: 50
      };

      // Force equal scores with custom weights ignoring distance
      const ranked = service.rankCandidates([candidateFar, candidateNear], {
        distanceWeight: 0
      });

      expect(ranked[0].totalScore).toBe(ranked[1].totalScore);
      expect(ranked[0].candidate.technicianId).toBe('tech-near');
      expect(ranked[1].candidate.technicianId).toBe('tech-far');
    });

    it('returns empty array when given an empty candidate list', () => {
      const ranked = service.rankCandidates([]);
      expect(ranked).toEqual([]);
    });
  });
});
