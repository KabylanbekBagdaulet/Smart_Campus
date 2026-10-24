import { minutesToTime } from "@/lib/availability";
import type { Booking } from "@/lib/availability";

interface TimelineProps {
  now: number;
  existingBookings: Booking[];
  candidate: { start: number; end: number } | null;
  available: boolean | null;
}

const DAY_START = 7 * 60;
const DAY_END = 20 * 60;
const SPAN = DAY_END - DAY_START;

export default function Timeline({
  now,
  existingBookings,
  candidate,
  available,
}: TimelineProps) {
  const pct = (min: number) => `${((min - DAY_START) / SPAN) * 100}%`;

  const ticks: number[] = [];
  for (let h = DAY_START; h <= DAY_END; h += 60) ticks.push(h);

  return (
    <div className="w-full">
      <div className="relative h-14 rounded-xl bg-slate-100 ring-1 ring-slate-200 overflow-hidden">
        {existingBookings.map((b, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 bg-slate-300"
            style={{ left: pct(b.start), width: `${((b.end - b.start) / SPAN) * 100}%` }}
            title={`Booked ${minutesToTime(b.start)}–${minutesToTime(b.end)}`}
          />
        ))}

        {candidate && (
          <div
            className={`absolute top-0 bottom-0 border-x-2 ${
              available === true
                ? "bg-emerald-300/70 border-emerald-600"
                : available === false
                  ? "bg-rose-300/70 border-rose-600"
                  : "bg-amber-300/70 border-amber-600"
            }`}
            style={{ left: pct(candidate.start), width: `${((candidate.end - candidate.start) / SPAN) * 100}%` }}
            title={`Your request ${minutesToTime(candidate.start)}–${minutesToTime(candidate.end)}`}
          />
        )}

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-500"
          style={{ left: pct(now) }}
          title={`Now ${minutesToTime(now)}`}
        />
      </div>

      <div className="relative h-5 mt-1 text-[10px] text-slate-400">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute -translate-x-1/2"
            style={{ left: pct(t) }}
          >
            {minutesToTime(t)}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-300" /> Existing booking
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-300 border border-emerald-600" /> Your request (available)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-rose-300 border border-rose-600" /> Your request (unavailable)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-0.5 h-3 bg-slate-500 inline-block" /> Now
        </span>
      </div>
    </div>
  );
}
