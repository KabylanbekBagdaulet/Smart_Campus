export interface Booking {
  start: number;
  end: number;
}

export interface AvailabilityConfig {
  now: number;
  blocked: boolean;
  maxDuration: number;
  existingBookings: Booking[];
}

export interface AvailabilityResult {
  available: boolean;
  reason: string;
  checks: { label: string; passed: boolean; detail: string }[];
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

export function isOverlap(a: Booking, b: Booking): boolean {
  return a.start < b.end && b.start < a.end;
}

export function checkAvailability(
  startRaw: number,
  endRaw: number,
  config: AvailabilityConfig,
): AvailabilityResult {
  const checks: AvailabilityResult["checks"] = [];

  checks.push({
    label: "Time order",
    detail:
      startRaw < endRaw
        ? "Start is before end."
        : "Start must be earlier than end.",
    passed: startRaw < endRaw,
  });

  checks.push({
    label: "Within day",
    detail:
      startRaw >= 0 && endRaw <= 1440
        ? "Request is within 00:00–24:00."
        : "Request must fall between 00:00 and 24:00.",
    passed: startRaw >= 0 && endRaw <= 1440,
  });

  checks.push({
    label: "After now",
    detail:
      startRaw > config.now
        ? `Start is strictly after now (${minutesToTime(config.now)}).`
        : `Start must be strictly after now (${minutesToTime(config.now)}).`,
    passed: startRaw > config.now,
  });

  const duration = endRaw - startRaw;
  checks.push({
    label: "Duration",
    detail:
      duration <= config.maxDuration
        ? `Duration is ${duration} min (limit ${config.maxDuration} min).`
        : `Duration is ${duration} min, exceeds ${config.maxDuration} min.`,
    passed: duration <= config.maxDuration,
  });

  checks.push({
    label: "Room blocked",
    detail: config.blocked
      ? "Room is currently blocked."
      : "Room is not blocked.",
    passed: !config.blocked,
  });

  const candidate = { start: startRaw, end: endRaw };
  const conflicting = config.existingBookings.filter((b) =>
    isOverlap(candidate, b),
  );
  checks.push({
    label: "No conflicts",
    detail:
      conflicting.length === 0
        ? "No overlap with existing bookings."
        : `Overlaps ${conflicting.length} existing booking(s).`,
    passed: conflicting.length === 0,
  });

  const hardPassed =
    startRaw >= 0 &&
    startRaw < endRaw &&
    endRaw <= 1440 &&
    startRaw > config.now;

  const available =
    hardPassed &&
    duration <= config.maxDuration &&
    !config.blocked &&
    conflicting.length === 0;

  let reason = "";
  if (available) {
    reason = "Room is available for your requested time.";
  } else if (config.blocked) {
    reason = "Room is blocked and cannot accept bookings right now.";
  } else if (!hardPassed) {
    reason = "Fix the time inputs and try again.";
  } else if (duration > config.maxDuration) {
    reason = `Requested duration (${duration} min) exceeds the ${config.maxDuration}-minute limit.`;
  } else if (conflicting.length > 0) {
    reason = `Requested time overlaps ${conflicting.length} existing booking(s).`;
  } else {
    reason = "Request is unavailable.";
  }

  return { available, reason, checks };
}
