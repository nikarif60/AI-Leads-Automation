// All positions are native game pixels. The renderer scales the same map on every screen.
export const ROOM = { width: 960, height: 432 };
export type RobotPose = "idle" | "north" | "south" | "west" | "east" | "typing" | "carrying" | "scanning" | "complete" | "failed";
export type OfficeObject = { id: string; asset: string; x: number; y: number; depth: number; station?: string; scale?: number };
export const stations = [
  { id: "research", name: "Research desk", description: "Review your business research", href: "/leads", x: 376, y: 108, number: "01" },
  { id: "map", name: "Malaysia map", description: "Explore leads by location", href: "/leads?location=Kuala%20Lumpur", x: 345, y: 86, number: "02" },
  { id: "inbox", name: "Lead inbox", description: "Open new and high-priority leads", href: "/leads?status=New%20%2F%20high%20priority", x: 491, y: 131, number: "03" },
  { id: "telegram", name: "Telegram", description: "Review Telegram alert activity", href: "/telegram", x: 596, y: 104, number: "04" },
  { id: "whatsapp", name: "WhatsApp desk", description: "Open leads waiting for approach", href: "/leads?status=Draft%20Ready", x: 227, y: 208, number: "05" },
  { id: "server", name: "Scan history", description: "Check your scan jobs", href: "/scans", x: 642, y: 251, number: "06" },
];

export const officeObjects: OfficeObject[] = [
  { id: "library", asset: "bookshelf", x: 98, y: 24, depth: 89 },
  { id: "window-west", asset: "window", x: 171, y: 19, depth: 77, scale: .8 },
  { id: "wall-clock", asset: "clock", x: 278, y: 34, depth: 78 },
  { id: "malaysia-map", asset: "map", x: 337, y: 21, depth: 79, station: "map" },
  { id: "whiteboard", asset: "whiteboard", x: 458, y: 26, depth: 81 },
  { id: "door", asset: "door", x: 563, y: 25, depth: 84 },
  { id: "printer", asset: "printer", x: 623, y: 36, depth: 89 },
  { id: "north-cabinet", asset: "cabinet", x: 672, y: 29, depth: 90 },
  { id: "north-plant", asset: "plant", x: 666, y: 107, depth: 159 },
  { id: "west-plant", asset: "plant", x: 107, y: 107, depth: 159 },
  { id: "research-desk", asset: "desk", x: 324, y: 139, depth: 201, station: "research" },
  { id: "research-monitor", asset: "monitor", x: 360, y: 120, depth: 202, station: "research" },
  { id: "research-keyboard", asset: "keyboard", x: 355, y: 166, depth: 203, station: "research" },
  { id: "research-lamp", asset: "lamp", x: 326, y: 129, depth: 204, station: "research" },
  { id: "research-chair", asset: "chair", x: 365, y: 209, depth: 236, station: "research" },
  { id: "inbox-cabinet", asset: "cabinet", x: 478, y: 161, depth: 215, station: "inbox" },
  { id: "inbox-tray", asset: "inbox", x: 474, y: 151, depth: 216, station: "inbox" },
  { id: "telegram-desk", asset: "desk", x: 545, y: 139, depth: 202, station: "telegram" },
  { id: "telegram-monitor", asset: "monitor", x: 581, y: 120, depth: 203, station: "telegram" },
  { id: "telegram-keyboard", asset: "keyboard", x: 576, y: 166, depth: 204, station: "telegram" },
  { id: "telegram-lamp", asset: "lamp", x: 548, y: 129, depth: 205, station: "telegram" },
  { id: "telegram-chair", asset: "chair", x: 625, y: 204, depth: 239, station: "telegram" },
  { id: "water-cooler", asset: "water", x: 108, y: 226, depth: 294 },
  { id: "approval-desk", asset: "desk", x: 171, y: 241, depth: 303, station: "whatsapp" },
  { id: "approval-phone", asset: "phone", x: 208, y: 246, depth: 304, station: "whatsapp" },
  { id: "approval-lamp", asset: "lamp", x: 175, y: 231, depth: 305, station: "whatsapp" },
  { id: "approval-chair", asset: "chair", x: 178, y: 294, depth: 332, station: "whatsapp" },
  { id: "south-plant", asset: "plant", x: 103, y: 294, depth: 342 },
  { id: "server-rack", asset: "server", x: 645, y: 271, depth: 335, station: "server" },
  { id: "server-files", asset: "cabinet", x: 604, y: 278, depth: 334, station: "server" },
  { id: "meeting-left", asset: "desk", x: 332, y: 327, depth: 392 },
  { id: "east-window", asset: "window", x: 780, y: 6, depth: 78 },
  { id: "east-library", asset: "bookshelf", x: 894, y: 12, depth: 77 },
  { id: "east-work-desk", asset: "desk", x: 774, y: 198, depth: 263, station: "research" },
  { id: "east-work-monitor", asset: "monitor", x: 810, y: 179, depth: 264, station: "research" },
  { id: "east-work-keyboard", asset: "keyboard", x: 805, y: 225, depth: 265, station: "research" },
  { id: "east-work-lamp", asset: "lamp", x: 776, y: 188, depth: 266, station: "research" },
  { id: "east-work-chair", asset: "chair", x: 806, y: 265, depth: 308, station: "research" },
  { id: "east-work-files", asset: "cabinet", x: 886, y: 333, depth: 390 },
  { id: "east-work-plant", asset: "plant", x: 901, y: 110, depth: 164 },
  { id: "meeting-right", asset: "desk", x: 436, y: 327, depth: 392 },
  { id: "meeting-chair-left", asset: "chair", x: 355, y: 379, depth: 420 },
  { id: "meeting-chair-right", asset: "chair", x: 480, y: 379, depth: 420 },
  { id: "meeting-lamp", asset: "lamp", x: 437, y: 316, depth: 393 },
  { id: "west-files", asset: "cabinet", x: 30, y: 115, depth: 170 },
  { id: "west-library", asset: "bookshelf", x: 21, y: 199, depth: 264 },
  { id: "meeting-plant", asset: "plant", x: 692, y: 365, depth: 419 },
  { id: "west-window", asset: "window", x: 10, y: 7, depth: 76, scale: .8 },
  { id: "east-plant", asset: "plant", x: 670, y: 290, depth: 344 },
];

export type OfficeActivity = "walk" | "sit-down" | "desk-work" | "stand-up" | "map" | "files" | "printer" | "telegram" | "break" | "idle";
export const activityLabels: Record<OfficeActivity, string> = {
  walk: "Walking to the next station", "sit-down": "Rolling the chair to the desk",
  "desk-work": "Organising desk notes", "stand-up": "Pushing the chair back",
  map: "Looking at the Malaysia map", files: "Tidying the file tray",
  printer: "Collecting a printout", telegram: "Checking the office console",
  break: "Taking a desk break", idle: "Taking a moment",
};
type Waypoint = { x: number; y: number; duration: number; pose?: RobotPose; activity?: OfficeActivity };

// Durations belong to the journey into each waypoint. Repeated points are actions.
const seatedRoutine: Waypoint[] = [
  { x: 381, y: 214, duration: 1200, pose: "north", activity: "sit-down" },
  { x: 381, y: 214, duration: 7200, pose: "typing", activity: "desk-work" },
  { x: 381, y: 235, duration: 1100, pose: "north", activity: "stand-up" },
];
export const idleRoute: Waypoint[] = [
  ...seatedRoutine,
  { x: 445, y: 250, duration: 1500 },
  { x: 499, y: 240, duration: 1200 },
  { x: 499, y: 240, duration: 2400, pose: "north", activity: "files" },
  { x: 535, y: 240, duration: 900 }, { x: 535, y: 106, duration: 2300 },
  { x: 641, y: 106, duration: 2000 },
  { x: 641, y: 106, duration: 3000, pose: "north", activity: "printer" },
  { x: 535, y: 106, duration: 2000 }, { x: 445, y: 114, duration: 1700 },
  { x: 388, y: 114, duration: 1100 },
  { x: 388, y: 114, duration: 2200, pose: "north", activity: "map" },
  { x: 445, y: 114, duration: 1100 }, { x: 535, y: 114, duration: 1700 },
  { x: 535, y: 240, duration: 2200 },
  { x: 595, y: 240, duration: 1200 },
  { x: 595, y: 240, duration: 2400, pose: "north", activity: "telegram" },
  { x: 535, y: 268, duration: 1400 }, { x: 290, y: 268, duration: 4000 },
  { x: 290, y: 324, duration: 1100 }, { x: 240, y: 324, duration: 1000 },
  { x: 240, y: 324, duration: 2200, pose: "west", activity: "break" },
  { x: 290, y: 324, duration: 1000 }, { x: 290, y: 268, duration: 1100 },
  { x: 445, y: 268, duration: 2700 }, { x: 445, y: 235, duration: 700 },
  { x: 381, y: 235, duration: 1200 },
];
export const workingRoute: Waypoint[] = [
  ...seatedRoutine,
  { x: 445, y: 235, duration: 1100 }, { x: 445, y: 114, duration: 2000 },
  { x: 388, y: 114, duration: 1000 },
  { x: 388, y: 114, duration: 3000, pose: "scanning", activity: "map" },
  { x: 445, y: 114, duration: 1000 }, { x: 445, y: 240, duration: 2000 },
  { x: 499, y: 240, duration: 1100 },
  { x: 499, y: 240, duration: 1800, pose: "north", activity: "files" },
  { x: 445, y: 240, duration: 1100 }, { x: 381, y: 235, duration: 1100 },
];
export function sampleRoute(route: Waypoint[], elapsed: number) {
  const duration = route.reduce((sum, point) => sum + point.duration, 0);
  let cursor = ((elapsed % duration) + duration) % duration;
  let previous = route[route.length - 1];
  for (const point of route) {
    if (cursor < point.duration) {
      const progress = cursor / point.duration;
      const dx = point.x - previous.x, dy = point.y - previous.y;
      const pose: RobotPose = point.pose ?? (Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "east" : "west" : dy > 0 ? "south" : "north");
      return { x: Math.round(previous.x + dx * progress), y: Math.round(previous.y + dy * progress), pose, activity: point.activity ?? "walk", progress };
    }
    cursor -= point.duration;
    previous = point;
  }
  return { x: 381, y: 235, pose: "idle" as RobotPose, activity: "idle" as OfficeActivity, progress: 0 };
}

export function chairPosition(point: { x: number; y: number; activity: OfficeActivity }) {
  const seated = ["sit-down", "desk-work", "stand-up"].includes(point.activity);
  return { x: seated ? point.x - 16 : 365, y: seated ? point.y - 26 : 209, seated };
}

export function officeCamera(width: number, height: number, point: { x: number; y: number }, zoom = 1) {
  const mobile = width < 900;
  const fit = Math.min(width / ROOM.width, height / ROOM.height);
  // Keep the whole room edge-to-edge instead of shrinking it into a centered card.
  const scale = Math.max(.25, (mobile ? 1.25 : fit) * zoom);
  const clampAxis = (view: number, world: number, target: number, alignStart = false) => world <= view ? (alignStart ? 0 : (view - world) / 2) : Math.max(view - world, Math.min(0, view / 2 - target * scale));
  return { scale, left: Math.round(clampAxis(width, ROOM.width * scale, point.x)), top: Math.round(clampAxis(height, ROOM.height * scale, point.y - 24, true)) };
}

export function robotFrame(pose: RobotPose, elapsed: number) {
  const column = Math.floor(elapsed / (pose === "idle" ? 550 : 160)) % 4;
  const rows = { idle: 0, north: 1, south: 2, west: 3, east: 4, typing: 5, carrying: 6, scanning: 7, complete: 7, failed: 7 };
  return { column: pose === "scanning" ? 0 : pose === "complete" ? 2 : pose === "failed" ? 3 : column, row: rows[pose] };
}
