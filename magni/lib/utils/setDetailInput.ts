import { SetDetail } from '../models/Workout'

/** Raw strings for per-set inputs so values like `12.` are not collapsed by Number() mid-edit. */
export interface PerSetTextRow {
  weight: string;
  reps: string;
}

export function setDetailsToPerSetTexts(details: SetDetail[]): PerSetTextRow[] {
  return details.map(detail => ({
    weight: Number.isFinite(detail.weight) ? String(detail.weight) : '',
    reps: Number.isFinite(detail.reps) ? String(detail.reps) : '',
  }))
}

export function parseDetailNumberFromInput(raw: string): number {
  const trimmed = raw.trim()
  if (trimmed === '' || trimmed === '.' || trimmed === '-' || trimmed === '-.') return 0
  const parsed = parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : 0
}
