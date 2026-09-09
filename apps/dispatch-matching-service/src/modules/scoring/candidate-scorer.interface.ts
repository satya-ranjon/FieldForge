export interface CandidateScoringWeights {
  /** Maximum distance score contribution (default: 40) */
  distanceWeight: number;
  /** Maximum rating score contribution (default: 30) */
  ratingWeight: number;
  /** Maximum experience score contribution (default: 15) */
  experienceWeight: number;
  /** Maximum certification match score contribution (default: 15) */
  certificationWeight: number;
}

export const DEFAULT_CANDIDATE_SCORING_WEIGHTS: CandidateScoringWeights = Object.freeze({
  distanceWeight: 40,
  ratingWeight: 30,
  experienceWeight: 15,
  certificationWeight: 15
});

export interface CandidateScoringInput {
  technicianId: string;
  distanceMiles: number;
  radiusMiles: number;
  rating: number;
  completedJobsCount: number;
  certifications?: string[];
  requiredCertifications?: string[];
}

export interface CandidateScoreBreakdown {
  distanceScore: number;
  ratingScore: number;
  experienceScore: number;
  certificationScore: number;
  totalScore: number;
}

export interface ScoredCandidate<T = CandidateScoringInput> {
  candidate: T;
  score: CandidateScoreBreakdown;
  totalScore: number;
}

export const CANDIDATE_SCORER = Symbol('CANDIDATE_SCORER');

export interface CandidateScorerPort {
  /**
   * Calculates multi-parameter composite score for a single candidate.
   */
  score(
    input: CandidateScoringInput,
    customWeights?: Partial<CandidateScoringWeights>
  ): CandidateScoreBreakdown;

  /**
   * Scores and ranks candidates descending by composite score, using distance as secondary tie-breaker.
   */
  rankCandidates<T extends CandidateScoringInput>(
    candidates: T[],
    customWeights?: Partial<CandidateScoringWeights>
  ): ScoredCandidate<T>[];
}
