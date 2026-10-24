import { useMemo, useState } from "react";
import { Check, X, Clock, DoorClosed, DoorOpen, Calendar } from "lucide-react";
import {
  checkAvailability,
  minutesToTime,
  parseTimeToMinutes,
  type AvailabilityConfig,
  type AvailabilityResult,
} from "@/lib/availability";
import Timeline from "@/components/Timeline";

const FIXED_CONFIG: AvailabilityConfig = {
  now: 540,
  blocked: false,
  maxDuration: 120,
  existingBookings: [{ start: 600, end: 660 }],
};

export default function App() {
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  const candidate =
    result && startStr && endStr
      ? (() => {
          const s = parseTimeToMinutes(startStr);
          const e = parseTimeToMinutes(endStr);
          return s !== null && e !== null ? { start: s, end: e } : null;
        })()
      : null;

  const config = useMemo(() => FIXED_CONFIG, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseTimeToMinutes(startStr);
    const ev = parseTimeToMinutes(endStr);

    if (s === null || ev === null) {
      setResult({
        available: false,
        reason: "Enter times in HH:MM format (e.g. 13:30).",
        checks: [],
      });
      return;
    }
    // AC5: never mutate existing bookings — operate on a shallow copy of the array.
    const safeConfig: AvailabilityConfig = {
      ...config,
      existingBookings: [...config.existingBookings],
    };
    setResult(checkAvailability(s, ev, safeConfig));
  };

  const reset = () => {
    setStartStr("");
    setEndStr("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <DoorClosed className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Smart Campus Room Availability Checker
              </h1>
              <p className="text-sm text-slate-500">
                Room <span className="font-semibold">LB-204</span> · Read-only availability check
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-5 sm:p-6">
            <h2 className="text-lg font-semibold mb-1">Check a time</h2>
            <p className="text-sm text-slate-500 mb-4">
              Enter a start and end time. This only checks availability — it does not book the room.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Start (HH:MM)</span>
                  <input
                    type="text"
                    value={startStr}
                    onChange={(e) => setStartStr(e.target.value)}
                    placeholder="13:30"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">End (HH:MM)</span>
                  <input
                    type="text"
                    value={endStr}
                    onChange={(e) => setEndStr(e.target.value)}
                    placeholder="14:30"
                    inputMode="numeric"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-slate-900 text-white text-sm font-medium py-2.5 hover:bg-slate-800 transition-colors"
                >
                  Check availability
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg border border-slate-300 text-sm font-medium px-4 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="mt-5 border-t border-slate-100 pt-4 space-y-1.5 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Now (fixed): {minutesToTime(config.now)}
              </p>
              <p className="flex items-center gap-2">
                <DoorOpen className="w-3.5 h-3.5" /> Room blocked: {config.blocked ? "yes" : "no"}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Existing bookings:{" "}
                {config.existingBookings
                  .map((b) => `${minutesToTime(b.start)}–${minutesToTime(b.end)}`)
                  .join(", ")}
              </p>
            </div>
          </section>

          <section className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-5 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Today's schedule</h2>
              <Timeline
                now={config.now}
                existingBookings={config.existingBookings}
                candidate={candidate}
                available={result?.available ?? null}
              />
            </div>

            {result && (
              <div
                className={`rounded-2xl ring-1 shadow-sm p-5 sm:p-6 ${
                  result.available
                    ? "bg-emerald-50 ring-emerald-200"
                    : "bg-rose-50 ring-rose-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      result.available ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    }`}
                  >
                    {result.available ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </div>
                  <div>
                    <p
                      className={`text-lg font-semibold ${
                        result.available ? "text-emerald-900" : "text-rose-900"
                      }`}
                    >
                      {result.available ? "Available" : "Unavailable"}
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">{result.reason}</p>
                  </div>
                </div>

                {result.checks.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {result.checks.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span
                          className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                            c.passed ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                          }`}
                        >
                          {c.passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </span>
                        <span className="text-slate-700">
                          <span className="font-medium">{c.label}:</span> {c.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!result && (
              <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-5 sm:p-6 text-sm text-slate-500">
                Enter a start and end time, then press <span className="font-medium text-slate-700">Check availability</span> to see the result.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
