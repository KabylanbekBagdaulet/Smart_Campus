import { MAX_DURATION, NOW, type Room } from "./rooms";

export interface CheckRow {
  label: string;
  passed: boolean;
  detail: string;
}

export interface Evaluation {
  verdict: boolean; // true => Available, false => Unavailable
  reason: string;
  checks: CheckRow[];
}

export function parseTimeToMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Single source of truth for the availability verdict.
 * Returns BOTH the per-rule rows and the final boolean, so the checklist
 * shown in the UI can never disagree with the verdict.
 *
 * Rules (unchanged):
 *  AC1: 0 <= start < end <= 1440; start strictly after now.
 *  AC2: duration <= 120 (120 allowed).
 *  AC3: blocked room is rejected.
 *  AC4: reject overlap; touching endpoints are not overlap.
 *  AC5: never mutate room.bookings.
 */
export function evaluate(room: Room, start: number, end: number): Evaluation {
  const checks: CheckRow[] = [];

  // AC1a: time order + within-day bounds
  const orderOk = start < end && start >= 0 && end <= 1440;
  checks.push({
    label: "Time order",
    detail: orderOk ? "Start is before end, within 00:00–24:00." : "Start must be before end and within 00:00–24:00.",
    passed: orderOk,
  });

  // AC1b: strictly after now
  const afterNow = start > NOW;
  checks.push({
    label: "After now",
    detail: afterNow
      ? `Start is strictly after now (${minutesToTime(NOW)}).`
      : `Start must be strictly after now (${minutesToTime(NOW)}).`,
    passed: afterNow,
  });

  // AC2: duration cap
  const duration = end - start;
  const durationOk = duration <= MAX_DURATION;
  checks.push({
    label: "Duration",
    detail: durationOk
      ? `Duration is ${duration} min (limit ${MAX_DURATION} min).`
      : `Duration is ${duration} min, exceeds ${MAX_DURATION} min.`,
    passed: durationOk,
  });

  // AC3: blocked
  checks.push({
    label: "Room not blocked",
    detail: room.blocked ? "Room is currently blocked." : "Room is not blocked.",
    passed: !room.blocked,
  });

  // AC4: no overlap with existing bookings (AC5: never mutate room.bookings)
  const conflicting = room.bookings.filter(([bStart, bEnd]) =>
    isOverlap(start, end, bStart, bEnd),
  );
  checks.push({
    label: "No conflicts",
    detail:
      conflicting.length === 0
        ? "No overlap with existing bookings."
        : `Overlaps ${conflicting.length} existing booking(s).`,
    passed: conflicting.length === 0,
  });

  // Verive = all checks pass. Computed from the rows so they can't disagree.
  const verdict = checks.every((c) => c.passed);

  let reason: string;
  if (verdict) {
    reason = `${room.name} is available for your requested time.`;
  } else if (room.blocked) {
    reason = `${room.name} is blocked and cannot accept bookings right now.`;
  } else if (!orderOk) {
    reason = "Fix the time inputs and try again.";
  } else if (!afterNow) {
    reason = `Start must be strictly after now (${minutesToTime(NOW)}).`;
  } else if (!durationOk) {
    reason = `Requested duration (${duration} min) exceeds the ${MAX_DURATION}-minute limit.`;
  } else {
    reason = `Requested time overlaps ${conflicting.length} existing booking(s) in ${room.name}.`;
  }

  return { verdict, reason, checks };
}
