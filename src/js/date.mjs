/**
 * Local-timezone safe date utilities (KST / device local clock, never UTC-shifted).
 */

export function formatLocalDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns the logical workout date (YYYY-MM-DD) using a 04:00 AM local boundary:
 * times from 00:00 through 03:59 count as the previous calendar day's workout.
 */
export function getWorkoutDateStr(d = new Date(), cutoffHour = 4) {
  const baseDate = formatLocalDate(d);
  if (d.getHours() < cutoffHour) {
    return addDaysLocal(baseDate, -1);
  }
  return baseDate;
}

export function getTodayStr(d = new Date()) {
  return getWorkoutDateStr(d);
}

/** Parse YYYY-MM-DD at local noon to prevent DST/midnight boundary shifts. */
export function parseLocalDateNoon(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return new Date();
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date(dateStr);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
}

export function addDaysLocal(dateStr, deltaDays) {
  const d = parseLocalDateNoon(dateStr);
  d.setDate(d.getDate() + deltaDays);
  return formatLocalDate(d);
}

export function getKoreanDateTitle(dateStr = getTodayStr()) {
  const d = parseLocalDateNoon(dateStr);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${dayNames[d.getDay()]}요일`;
}

export function formatLocalTimeHHMM(isoOrDate) {
  if (!isoOrDate) return "";
  try {
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch (e) {
    return "";
  }
}

export function formatTimeDisplayKR(d = new Date()) {
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}
