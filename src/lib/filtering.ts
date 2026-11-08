import { ROOMS, type Equipment, type Room } from "./rooms";

/**
 * F1: capacity >= attendees.
 * F2: room must have ALL selected equipment.
 * F3 (display concern): blocked rooms stay in the list but are never Available.
 *   Filtering does NOT remove blocked rooms — the availability verdict handles that.
 */
export function filterRooms(
  minAttendees: number,
  requiredEquipment: Equipment[],
): Room[] {
  return ROOMS.filter((room) => {
    if (room.capacity < minAttendees) return false;
    if (requiredEquipment.length > 0) {
      const has = requiredEquipment.every((eq) => room.equipment.includes(eq));
      if (!has) return false;
    }
    return true;
  });
}
