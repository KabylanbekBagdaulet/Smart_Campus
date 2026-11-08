export type Equipment = "Projector" | "Whiteboard" | "VideoConf";

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: Equipment[];
  blocked: boolean;
  bookings: [number, number][];
}

export const NOW = 540; // 09:00, fixed
export const MAX_DURATION = 120; // minutes

export const ROOMS: Room[] = [
  {
    id: "lb-204",
    name: "LB-204",
    capacity: 6,
    equipment: ["Projector"],
    blocked: false,
    bookings: [[600, 660]], // 10:00–11:00
  },
  {
    id: "lb-305",
    name: "LB-305",
    capacity: 12,
    equipment: ["Projector", "Whiteboard"],
    blocked: false,
    bookings: [[780, 840]], // 13:00–14:00
  },
  {
    id: "eng-101",
    name: "ENG-101",
    capacity: 30,
    equipment: ["Projector", "Whiteboard", "VideoConf"],
    blocked: false,
    bookings: [],
  },
  {
    id: "math-010",
    name: "MATH-010",
    capacity: 4,
    equipment: ["Whiteboard"],
    blocked: true,
    bookings: [[600, 660]], // 10:00–11:00
  },
];

export const ALL_EQUIPMENT: Equipment[] = ["Projector", "Whiteboard", "VideoConf"];
