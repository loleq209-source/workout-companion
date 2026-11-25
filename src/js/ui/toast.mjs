/**
 * Lightweight UI feedback helpers: toast, sync status banner, and header badge.
 */

let toastTimer = null;

export function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastTimer = null;
    t.classList.remove("show");
  }, 2300);
}

export function updateSyncBadge(text) {
  const badge = document.getElementById("headerSyncBadge");
  if (!badge) return;
  badge.textContent = text;
  if (text.includes("동기화 ") && !text.includes("중") && !text.includes("실패") && !text.includes("오류")) {
    badge.className = "badge badge-lime";
  } else {
    badge.className = "badge badge-muted";
  }
}

export function setSyncStatusMsg(msg, isError = false) {
  const box = document.getElementById("syncStatusBox");
  if (!box) return;
  box.textContent = msg;
  box.style.color = isError ? "var(--rose)" : "var(--accent)";
  box.style.borderColor = isError ? "rgba(251,113,133,0.3)" : "rgba(163,230,53,0.3)";
  box.style.background = isError ? "var(--rose-bg)" : "var(--accent-bg)";
}
