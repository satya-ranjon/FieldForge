import { Injectable } from '@nestjs/common';
import {
  CandidateScorerPort,
  CandidateScoringInput,
  CandidateScoreBreakdown,
  CandidateScoringWeights,
  DEFAULT_CANDIDATE_SCORING_WEIGHTS,
  ScoredCandidate
} from './candidate-scorer.interface';

@Injectable()
export class CandidateScoringService implements CandidateScorerPort {
  /**
   * Calculates multi-parameter composite score for a single candidate based on:
   * 1. Distance score: proximity within radius (default max 40 pts)
   * 2. Rating score: normalized 0-5 stars (default max 30 pts)
   * 3. Experience score: completed jobs up to 100 (default max 15 pts)
   * 4. Certification score: matched required certifications (default max 15 pts)
   */
  score(
    input: CandidateScoringInput,
    customWeights?: Partial<CandidateScoringWeights>
  ): CandidateScoreBreakdown {
    const weights: CandidateScoringWeights = {
      ...DEFAULT_CANDIDATE_SCORING_WEIGHTS,
      ...customWeights
    };

    const effectiveRadius = Math.max(input.radiusMiles, 1);
    const dist = Math.max(0, input.distanceMiles);

    // Distance score: closer is higher (up to weights.distanceWeight pts)
    const distanceScore = Math.max(0, weights.distanceWeight * (1 - dist / effectiveRadius));

    // Rating score: normalized 0-5 (up to weights.ratingWeight pts)
    const normalizedRating = Math.max(0, Math.min(5, input.rating));
    const ratingScore = (normalizedRating / 5.0) * weights.ratingWeight;

    // Experience score: up to 100 jobs (up to weights.experienceWeight pts)
    const jobs = Math.max(0, input.completedJobsCount);
    const experienceScore = Math.min(
      weights.experienceWeight,
      (jobs / 100) * weights.experienceWeight
    );

    // Certification match score: up to weights.certificationWeight pts
    let certificationScore = weights.certificationWeight;
    const required = input.requiredCertifications ?? [];
    if (required.length > 0) {
      const held = input.certifications ?? [];
      const matched = required.filter((r) => held.includes(r)).length;
      certificationScore = (matched / required.length) * weights.certificationWeight;
    }

    const totalScore = distanceScore + ratingScore + experienceScore + certificationScore;

    return {
      distanceScore: Math.round(distanceScore * 100) / 100,
      ratingScore: Math.round(ratingScore * 100) / 100,
      experienceScore: Math.round(experienceScore * 100) / 100,
      certificationScore: Math.round(certificationScore * 100) / 100,
      totalScore: Math.round(totalScore * 100) / 100
    };
  }

  /**
   * Scores and ranks candidates descending by composite score, using distance as secondary tie-breaker.
   */
  rankCandidates<T extends CandidateScoringInput>(
    candidates: T[],
    customWeights?: Partial<CandidateScoringWeights>
  ): ScoredCandidate<T>[] {
    const scored = candidates.map((candidate) => {
      const scoreBreakdown = this.score(candidate, customWeights);
      return {
        candidate,
        score: scoreBreakdown,
        totalScore: scoreBreakdown.totalScore
      };
    });

    // Sort descending by total composite score
    // Secondary tie-breaker: closer distance first
    scored.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return a.candidate.distanceMiles - b.candidate.distanceMiles;
    });

    return scored;
  }
}
