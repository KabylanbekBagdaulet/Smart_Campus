"""Room availability logic for the Smart Campus Room Availability Checker.

Pure standard library. `can_book` is read-only: it never mutates its inputs and
returns an unambiguous boolean.
"""

from typing import Iterable, Mapping, Sequence


def can_book(
    start,
    end,
    now,
    blocked,
    existing: Sequence,
) -> bool:
    """Return True iff a booking [start, end) is valid against the rules.

    Checks, applied in order (fail fast):
      1. Copy `existing` so the caller's list is never mutated.
      2. AC1a: 0 <= start < end <= 1440.
      3. AC1b: start strictly after now (start > now).
      4. AC2:  duration <= 120 minutes (exactly 120 allowed).
      5. AC3:  blocked rejects everything.
      6. AC4:  reject overlap with any existing booking; touching endpoints
               (end == b.start or start == b.end) do NOT overlap.

    `existing` entries may be 2-tuples (start, end), 2-lists, or mappings with
    'start'/'end' keys. Inputs are not modified.
    """
    _ = list(existing)  # AC5: never mutate the caller's list

    # AC1a: time order and within-day bounds
    if not (0 <= start < end <= 1440):
        return False

    # AC1b: start must be strictly after now
    if not (start > now):
        return False

    # AC2: duration cap, exactly 120 allowed
    if (end - start) > 120:
        return False

    # AC3: a blocked room rejects every request
    if blocked:
        return False

    # AC4: reject overlap with any existing booking.
    # Touching endpoints do not overlap: end == b.start and start == b.end pass.
    for b in _:
        b_start, b_end = _unpack(b)
        if start < b_end and b_start < end:
            return False

    return True


def _unpack(b):
    """Return (start, end) from a tuple/list or a mapping with start/end keys."""
    if isinstance(b, Mapping):
        return b["start"], b["end"]
    return b[0], b[1]