/**
 * Tab 3: RideMate Integrated Condition & Fatigue Cards, Sound Setting, & Expandable History.
 */
import { calculateWorkoutMetrics, computeSessionStss } from "../metrics.mjs";
import { formatLocalTimeHHMM } from "../date.mjs";

export function renderMetricsCards(store) {
  const container1 = document.getElementById("cardIntegratedCondition");
  const container2 = document.getElementById("cardMuscleFreshness");
  if (!container1 || !container2) return;

  const m = calculateWorkoutMetrics(store.state.history, store.state.wellness);
  store.state.metrics = m;

  const tsb = m.cycling && m.cycling.tsb != null ? m.cycling.tsb : null;
  let tsbStr = "--";
  let tsbColor = "var(--text-muted)";
  if (tsb !== null) {
    tsbStr = tsb > 0 ? `+${tsb}` : `${tsb}`;
    tsbColor = tsb > 0 ? "var(--accent)" : tsb >= -10 ? "var(--amber)" : "var(--rose)";
  }

  const todayStssStr = m.todayStss != null ? m.todayStss.toFixed(1) : "0.0";
  const totalAtlStr = m.totalAtl != null ? m.totalAtl.toFixed(1) : "--";
  const ctlStr = m.cycling && m.cycling.ctl != null ? m.cycling.ctl.toFixed(1) : "--";
  const atlStr = m.cycling && m.cycling.atl != null ? m.cycling.atl.toFixed(1) : "--";
  const strengthAtlStr = m.strengthAtl7d != null ? m.strengthAtl7d.toFixed(1) : "0.0";

  container1.innerHTML = `
    <div class="row-between">
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:15px;">⚡</span>
        <strong style="color:#ffffff; font-size:13.5px; font-weight:800;">통합 컨디션 & 피로도</strong>
      </div>
      <span class="badge badge-muted" style="font-size:10px; font-family:monospace; background:rgba(255,255,255,0.06);">RideMate 연동</span>
    </div>

    <div class="grid-3" style="margin-top:2px;">
      <div class="metric-tile">
        <div style="font-size:10.5px; color:var(--text-muted); font-weight:600;">자전거 TSB</div>
        <div class="tabular-nums" style="font-size:18px; font-weight:900; color:${tsbColor}; margin-top:3px; letter-spacing:-0.5px;">${tsbStr}</div>
        <div style="font-size:9.5px; color:var(--text-muted); margin-top:2px;">컨디션 지수</div>
      </div>
      <div class="metric-tile">
        <div style="font-size:10.5px; color:var(--text-muted); font-weight:600;">오늘 근력 sTSS</div>
        <div class="tabular-nums" style="font-size:18px; font-weight:900; color:#ffffff; margin-top:3px; letter-spacing:-0.5px;">${todayStssStr}</div>
        <div style="font-size:9.5px; color:var(--text-muted); margin-top:2px;">근력 부하</div>
      </div>
      <div class="metric-tile">
        <div style="font-size:10.5px; color:var(--text-muted); font-weight:600;">통합 ATL</div>
        <div class="tabular-nums" style="font-size:18px; font-weight:900; color:var(--accent); margin-top:3px; letter-spacing:-0.5px;">${totalAtlStr}</div>
        <div style="font-size:9.5px; color:var(--text-muted); margin-top:2px;">전신 피로도</div>
      </div>
    </div>

    <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:6px 10px; font-size:11px; color:var(--text-muted); margin-top:2px;">
      <span>🚴 RideMate 라이딩:</span>
      <span style="color:#ffffff; font-weight:700; font-family:monospace;">CTL ${ctlStr} · ATL ${atlStr} <span style="color:var(--text-muted); font-weight:400;">(근력 ATL ${strengthAtlStr})</span></span>
    </div>
  `;

  const groups = [
    { key: "push", label: "상체 밀기", desc: "가슴·어깨·삼두" },
    { key: "pull", label: "상체 당기기", desc: "등·이두·악력" },
    { key: "legs", label: "하체 (자전거 포함)", desc: "대퇴·둔근·종아리" },
    { key: "core", label: "코어", desc: "복직·복사근·기립근" }
  ];

  const getFreshnessColor = pct => {
    if (pct >= 80) return "var(--accent)";
    if (pct >= 60) return "var(--amber)";
    return "var(--rose)";
  };

  container2.innerHTML = `
    <div class="row-between">
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:15px;">💪</span>
        <strong style="color:#ffffff; font-size:13.5px; font-weight:800;">부위별 회복도 & 주간 볼륨</strong>
      </div>
      <span style="font-size:10.5px; color:var(--text-muted);">권장 8~14세트/주</span>
    </div>
    <div class="stack-2" style="margin-top:4px; gap:10px;">
      ${groups
        .map(g => {
          const pct = m.muscleFreshness && m.muscleFreshness[g.key] != null ? m.muscleFreshness[g.key] : 100;
          const hardSets = m.weeklyHardSets && m.weeklyHardSets[g.key] != null ? m.weeklyHardSets[g.key] : 0;
          const color = getFreshnessColor(pct);
          return `
            <div style="display:flex; flex-direction:column; gap:4px;">
              <div class="row-between" style="font-size:12px;">
                <div style="display:flex; align-items:baseline; gap:5px;">
                  <span style="font-weight:700; color:#ffffff;">${g.label}</span>
                  <span style="font-size:10px; color:var(--text-muted);">${g.desc}</span>
                </div>
                <div class="tabular-nums" style="font-size:11.5px;">
                  <span style="color:${color}; font-weight:800;">회복 ${pct}%</span>
                  <span style="color:var(--text-muted); font-size:10.5px;"> · 주간 <strong style="color:#fff;">${hardSets}</strong>세트</span>
                </div>
              </div>
              <div class="freshness-track">
                <div class="freshness-fill" style="width:${pct}%; background:${color};"></div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

const expandedDates = new Set();

export function renderHistoryList(store) {
  const container = document.getElementById("historyListWrap");
  const badge = document.getElementById("historyCountBadge");
  if (!container) return;

  const history = store.state.history || [];
  if (badge) badge.textContent = `${history.length}건`;

  if (!history.length) {
    container.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:12px;">저장된 과거 세션이 없습니다.</div>`;
    return;
  }

  container.innerHTML = history
    .slice(-10)
    .reverse()
    .map(h => {
      const localHHMM = formatLocalTimeHHMM(h.savedAt || h.timestamp);
      const stss = computeSessionStss(h);
      const isExpanded = expandedDates.has(h.date);
      const exRows = (h.exercises || h.items || [])
        .map(e => {
          const w = e.actualWeightKg > 0 ? `${e.actualWeightKg}kg · ` : "";
          const rpe = e.rpe != null ? `RPE ${e.rpe}` : "이완/미기록";
          return `
            <div class="row-between" style="font-size:11px; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
              <span style="color:${e.isCompleted ? "#fff" : "var(--text-muted)"};">${e.isCompleted ? "✓" : "○"} ${e.name}</span>
              <span class="tabular-nums" style="color:var(--text-muted); flex-shrink:0; margin-left:6px;">${w}${e.completedSets || 0}세트 · <strong style="color:var(--accent);">${rpe}</strong></span>
            </div>
          `;
        })
        .join("");

      return `
        <div style="background:var(--card-2); border:1px solid var(--border); border-radius:14px; padding:10px 12px; cursor:pointer;" data-hist-date="${h.date}" class="hist-card stack-2">
          <div class="row-between" style="gap:8px;">
            <div style="min-width:0; flex:1;">
              <div style="font-size:12.5px; font-weight:800; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${h.date} · ${h.routineTitle || "운동 세션"}</div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">완료: ${h.summary ? `${h.summary.completedExercises}/${h.summary.totalExercises}종목 (${h.summary.completedSets}/${h.summary.totalSets}세트)` : "-"}${stss > 0 ? ` · sTSS ${stss}` : ""}</div>
            </div>
            <div class="row-gap" style="gap:4px; flex-shrink:0;">
              ${localHHMM ? `<span class="badge badge-muted" style="font-size:10px;">${localHHMM}</span>` : ""}
              <span style="font-size:10px; color:var(--text-muted);">${isExpanded ? "▲" : "▼"}</span>
            </div>
          </div>
          ${isExpanded ? `<div style="margin-top:4px; padding-top:4px; border-top:1px solid var(--border);">${exRows}</div>` : ""}
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".hist-card").forEach(el => {
    el.addEventListener("click", () => {
      const d = el.dataset.histDate;
      if (expandedDates.has(d)) expandedDates.delete(d);
      else expandedDates.add(d);
      renderHistoryList(store);
    });
  });
}

export function renderSyncTab(store) {
  renderMetricsCards(store);
  renderHistoryList(store);
  const urlInput = document.getElementById("gasUrlInput");
  if (urlInput) urlInput.value = store.state.gasUrl || "";

  const soundBtn = document.getElementById("soundToggleBtn");
  if (soundBtn) {
    const on = !!store.state.soundEnabled;
    soundBtn.textContent = on ? "켜짐 (ON)" : "꺼짐 (OFF)";
    soundBtn.className = `btn-tap badge ${on ? "badge-lime" : "badge-muted"}`;
  }

  const syncBox = document.getElementById("syncStatusBox");
  if (syncBox && store.state.lastSyncAt) {
    syncBox.textContent = `☁️ Google Drive 자동 동기화됨 · ${store.state.lastSyncAt}`;
  }
}
