export const RATING_PROMPT_KEY = 'rating_prompt_state_v2';
export const LEGACY_RATED_KEY = 'store_rating_started';
export const MIN_ELIGIBLE_LAUNCHES = 4;
export const MIN_USAGE_AGE_MS = 3 * 24 * 60 * 60 * 1000;
export const LATER_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

export interface RatingPromptState {
  firstEligibleAt: number;
  eligibleLaunches: number;
  nextPromptAt: number;
  completed: boolean;
}

export function normalizeRatingPromptState(value: Partial<RatingPromptState> | null | undefined): RatingPromptState {
  return {
    firstEligibleAt: Number.isFinite(value?.firstEligibleAt) ? value!.firstEligibleAt! : 0,
    eligibleLaunches: Number.isFinite(value?.eligibleLaunches) ? value!.eligibleLaunches! : 0,
    nextPromptAt: Number.isFinite(value?.nextPromptAt) ? value!.nextPromptAt! : 0,
    completed: value?.completed === true,
  };
}

export function recordEligibleLaunch(value: Partial<RatingPromptState> | null | undefined, now = Date.now()): RatingPromptState {
  const state = normalizeRatingPromptState(value);
  if (state.completed) return state;
  return {
    ...state,
    firstEligibleAt: state.firstEligibleAt || now,
    eligibleLaunches: state.eligibleLaunches + 1,
  };
}

export function shouldShowRatingPrompt(state: RatingPromptState, now = Date.now()): boolean {
  return !state.completed
    && state.eligibleLaunches >= MIN_ELIGIBLE_LAUNCHES
    && now - state.firstEligibleAt >= MIN_USAGE_AGE_MS
    && now >= state.nextPromptAt;
}

export function snoozeRatingPrompt(state: RatingPromptState, durationMs: number, now = Date.now()): RatingPromptState {
  return { ...state, nextPromptAt: now + durationMs };
}

export function completeRatingPrompt(state: RatingPromptState): RatingPromptState {
  return { ...state, completed: true };
}
