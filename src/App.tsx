import { useMemo, useState } from "react";
import {
  Check,
  X,
  Clock,
  DoorClosed,
  DoorOpen,
  Calendar,
  Users,
  Search,
  AlertCircle,
} from "lucide-react";
import {
  evaluate,
  minutesToTime,
  parseTimeToMinutes,
  type Evaluation,
} from "@/lib/availability";
import { filterRooms } from "@/lib/filtering";
import {
  ALL_EQUIPMENT,
  NOW,
  ROOMS,
  type Equipment,
  type Room,
} from "@/lib/rooms";
import Timeline from "@/components/Timeline";

export default function App() {
  const [minAttendees, setMinAttendees] = useState<number>(1);
  const [requiredEquipment, setRequiredEquipment] = useState<Equipment[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(ROOMS[0].id);
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");
  const [result, setResult] = useState<Evaluation | null>(null);

  const visibleRooms = useMemo(
    () => filterRooms(minAttendees, requiredEquipment),
    [minAttendees, requiredEquipment],
  );

  const selectedRoom = useMemo(
    () => ROOMS.find((r) => r.id === selectedRoomId) ?? ROOMS[0],
    [selectedRoomId],
  );

  // F4: if selected room no longer passes filters, surface empty-state.
  const selectedVisible =
    visibleRooms.some((r) => r.id === selectedRoom.id);

  // F5: switching room clears the result.
  const onRoomChange = (id: string) => {
    setSelectedRoomId(id);
    setResult(null);
    setStartStr("");
    setEndStr("");
  };

  const toggleEquipment = (eq: Equipment) => {
    setRequiredEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq],
    );
  };

  const candidate = useMemo(() => {
    if (!startStr || !endStr) return null;
    const s = parseTimeToMinutes(startStr);
    const e = parseTimeToMinutes(endStr);
    return s !== null && e !== null ? { start: s, end: e } : null;
  }, [startStr, endStr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseTimeToMinutes(startStr);
    const ev = parseTimeToMinutes(endStr);
    if (s === null || ev === null) {
      setResult({
        verdict: false,
        reason: "Enter times in HH:MM format (e.g. 13:30).",
        checks: [],
      });
      return;
    }
    setResult(evaluate(selectedRoom, s, ev));
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
              <p className="text-sm text-slate-500">Read-only availability check · no booking created</p>
            </div>
          </div>
        </header>

        {/* Filters */}
        <section className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filter rooms</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Minimum attendees
              </span>
              <input
                type="number"
                min={1}
                value={minAttendees}
                onChange={(e) => setMinAttendees(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </label>
            <fieldset>
              <legend className="text-xs font-medium text-slate-600 mb-1.5">Required equipment</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {ALL_EQUIPMENT.map((eq) => (
                  <label key={eq} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiredEquipment.includes(eq)}
                      onChange={() => toggleEquipment(eq)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    {eq}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Room picker — only when rooms match filters (F4) */}
          {visibleRooms.length === 0 ? (
            <div className="mt-5 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 ring-1 ring-amber-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              No rooms match your filters. Try lowering the attendee count or removing equipment requirements.
            </div>
          ) : (
            <div className="mt-5">
              <span className="text-xs font-medium text-slate-600">Select a room</span>
              <div className="grid gap-2 mt-1.5 sm:grid-cols-2">
                {visibleRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    selected={room.id === selectedRoomId && selectedVisible}
                    onSelect={() => onRoomChange(room.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Availability check — only when a visible room is selected */}
        {selectedVisible ? (
          <div className="grid gap-6 lg:grid-cols-5">
            <section className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-5 sm:p-6">
              <h2 className="text-lg font-semibold mb-1">Check a time</h2>
              <p className="text-sm text-slate-500 mb-4">
                For <span className="font-semibold">{selectedRoom.name}</span>. This only checks availability — it does not book the room.
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
                  <Clock className="w-3.5 h-3.5" /> Now (fixed): {minutesToTime(NOW)}
                </p>
                <p className="flex items-center gap-2">
                  <DoorOpen className="w-3.5 h-3.5" /> Room blocked: {selectedRoom.blocked ? "yes" : "no"}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Existing bookings:{" "}
                  {selectedRoom.bookings.length === 0
                    ? "none"
                    : selectedRoom.bookings
                        .map(([s, e]) => `${minutesToTime(s)}–${minutesToTime(e)}`)
                        .join(", ")}
                </p>
              </div>
            </section>

            <section className="lg:col-span-3 space-y-5">
              <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-5 sm:p-6">
                <h2 className="text-lg font-semibold mb-4">{selectedRoom.name} — today's schedule</h2>
                <Timeline
                  now={NOW}
                  existingBookings={selectedRoom.bookings}
                  candidate={candidate}
                  available={result?.verdict ?? null}
                />
              </div>

              {result && (
                <div
                  className={`rounded-2xl ring-1 shadow-sm p-5 sm:p-6 ${
                    result.verdict
                      ? "bg-emerald-50 ring-emerald-200"
                      : "bg-rose-50 ring-rose-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        result.verdict ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                      }`}
                    >
                      {result.verdict ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </div>
                    <div>
                      <p
                        className={`text-lg font-semibold ${
                          result.verdict ? "text-emerald-900" : "text-rose-900"
                        }`}
                      >
                        {result.verdict ? "Available" : "Unavailable"}
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
                  Enter a start and end time, then press{" "}
                  <span className="font-medium text-slate-700">Check availability</span> to see the result.
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm p-6 text-sm text-slate-500 flex items-center gap-2">
            <Search className="w-4 h-4 flex-shrink-0" />
            Adjust the filters above to see rooms and check availability.
          </div>
        )}
      </div>
    </div>
  );
}

function RoomCard({
  room,
  selected,
  onSelect,
}: {
  room: Room;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-lg border px-4 py-3 transition-colors ${
        selected
          ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
          : "border-slate-200 hover:border-slate-400"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm">{room.name}</span>
        {room.blocked && (
          <span className="text-[10px] uppercase tracking-wide font-medium text-rose-700 bg-rose-100 rounded px-1.5 py-0.5">
            Blocked
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-slate-500">
        Seats {room.capacity} · {room.equipment.join(", ")}
      </div>
    </button>
  );
}
