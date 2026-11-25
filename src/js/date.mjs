/**
 * Local-timezone safe date utilities (KST / device local clock, never UTC-shifted).
 */

export function formatLocalDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getTodayStr() {
  return formatLocalDate(new Date());
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
